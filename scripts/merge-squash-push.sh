#!/bin/bash

# Usage: ./merge-squash-push.sh <branch> ["<message>"] [--planet <planet>]

PLANET=""
BRANCH=""
MESSAGE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --planet)
            PLANET="$2"
            shift 2
            ;;
        *)
            if [[ -z "$BRANCH" ]]; then
                BRANCH="$1"
            elif [[ -z "$MESSAGE" ]]; then
                MESSAGE="$1"
            else
                echo "Too many arguments"
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$BRANCH" ]]; then
    echo "Usage: $0 <branch> [\"<message>\"] [--planet <planet>]"
    exit 1
fi

# Validate planet context if specified
if [[ -n "$PLANET" ]]; then
    VALID_PLANETS=("mercury" "mars" "earth" "jupiter" "saturn")
    if [[ ! " ${VALID_PLANETS[*]} " =~ " $PLANET " ]]; then
        echo "Error: Invalid planet '$PLANET'"
        exit 1
    fi

    # Validate branch is a feature for this planet
    if [[ ! "$BRANCH" =~ ^feature/$PLANET/ ]]; then
        echo "Error: Branch '$BRANCH' is not a feature branch for planet '$PLANET'"
        exit 1
    fi

    # Set default message with planet context
    if [[ -z "$MESSAGE" ]]; then
        FEATURE_DESC=$(echo "$BRANCH" | sed "s|^feature/$PLANET/||")
        MESSAGE="feat: $FEATURE_DESC (from $BRANCH)"
    fi
else
    MESSAGE=${MESSAGE:-$BRANCH}
fi

echo "Merging --squash from $BRANCH..."
if [[ -n "$PLANET" ]]; then
    echo "Planet context: $PLANET"
fi

git merge --squash "$BRANCH"
if [ $? -ne 0 ]; then
  echo "Merge failed"
  exit 1
fi

# Check if there are any staged changes
if git diff --cached --quiet; then
  echo "Already up-to-date with $BRANCH"
  exit 0
fi

echo "Committing with message: $MESSAGE"
git commit -m "$MESSAGE"
if [ $? -ne 0 ]; then
  echo "Commit failed"
  exit 1
fi

echo "Pushing..."
git push
if [ $? -ne 0 ]; then
  echo "Push failed"
  exit 1
fi

echo "Done."