#!/bin/bash

# DWP Hours Tracker Deployment Script
# Builds everything locally and deploys a ready-to-run package to DigitalOcean.
# No package installation happens on the server.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DEPLOY_DIR="deploy"
SERVER_USER="deploy"
SERVER_HOST="206.189.237.101"
SERVER_PATH="/var/www/dwp-hours"
SSH_KEY="$HOME/.ssh/id_ed25519"

print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ──────────────────────────────────────────────
# 1. Pre-flight checks (local)
# ──────────────────────────────────────────────
print_status "Running pre-flight checks..."

for tool in node pnpm rsync ssh curl; do
    command -v "$tool" >/dev/null 2>&1 || { print_error "$tool is required but not installed."; exit 1; }
done

[ -f "$SSH_KEY" ] || { print_error "SSH key not found at $SSH_KEY"; exit 1; }

if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "echo ok" >/dev/null 2>&1; then
    print_error "Cannot connect to server via SSH."
    exit 1
fi

print_success "Pre-flight checks passed"

# ──────────────────────────────────────────────
# 2. Build locally
# ──────────────────────────────────────────────
print_status "Building application locally..."

pnpm install --frozen-lockfile
pnpm run build

[ -f "dist/server.mjs" ]    || { print_error "dist/server.mjs not found"; exit 1; }
[ -f "public/index.html" ]  || { print_error "public/index.html not found"; exit 1; }
[ -f "public/app.js" ]      || { print_error "public/app.js not found"; exit 1; }

print_success "Build completed"

# Seed the database locally
print_status "Seeding database locally..."
pnpm run seed

[ -f "db/dwp-hours.db" ] || { print_error "db/dwp-hours.db not found after seeding"; exit 1; }
print_success "Database seeded"

# ──────────────────────────────────────────────
# 3. Assemble deployment package
# ──────────────────────────────────────────────
print_status "Assembling deployment package..."

rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/dist" "$DEPLOY_DIR/public" "$DEPLOY_DIR/db"

# Server bundle
cp dist/server.mjs "$DEPLOY_DIR/dist/"
cp dist/server.mjs.map "$DEPLOY_DIR/dist/" 2>/dev/null || true

# Client assets
cp -r public/* "$DEPLOY_DIR/public/"

# Database (seeded locally)
cp db/dwp-hours.db "$DEPLOY_DIR/db/"
cp db/schema.sql "$DEPLOY_DIR/db/" 2>/dev/null || true

# Server-side scripts
mkdir -p "$DEPLOY_DIR/scripts"
cp scripts/server/*.sh "$DEPLOY_DIR/scripts/"
chmod +x "$DEPLOY_DIR/scripts/"*.sh

# PM2 config
cp ecosystem.config.json "$DEPLOY_DIR/"

# Minimal package.json with only production dependencies (no scripts, no devDeps)
LOCAL_VERSION=$(node -p "require('./package.json').version")
node -e "
const pkg = require('./package.json');
const minimal = {
  name: pkg.name,
  version: pkg.version,
  type: 'module',
  dependencies: Object.assign({}, pkg.dependencies)
};
// Remove npm-run-all — only needed for build scripts, not runtime
delete minimal.dependencies['npm-run-all'];
require('fs').writeFileSync('$DEPLOY_DIR/package.json', JSON.stringify(minimal, null, 2) + '\n');
"

# Copy lockfile for reproducible installs
cp pnpm-lock.yaml "$DEPLOY_DIR/" 2>/dev/null || true

# Deploy metadata
cat > "$DEPLOY_DIR/deploy-info.json" << EOF
{
    "version": "$LOCAL_VERSION",
    "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "node_version": "$(node --version)"
}
EOF

print_success "Deployment package assembled"

# ──────────────────────────────────────────────
# 4. Install production dependencies locally
# ──────────────────────────────────────────────
print_status "Installing production dependencies in deploy dir..."

(cd "$DEPLOY_DIR" && pnpm install --prod --no-frozen-lockfile)

print_success "Production dependencies installed ($(du -sh "$DEPLOY_DIR/node_modules" | cut -f1))"

# ──────────────────────────────────────────────
# 5. Local verification
# ──────────────────────────────────────────────
print_status "Verifying deployment package..."

for f in dist/server.mjs ecosystem.config.json package.json public/index.html public/app.js node_modules; do
    [ -e "$DEPLOY_DIR/$f" ] || { print_error "Missing: $f"; exit 1; }
done

print_success "Local verification passed"

# ──────────────────────────────────────────────
# 6. Upload to server
# ──────────────────────────────────────────────
print_status "Uploading to $SERVER_HOST..."

rsync -az --delete \
    -e "ssh -i $SSH_KEY" \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='db/backups' \
    "$DEPLOY_DIR/" \
    "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

print_success "Upload complete"

# ──────────────────────────────────────────────
# 7. Restart application on server
# ──────────────────────────────────────────────
print_status "Restarting application on server..."

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
    cd '$SERVER_PATH'

    # Ensure db directory has correct permissions
    chmod 755 db

    # Restart PM2 (use restart if running, otherwise start fresh)
    if pm2 describe dwp-hours-tracker >/dev/null 2>&1; then
        pm2 restart dwp-hours-tracker
    else
        pm2 start ecosystem.config.json
        pm2 save
    fi
"

print_success "Application restarted"

# ──────────────────────────────────────────────
# 8. Verify deployment
# ──────────────────────────────────────────────
print_status "Waiting for server to start..."
sleep 3

print_status "Verifying deployment..."

# Check API version endpoint
DEPLOYED_VERSION=$(curl -sf "https://ca0v.us/api/version" | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
        try { console.log(JSON.parse(d).version); } catch { console.log('unknown'); }
    });
" 2>/dev/null || echo "unreachable")

if [ "$DEPLOYED_VERSION" = "$LOCAL_VERSION" ]; then
    print_success "Version verified: $LOCAL_VERSION"
else
    print_warning "Version mismatch — Local: $LOCAL_VERSION, Deployed: $DEPLOYED_VERSION"
fi

# Grab tail of server log
print_status "Recent server logs:"
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
    pm2 logs dwp-hours-tracker --lines 15 --nostream 2>&1 || true
"

echo ""
print_success "Deployment complete!"
print_status "App: https://ca0v.us"
print_status "API: https://ca0v.us/api/version"
