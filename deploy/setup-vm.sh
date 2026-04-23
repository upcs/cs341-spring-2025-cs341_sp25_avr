#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script with sudo on the VM."
  exit 1
fi

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SERVICE_NAME="cs341-avr.service"
NGINX_SITE_NAME="cs341avr.campus.up.edu"
ASSERT_SCRIPT="$APP_DIR/scripts/assert-correct-project.sh"

echo "Using app directory: $APP_DIR"

if [ -x "$ASSERT_SCRIPT" ]; then
  "$ASSERT_SCRIPT" "$APP_DIR"
fi

if [ ! -d /etc/systemd/system ]; then
  echo "This machine does not have /etc/systemd/system. Run this only on the Linux VM."
  exit 1
fi

if [ ! -d /etc/nginx ]; then
  echo "Nginx is not installed. Install nginx on the VM before running this script."
  exit 1
fi

if command -v git >/dev/null 2>&1 && [ -d "$APP_DIR/.git" ]; then
  CURRENT_BRANCH="$(git -C "$APP_DIR" branch --show-current || true)"
  CURRENT_COMMIT="$(git -C "$APP_DIR" rev-parse --short HEAD || true)"
  echo "Deploying branch: ${CURRENT_BRANCH:-unknown}"
  echo "Deploying commit: ${CURRENT_COMMIT:-unknown}"
fi

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
systemctl enable cs341-avr
systemctl restart cs341-avr
nginx -t
systemctl reload nginx

echo
echo "VM setup complete."
echo "WorkingDirectory: $APP_DIR"
echo "App service: systemctl status cs341-avr"
echo "Domain URL: http://cs341avr.campus.up.edu/"
echo "If the domain still does not open, fix DNS and firewall rules for port 80."
