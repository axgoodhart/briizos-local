#!/usr/bin/env bash
# =============================================================================
# briizOS Chat Test Pipeline
#
# Sends a test message to the LangGraph backend and streams the response.
# Use --debug to trace every step: IPC-equivalent HTTP requests, SSE events,
# state changes, tool calls, and more.
#
# Usage:
#   ./scripts/test-chat.sh [OPTIONS] "Your message here"
#
# Options:
#   --debug         Enable full step-by-step trace logging
#   --model NAME    Use a specific model (e.g. claude-sonnet-4-6)
#   --thread ID     Reuse an existing thread ID (omit to create a new thread)
#   --no-thinking   Disable extended thinking mode
#   --port PORT     LangGraph port (default: 2024)
#   --help          Show this help message
#
# Examples:
#   ./scripts/test-chat.sh "What is 2 + 2?"
#   ./scripts/test-chat.sh --debug "Write a hello world in Python"
#   ./scripts/test-chat.sh --debug --model claude-sonnet-4-6 "List files in the workspace"
#   ./scripts/test-chat.sh --thread abc-123 --debug "Follow-up question"
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
DEBUG=false
MODEL=""
THREAD_ID=""
THINKING=true
PORT=2024
MESSAGE=""

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --debug)        DEBUG=true;       shift ;;
    --model)        MODEL="$2";       shift 2 ;;
    --thread)       THREAD_ID="$2";   shift 2 ;;
    --no-thinking)  THINKING=false;   shift ;;
    --port)         PORT="$2";        shift 2 ;;
    --help)
      sed -n '/^# ====/,/^# ====/p' "$0" | head -n 30
      exit 0
      ;;
    --*)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
    *)
      MESSAGE="$1"
      shift
      ;;
  esac
done

if [[ -z "$MESSAGE" ]]; then
  echo "Error: message argument is required." >&2
  echo "Usage: $0 [OPTIONS] \"Your message here\"" >&2
  exit 1
fi

BASE_URL="http://127.0.0.1:${PORT}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log_step() {
  if [[ "$DEBUG" == "true" ]]; then
    local ts
    ts=$(date '+%H:%M:%S.%3N' 2>/dev/null || date '+%H:%M:%S')
    printf "\033[36m[STEP %s]\033[0m %s\n" "$ts" "$1" >&2
  fi
}

log_event() {
  if [[ "$DEBUG" == "true" ]]; then
    local ts
    ts=$(date '+%H:%M:%S.%3N' 2>/dev/null || date '+%H:%M:%S')
    printf "\033[33m[EVENT %s]\033[0m %s\n" "$ts" "$1" >&2
  fi
}

log_info() {
  printf "\033[32m[INFO]\033[0m %s\n" "$1" >&2
}

log_error() {
  printf "\033[31m[ERROR]\033[0m %s\n" "$1" >&2
}

# ---------------------------------------------------------------------------
# Step 1: Health check
# ---------------------------------------------------------------------------
log_step "Health check — GET ${BASE_URL}/ok"
if ! curl -sf --max-time 3 "${BASE_URL}/ok" > /dev/null 2>&1; then
  log_error "LangGraph backend is not reachable at ${BASE_URL}"
  log_error "Start the app first (npm run dev) and wait for the backend to be ready."
  exit 1
fi
log_info "Backend is healthy at ${BASE_URL}"

# ---------------------------------------------------------------------------
# Step 2: Create thread (if not provided)
# ---------------------------------------------------------------------------
if [[ -z "$THREAD_ID" ]]; then
  log_step "Creating new thread — POST ${BASE_URL}/threads"
  THREAD_RESPONSE=$(curl -sf --max-time 10 \
    -X POST "${BASE_URL}/threads" \
    -H "Content-Type: application/json" \
    -d '{}')
  if [[ -z "$THREAD_RESPONSE" ]]; then
    log_error "Failed to create thread (empty response)"
    exit 1
  fi
  THREAD_ID=$(echo "$THREAD_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['thread_id'])" 2>/dev/null || echo "")
  if [[ -z "$THREAD_ID" ]]; then
    log_error "Failed to parse thread_id from response: $THREAD_RESPONSE"
    exit 1
  fi
  log_info "Thread created: $THREAD_ID"
