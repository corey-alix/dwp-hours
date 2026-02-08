#!/bin/bash

# Start development server with worktree-specific port
# This script automatically assigns a port based on the current worktree/branch

set -e

# Get the assigned port for this worktree
PORT=$(./scripts/get-worktree-port.sh | grep "Assigned port:" | cut -d' ' -f3)

echo "Starting dev server on port $PORT..."
echo "Press Ctrl+C to stop"
echo ""

# Export PORT and start the server
export PORT
export PATH="$HOME/.local/share/pnpm:$PATH"
pnpm run dev:external