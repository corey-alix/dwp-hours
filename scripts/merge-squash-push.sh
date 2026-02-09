#!/bin/bash

# Usage: ./merge-squash-push.sh <branch> ["<message>"]

if [ $# -lt 1 ]; then
  echo "Usage: $0 <branch> [\"<message>\"]"
  exit 1
fi

BRANCH=$1
MESSAGE=${2:-$BRANCH}

echo "Merging --squash from $BRANCH..."
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