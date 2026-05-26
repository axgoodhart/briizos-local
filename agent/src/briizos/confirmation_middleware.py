"""Middleware for requiring user confirmation before executing destructive tool calls.

When the agent calls a destructive tool (bash, write_file, str_replace, or briizOS
mutation tools), this middleware intercepts the call and interrupts execution.
The frontend receives the interruption, displays a confirmation UI, and either
resumes execution (approved) or sends a rejection message (denied).

Follows the same wrap_tool_call pattern as ClarificationMiddleware.

The middleware respects the tool_confirmation_mode configurable passed in the
LangGraph run config:
  - "ask-always"     (default) — intercept all destructive tools
  - "ask-destructive" — same as ask-always (destructive = always ask)
  - "no-asking"      — bypass all confirmation; execute destructive tools directly
"""

import json
import logging
from collections.abc import Callable
from typing import override

from langchain.agents import AgentState
from langchain.agents.middleware import AgentMiddleware
from langchain_core.messages import ToolMessage
from langgraph.graph import END
from langgraph.prebuilt.tool_node import ToolCallRequest
from langgraph.types import Command


logger = logging.getLogger(__name__)

# Tools that require user confirmation before execution.
# Destructive = can modify files, run commands, or mutate user data.
DESTRUCTIVE_TOOLS = {
    # DeerFlow sandbox tools
    "bash",
    "write_file",
    "str_replace",
    # briizOS mutation tools (from Plan 02)
    "briizos_create_note",
    "briizos_update_note",
    "briizos_delete_note",
    "briizos_create_task",
    "briizos_complete_task",
    "briizos_create_event",
    "briizos_update_event",
}

# Non-destructive tools that execute without confirmation:
# web_search, web_fetch, image_search, ls, read_file,
# briizos_search_notes, briizos_get_schedule, ask_clarification,
# present_files, view_image, task, write_todos


def _format_tool_summary(tool_call: dict) -> str:
    """Build a short human-readable summary of a destructive tool call."""
    name = tool_call.get("name", "unknown")
    args = tool_call.get("args", {})

    if name == "bash":
        cmd = args.get("command", "")
        return f"bash: {cmd[:120]}" if cmd else "bash: (empty command)"
    elif name == "write_file":
        path = args.get("file_path", args.get("path", ""))
        return f"write_file: {path}"
    elif name == "str_replace":
        path = args.get("file_path", args.get("path", ""))
        return f"str_replace: {path}"
    else:
        # briizOS tools -- show key arg
        key_args = ", ".join(f"{k}={v!r}" for k, v in list(args.items())[:2])
        return f"{name}({key_args})" if key_args else name


def _get_confirmation_mode(request: ToolCallRequest) -> str:
    """Extract tool_confirmation_mode from the LangGraph runtime config embedded in request.

    The ToolCallRequest carries a ToolRuntime with a .config (RunnableConfig) field.
    tool_confirmation_mode is set under config["configurable"]["tool_confirmation_mode"].

    Returns one of: "ask-always", "ask-destructive", "no-asking".
    Defaults to "ask-always" if not set (safest default).
    """
    try:
        tool_runtime = getattr(request, "runtime", None)
        runnable_config = getattr(tool_runtime, "config", None) or {}
        mode = (runnable_config.get("configurable") or {}).get("tool_confirmation_mode")
        if mode in ("ask-always", "ask-destructive", "no-asking"):
            return mode
    except Exception:
        pass
    return "ask-always"


def _get_permission_policy(request: ToolCallRequest) -> dict:
    """Extract the per-surface permission_policy from the run config.

    Shape: {"surface": str, "mode": str, "blacklist": {"paths": [...],
    "filetypes": [...]}}. Missing → fail-closed (ask-always, empty allow).
    """
    try:
        tool_runtime = getattr(request, "runtime", None)
        runnable_config = getattr(tool_runtime, "config", None) or {}
        pol = (runnable_config.get("configurable") or {}).get("permission_policy")
        if isinstance(pol, dict):
            bl = pol.get("blacklist") or {}
            return {
                "surface": pol.get("surface", "unknown"),
                "mode": pol.get("mode", _get_confirmation_mode(request)),
                "blacklist": {
                    "paths": list(bl.get("paths") or []),
                    "filetypes": list(bl.get("filetypes") or []),
                },
            }
    except Exception:
        pass
    return {
        "surface": "unknown",
        "mode": _get_confirmation_mode(request),
        "blacklist": {"paths": [], "filetypes": []},
    }


