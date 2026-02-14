#!/bin/bash

# Validate feature branch naming and planet fit
# Usage: ./validate-feature.sh [--fix]

set -euo pipefail

FIX=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            FIX=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--fix]"
            exit 1
            ;;
    esac
done

CURRENT_BRANCH=$(git branch --show-current)

echo "Validating feature branch: $CURRENT_BRANCH"
echo ""

ISSUES_FOUND=false

# Check branch name format
if [[ ! "$CURRENT_BRANCH" =~ ^feature/([^/]+)/(.+)$ ]]; then
    echo "❌ ERROR: Branch name format invalid"
    echo "   Expected: feature/planet/description"
    echo "   Actual: $CURRENT_BRANCH"
    ISSUES_FOUND=true
else
    PLANET="${BASH_REMATCH[1]}"
    FEATURE_DESC="${BASH_REMATCH[2]}"

    echo "✅ Branch name format: OK"
    echo "   Planet: $PLANET"
    echo "   Feature: $FEATURE_DESC"

    # Validate planet
    VALID_PLANETS=("mercury" "mars" "earth" "jupiter" "saturn")
    if [[ ! " ${VALID_PLANETS[*]} " =~ " $PLANET " ]]; then
        echo "❌ ERROR: Invalid planet '$PLANET'"
        echo "   Valid planets: ${VALID_PLANETS[*]}"
        ISSUES_FOUND=true
    else
        echo "✅ Planet: OK"

        # Check if branch exists on planet
        if ! git merge-base --is-ancestor "$PLANET" "$CURRENT_BRANCH" 2>/dev/null; then
            echo "❌ ERROR: Branch not based on planet '$PLANET'"
            echo "   Branch should be created from $PLANET"
            ISSUES_FOUND=true
        else
            echo "✅ Branch ancestry: OK"
        fi
    fi
fi

# Check commit messages
echo ""
echo "Checking recent commit messages..."
INVALID_COMMITS=()
while IFS= read -r commit; do
    if [[ ! "$commit" =~ ^(feat|fix|docs|style|refactor|test|chore): ]]; then
        INVALID_COMMITS+=("$commit")
    fi
done < <(git log --oneline -10 --format="%s" 2>/dev/null)

if [[ ${#INVALID_COMMITS[@]} -gt 0 ]]; then
    echo "❌ WARNING: Found commits not following conventional format:"
    for commit in "${INVALID_COMMITS[@]}"; do
        echo "   $commit"
    done
    echo "   Recommended: Use 'feat:', 'fix:', 'docs:', etc."
else
    echo "✅ Commit messages: OK"
fi

echo ""

if [[ "$ISSUES_FOUND" == "true" ]]; then
    echo "❌ Validation failed!"
    if [[ "$FIX" == "true" ]]; then
        echo "Use --fix option to attempt automatic fixes (not implemented yet)"
    fi
    exit 1
else
    echo "✅ Validation passed!"
fi