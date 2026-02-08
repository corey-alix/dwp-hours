#!/bin/bash

# Worktree port management script
# Assigns planet-based ports for solar system themed worktrees
# Mars (3rd planet) = 3003, Jupiter (5th) = 3005, etc.

set -e

# Base port for worktrees
BASE_PORT=3000

# Planet-based port assignments (planet number + 3000)
# Mercury=3001, Venus=3002, Earth=3003, Mars=3003, Jupiter=3005, etc.
declare -A PLANET_PORTS=(
    ["mercury"]=3001
    ["venus"]=3002
    ["earth"]=3003
    ["mars"]=3004
    ["jupiter"]=3005
    ["saturn"]=3006
    ["uranus"]=3007
    ["neptune"]=3008
    ["main"]=3000
    ["master"]=3000
)

# Get current worktree name/branch
WORKTREE_NAME=$(git branch --show-current 2>/dev/null || git rev-parse --short HEAD)

# Check if worktree name matches a planet
PORT=${PLANET_PORTS[$WORKTREE_NAME]}

# If not a planet, generate a port based on worktree name hash
if [ -z "$PORT" ]; then
    PORT=$((BASE_PORT + $(echo "$WORKTREE_NAME" | cksum | cut -d' ' -f1) % 100))
fi

echo "Worktree: $WORKTREE_NAME"
echo "Assigned port: $PORT"
echo ""
echo "To use this port, run:"
echo "  export PORT=$PORT"
echo "  pnpm run dev:external"
echo ""
echo "Or start server directly:"
echo "  PORT=$PORT pnpm run start:prod"
echo ""
echo "For testing:"
echo "  PORT=$PORT pnpm run test"