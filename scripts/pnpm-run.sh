#!/bin/bash

# Drop-in replacement for npm-run-all with proper signal handling
# Usage: ./scripts/pnpm-run.sh -p script1 script2 ...  (parallel)
#        ./scripts/pnpm-run.sh -s script1 script2 ...  (sequential)
# Runs pnpm run script1, pnpm run script2, etc.

if [ $# -lt 2 ] || { [ "$1" != "-p" ] && [ "$1" != "-s" ]; }; then
    echo "Usage: $0 -p script1 script2 ... (parallel)"
    echo "       $0 -s script1 script2 ... (sequential)"
    exit 1
fi

mode="$1"
shift

if [ "$mode" = "-s" ]; then
    # Sequential mode
    echo "Running scripts sequentially..."
    for script in "$@"; do
        echo "Running: pnpm run $script"
        pnpm run "$script"
        if [ $? -ne 0 ]; then
            echo "Script $script failed, stopping."
            exit 1
        fi
    done
    echo "All scripts completed successfully."
elif [ "$mode" = "-p" ]; then
    # Parallel mode
    pids=()

    cleanup() {
        echo "Shutting down processes..."
        for pid in "${pids[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null
            fi
        done
        exit 0
    }

    trap cleanup INT

    echo "Starting processes..."

    for script in "$@"; do
        echo "Starting: pnpm run $script"
        pnpm run "$script" &
        pids+=($!)
    done

    wait || true

    echo "All processes stopped."
fi