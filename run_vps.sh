#!/usr/bin/env bash
# Backward-compatibility shim forwarding to scripts/run_vps.sh
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$PROJECT_DIR/scripts/run_vps.sh" ]; then
    exec bash "$PROJECT_DIR/scripts/run_vps.sh" "$@"
fi
