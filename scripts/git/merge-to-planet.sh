#!/bin/bash

# Merge current feature branch back to its planet
# Usage: ./merge-to-planet.sh [--dry-run] [--force]

set -euo pipefail

DRY_RUN=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run] [--force]"
            exit 1
            ;;
    esac
done

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Validate branch name format
if [[ ! "$CURRENT_BRANCH" =~ ^feature/([^/]+)/(.+)$ ]]; then
    echo "Error: Current branch '$CURRENT_BRANCH' is not a valid feature branch."
    echo "Feature branches must be in format: feature/planet/description"
    exit 1
fi

PLANET="${BASH_REMATCH[1]}"
FEATURE_DESC="${BASH_REMATCH[2]}"

# Validate planet
VALID_PLANETS=("mercury" "mars" "earth" "jupiter" "saturn")
if [[ ! " ${VALID_PLANETS[*]} " =~ " $PLANET " ]]; then
    echo "Error: Invalid planet '$PLANET' in branch name."
    echo "Valid planets: ${VALID_PLANETS[*]}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: You have uncommitted changes. Please commit them first."
    exit 1
fi

# Check if we're ahead of planet branch
COMMITS_AHEAD=$(git rev-list --count "$PLANET..$CURRENT_BRANCH")
if [[ "$COMMITS_AHEAD" -eq 0 ]]; then
    echo "Error: No commits to merge. Branch '$CURRENT_BRANCH' is not ahead of '$PLANET'."
    exit 1
fi

echo "Feature branch: $CURRENT_BRANCH"
echo "Target planet: $PLANET"
echo "Commits to merge: $COMMITS_AHEAD"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN: Would squash merge $COMMITS_AHEAD commits to $PLANET"
    echo "Would delete branch $CURRENT_BRANCH"
    exit 0
fi

# Confirm merge
if [[ "$FORCE" != "true" ]]; then
    read -p "Squash merge $COMMITS_AHEAD commits to $PLANET and delete branch? (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Merge cancelled."
        exit 0
    fi
fi

echo "Squashing commits to $PLANET..."

# Switch to planet branch
git checkout "$PLANET"

# Squash merge the feature branch
git merge --squash "$CURRENT_BRANCH"

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "No changes to commit after squash merge."
    git checkout "$CURRENT_BRANCH"
    exit 1
fi

# Create commit message
COMMIT_MSG="feat: $FEATURE_DESC (from $CURRENT_BRANCH)"

# Commit the changes
git commit -m "$COMMIT_MSG"

echo "✅ Feature merged to $PLANET successfully!"
echo "Commit: $COMMIT_MSG"

# Delete the feature branch
git branch -D "$CURRENT_BRANCH"

echo "✅ Feature branch '$CURRENT_BRANCH' deleted."
echo ""
echo "Next steps:"
echo "1. Test the changes on $PLANET"
echo "2. Run 'pnpm run planet:promote' when ready for main"