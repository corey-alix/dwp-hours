#!/bin/bash

# Migration script to switch from npm to pnpm
# This script safely migrates the project to use pnpm as the package manager

set -e  # Exit on any error

echo "🚀 Starting migration from npm to pnpm..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    # Source the updated PATH if needed
    export PATH="$HOME/.local/share/pnpm:$PATH"
    export PATH="$HOME/.pnpm:$PATH"
fi

echo "✅ pnpm is available"

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
    echo "🗑️  Removing npm lockfile (package-lock.json)..."
    rm package-lock.json
else
    echo "ℹ️  No package-lock.json found, skipping removal"
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "🗑️  Removing node_modules..."
    rm -rf node_modules
else
    echo "ℹ️  No node_modules found, skipping removal"
fi

# Install dependencies with pnpm
echo "📦 Installing dependencies with pnpm..."
pnpm install

echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "  - Test your scripts: pnpm run build, pnpm run test, etc."
echo "  - Update any CI/CD pipelines to use pnpm instead of npm"
echo "  - Commit the new pnpm-lock.yaml file"
echo ""
echo "For worktrees: pnpm will now share dependencies efficiently across worktree clones!"