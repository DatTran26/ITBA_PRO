#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

run_one() {
  local dir="$1"
  local port="$2"
  local py="$dir/.venv/bin/python"
  if [[ ! -x "$py" ]]; then
    echo "Missing venv at $dir/.venv — run: bash scripts/setup-local-backends.sh" >&2
    exit 1
  fi
  (cd "$dir" && exec "$py" -m uvicorn app.main:app --host 127.0.0.1 --port "$port")
}

run_one "$ROOT/modules/vision-ai/backend" 8001 &
run_one "$ROOT/modules/vision-ocr/backend" 8000 &
run_one "$ROOT/modules/face-attendance/backend" 8002 &
wait
