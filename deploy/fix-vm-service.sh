#!/usr/bin/env bash
set -euo pipefail

SERVICE_FILE="/etc/systemd/system/cs341-avr.service"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script with sudo."
  exit 1
fi

if [ ! -f "$SERVICE_FILE" ]; then
  echo "Service file not found: $SERVICE_FILE"
  exit 1
fi

sed -i 's|^ExecStart=.*|ExecStart=%h/.volta/bin/npm start|' "$SERVICE_FILE"

if ! grep -q '^Environment=VOLTA_HOME=' "$SERVICE_FILE"; then
  sed -i '/^ExecStart=/i Environment=VOLTA_HOME=%h/.volta\nEnvironment=PATH=%h/.volta/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' "$SERVICE_FILE"
fi

systemctl daemon-reload
systemctl restart cs341-avr
sleep 2

echo
echo "Verification:"
systemctl status cs341-avr --no-pager
printf '\n---\n'
curl -I --max-time 10 http://127.0.0.1:4000/
printf '\n---\n'
curl -I --max-time 10 http://127.0.0.1/