else
  log_info "Reusing thread: $THREAD_ID"
fi

# ---------------------------------------------------------------------------
# Step 3: Build the run request body
# ---------------------------------------------------------------------------
log_step "Building run config"

# Build model_name JSON value
if [[ -n "$MODEL" ]]; then
  MODEL_JSON="\"${MODEL}\""
else
  MODEL_JSON="null"
fi

THINKING_JSON="true"
if [[ "$THINKING" == "false" ]]; then
  THINKING_JSON="false"
fi

REQUEST_BODY=$(cat <<EOF
{
  "assistant_id": "lead_agent",
  "input": {
    "messages": [{"role": "human", "content": $(python3 -c "import sys,json; print(json.dumps(sys.argv[1]))" "$MESSAGE")}]
  },
  "config": {
    "configurable": {
      "thread_id": "${THREAD_ID}",
      "model_name": ${MODEL_JSON},
      "thinking_enabled": ${THINKING_JSON},
      "is_plan_mode": false,
      "subagent_enabled": true
    }
  },
  "stream_mode": ["messages-tuple", "values", "custom"]
}
EOF
)

if [[ "$DEBUG" == "true" ]]; then
  log_step "Request body:"
  echo "$REQUEST_BODY" | python3 -m json.tool >&2 2>/dev/null || echo "$REQUEST_BODY" >&2
fi

# ---------------------------------------------------------------------------
# Step 4: Stream the run and parse SSE events
# ---------------------------------------------------------------------------
log_step "Streaming run — POST ${BASE_URL}/threads/${THREAD_ID}/runs/stream"
log_info "Message: \"$MESSAGE\""
echo ""

CURRENT_EVENT=""
TEXT_BUFFER=""
TOOL_CALLS_SEEN=0
ERRORS_SEEN=0

# Use a temp file to capture the HTTP status without losing the body stream.
STREAM_URL="${BASE_URL}/threads/${THREAD_ID}/runs/stream"

