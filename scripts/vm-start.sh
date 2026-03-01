#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

npm install
npm --prefix initialApp install

PORT=${PORT:-4000}

npm --prefix initialApp start &
BACKEND_PID=$!

npm run dev &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID' INT TERM
wait $BACKEND_PID $FRONTEND_PID
