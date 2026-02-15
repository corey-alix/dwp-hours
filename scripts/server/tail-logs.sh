#!/bin/bash

# tail-logs.sh — Return the last N lines from the newest log files.
# If the newest log file has fewer than N lines, prepend lines from
# older log files until N lines are collected.
#
# Usage: tail-logs.sh [LINES]
#   LINES  Number of lines to return (default: 100)

set -euo pipefail

LINES="${1:-100}"
LOG_DIR="/var/www/dwp-hours/logs"

if [ ! -d "$LOG_DIR" ]; then
  echo "Log directory $LOG_DIR does not exist." >&2
  exit 1
fi

# List log files newest-first (lexicographic sort works for app-YYYY-MM-DD.log)
mapfile -t LOG_FILES < <(find "$LOG_DIR" -maxdepth 1 -name 'app-*.log' -type f | sort -r)

if [ ${#LOG_FILES[@]} -eq 0 ]; then
  echo "No log files found in $LOG_DIR" >&2
  exit 1
fi

# Collect lines from newest to oldest until we have enough
COLLECTED=""
REMAINING=$LINES

for LOG_FILE in "${LOG_FILES[@]}"; do
  FILE_LINES=$(wc -l < "$LOG_FILE")

  if [ "$FILE_LINES" -ge "$REMAINING" ]; then
    # This file has enough lines to satisfy the remainder
    CHUNK=$(tail -n "$REMAINING" "$LOG_FILE")
    if [ -n "$COLLECTED" ]; then
      COLLECTED="${CHUNK}
${COLLECTED}"
    else
      COLLECTED="$CHUNK"
    fi
    REMAINING=0
    break
  else
    # Take the entire file and keep going
    CHUNK=$(cat "$LOG_FILE")
    if [ -n "$COLLECTED" ]; then
      COLLECTED="${CHUNK}
${COLLECTED}"
    else
      COLLECTED="$CHUNK"
    fi
    REMAINING=$((REMAINING - FILE_LINES))
  fi
done

echo "$COLLECTED"
