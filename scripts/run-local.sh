#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

run_api() {
  local dir="$1"
  local port="$2"
  local py="$dir/.venv/bin/python"
  if [[ ! -x "$py" ]]; then
    echo "Missing venv at $dir/.venv — run: bash scripts/setup-local-backends.sh" >&2
    exit 1
  fi
  (cd "$dir" && exec "$py" -m uvicorn app.main:app --host 127.0.0.1 --port "$port")
}

if [[ ! -d "$ROOT/Frontend/node_modules" ]]; then
  echo "Missing Frontend/node_modules — run: cd Frontend && npm ci" >&2
  exit 1
fi

run_api "$ROOT/modules/vision-ai/backend" 8001 &
run_api "$ROOT/modules/vision-ocr/backend" 8000 &
run_api "$ROOT/modules/face-attendance/backend" 8002 &
(cd "$ROOT/Frontend" && exec npm run dev) &
wait