# Destructive command verbs (mirrors src/lib/permissions.js so the Python
# middleware and the renderer gate classify bash the same way).
_DESTRUCTIVE_VERBS = {
    "rm", "rmdir", "mv", "chmod", "chown", "chgrp", "kill", "killall",
    "pkill", "mkfs", "fdisk", "dd", "truncate", "shred", "launchctl",
    "systemctl", "defaults", "xattr",
}
_SAFE_VERBS = {
    "ls", "cat", "head", "tail", "less", "more", "echo", "printf", "pwd",
    "whoami", "which", "where", "find", "grep", "rg", "ag", "ack", "wc",
    "sort", "uniq", "diff", "comm", "file", "stat", "du", "df", "date",
    "cal", "uptime", "uname", "env", "printenv", "set", "cp", "mkdir",
    "touch", "curl", "wget", "ping", "dig", "nslookup", "host", "git",
    "node", "npm", "npx", "python", "python3", "pip", "brew", "open",
    "top", "ps", "htop", "lsof", "netstat",
}


def _bash_is_destructive(command: str) -> bool:
    """Best-effort destructive classification for a bash command string."""
    if not command:
        return False
    trimmed = command.strip()
    parts = trimmed.split()
    if not parts:
        return False
    verb = parts[0]
    if verb == "sudo" and len(parts) > 1:
        verb = parts[1]
    verb = verb.split("/")[-1]
    if verb in _SAFE_VERBS:
        # Still re-check pipe/redirect chains below.
        pass
    elif verb in _DESTRUCTIVE_VERBS:
        return True
    if any(sep in trimmed for sep in ("|", "&&", ";")):
        import re
        for sub in re.split(r"[|;&]+", trimmed):
            sub = sub.strip()
            if sub and _bash_is_destructive(sub):
                return True
    if ">" in trimmed:
        return True
    if verb in _SAFE_VERBS:
        return False
    # Unknown verb → destructive (safer), matching the renderer.
    return verb not in _SAFE_VERBS


def _is_blacklisted(path: str, blacklist: dict) -> bool:
    if not path or not blacklist:
        return False
    for blocked in blacklist.get("paths", []):
        if path == blocked or path.startswith(blocked.rstrip("/") + "/"):
            return True
    if "." in path:
        ext = "." + path.rsplit(".", 1)[-1].lower()
        if ext in [ft.lower() for ft in blacklist.get("filetypes", [])]:
            return True
    return False


def _blacklisted_target(tool_name: str, args: dict, blacklist: dict) -> str | None:
    """Return the first blacklisted path this call would touch, if any."""
    candidates = []
    if tool_name in ("write_file", "str_replace"):
        candidates.append(args.get("file_path") or args.get("path"))
    elif tool_name == "bash":
        cmd = args.get("command", "") or ""
        # Coarse: scan whitespace tokens that look like paths.
        for tok in cmd.replace("'", " ").replace('"', " ").split():
            if "/" in tok or tok.startswith(".") or "." in tok:
                candidates.append(tok)
    for c in candidates:
        if c and _is_blacklisted(c, blacklist):
            return c
    return None


