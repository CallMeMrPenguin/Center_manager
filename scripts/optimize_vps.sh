#!/usr/bin/env bash
# Forward to master VPS runner
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "$PROJECT_DIR/scripts/run_vps.sh" "$@"
