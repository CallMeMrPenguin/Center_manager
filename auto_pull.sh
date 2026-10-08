#!/usr/bin/env bash
# Backward-compatibility shim forwarding to scripts/auto_pull.sh
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$PROJECT_DIR/scripts/auto_pull.sh" ]; then
    exec bash "$PROJECT_DIR/scripts/auto_pull.sh" "$@"
fi
