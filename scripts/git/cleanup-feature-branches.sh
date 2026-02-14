#!/bin/bash

# Safely cleanup merged feature branches
# Usage: ./cleanup-feature-branches.sh [--dry-run] [--force] [--days <n>]

set -euo pipefail

DRY_RUN=false
FORCE=false
DAYS=30

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
        --days)
            DAYS="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run] [--force] [--days <n>]"
            exit 1
            ;;
    esac
done

LOG_FILE="/tmp/branch-cleanup-$(date +%Y%m%d-%H%M%S).log"

echo "🧹 Feature Branch Cleanup"
echo "========================="
echo "Days threshold: $DAYS"
echo "Log file: $LOG_FILE"
echo ""

# Get all merged feature branches
MERGED_BRANCHES=()
while IFS= read -r branch; do
    # Skip current branch and non-feature branches
    if [[ "$branch" == "*" ]] || [[ ! "$branch" =~ ^feature/ ]]; then
        continue
    fi

    # Remove leading spaces/asterisks
    branch=$(echo "$branch" | sed 's/^[ *]*//')

    # Check if branch exists and is merged
    if git show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null; then
        # Check if merged into any planet
        MERGED=false
        for planet in mercury mars earth jupiter saturn; do
            if git branch --merged "$planet" | grep -q "^[ *]*$branch$"; then
                MERGED=true
                break
            fi
        done

        if [[ "$MERGED" == "true" ]]; then
            # Check age
            LAST_COMMIT_DATE=$(git log -1 --format=%ct "refs/heads/$branch" 2>/dev/null || echo "0")
            CURRENT_TIME=$(date +%s)
            AGE_DAYS=$(( (CURRENT_TIME - LAST_COMMIT_DATE) / 86400 ))

            if [[ $AGE_DAYS -ge $DAYS ]]; then
                MERGED_BRANCHES+=("$branch:$AGE_DAYS")
            fi
        fi
    fi
done < <(git branch --merged)

if [[ ${#MERGED_BRANCHES[@]} -eq 0 ]]; then
    echo "✅ No old merged feature branches to clean up."
    exit 0
fi

echo "Found ${#MERGED_BRANCHES[@]} old merged feature branches:"
echo ""
for branch_info in "${MERGED_BRANCHES[@]}"; do
    branch=$(echo "$branch_info" | cut -d: -f1)
    age=$(echo "$branch_info" | cut -d: -f2)
    printf "  %-40s (%d days old)\n" "$branch" "$age"
done
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN: Would delete ${#MERGED_BRANCHES[@]} branches"
    exit 0
fi

# Confirm deletion
if [[ "$FORCE" != "true" ]]; then
    read -p "Delete ${#MERGED_BRANCHES[@]} old merged feature branches? (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Cleanup cancelled."
        exit 0
    fi
fi

# Delete branches
DELETED_COUNT=0
for branch_info in "${MERGED_BRANCHES[@]}"; do
    branch=$(echo "$branch_info" | cut -d: -f1)
    age=$(echo "$branch_info" | cut -d: -f2)

    echo "Deleting $branch (age: $age days)..." | tee -a "$LOG_FILE"
    if git branch -D "$branch" 2>&1 | tee -a "$LOG_FILE"; then
        ((DELETED_COUNT++))
    else
        echo "Failed to delete $branch" | tee -a "$LOG_FILE"
    fi
done

echo ""
echo "✅ Cleanup complete!"
echo "Deleted: $DELETED_COUNT branches"
echo "Log saved to: $LOG_FILE"
echo ""
echo "Note: Branches can be restored from reflog if needed:"
echo "  git reflog | grep 'branch: Created'"
echo "  git checkout -b <branch> <commit-hash>"