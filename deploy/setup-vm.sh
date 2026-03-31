#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script with sudo on the VM."
  exit 1
fi

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SERVICE_NAME="cs341-avr.service"
NGINX_SITE_NAME="cs341avr.campus.up.edu"

echo "Using app directory: $APP_DIR"

mkdir -p "$APP_DIR/logs"

cp "$APP_DIR/deploy/$SERVICE_NAME" "/etc/systemd/system/$SERVICE_NAME"
sed -i.bak "s|^WorkingDirectory=.*|WorkingDirectory=$APP_DIR|" "/etc/systemd/system/$SERVICE_NAME"
sed -i.bak "s|^StandardOutput=.*|StandardOutput=append:$APP_DIR/logs/systemd.out.log|" "/etc/systemd/system/$SERVICE_NAME"
sed -i.bak "s|^StandardError=.*|StandardError=append:$APP_DIR/logs/systemd.err.log|" "/etc/systemd/system/$SERVICE_NAME"

cp "$APP_DIR/deploy/$NGINX_SITE_NAME.nginx.conf" "/etc/nginx/sites-available/$NGINX_SITE_NAME"
ln -sf "/etc/nginx/sites-available/$NGINX_SITE_NAME" "/etc/nginx/sites-enabled/$NGINX_SITE_NAME"

if [ -f /etc/nginx/sites-enabled/default ]; then
  rm -f /etc/nginx/sites-enabled/default
fi

systemctl daemon-reload
systemctl enable --now cs341-avr
nginx -t
systemctl reload nginx

echo
echo "VM setup complete."
echo "App service: systemctl status cs341-avr"
echo "Domain URL: http://cs341avr.campus.up.edu/"
echo "If the domain still does not open, fix DNS and firewall rules for port 80."
