#!/usr/bin/env bash
# ==============================================================================
# Center Manager - Auto Pull Background Watcher
# Periodically checks GitHub origin/main for new commits every 60 seconds.
# When a new commit is detected, it automatically pulls and runs update.sh.
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "Auto-pull service running for Center Manager in: $PROJECT_DIR"

while true; do
    # Fetch latest remote changes quietly
    git fetch origin main --quiet 2>/dev/null || true
    
    LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")
    REMOTE_HASH=$(git rev-parse origin/main 2>/dev/null || echo "")

    if [ -n "$LOCAL_HASH" ] && [ -n "$REMOTE_HASH" ] && [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] New commit detected on GitHub ($LOCAL_HASH -> $REMOTE_HASH). Auto pulling..."
        git pull origin main
        bash "$PROJECT_DIR/update.sh"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto deployment completed successfully!"
    fi

    # Wait 60 seconds before next check
    sleep 60
done
