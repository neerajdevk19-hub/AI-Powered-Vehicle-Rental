#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_PORT="${PYTHON_PORT:-8002}"
FRONTEND_PORT="${FRONTEND_PORT:-5174}"
export PYTHON_SERVICE_URL="http://127.0.0.1:${PYTHON_PORT}"
PIDS=()
cleanup() { for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM
cd "$PROJECT_DIR/python-service"
./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port "$PYTHON_PORT" &
PIDS+=("$!")
cd "$PROJECT_DIR/backend"
npm run start:dev &
PIDS+=("$!")
cd "$PROJECT_DIR/frontend"
npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT" --strictPort &
PIDS+=("$!")
printf 'Starting DriveAI: frontend http://localhost:%s, API http://localhost:3000, Python http://localhost:%s\n' "$FRONTEND_PORT" "$PYTHON_PORT"
wait -n "${PIDS[@]}"
