#!/usr/bin/env bash
# Reset briizOS.Local: stop dev processes and clear local caches.
#
# Usage:
#   ./scripts/reset.sh
#   ./scripts/reset.sh --deep          # also removes node_modules/.venv
#   ./scripts/reset.sh --app-cache     # also clears Electron app caches (keeps app config/memory)
#   ./scripts/reset.sh --dry-run

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DEEP=0
APP_CACHE=0
DRY_RUN=0

for arg in "${@:-}"; do
  case "$arg" in
    --deep) DEEP=1 ;;
    --app-cache) APP_CACHE=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      echo "Usage: ./scripts/reset.sh [--deep] [--app-cache] [--dry-run]"
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg"
      exit 1
      ;;
  esac
done

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] $*"
    return 0
  fi
  "$@"
}

kill_pid() {
  local pid="$1"
  local label="${2:-process}"

  if [[ -z "$pid" ]]; then
    return 0
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    return 0
  fi

  echo "Stopping $label (pid=$pid)..."
  run kill -TERM "$pid" 2>/dev/null || true

  local tries=0
  while kill -0 "$pid" 2>/dev/null; do
    tries=$((tries + 1))
    if [[ "$tries" -ge 20 ]]; then
      echo "Force killing $label (pid=$pid)..."
      run kill -KILL "$pid" 2>/dev/null || true
      break
    fi
    sleep 0.1
  done
}

kill_listeners_on_port() {
  local port="$1"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  fi

  if [[ -z "$pids" ]]; then
    return 0
  fi

  for pid in $pids; do
    kill_pid "$pid" "listener :$port"
  done
}

kill_repo_processes() {
  # Kill any lingering processes whose command line includes the repo path.
  # This avoids global `pkill -f electron` blasts.
  if ! command -v ps >/dev/null 2>&1; then
    return 0
  fi
  if ! command -v awk >/dev/null 2>&1; then
    return 0
  fi

  # macOS: `ps ax -o pid= -o command=` is stable.
  local lines
  lines="$(ps ax -o pid= -o command= | awk -v root="$ROOT" 'index($0, root) {print $1}' | tr '\n' ' ' || true)"
  if [[ -z "$lines" ]]; then
    return 0
  fi

  for pid in $lines; do
    # Never kill our own shell/script process.
    if [[ "$pid" == "$$" ]]; then
      continue
    fi
    kill_pid "$pid" "repo process"
  done
}

echo "Resetting briizOS.Local"
echo "Repo: $ROOT"

echo "Killing dev listeners..."
kill_listeners_on_port 5173  # Vite
kill_listeners_on_port 2024  # LangGraph
kill_listeners_on_port 2025  # tool-bridge
kill_listeners_on_port 8001  # gateway

echo "Killing any remaining repo processes..."
kill_repo_processes

echo "Clearing local caches..."
run rm -rf "$ROOT/dist"
run rm -rf "$ROOT/node_modules/.vite"
run rm -rf "$ROOT/node_modules/.cache"
run rm -f "$ROOT/firebase-debug.log"

echo "Clearing agent runtime data..."
run rm -rf "$ROOT/agent/.deer-flow"
run rm -rf "$ROOT/agent/.langgraph_api"
run find "$ROOT/agent" -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null || true
run find "$ROOT/agent" -type d -name ".ruff_cache" -prune -exec rm -rf {} + 2>/dev/null || true
run find "$ROOT/agent" -type d -name ".pytest_cache" -prune -exec rm -rf {} + 2>/dev/null || true

if [[ "$APP_CACHE" == "1" ]]; then
  echo "Clearing Electron app caches..."
  # Keep app config/memory; only remove cache-y directories.
  run rm -rf "$HOME/Library/Caches/briizOS" 2>/dev/null || true
  run rm -rf "$HOME/Library/Application Support/briizOS/Cache" 2>/dev/null || true
  run rm -rf "$HOME/Library/Application Support/briizOS/Code Cache" 2>/dev/null || true
  run rm -rf "$HOME/Library/Application Support/briizOS/GPUCache" 2>/dev/null || true
  run rm -rf "$HOME/Library/Application Support/briizOS/Network" 2>/dev/null || true
fi

if [[ "$DEEP" == "1" ]]; then
  echo "Deep reset requested..."
  run rm -rf "$ROOT/node_modules"
  run rm -rf "$ROOT/agent/.venv"
fi

echo "Done."
echo "Next: npm run dev"
