#!/usr/bin/env bash
set -euo pipefail

# Convenience wrapper so you can run `./reset.sh` from repo root.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$DIR/scripts/reset.sh" "$@"

