#!/bin/bash
# Stream Azure Web App logs to a local file for real-time monitoring.
# Usage: ./scripts/az-log-stream.sh
# Then watch the file: tail -f ./tmp/az-logs.txt

set -euo pipefail

APP_NAME="${AZURE_APP_NAME:-dw-time}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-DWP_time_app_RG}"
LOG_FILE="./tmp/az-logs.txt"

mkdir -p ./tmp

# Truncate previous log
> "$LOG_FILE"

echo "[az-log-stream] Streaming logs from $APP_NAME to $LOG_FILE ..."
echo "[az-log-stream] Monitor with: tail -f $LOG_FILE"
echo "[az-log-stream] Press Ctrl+C to stop."

# Enable container logging if not already enabled
az webapp log config \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --docker-container-logging filesystem \
  -o none 2>/dev/null || true

# Stream logs, writing to both stdout and the log file
az webapp log tail \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  2>&1 | tee "$LOG_FILE"
