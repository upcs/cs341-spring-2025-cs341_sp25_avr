#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/cs341-spring-2025-cs341_sp25_avr}"
NGINX_CONF="$APP_DIR/deploy/cs341avr.campus.up.edu.nginx.conf"

if [ ! -d "$APP_DIR" ]; then
  echo "App directory not found: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

if [ ! -f "$NGINX_CONF" ]; then
  echo "Nginx config not found: $NGINX_CONF"
  exit 1
fi

echo "Using app directory: $APP_DIR"

# This VM does not support IPv6 listeners, so strip them from the site config.
sed -i.bak '/listen \[::\]:80;/d' "$NGINX_CONF"

if [ -f /etc/nginx/sites-available/default ]; then
  sudo sed -i.bak '/listen \[::\]:80/d' /etc/nginx/sites-available/default
fi

sudo dpkg --configure -a
sudo apt-get install -f -y
sudo bash "$APP_DIR/deploy/setup-vm.sh"
sudo systemctl restart nginx

echo
echo "Verification:"
sudo systemctl status cs341-avr --no-pager
sudo systemctl status nginx --no-pager
curl -I http://127.0.0.1:4000/
curl -I http://127.0.0.1/
