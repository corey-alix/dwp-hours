#!/bin/bash

# configure-nginx.sh — Ensure nginx has required settings for the application.
# Must be run with sudo on the server.
# Idempotent: safe to run multiple times.

set -euo pipefail

NGINX_CONF="/etc/nginx/sites-enabled/default"
CHANGED=false

# ── client_max_body_size (needed for Excel file uploads) ──
if ! grep -q 'client_max_body_size' "$NGINX_CONF"; then
    echo "Adding client_max_body_size 20m to nginx config..."
    # Insert inside the ssl server block, after the listen 443 line
    sudo sed -i '/listen 443/a\    client_max_body_size 20m;' "$NGINX_CONF"
    CHANGED=true
else
    echo "client_max_body_size already configured."
fi

# ── proxy timeouts (keep defaults reasonable, import should be fast) ──
# Note: Default proxy_read_timeout is 60s. If imports still time out
# after the transaction batching fix, investigate further rather than
# increasing this value.

if [ "$CHANGED" = true ]; then
    echo "Testing nginx configuration..."
    sudo nginx -t
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    echo "Nginx configuration updated and reloaded."
else
    echo "No nginx changes needed."
fi
