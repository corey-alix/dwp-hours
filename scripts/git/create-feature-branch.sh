#!/bin/bash

# Create a new feature branch with planet selection
# Usage: ./create-feature-branch.sh [--override <planet>] [--description <desc>] [--effort <level>] [--urgency <level>] [--dry-run]

set -euo pipefail

# Planet definitions
declare -A PLANET_PORTS=(
    ["mercury"]=3001
    ["venus"]=3002
    ["earth"]=3003
    ["mars"]=3004
    ["jupiter"]=3005
    ["saturn"]=3006
)

VALID_PLANETS=("mercury" "mars" "earth" "jupiter" "saturn")

# Parse arguments
OVERRIDE_PLANET=""
FEATURE_DESC=""
EFFORT=""
URGENCY=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --override)
            OVERRIDE_PLANET="$2"
            shift 2
            ;;
        --description)
            FEATURE_DESC="$2"
            shift 2
            ;;
        --effort)
            EFFORT="$2"
            shift 2
            ;;
        --urgency)
            URGENCY="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--override <planet>] [--description <desc>] [--effort <small|medium|large>] [--urgency <low|medium|high>] [--dry-run]"
            exit 1
            ;;
    esac
done

# Safety checks
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Get current branch to ensure we're on a planet
CURRENT_BRANCH=$(git branch --show-current)
if [[ ! " ${VALID_PLANETS[*]} " =~ " $CURRENT_BRANCH " ]]; then
    echo "Error: You must be on a planet branch to create a feature branch."
    echo "Current branch: $CURRENT_BRANCH"
    echo "Available planets: ${VALID_PLANETS[*]}"
    exit 1
fi

# If override specified, validate it
if [[ -n "$OVERRIDE_PLANET" ]]; then
    if [[ ! " ${VALID_PLANETS[*]} " =~ " $OVERRIDE_PLANET " ]]; then
        echo "Error: Invalid planet '$OVERRIDE_PLANET'. Valid planets: ${VALID_PLANETS[*]}"
        exit 1
    fi
    PLANET="$OVERRIDE_PLANET"
else
    # Automatic planet selection based on effort and urgency
    if [[ -z "$EFFORT" || -z "$URGENCY" ]]; then
        echo "Error: When not using --override, both --effort and --urgency must be specified."
        echo "Usage: $0 --effort <small|medium|large> --urgency <low|medium|high> [--description <desc>]"
        exit 1
    fi

    case "$EFFORT-$URGENCY" in
        small-low)
            PLANET="saturn"
            ;;
        small-medium)
            PLANET="earth"
            ;;
        small-high)
            PLANET="mercury"
            ;;
        medium-low)
            PLANET="saturn"
            ;;
        medium-medium)
            PLANET="earth"
            ;;
        medium-high)
            PLANET="mars"
            ;;
        large-low)
            PLANET="jupiter"
            ;;
        large-medium)
            PLANET="jupiter"
            ;;
        large-high)
            PLANET="mercury"
            ;;
        *)
            echo "Error: Invalid effort/urgency combination: $EFFORT/$URGENCY"
            exit 1
            ;;
    esac
fi

# Get feature description
if [[ -z "$FEATURE_DESC" ]]; then
    FEATURE_DESC="test-feature"
    echo "Using default feature description: $FEATURE_DESC"
fi

# Validate description
if [[ -z "$FEATURE_DESC" ]]; then
    echo "Error: Feature description cannot be empty."
    exit 1
fi

# Create branch name
BRANCH_NAME="feature/$PLANET/$FEATURE_DESC"

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "Error: Branch '$BRANCH_NAME' already exists."
    exit 1
fi

# Create the branch
if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN: Would create branch '$BRANCH_NAME' from '$PLANET'"
    echo "Would switch to worktree for planet '$PLANET' (port ${PLANET_PORTS[$PLANET]})"
else
    echo "Creating feature branch '$BRANCH_NAME' from '$PLANET'..."
    git checkout -b "$BRANCH_NAME" "$PLANET"

    # Switch to planet worktree if available
    WORKTREE_DIR="../$PLANET"
    if [[ -d "$WORKTREE_DIR" ]]; then
        echo "Switching to worktree for $PLANET (port ${PLANET_PORTS[$PLANET]})"
        cd "$WORKTREE_DIR"
        export PORT="${PLANET_PORTS[$PLANET]}"
        echo "You are now in the $PLANET worktree."
        echo "Run 'pnpm run dev:external' to start development server."
    else
        echo "Worktree for $PLANET not found. Staying in current directory."
    fi

    echo ""
    echo "✅ Feature branch created successfully!"
    echo "Branch: $BRANCH_NAME"
    echo "Planet: $PLANET"
    echo "Next steps:"
    echo "1. Make your changes"
    echo "2. Test on port ${PLANET_PORTS[$PLANET]}"
    echo "3. Run 'pnpm run feature:finish' when done"
fi