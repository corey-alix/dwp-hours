#!/bin/bash

# DWP Hours Tracker Deployment Script
# This script builds the application and prepares it for deployment

set -e  # Exit on any error

echo "🚀 Starting DWP Hours Tracker deployment build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="dist"
DEPLOY_DIR="deploy"
SERVER_USER="root"
SERVER_HOST="206.189.237.101"
SERVER_PATH="/var/www/dwp-hours"
SSH_KEY="$HOME/.ssh/do_dev"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Pre-flight checks
print_status "Running pre-flight checks..."

# Check if required tools are installed
for tool in node npm rsync ssh; do
    if ! command_exists "$tool"; then
        print_error "$tool is not installed. Please install it first."
        exit 1
    fi
done

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    print_error "SSH key not found at $SSH_KEY"
    exit 1
fi

# Check if we can connect to the server
print_status "Testing SSH connection to server..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
    print_error "Cannot connect to server. Please check SSH configuration."
    exit 1
fi

print_success "Pre-flight checks passed!"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf "$BUILD_DIR" "$DEPLOY_DIR"
mkdir -p "$BUILD_DIR" "$DEPLOY_DIR"

# Install dependencies
print_status "Installing dependencies..."
if command_exists pnpm; then
    pnpm install --frozen-lockfile
else
    npm ci
fi

# Build the application
print_status "Building application..."
npm run build

# Verify build outputs
if [ ! -f "dist/server.mjs" ]; then
    print_error "Server build failed - dist/server.mjs not found"
    exit 1
fi

if [ ! -f "public/index.html" ]; then
    print_error "Client build failed - public/index.html not found"
    exit 1
fi

print_success "Build completed successfully!"

# Prepare deployment package
print_status "Preparing deployment package..."

# Copy server files
cp -r dist/ "$DEPLOY_DIR/"
cp ecosystem.config.json "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/" 2>/dev/null || true
cp pnpm-lock.yaml "$DEPLOY_DIR/" 2>/dev/null || true

# Copy client files
mkdir -p "$DEPLOY_DIR/public"
cp -r public/* "$DEPLOY_DIR/public/"

# Copy database files
mkdir -p "$DEPLOY_DIR/db"
cp db/schema.sql "$DEPLOY_DIR/db/" 2>/dev/null || true

# Copy init-db script
cp scripts/init-db.ts "$DEPLOY_DIR/" 2>/dev/null || true

# Create deployment info
cat > "$DEPLOY_DIR/deploy-info.json" << EOF
{
    "version": "$(node -p "require('./package.json').version")",
    "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "node_version": "$(node --version)",
    "npm_version": "$(npm --version)"
}
EOF

print_success "Deployment package prepared!"

# Create deployment verification script
cat > "$DEPLOY_DIR/verify-deployment.sh" << 'EOF'
#!/bin/bash
echo "🔍 Verifying deployment..."

# Check if files exist
files_to_check=(
    "dist/server.mjs"
    "ecosystem.config.json"
    "package.json"
    "public/index.html"
    "public/app.js"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check Node.js version
node_version=$(node --version | sed 's/v//')
required_version="18.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo "✅ Node.js version $node_version meets requirement (>= $required_version)"
else
    echo "❌ Node.js version $node_version does not meet requirement (>= $required_version)"
    exit 1
fi

echo "✅ Deployment verification passed!"
EOF

chmod +x "$DEPLOY_DIR/verify-deployment.sh"

# Run verification
print_status "Running deployment verification..."
if ! (cd "$DEPLOY_DIR" && ./verify-deployment.sh); then
    print_error "Deployment verification failed!"
    exit 1
fi

print_success "Deployment package ready for upload!"

print_success "Deployment package ready for upload!"

print_status "Starting deployment to server..."

# Run deployment verification on server first
print_status "Running pre-deployment checks on server..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
    echo 'Checking server prerequisites...'
    command -v node >/dev/null 2>&1 && echo '✅ Node.js installed' || echo '❌ Node.js not found'
    command -v npm >/dev/null 2>&1 && echo '✅ npm installed' || echo '❌ npm not found'
    command -v pm2 >/dev/null 2>&1 && echo '✅ PM2 installed' || echo '❌ PM2 not found'
    [ -d '/var/www/dwp-hours' ] && echo '✅ Application directory exists' || echo '❌ Application directory missing'
    [ -d '/var/www/dwp-hours/db' ] && echo '✅ Database directory exists' || echo '❌ Database directory missing'
"

    # Upload files to server
    print_status "Uploading files to server..."
    rsync -avz -e "ssh -i $SSH_KEY" --delete \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        "$DEPLOY_DIR/" \
        "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

    # Install dependencies on server
    print_status "Installing dependencies on server..."
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
        cd '$SERVER_PATH'
        if command -v pnpm >/dev/null 2>&1; then
            pnpm install --prod --frozen-lockfile --ignore-scripts
        else
            npm ci --omit=dev --ignore-scripts
        fi
    "

    # Set proper permissions
    print_status "Setting file permissions..."
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
        chown -R root:root '$SERVER_PATH'
        chmod 755 '$SERVER_PATH/db'
        find '$SERVER_PATH' -type f -name '*.sh' -exec chmod +x {} \;
    "

    # Initialize database if needed
    print_status "Initializing database..."
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
        cd '$SERVER_PATH'
        if [ ! -f 'db/dwp-hours.db' ] || [ ! -s 'db/dwp-hours.db' ]; then
            echo 'Database file not found or empty, initializing...'
            node -e \"
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function initDB() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  
  const schema = fs.readFileSync('db/schema.sql', 'utf8');
  db.exec(schema);
  
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync('db/dwp-hours.db', buffer);
  
  console.log('Database initialized successfully');
}

initDB().catch(console.error);
\"
        else
            echo 'Database file exists, skipping initialization'
        fi
    "

    # Stop existing application
    print_status "Stopping existing application..."
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
        pm2 stop dwp-hours-tracker 2>/dev/null || true
        pm2 delete dwp-hours-tracker 2>/dev/null || true
    "

    # Start application with PM2
    print_status "Starting application with PM2..."
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
        cd '$SERVER_PATH'
        pm2 start ecosystem.config.json
        pm2 save
    "

    # Wait a moment for the application to start
    sleep 3

    # Verify deployment
    print_status "Verifying deployment..."
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" "
        pm2 list
        curl -f http://localhost:3000/api/version 2>/dev/null && echo '✅ API responding' || echo '❌ API not responding'
    "

    print_success "Deployment completed successfully!"
    print_status "Application should be available at: http://$SERVER_HOST"
    print_status "API should be available at: http://$SERVER_HOST/api/"

print_success "Build script completed!"