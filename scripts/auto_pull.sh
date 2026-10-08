#!/usr/bin/env bash
# ==============================================================================
# Center Manager - Auto Pull & Self-Healing Watcher Daemon
# Automatically checks & updates GitHub origin/main every 15 seconds.
# On system reboot, automatically self-heals, verifies containers & pulls updates.
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Center Manager auto-pull service in: $PROJECT_DIR"

# 1. Startup Self-Healing on VPS Boot
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for network connection..."
for i in {1..15}; do
    if ping -c 1 -W 2 github.com >/dev/null 2>&1; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Network is ready!"
        break
    fi
    sleep 2
done

# Ensure Docker containers are running on boot
if [ -f "docker-compose.yml" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Verifying Docker containers status..."
    docker compose up -d 2>/dev/null || true
fi

# Ensure Caddy is active on boot
if command -v caddy &>/dev/null; then
    systemctl is-active --quiet caddy || systemctl restart caddy 2>/dev/null || true
fi

# Check for any new commits pushed while VPS was down or rebooting
git fetch origin main --quiet 2>/dev/null || true
BOOT_LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "")
BOOT_REMOTE=$(git rev-parse FETCH_HEAD 2>/dev/null || git rev-parse origin/main 2>/dev/null || echo "")

if [ -n "$BOOT_LOCAL" ] && [ -n "$BOOT_REMOTE" ] && [ "$BOOT_LOCAL" != "$BOOT_REMOTE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] New update detected on startup ($BOOT_LOCAL -> $BOOT_REMOTE). Applying update..."
    rm -f .git/index.lock 2>/dev/null || true
    git reset --hard "$BOOT_REMOTE" 2>/dev/null || git reset --hard origin/main 2>/dev/null || true
    git clean -fd 2>/dev/null || true
    NEW_BOOT=$(git rev-parse HEAD 2>/dev/null || echo "")
    if [ "$NEW_BOOT" != "$BOOT_LOCAL" ]; then
        export INVOKED_BY_AUTOPULL=1
        if [ -f "$PROJECT_DIR/scripts/run_vps.sh" ]; then
            bash "$PROJECT_DIR/scripts/run_vps.sh"
        elif [ -f "$PROJECT_DIR/run_vps.sh" ]; then
            bash "$PROJECT_DIR/run_vps.sh"
        elif [ -f "$PROJECT_DIR/scripts/update.sh" ]; then
            bash "$PROJECT_DIR/scripts/update.sh"
        elif [ -f "$PROJECT_DIR/update.sh" ]; then
            bash "$PROJECT_DIR/update.sh"
        fi
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Startup update completed successfully!"
    fi
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Background watch loop active (checking origin/main every 30s)..."

# 2. Continuous 30-second background watch loop
while true; do
    git fetch origin main --quiet 2>/dev/null || true
    
    LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")
    REMOTE_HASH=$(git rev-parse FETCH_HEAD 2>/dev/null || git rev-parse origin/main 2>/dev/null || echo "")

    if [ -n "$LOCAL_HASH" ] && [ -n "$REMOTE_HASH" ] && [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] New commit detected on GitHub ($LOCAL_HASH -> $REMOTE_HASH). Auto pulling..."
        rm -f .git/index.lock 2>/dev/null || true
        git reset --hard "$REMOTE_HASH" 2>/dev/null || git reset --hard origin/main 2>/dev/null || true
        git clean -fd 2>/dev/null || true
        
        NEW_LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "")
        if [ "$NEW_LOCAL" = "$LOCAL_HASH" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Git reset did not move HEAD. Skipping deployment to avoid restart loop."
            sleep 30
            continue
        fi

        export INVOKED_BY_AUTOPULL=1
        if [ -f "$PROJECT_DIR/scripts/run_vps.sh" ]; then
            bash "$PROJECT_DIR/scripts/run_vps.sh"
        elif [ -f "$PROJECT_DIR/run_vps.sh" ]; then
            bash "$PROJECT_DIR/run_vps.sh"
        elif [ -f "$PROJECT_DIR/scripts/update.sh" ]; then
            bash "$PROJECT_DIR/scripts/update.sh"
        elif [ -f "$PROJECT_DIR/update.sh" ]; then
            bash "$PROJECT_DIR/update.sh"
        fi
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto deployment completed successfully!"
    fi

    # Wait 30 seconds before next check
    sleep 30
done
