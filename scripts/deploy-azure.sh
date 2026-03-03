#!/bin/bash

# Azure Web App Deployment Script for DWP Hours Tracker
# Creates the Azure infrastructure if it doesn't exist, then deploys
# the application via zip deploy.
#
# Usage:
#   ./scripts/deploy-azure.sh            # deploy using defaults
#   AZURE_APP_NAME=my-app ./scripts/deploy-azure.sh  # override app name
#
# Environment variables (all optional, sensible defaults provided):
#   AZURE_APP_NAME        - Web app name           (default: dw-time)
#   AZURE_RESOURCE_GROUP  - Resource group name     (default: DWP_time_app_RG)
#   AZURE_LOCATION        - Azure region            (default: eastus2)
#   AZURE_PLAN_NAME       - App Service Plan name   (default: dw-pto-time-sp)
#   AZURE_SKU             - App Service Plan SKU    (default: B1)

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────
APP_NAME="${AZURE_APP_NAME:-dw-time}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-DWP_time_app_RG}"
LOCATION="${AZURE_LOCATION:-eastus2}"
PLAN_NAME="${AZURE_PLAN_NAME:-dw-pto-time-sp}"
SKU="${AZURE_SKU:-B1}"
NODE_VERSION="24-lts"
DEPLOY_DIR="deploy-azure"
ZIP_FILE="deploy-azure.zip"

