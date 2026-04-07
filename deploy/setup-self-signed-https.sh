#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script with sudo."
  exit 1
fi

APP_DOMAIN="${APP_DOMAIN:-cs341s26upadv.campus.up.edu}"
APP_PORT="${APP_PORT:-4000}"
SSL_DIR="/etc/ssl/cs341"
NGINX_SITE="/etc/nginx/sites-available/${APP_DOMAIN}"

mkdir -p "$SSL_DIR"

if [ ! -f "$SSL_DIR/server.key" ] || [ ! -f "$SSL_DIR/server.crt" ]; then
  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$SSL_DIR/server.key" \
    -out "$SSL_DIR/server.crt" \
    -subj "/CN=${APP_DOMAIN}"
fi

cat > "$NGINX_SITE" <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${APP_DOMAIN};

    ssl_certificate ${SSL_DIR}/server.crt;
    ssl_certificate_key ${SSL_DIR}/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/${APP_DOMAIN}"
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

echo
echo "Self-signed HTTPS is configured."
echo "Domain: https://${APP_DOMAIN}/"
echo "Certificate: ${SSL_DIR}/server.crt"
echo
echo "Verification:"
systemctl status nginx --no-pager
printf '\n---\n'
curl -k -I --max-time 10 "https://${APP_DOMAIN}/" || true
