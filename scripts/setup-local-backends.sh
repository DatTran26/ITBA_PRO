#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

for d in vision-ocr vision-ai face-attendance; do
  dir="$ROOT/modules/$d/backend"
  if [[ ! -x "$dir/.venv/bin/python" ]]; then
    python3 -m venv "$dir/.venv"
  fi
  echo "Installing $d ..."
  "$dir/.venv/bin/python" -m pip install --upgrade pip
  "$dir/.venv/bin/python" -m pip install --requirement "$dir/requirements.txt"
  echo "OK $d"
done
