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

from langchain_core.tools import tool

logger = logging.getLogger(__name__)

BRIDGE_URL = "http://127.0.0.1:2025"


def _call_bridge(tool_name: str, params: dict) -> str:
    """Make an HTTP POST to the Electron tool bridge and return the result."""
    url = f"{BRIDGE_URL}/tools/{tool_name}"
    data = json.dumps(params).encode("utf-8")
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
def briizos_create_note(title: str, content: str = "") -> str:
    """Create a new note panel in briizOS with the given title and optional content."""
    return _call_bridge("createNotePanel", {"title": title, "content": content})


@tool
def briizos_update_note(panel_id: str, new_content: str) -> str:
    """Update the content of an existing note panel in briizOS. Use the panel ID or title to identify the note."""
    return _call_bridge("updateNoteContent", {"panel_id": panel_id, "new_content": new_content})


@tool
def briizos_search_notes(query: str) -> str:
    """Search through note panels in briizOS for content matching the query."""
    return _call_bridge("searchNotes", {"query": query})


@tool
def briizos_delete_note(panel_id: str) -> str:
    """Delete a note panel from briizOS. Use the panel ID or title to identify the note."""
    return _call_bridge("deletePanel", {"panel_id": panel_id})


# =============================================================================
# Tasks Tools
# =============================================================================


@tool
def briizos_create_task(text: str, priority: str = "medium") -> str:
    """Create a new task in briizOS with the given text and priority (high/medium/low)."""
    return _call_bridge("createThoughtStream", {"text": text, "priority": priority})


@tool
def briizos_complete_task(task_id: str) -> str:
    """Mark a task as completed in briizOS. Use the task ID or task title."""
    return _call_bridge("completeTask", {"task_id": task_id})


# =============================================================================
# Calendar Tools
# =============================================================================


@tool
def briizos_create_event(title: str, date: str, time: str = "") -> str:
    """Create a calendar event in briizOS. Date should be YYYY-MM-DD format, time optional (e.g. '9:00')."""
    return _call_bridge("createSingleCalendarEvent", {"title": title, "date": date, "time": time})


@tool
def briizos_update_event(event_title: str, new_date: str) -> str:
    """Update an existing calendar event in briizOS by moving it to a new date (YYYY-MM-DD)."""
    return _call_bridge("updateCalendarEvent", {"event_title": event_title, "new_date": new_date})


@tool
def briizos_get_schedule(time_range: str = "today") -> str:
    """Get a summary of scheduled events from briizOS. Time range: 'today', 'tomorrow', 'this week', 'next week', 'all'."""
    return _call_bridge("getScheduleSummary", {"time_range": time_range})