class ToolConfirmationMiddleware(AgentMiddleware[AgentState]):
    """Intercepts destructive tool calls and interrupts execution for user confirmation.

    When the model calls a tool in DESTRUCTIVE_TOOLS, this middleware:
    1. Intercepts the tool call before execution
    2. Formats a confirmation prompt with tool details
    3. Returns a Command that interrupts execution (goto=END)
    4. The frontend detects the interruption and shows approve/reject UI
    5. On approval, the user re-sends a message to continue
    6. On rejection, the user sends a denial message

    Non-destructive tools pass through unchanged.

    Respects the tool_confirmation_mode configurable from the run config:
    - "no-asking": all destructive tools execute without confirmation (bypass this middleware)
    - "ask-always" / "ask-destructive" (default): intercept and require confirmation
    """

    state_schema = AgentState

    def _handle_destructive_call(self, request: ToolCallRequest) -> Command:
        """Interrupt execution for a destructive tool call, returning a Command."""
        tool_call = request.tool_call
        tool_name = tool_call.get("name", "unknown")
        tool_call_id = tool_call.get("id", "")
        args = tool_call.get("args", {})

        summary = _format_tool_summary(tool_call)
        logger.info("[ToolConfirmationMiddleware] Destructive tool intercepted: %s", summary)

        # Build a ToolMessage that carries the confirmation request.
        # The frontend will detect tool_confirmation messages and render a UI.
        confirmation_payload = {
            "type": "tool_confirmation",
            "tool_name": tool_name,
            "tool_call_id": tool_call_id,
            "args": args,
            "summary": summary,
        }

        # The ToolMessage content is a JSON string the frontend can parse.
        tool_message = ToolMessage(
            content=json.dumps(confirmation_payload),
            tool_call_id=tool_call_id,
            name=tool_name,
        )

        # Interrupt execution -- frontend will see this as the run ending
        # with a tool_confirmation ToolMessage in the final state.
        return Command(
            update={"messages": [tool_message]},
            goto=END,
        )

    def _deny(self, request: ToolCallRequest, reason: str) -> ToolMessage:
        """Hard-deny a tool call. The agent receives an error result and
        continues (it can explain / replan) rather than the run ending."""
        tool_call = request.tool_call
        logger.warning("[ToolConfirmationMiddleware] DENY %s: %s", tool_call.get("name"), reason)
        return ToolMessage(
            content=f"Error: blocked by permission policy — {reason}",
            tool_call_id=tool_call.get("id", ""),
            name=tool_call.get("name", "unknown"),
        )

    def _decide(self, request: ToolCallRequest) -> tuple[str, str]:
        """Return (action, reason) where action ∈ {'pass','deny','confirm'}.

        - Blacklist is a HARD DENY for every mode, including no-asking.
        - ask-destructive only confirms genuinely destructive operations:
          bash (by command heuristic) and write_file/str_replace; briizOS
          UI mutations are reversible and pass.
        - ask-always (and unknown/fail-closed) confirms every destructive
          tool. no-asking confirms none (but blacklist still denies).
        """
        tool_name = request.tool_call.get("name")
        if tool_name not in DESTRUCTIVE_TOOLS:
            return ("pass", "")

        policy = _get_permission_policy(request)
        mode = policy["mode"]
        args = request.tool_call.get("args", {}) or {}

        blocked = _blacklisted_target(tool_name, args, policy["blacklist"])
        if blocked:
            return ("deny", f'path "{blocked}" is blacklisted for the {policy["surface"]} surface')

        if mode == "no-asking":
            return ("pass", "")

        if mode == "ask-destructive":
            if tool_name.startswith("briizos_"):
                return ("pass", "")  # reversible UI mutation
            if tool_name == "bash":
                cmd = args.get("command", "") or ""
                return ("confirm", "") if _bash_is_destructive(cmd) else ("pass", "")
            # write_file / str_replace are inherently destructive
            return ("confirm", "")

        # ask-always or unknown → most restrictive
        return ("confirm", "")

    @override
    def wrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], ToolMessage | Command],
    ) -> ToolMessage | Command:
        """Intercept destructive tool calls (sync version)."""
        action, reason = self._decide(request)
        if action == "pass":
            return handler(request)
        if action == "deny":
            return self._deny(request, reason)
        return self._handle_destructive_call(request)

    @override
    async def awrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], ToolMessage | Command],
    ) -> ToolMessage | Command:
        """Intercept destructive tool calls (async version)."""
        action, reason = self._decide(request)
        if action == "pass":
            return await handler(request)
        if action == "deny":
            return self._deny(request, reason)
        return self._handle_destructive_call(request)
