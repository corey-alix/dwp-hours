#!/bin/bash

# Promote a planet branch to main
# Usage: ./merge-planet-to-main.sh [--dry-run] [--force]

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

# Validate it's a planet branch
VALID_PLANETS=("mercury" "mars" "earth" "jupiter" "saturn")
if [[ ! " ${VALID_PLANETS[*]} " =~ " $CURRENT_BRANCH " ]]; then
    echo "Error: Current branch '$CURRENT_BRANCH' is not a planet branch."
    echo "Planet branches: ${VALID_PLANETS[*]}"
    exit 1
fi

PLANET="$CURRENT_BRANCH"

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: You have uncommitted changes. Please commit them first."
    exit 1
fi

# Check if we're ahead of main
COMMITS_AHEAD=$(git rev-list --count "main..$PLANET")
if [[ "$COMMITS_AHEAD" -eq 0 ]]; then
    echo "Error: Planet '$PLANET' has no commits ahead of main."
    exit 1
fi

echo "Planet: $PLANET"
echo "Target: main"
echo "Commits to promote: $COMMITS_AHEAD"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN: Would rebase $PLANET onto main and merge with --no-ff"
    exit 0
fi

# Confirm promotion
if [[ "$FORCE" != "true" ]]; then
    read -p "Promote $PLANET to main ($COMMITS_AHEAD commits)? This will rebase and merge. (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Promotion cancelled."
        exit 0
    fi
fi

echo "Fetching latest main..."
git fetch origin main

echo "Rebasing $PLANET onto origin/main..."
git rebase "origin/main"

echo "Switching to main..."
git checkout main

echo "Pulling latest main..."
git pull origin main

echo "Merging $PLANET with --no-ff..."
git merge "$PLANET" --no-ff -m "feat: promote $PLANET branch to main

- $COMMITS_AHEAD commits from $PLANET
- Includes features developed on $PLANET planet"

echo "Pushing to origin..."
git push origin main

echo "✅ Planet '$PLANET' promoted to main successfully!"
echo ""
echo "Switching back to $PLANET branch..."
git checkout "$PLANET"
echo ""
echo "Next steps:"
echo "1. Deploy main to production"
echo "2. Consider cleaning up feature branches with 'pnpm run branch:cleanup'"