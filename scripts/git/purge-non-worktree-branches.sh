#!/bin/bash

# Delete all branches NOT currently checked out by a worktree, locally and on the remote.
# Usage: ./purge-non-worktree-branches.sh [--dry-run] [--force] [--local-only] [--remote-only]

set -euo pipefail

DRY_RUN=false
FORCE=false
LOCAL_ONLY=false
REMOTE_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --)
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --local-only)
            LOCAL_ONLY=true
            shift
            ;;
        --remote-only)
            REMOTE_ONLY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run] [--force] [--local-only] [--remote-only]"
            exit 1
            ;;
    esac
done

LOG_FILE="/tmp/purge-branches-$(date +%Y%m%d-%H%M%S).log"

echo "🗑️  Purge Non-Worktree Branches"
echo "================================"
echo "Log file: $LOG_FILE"
echo ""

# ── Collect worktree-protected branches ──────────────────────────────────────

PROTECTED_BRANCHES=()
while IFS= read -r line; do
    if [[ "$line" =~ ^branch\ refs/heads/(.+)$ ]]; then
        PROTECTED_BRANCHES+=("${BASH_REMATCH[1]}")
    fi
done < <(git worktree list --porcelain)

if [[ ${#PROTECTED_BRANCHES[@]} -eq 0 ]]; then
    echo "❌ Could not determine worktree branches. Aborting for safety."
    exit 1
fi

echo "Protected (worktree) branches:"
for b in "${PROTECTED_BRANCHES[@]}"; do
    echo "  🔒 $b"
done
echo ""

is_protected() {
    local branch="$1"
    for p in "${PROTECTED_BRANCHES[@]}"; do
        if [[ "$branch" == "$p" ]]; then
            return 0
        fi
    done
    return 1
}

# ── Local branches ───────────────────────────────────────────────────────────

LOCAL_TO_DELETE=()
if [[ "$REMOTE_ONLY" == "false" ]]; then
    while IFS= read -r branch; do
        branch=$(echo "$branch" | sed 's/^[ *]*//')
        [[ -z "$branch" ]] && continue
        if ! is_protected "$branch"; then
            LOCAL_TO_DELETE+=("$branch")
        fi
    done < <(git branch --format='%(refname:short)')
fi

# ── Remote branches (origin) ────────────────────────────────────────────────

REMOTE_TO_DELETE=()
if [[ "$LOCAL_ONLY" == "false" ]]; then
    git fetch --prune origin 2>/dev/null || true
    while IFS= read -r ref; do
        [[ -z "$ref" ]] && continue
        # strip "origin/" prefix
        branch="${ref#origin/}"
        # skip HEAD pointer
        [[ "$branch" == "HEAD" ]] && continue
        if ! is_protected "$branch"; then
            REMOTE_TO_DELETE+=("$branch")
        fi
    done < <(git branch -r --format='%(refname:short)' | grep '^origin/')
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo "Local branches to delete (${#LOCAL_TO_DELETE[@]}):"
for b in "${LOCAL_TO_DELETE[@]}"; do
    echo "  ✖ $b"
done
echo ""

echo "Remote branches to delete (${#REMOTE_TO_DELETE[@]}):"
for b in "${REMOTE_TO_DELETE[@]}"; do
    echo "  ✖ origin/$b"
done
echo ""

TOTAL=$(( ${#LOCAL_TO_DELETE[@]} + ${#REMOTE_TO_DELETE[@]} ))
if [[ $TOTAL -eq 0 ]]; then
    echo "✅ Nothing to delete — all branches are worktree-protected."
    exit 0
fi

if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY RUN: Would delete $TOTAL branch(es). No changes made."
    exit 0
fi

# ── Confirmation ─────────────────────────────────────────────────────────────

if [[ "$FORCE" != "true" ]]; then
    read -p "Delete $TOTAL branch(es) locally and on origin? (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# ── Delete local ─────────────────────────────────────────────────────────────

DELETED_LOCAL=0
for branch in "${LOCAL_TO_DELETE[@]}"; do
    echo "Deleting local branch: $branch" | tee -a "$LOG_FILE"
    if git branch -D "$branch" 2>&1 | tee -a "$LOG_FILE"; then
        DELETED_LOCAL=$((DELETED_LOCAL + 1))
    else
        echo "  ⚠️  Failed to delete local $branch" | tee -a "$LOG_FILE"
    fi
done

# ── Delete remote ────────────────────────────────────────────────────────────

DELETED_REMOTE=0
for branch in "${REMOTE_TO_DELETE[@]}"; do
    echo "Deleting remote branch: origin/$branch" | tee -a "$LOG_FILE"
    if git push origin --delete "$branch" 2>&1 | tee -a "$LOG_FILE"; then
        DELETED_REMOTE=$((DELETED_REMOTE + 1))
    else
        echo "  ⚠️  Failed to delete remote origin/$branch" | tee -a "$LOG_FILE"
    fi
done

echo ""
echo "✅ Purge complete!"
echo "  Local deleted:  $DELETED_LOCAL / ${#LOCAL_TO_DELETE[@]}"
echo "  Remote deleted: $DELETED_REMOTE / ${#REMOTE_TO_DELETE[@]}"
echo "  Log: $LOG_FILE"
echo ""
echo "Tip: Recover a local branch from reflog if needed:"
echo "  git reflog | grep '<branch-name>'"
echo "  git checkout -b <branch-name> <commit-hash>"
