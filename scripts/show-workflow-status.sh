#!/bin/bash

# Show current workflow status and available actions
# Usage: ./show-workflow-status.sh

set -euo pipefail

# Get current branch and status
CURRENT_BRANCH=$(git branch --show-current)
GIT_STATUS=$(git status --porcelain)

VALID_PLANETS=("mercury" "mars" "earth" "jupiter" "saturn")

echo "🌍 Planet Workflow Status"
echo "========================="
echo ""

# Determine workflow position
if [[ "$CURRENT_BRANCH" == "main" ]]; then
    WORKFLOW_POSITION="Production Branch"
    AVAILABLE_ACTIONS=(
        "Create new features with 'pnpm run feature:start'"
        "View planet statuses"
    )
elif [[ " ${VALID_PLANETS[*]} " =~ " $CURRENT_BRANCH " ]]; then
    WORKFLOW_POSITION="Planet Branch: $CURRENT_BRANCH"
    COMMITS_AHEAD=$(git rev-list --count "main..$CURRENT_BRANCH")
    AVAILABLE_ACTIONS=(
        "Create features with 'pnpm run feature:start'"
        "Promote to main with 'pnpm run planet:promote' ($COMMITS_AHEAD commits ready)"
        "View feature branches on this planet"
    )
elif [[ "$CURRENT_BRANCH" =~ ^feature/([^/]+)/(.+)$ ]]; then
    PLANET="${BASH_REMATCH[1]}"
    FEATURE_DESC="${BASH_REMATCH[2]}"
    WORKFLOW_POSITION="Feature Branch: $FEATURE_DESC (on $PLANET planet)"
    COMMITS_AHEAD=$(git rev-list --count "$PLANET..$CURRENT_BRANCH")
    AVAILABLE_ACTIONS=(
        "Continue development"
        "Finish feature with 'pnpm run feature:finish' ($COMMITS_AHEAD commits to merge)"
        "Migrate to different planet with 'pnpm run feature:migrate --to <planet>'"
    )
else
    WORKFLOW_POSITION="Unknown Branch Type"
    AVAILABLE_ACTIONS=(
        "Switch to a planet or main branch"
        "Use 'pnpm run feature:start' to create proper feature branches"
    )
fi

echo "Current Branch: $CURRENT_BRANCH"
echo "Workflow Position: $WORKFLOW_POSITION"
echo ""

# Show git status
if [[ -n "$GIT_STATUS" ]]; then
    echo "⚠️  Uncommitted Changes:"
    echo "$GIT_STATUS"
    echo ""
else
    echo "✅ Working directory clean"
    echo ""
fi

# Show available actions
echo "Available Actions:"
for action in "${AVAILABLE_ACTIONS[@]}"; do
    echo "  • $action"
done
echo ""

# Show planet overview
echo "Planet Overview:"
echo "----------------"
for planet in "${VALID_PLANETS[@]}"; do
    if git show-ref --verify --quiet "refs/heads/$planet" 2>/dev/null; then
        COMMITS_AHEAD=$(git rev-list --count "main..$planet" 2>/dev/null || echo "0")
        FEATURE_COUNT=$(git branch -r 2>/dev/null | grep "origin/feature/$planet/" | wc -l 2>/dev/null || echo "0")
        STATUS="✅ Active"
        if [[ "$planet" == "$CURRENT_BRANCH" ]]; then
            STATUS="🔵 Current"
        fi
        printf "  %-8s: %s (%d commits, %d features)\n" "$planet" "$STATUS" "$COMMITS_AHEAD" "$FEATURE_COUNT"
    else
        printf "  %-8s: ❌ Missing\n" "$planet"
    fi
done
echo ""

# Show recent workflow activity
echo "Recent Activity:"
echo "----------------"
git log --oneline -5 --grep="feat:\|promote\|from" 2>/dev/null || echo "  No recent workflow commits"
echo ""

echo "Need help? Run 'pnpm run workflow:status' anytime for this overview."