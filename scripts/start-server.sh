#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bash "$ROOT_DIR/scripts/assert-correct-project.sh" "$ROOT_DIR"

PORT="${PORT:-4000}"
LOCAL_IP="$(node -e "const os=require('os'); const nets=os.networkInterfaces(); for (const name of Object.keys(nets)) { for (const net of nets[name] || []) { if (net.family === 'IPv4' && !net.internal) { console.log(net.address); process.exit(0); } } }")"

existing_pid="$(lsof -ti tcp:"$PORT" -sTCP:LISTEN || true)"
if [ -n "$existing_pid" ]; then
  echo "Stopping existing process on port $PORT (PID: $existing_pid)"
  kill "$existing_pid"
  sleep 1
fi

echo "App starting..."
echo "Local:   http://localhost:${PORT}/"
if [ -n "$LOCAL_IP" ]; then
  echo "Network: http://${LOCAL_IP}:${PORT}/"
fi
echo "VM URL:  https://cs341s26upadv.campus.up.edu/"

exec npm --prefix initialApp start
