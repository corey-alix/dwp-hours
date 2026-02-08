#!/bin/bash

# Set PORT for the current worktree

BASE_PORT=3000
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

WORKTREE_NAME=$(git branch --show-current 2>/dev/null || git rev-parse --short HEAD)
PORT=${PLANET_PORTS[$WORKTREE_NAME]}
if [ -z "$PORT" ]; then
    PORT=$((BASE_PORT + $(echo "$WORKTREE_NAME" | cksum | cut -d' ' -f1) % 100))
fi

export PORT=$PORT
echo "PORT set to $PORT"