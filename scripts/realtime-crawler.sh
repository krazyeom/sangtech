#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

INTERVAL_SECONDS="${INTERVAL_SECONDS:-300}"
NODE_BIN="${NODE_BIN:-/opt/homebrew/bin/node}"
NPM_BIN="${NPM_BIN:-/opt/homebrew/bin/npm}"

if ! command -v "$NODE_BIN" >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
fi

if ! command -v "$NPM_BIN" >/dev/null 2>&1; then
  NPM_BIN="$(command -v npm)"
fi

export PATH="$(dirname "$NODE_BIN"):$PATH"

echo "[realtime-crawler] start: interval=${INTERVAL_SECONDS}s"

while true; do
  echo "[realtime-crawler] running local crawler at $(date '+%Y-%m-%d %H:%M:%S')"
  "$NPM_BIN" run crawler:run
  echo "[realtime-crawler] sleep ${INTERVAL_SECONDS}s"
  sleep "$INTERVAL_SECONDS"
done