# Stream SSE response line-by-line
while IFS= read -r line; do
  if [[ "$line" == event:* ]]; then
    CURRENT_EVENT="${line#event: }"
    CURRENT_EVENT="${CURRENT_EVENT#event:}"
    CURRENT_EVENT="${CURRENT_EVENT#"${CURRENT_EVENT%%[! ]*}"}"  # ltrim
    log_event "SSE event type: $CURRENT_EVENT"

  elif [[ "$line" == data:* ]]; then
    RAW_DATA="${line#data: }"
    RAW_DATA="${RAW_DATA#data:}"
    RAW_DATA="${RAW_DATA#"${RAW_DATA%%[! ]*}"}"  # ltrim

    if [[ -z "$RAW_DATA" || "$RAW_DATA" == "null" ]]; then
      continue
    fi

    case "$CURRENT_EVENT" in
      messages)
        # Parse message type and content
        MSG_TYPE=$(echo "$RAW_DATA" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    if isinstance(data, list) and len(data) > 0:
        msg = data[0]
        print(msg.get('type','') or msg.get('role',''))
except Exception:
    pass
" 2>/dev/null || echo "")

        if [[ "$MSG_TYPE" == "ai" || "$MSG_TYPE" == "AIMessageChunk" ]]; then
          # Extract text content
          TEXT=$(echo "$RAW_DATA" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    msg = data[0]
    content = msg.get('content','')
    if isinstance(content, str):
        print(content, end='')
    elif isinstance(content, list):
        for block in content:
            if isinstance(block, dict) and block.get('type') == 'text':
                print(block.get('text',''), end='')
except Exception:
    pass
" 2>/dev/null || echo "")
          if [[ -n "$TEXT" ]]; then
            printf "%s" "$TEXT"
            TEXT_BUFFER+="$TEXT"
          fi

          # Detect tool calls
          TOOL_CALL=$(echo "$RAW_DATA" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    msg = data[0]
    tcs = msg.get('tool_calls', [])
    for tc in tcs:
        print(f\"  tool_call: {tc.get('name','?')}({json.dumps(tc.get('args',{}))[:120]})\")
except Exception:
    pass
" 2>/dev/null || echo "")
          if [[ -n "$TOOL_CALL" ]]; then
            TOOL_CALLS_SEEN=$((TOOL_CALLS_SEEN + 1))
            echo ""
            log_event "TOOL CALL #${TOOL_CALLS_SEEN}:${TOOL_CALL}"
          fi

        elif [[ "$MSG_TYPE" == "tool" || "$MSG_TYPE" == "ToolMessage" ]]; then
          TOOL_RESULT=$(echo "$RAW_DATA" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    msg = data[0]
    name = msg.get('name','?')
    content = str(msg.get('content',''))[:200]
    # Check if it's a tool_confirmation
    try:
        parsed = json.loads(msg.get('content','{}'))
        if parsed.get('type') == 'tool_confirmation':
            print(f'  tool_confirmation: {parsed.get(\"summary\",\"?\")}')
        else:
            print(f'  tool_result: {name} -> {content}')
    except Exception:
        print(f'  tool_result: {name} -> {content}')
except Exception:
    pass
" 2>/dev/null || echo "")
          if [[ -n "$TOOL_RESULT" ]]; then
            echo ""
            log_event "TOOL RESULT:${TOOL_RESULT}"
          fi
        fi
        ;;

      custom)
        # Sub-agent / custom events
        CUSTOM_TYPE=$(echo "$RAW_DATA" | python3 -c "
import sys, json
try:
    d = json.loads(sys.stdin.read())
    print(d.get('type','?'))
except Exception:
    pass
" 2>/dev/null || echo "")
        CUSTOM_DESC=$(echo "$RAW_DATA" | python3 -c "
import sys, json
try:
    d = json.loads(sys.stdin.read())
    print(d.get('description', d.get('task_id', '')))
except Exception:
    pass
" 2>/dev/null || echo "")
        log_event "CUSTOM EVENT: type=${CUSTOM_TYPE} desc=${CUSTOM_DESC}"
        ;;

      values)
        # State snapshot — log title if present
        TITLE=$(echo "$RAW_DATA" | python3 -c "
import sys, json
try:
    d = json.loads(sys.stdin.read())
    t = d.get('title','')
    if t:
        print(t)
except Exception:
    pass
" 2>/dev/null || echo "")
        if [[ -n "$TITLE" ]]; then
          log_event "THREAD TITLE: $TITLE"
        fi
        if [[ "$DEBUG" == "true" ]]; then
          MSG_COUNT=$(echo "$RAW_DATA" | python3 -c "
import sys, json
try:
    d = json.loads(sys.stdin.read())
    print(len(d.get('messages',[])))
except Exception:
    print('?')
" 2>/dev/null || echo "?")
          log_event "STATE SNAPSHOT: ${MSG_COUNT} messages in state"
        fi
        ;;

      error)
        ERRORS_SEEN=$((ERRORS_SEEN + 1))
        ERROR_MSG=$(echo "$RAW_DATA" | python3 -c "
import sys, json
try:
    d = json.loads(sys.stdin.read())
    if isinstance(d, str):
        print(d)
    else:
        print(d.get('message', json.dumps(d)))
except Exception:
    print(sys.stdin.read()[:200])
" 2>/dev/null || echo "$RAW_DATA")
        echo ""
        log_error "STREAM ERROR: $ERROR_MSG"
        ;;

      end)
        log_event "Stream ended"
        ;;

      *)
        if [[ -n "$CURRENT_EVENT" ]] && [[ "$DEBUG" == "true" ]]; then
          log_event "UNHANDLED EVENT TYPE: $CURRENT_EVENT"
        fi
        ;;
    esac

  elif [[ -z "$line" ]]; then
    # Empty line = event delimiter; reset current event
    CURRENT_EVENT=""
  fi

done < <(curl -sf --max-time 120 --no-buffer \
  -X POST "$STREAM_URL" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY" 2>&1)

echo ""
echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log_info "Stream complete"
log_info "Thread ID: $THREAD_ID  (pass --thread $THREAD_ID to continue this conversation)"
log_info "Tool calls seen: $TOOL_CALLS_SEEN"
if [[ $ERRORS_SEEN -gt 0 ]]; then
  log_error "Errors encountered: $ERRORS_SEEN"
  exit 1
fi