# Colors (skip when not interactive, e.g. in CI)
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; NC=''
fi

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()      { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()    { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Pre-flight ────────────────────────────────────────────────────
info "Pre-flight checks..."

command -v az      >/dev/null 2>&1 || fail "Azure CLI (az) is required but not installed."
command -v python3 >/dev/null 2>&1 || fail "python3 is required but not installed."

# Verify az is logged in
az account show >/dev/null 2>&1 || fail "Not logged in to Azure. Run 'az login' first."

ok "Pre-flight checks passed"

# ── Helper: try an az command, distinguish "not found" from "auth error" ──
# Returns 0 if resource exists, 1 if not found, 2 if auth/other error.
az_check() {
  local output rc=0
  output=$(az "$@" 2>&1) || rc=$?
  if [ $rc -eq 0 ]; then return 0; fi
  if echo "$output" | grep -qi "ResourceNotFound\|ResourceGroupNotFound\|not found"; then return 1; fi
  # Auth error or other — resource likely exists but we can't verify
  return 2
}

# ── 1. Ensure Resource Group ─────────────────────────────────────
info "Checking resource group '$RESOURCE_GROUP'..."

RG_STATUS=0
az_check group show --name "$RESOURCE_GROUP" -o none || RG_STATUS=$?
if [ $RG_STATUS -eq 0 ]; then
  ok "Resource group '$RESOURCE_GROUP' exists"
elif [ $RG_STATUS -eq 1 ]; then
  info "Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" -o none
  ok "Resource group created"
else
  warn "Cannot verify resource group (likely auth — assuming it exists)"
fi

# ── 2. Ensure App Service Plan ───────────────────────────────────
info "Checking App Service Plan '$PLAN_NAME'..."

PLAN_STATUS=0
az_check appservice plan show --name "$PLAN_NAME" --resource-group "$RESOURCE_GROUP" -o none || PLAN_STATUS=$?
if [ $PLAN_STATUS -eq 0 ]; then
  ok "App Service Plan '$PLAN_NAME' exists"
elif [ $PLAN_STATUS -eq 1 ]; then
  info "Creating App Service Plan '$PLAN_NAME' (SKU=$SKU, Linux)..."
  az appservice plan create \
    --name "$PLAN_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku "$SKU" \
    --is-linux \
    -o none
  ok "App Service Plan created"
else
  warn "Cannot verify App Service Plan (likely auth — assuming it exists)"
fi

# ── 3. Ensure Web App ────────────────────────────────────────────
info "Checking Web App '$APP_NAME'..."

APP_STATUS=0
az_check webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" -o none || APP_STATUS=$?
if [ $APP_STATUS -eq 0 ]; then
  ok "Web App '$APP_NAME' exists"
elif [ $APP_STATUS -eq 1 ]; then
  info "Creating Web App '$APP_NAME' with Node $NODE_VERSION..."
  az webapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$PLAN_NAME" \
    --runtime "NODE|$NODE_VERSION" \
    -o none
  ok "Web App created"
else
  warn "Cannot verify Web App (likely auth — assuming it exists)"
fi

# ── 4. Configure Web App (best-effort) ───────────────────────────
info "Configuring Web App..."

# Set Node.js runtime version and startup command
if az webapp config set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --linux-fx-version "NODE|$NODE_VERSION" \
  --startup-file "node dist/server.mjs" \
  -o none 2>/dev/null; then
  ok "Runtime configured (Node $NODE_VERSION, startup: node dist/server.mjs)"
else
  warn "Could not update runtime config (may require elevated permissions)"
fi

# Set application settings
if az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    NODE_ENV=production \
    WEBSITE_NODE_DEFAULT_VERSION="~20" \
  -o none 2>/dev/null; then
  ok "App settings configured"
else
  warn "Could not update app settings (may require elevated permissions)"
fi

# ── 5. Assemble deployment package ───────────────────────────────
info "Assembling deployment package..."

rm -rf "$DEPLOY_DIR" "$ZIP_FILE"
mkdir -p "$DEPLOY_DIR/dist" "$DEPLOY_DIR/public" "$DEPLOY_DIR/db"

# Server bundle
cp dist/server.mjs "$DEPLOY_DIR/dist/"
cp dist/server.mjs.map "$DEPLOY_DIR/dist/" 2>/dev/null || true

# Client assets
cp -r public/* "$DEPLOY_DIR/public/"

# Database schema (db file will be created at runtime by the server)
cp db/schema.sql "$DEPLOY_DIR/db/" 2>/dev/null || true

# Minimal package.json with production dependencies only
node -e "
const pkg = require('./package.json');
const minimal = {
  name: pkg.name,
  version: pkg.version,
  type: 'module',
  scripts: { start: 'node dist/server.mjs' },
  dependencies: Object.assign({}, pkg.dependencies)
};
require('fs').writeFileSync('$DEPLOY_DIR/package.json', JSON.stringify(minimal, null, 2) + '\n');
"

# Deploy metadata
LOCAL_VERSION=$(node -p "require('./package.json').version")
cat > "$DEPLOY_DIR/deploy-info.json" << EOF
{
  "version": "$LOCAL_VERSION",
  "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "node_version": "$(node --version)",
  "target": "azure/$APP_NAME"
}
EOF

ok "Deployment package assembled"

# ── 6. Install production dependencies ───────────────────────────
info "Installing production dependencies..."

if command -v pnpm >/dev/null 2>&1; then
  (cd "$DEPLOY_DIR" && pnpm install --prod --no-frozen-lockfile --ignore-scripts 2>&1 | tail -3)
else
  cp pnpm-lock.yaml "$DEPLOY_DIR/" 2>/dev/null || true
  (cd "$DEPLOY_DIR" && npm install --omit=dev 2>&1 | tail -3)
fi

ok "Production dependencies installed ($(du -sh "$DEPLOY_DIR/node_modules" | cut -f1))"

# ── 7. Create zip (using python3 — no 'zip' binary needed) ──────
info "Creating deployment zip..."

python3 -c "
import shutil, sys
shutil.make_archive('deploy-azure', 'zip', '$DEPLOY_DIR')
"

ZIP_SIZE=$(du -sh "$ZIP_FILE" | cut -f1)
ok "Deployment zip created ($ZIP_SIZE)"

# ── 8. Deploy ────────────────────────────────────────────────────
info "Deploying to Azure Web App '$APP_NAME'..."

az webapp deploy \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --src-path "$ZIP_FILE" \
  --type zip \
  --async false \
  -o none

ok "Deployment complete"

# ── 9. Verify ────────────────────────────────────────────────────
info "Waiting for app to start (30s)..."
sleep 30

APP_URL="https://${APP_NAME}.azurewebsites.net"
# Try the more specific default hostname first
DEFAULT_HOST=$(az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostName" -o tsv 2>/dev/null || true)
if [ -n "$DEFAULT_HOST" ]; then
  APP_URL="https://${DEFAULT_HOST}"
fi

info "Checking $APP_URL/api/version ..."
RESPONSE=$(curl -sf "$APP_URL/api/version" 2>/dev/null || echo "unreachable")

if echo "$RESPONSE" | grep -q "version"; then
  ok "App is responding: $RESPONSE"
else
  warn "App may still be starting. Response: $RESPONSE"
  warn "Check logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
fi

# ── Cleanup ──────────────────────────────────────────────────────
rm -rf "$DEPLOY_DIR" "$ZIP_FILE"

echo ""
ok "Azure deployment finished!"
info "App URL: $APP_URL"
info "Logs:    az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
