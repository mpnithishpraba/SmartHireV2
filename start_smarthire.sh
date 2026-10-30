#!/usr/bin/env bash
# Start SmartHire on macOS, Linux, Git Bash, or WSL.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR/app"

PYTHON_CMD="${PYTHON_CMD:-python3}"
if [ -x "$ROOT_DIR/.venv/bin/python" ]; then
  PYTHON_CMD="$ROOT_DIR/.venv/bin/python"
fi
if ! command -v "$PYTHON_CMD" >/dev/null 2>&1; then
  PYTHON_CMD="python"
fi

if ! "$PYTHON_CMD" -c "import flask, PyPDF2, reportlab" >/dev/null 2>&1; then
  echo "Required packages are missing. Run:"
  echo "  cd app && $PYTHON_CMD -m pip install -r requirements.txt"
  exit 1
fi

echo "Starting SmartHire at http://127.0.0.1:5000"
exec "$PYTHON_CMD" main.py
