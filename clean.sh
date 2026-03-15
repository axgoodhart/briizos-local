#!/bin/bash
# Kill processes on dev ports and clear build cache

echo "Killing processes on ports..."
for port in 2024 2025 5173 8001; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill -9 $pid 2>/dev/null
    echo "  Port $port: killed (pid $pid)"
  else
    echo "  Port $port: clear"
  fi
done

echo ""
echo "Clearing build cache..."
rm -rf dist .vite node_modules/.vite node_modules/.cache
echo "  Done"

echo ""
echo "Clean complete."
