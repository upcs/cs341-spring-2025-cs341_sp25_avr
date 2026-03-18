#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${LOG_DIR:-$ROOT_DIR/logs}"
LOCAL_IP="$(node -e "const os=require('os'); const nets=os.networkInterfaces(); for (const name of Object.keys(nets)) { for (const net of nets[name] || []) { if (net.family === 'IPv4' && !net.internal) { console.log(net.address); process.exit(0); } } }")"

bash "$ROOT_DIR/scripts/assert-correct-project.sh" "$ROOT_DIR"

cd "$ROOT_DIR"

if [ ! -d node_modules ]; then
  npm install
fi

if [ ! -d initialApp/node_modules ]; then
  npm --prefix initialApp install
fi

PORT=${PORT:-4000}
mkdir -p "$LOG_DIR"

PORT="$PORT" npm --prefix initialApp start >>"$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

npm run dev >>"$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

echo "App starting..."
echo "Frontend: http://localhost:3000/"
echo "Backend:  http://localhost:${PORT}/"
if [ -n "$LOCAL_IP" ]; then
  echo "IP URL:   http://${LOCAL_IP}:3000/"
fi
echo "VM URL:   http://cs341avr.campus.up.edu"
echo "Logs:     $LOG_DIR/frontend.log and $LOG_DIR/backend.log"

trap 'kill $BACKEND_PID $FRONTEND_PID' INT TERM
wait $BACKEND_PID $FRONTEND_PID
