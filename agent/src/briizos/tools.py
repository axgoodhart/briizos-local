"""
briizOS Tool Definitions for LangGraph Agent

Python LangChain tool functions that call the Electron tool bridge HTTP API
running on port 2025. Each tool makes an HTTP POST to /tools/{toolName} and
returns the result as a string for the agent to consume.

The tool bridge relays requests to the Electron renderer where the existing
briizOS tool registry (src/lib/tools.js) executes them with full Firestore
and UI context.
"""

import json
import logging
import urllib.request
import urllib.error
from typing import Optional

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

BRIDGE_URL = "http://127.0.0.1:2025"


def _thread_id_from_config(config: Optional[RunnableConfig]) -> Optional[str]:
    """Pull the LangGraph thread_id out of the injected run config.

    LangChain auto-injects (and hides from the model schema) any tool
    parameter annotated as RunnableConfig. We forward thread_id to the
    renderer so the hard permission gate can resolve which surface
    (chat vs task) a bridge tool call belongs to. Absent → renderer
    fails closed to the most restrictive policy.
    """
    try:
        if not config:
            return None
        return (config.get("configurable") or {}).get("thread_id")
    except Exception:
        return None


def _call_bridge(tool_name: str, params: dict, config: Optional[RunnableConfig] = None) -> str:
    """Make an HTTP POST to the Electron tool bridge and return the result."""
    url = f"{BRIDGE_URL}/tools/{tool_name}"
    thread_id = _thread_id_from_config(config)
    payload = dict(params)
    if thread_id:
        payload["__briizos_thread_id"] = thread_id
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result.get("message", json.dumps(result))
    except urllib.error.URLError as e:
        logger.error("briizOS tool bridge unavailable: %s", e)
        return f"Error: briizOS tool bridge unavailable - {e}"
    except Exception as e:
        logger.error("briizOS tool bridge error: %s", e)
        return f"Error: {e}"


# =============================================================================
# Notes Tools
# =============================================================================


@tool
def briizos_create_note(title: str, content: str = "", config: RunnableConfig = None) -> str:
    """Create a new note panel in briizOS with the given title and optional content."""
    return _call_bridge("createNotePanel", {"title": title, "content": content}, config=config)


@tool
def briizos_update_note(panel_id: str, new_content: str, config: RunnableConfig = None) -> str:
    """Update the content of an existing note panel in briizOS. Use the panel ID or title to identify the note."""
    return _call_bridge("updateNoteContent", {"panel_id": panel_id, "new_content": new_content}, config=config)


@tool
def briizos_search_notes(query: str, config: RunnableConfig = None) -> str:
    """Search through note panels in briizOS for content matching the query."""
    return _call_bridge("searchNotes", {"query": query}, config=config)


@tool
def briizos_delete_note(panel_id: str, config: RunnableConfig = None) -> str:
    """Delete a note panel from briizOS. Use the panel ID or title to identify the note."""
    return _call_bridge("deletePanel", {"panel_id": panel_id}, config=config)


# =============================================================================
# Tasks Tools
# =============================================================================


@tool
def briizos_create_task(text: str, priority: str = "medium", config: RunnableConfig = None) -> str:
    """Create a new task in briizOS with the given text and priority (high/medium/low)."""
    return _call_bridge("createThoughtStream", {"text": text, "priority": priority}, config=config)


@tool
def briizos_complete_task(task_id: str, config: RunnableConfig = None) -> str:
    """Mark a task as completed in briizOS. Use the task ID or task title."""
    return _call_bridge("completeTask", {"task_id": task_id}, config=config)


# =============================================================================
# Calendar Tools
# =============================================================================


@tool
def briizos_create_event(title: str, date: str, time: str = "", config: RunnableConfig = None) -> str:
    """Create a calendar event in briizOS. Date should be YYYY-MM-DD format, time optional (e.g. '9:00')."""
    return _call_bridge("createSingleCalendarEvent", {"title": title, "date": date, "time": time}, config=config)


@tool
def briizos_update_event(event_title: str, new_date: str, config: RunnableConfig = None) -> str:
    """Update an existing calendar event in briizOS by moving it to a new date (YYYY-MM-DD)."""
    return _call_bridge("updateCalendarEvent", {"event_title": event_title, "new_date": new_date}, config=config)


@tool
def briizos_get_schedule(time_range: str = "today", config: RunnableConfig = None) -> str:
    """Get a summary of scheduled events from briizOS. Time range: 'today', 'tomorrow', 'this week', 'next week', 'all'."""
    return _call_bridge("getScheduleSummary", {"time_range": time_range}, config=config)
