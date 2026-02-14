#!/bin/bash

# Create a new feature branch with planet selection
# Usage: ./create-feature-branch.sh [--override <planet>] [--dry-run]

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
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --override)
            OVERRIDE_PLANET="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--override <planet>] [--dry-run]"
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
    # Interactive planet selection
    echo "Current branch: $CURRENT_BRANCH"
    echo ""
    echo "Planet Selection Criteria:"
    echo "Mercury: Urgent, high-priority (fast deployment)"
    echo "Mars: Experimental, moderate risk"
    echo "Earth: Stable, important features"
    echo "Jupiter: Major features, large effort"
    echo "Saturn: Standard features, moderate effort"
    echo ""

    while true; do
        read -p "Select planet (or 'current' to use $CURRENT_BRANCH): " PLANET_INPUT
        case $PLANET_INPUT in
            mercury|mars|earth|jupiter|saturn)
                PLANET="$PLANET_INPUT"
                break
                ;;
            current)
                PLANET="$CURRENT_BRANCH"
                break
                ;;
            *)
                echo "Invalid planet. Please choose: mercury, mars, earth, jupiter, saturn, or 'current'"
                ;;
        esac
    done
fi

# Get feature description
read -p "Enter feature description (e.g., 'add-user-authentication'): " FEATURE_DESC

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