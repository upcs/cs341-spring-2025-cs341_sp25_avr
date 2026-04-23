#!/usr/bin/env bash
set -euo pipefail

SERVICE_FILE="/etc/systemd/system/cs341-avr.service"
APP_USER="lokombo27@campus.up.edu"
APP_HOME="/home/$APP_USER"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script with sudo."
  exit 1
fi

if [ ! -f "$SERVICE_FILE" ]; then
  echo "Service file not found: $SERVICE_FILE"
  exit 1
fi

sed -i '/^User=/d' "$SERVICE_FILE"
sed -i "/^WorkingDirectory=/a User=$APP_USER" "$SERVICE_FILE"
sed -i "s|^Environment=VOLTA_HOME=.*|Environment=VOLTA_HOME=$APP_HOME/.volta|" "$SERVICE_FILE"
sed -i "s|^Environment=PATH=.*|Environment=PATH=$APP_HOME/.volta/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin|" "$SERVICE_FILE"
sed -i "s|^ExecStart=.*|ExecStart=$APP_HOME/.volta/bin/npm start|" "$SERVICE_FILE"

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
