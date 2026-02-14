#!/bin/bash

# Migrate a feature branch to a different planet
# Usage: ./migrate-feature.sh --to <planet> [--dry-run] [--force]

set -euo pipefail

TO_PLANET=""
DRY_RUN=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --to)
            TO_PLANET="$2"
            shift 2
            ;;
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
            echo "Usage: $0 --to <planet> [--dry-run] [--force]"
            exit 1
            ;;
    esac
done

if [[ -z "$TO_PLANET" ]]; then
    echo "Error: --to <planet> is required."
    echo "Usage: $0 --to <planet> [--dry-run] [--force]"
    exit 1
fi

# Validate target planet
VALID_PLANETS=("mercury" "mars" "earth" "jupiter" "saturn")
if [[ ! " ${VALID_PLANETS[*]} " =~ " $TO_PLANET " ]]; then
    echo "Error: Invalid target planet '$TO_PLANET'."
    echo "Valid planets: ${VALID_PLANETS[*]}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Validate current branch is a feature
if [[ ! "$CURRENT_BRANCH" =~ ^feature/([^/]+)/(.+)$ ]]; then
    echo "Error: Current branch '$CURRENT_BRANCH' is not a feature branch."
    exit 1
fi

FROM_PLANET="${BASH_REMATCH[1]}"
FEATURE_DESC="${BASH_REMATCH[2]}"

if [[ "$FROM_PLANET" == "$TO_PLANET" ]]; then
    echo "Error: Cannot migrate to the same planet ($FROM_PLANET)."
    exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: You have uncommitted changes. Please commit them first."
    exit 1
fi

NEW_BRANCH_NAME="feature/$TO_PLANET/$FEATURE_DESC"

# Check if new branch already exists
if git show-ref --verify --quiet "refs/heads/$NEW_BRANCH_NAME"; then
    echo "Error: Target branch '$NEW_BRANCH_NAME' already exists."
    exit 1
fi

COMMITS_COUNT=$(git rev-list --count "$FROM_PLANET..$CURRENT_BRANCH")

echo "Migration Plan:"
echo "From: $CURRENT_BRANCH (planet: $FROM_PLANET)"
echo "To: $NEW_BRANCH_NAME (planet: $TO_PLANET)"
echo "Commits to migrate: $COMMITS_COUNT"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN: Would create $NEW_BRANCH_NAME from $TO_PLANET and cherry-pick commits"
    exit 0
fi

# Confirm migration
if [[ "$FORCE" != "true" ]]; then
    read -p "Migrate feature from $FROM_PLANET to $TO_PLANET? (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Migration cancelled."
        exit 0
    fi
fi

echo "Creating new branch from $TO_PLANET..."
git checkout -b "$NEW_BRANCH_NAME" "$TO_PLANET"

echo "Cherry-picking commits..."
COMMITS_TO_PICK=$(git rev-list --reverse "$FROM_PLANET..$CURRENT_BRANCH")

for commit in $COMMITS_TO_PICK; do
    echo "Cherry-picking $commit..."
    if git cherry-pick "$commit"; then
        # Amend commit message with migration prefix
        git commit --amend -m "[MIGRATED FROM $FROM_PLANET] $(git log -1 --format=%B)"
    else
        echo "❌ Cherry-pick failed for $commit"
        echo "Please resolve conflicts and run 'git cherry-pick --continue'"
        echo "Or abort with 'git cherry-pick --abort'"
        exit 1
    fi
done

echo "✅ Migration completed!"
echo "New branch: $NEW_BRANCH_NAME"
echo "From planet: $FROM_PLANET → $TO_PLANET"
echo ""

# Optionally delete old branch
if [[ "$FORCE" != "true" ]]; then
    read -p "Delete old branch '$CURRENT_BRANCH'? (y/N): " DELETE_OLD
    if [[ "$DELETE_OLD" =~ ^[Yy]$ ]]; then
        git branch -D "$CURRENT_BRANCH"
        echo "✅ Old branch '$CURRENT_BRANCH' deleted."
    else
        echo "Old branch '$CURRENT_BRANCH' kept for reference."
    fi
fi

echo ""
echo "Next steps:"
echo "1. Test the migrated feature on $TO_PLANET"
echo "2. Continue development or run 'pnpm run feature:finish'"