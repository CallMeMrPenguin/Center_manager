#!/usr/bin/env bash
# ==============================================================================
# CENTER MANAGER APP - MASTER VPS CONTROLLER & ALL-IN-ONE SERVICE RUNNER
# ==============================================================================
# Tác dụng: Chạy 1 lệnh duy nhất là thiết lập, tối ưu, khởi động và tự động hóa
# toàn bộ hệ thống Center Manager trên VPS:
#   1. Tắt & gỡ bỏ các service thừa thãi gây tốn RAM (snapd, packagekit, v.v.)
#   2. Kích hoạt 2GB Swap RAM ngăn ngừa OOM crash
#   3. Khởi chạy Docker (PostgreSQL 16 + FastAPI Backend với volume live code)
#   4. Tự động đồng bộ database & tài khoản người dùng
#   5. Build Frontend React UI mới nhất
#   6. Cấu hình Caddy Server với No-Cache headers & SSL tự động
#   7. Kích hoạt service tự khởi động & tự update khi VPS khởi động lại
# ==============================================================================
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================================="
echo " [1/8] DỌN DẸP & TẮT CÁC SERVICE THỪA KHÔNG CẦN THIẾT"
echo "=========================================================="
# Tắt snapd (tiết kiệm ~150-200MB RAM)
if command -v snap &>/dev/null; then
    echo " -> Tắt snapd service..."
    systemctl stop snapd.service snapd.socket snapd.seeded.service 2>/dev/null || true
    systemctl disable snapd.service snapd.socket snapd.seeded.service 2>/dev/null || true
fi

# Tắt packagekit (tiết kiệm ~40-60MB RAM)
if systemctl is-active --quiet packagekit 2>/dev/null; then
    echo " -> Tắt packagekit service..."
    systemctl stop packagekit || true
    systemctl disable packagekit || true
fi

# Tắt multipathd (vô dụng trên VPS đơn ổ đĩa, tốn ~40MB RAM)
if systemctl is-active --quiet multipathd 2>/dev/null; then
    echo " -> Tắt multipathd service..."
    systemctl stop multipathd || true
    systemctl disable multipathd || true
fi

# Tắt apache2/nginx nếu có để tránh tranh chấp cổng 80/443 với Caddy
for srv in apache2 nginx httpd; do
    if systemctl is-active --quiet "$srv" 2>/dev/null; then
        echo " -> Tắt $srv để tránh tranh chấp cổng..."
        systemctl stop "$srv" || true
        systemctl disable "$srv" || true
    fi
done

# Tắt các timer chạy ngầm không cần thiết
for tmr in motd-news.timer man-db.timer; do
    systemctl stop "$tmr" 2>/dev/null || true
    systemctl disable "$tmr" 2>/dev/null || true
done

echo " -> Các service thừa đã được dọn dẹp sạch sẽ!"

echo "=========================================================="
echo " [2/8] KIỂM TRA & KÍCH HOẠT 2GB SWAP RAM"
echo "=========================================================="
if ! swapon --show | grep -q '/swapfile'; then
    echo " -> Tạo và kích hoạt 2GB Swap RAM..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
        chmod 600 /swapfile
        mkswap /swapfile
    fi
    swapon /swapfile || true
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo " -> Kích hoạt Swap RAM thành công!"
else
    echo " -> Swap RAM đã sẵn sàng!"
fi

echo "=========================================================="
echo " [3/8] TỐI ƯU HÓA KERNEL & GIỚI HẠN LOG DOCKER / SYSTEMD"
echo "=========================================================="
# Giới hạn Systemd Journal Logs tối đa 50MB
mkdir -p /etc/systemd/journald.conf.d
cat << 'EOF' > /etc/systemd/journald.conf.d/00-memory-limit.conf
[Journal]
SystemMaxUse=50M
RuntimeMaxUse=30M
MaxRetentionSec=1month
EOF
systemctl restart systemd-journald 2>/dev/null || true

# Tối ưu Docker Log Rotation
mkdir -p /etc/docker
cat << 'EOF' > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl reload docker 2>/dev/null || systemctl restart docker 2>/dev/null || true

# Tối ưu sysctl kernel
cat << 'EOF' > /etc/sysctl.d/99-vps-tuning.conf
vm.swappiness=15
vm.vfs_cache_pressure=50
vm.dirty_background_ratio=5
vm.dirty_ratio=10
net.core.somaxconn=2048
net.ipv4.tcp_max_syn_backlog=2048
net.ipv4.tcp_slow_start_after_idle=0
net.ipv4.tcp_tw_reuse=1
net.ipv4.tcp_fin_timeout=15
EOF
sysctl --system > /dev/null 2>&1 || true

echo "=========================================================="
echo " [4/8] KHỞI ĐỘNG DOCKER CONTAINERS (DATABASE & BACKEND)"
echo "=========================================================="
# Đảm bảo docker service hoạt động
systemctl start docker
systemctl enable docker

# Khởi động PostgreSQL 16 & FastAPI Backend với volume live code (Zero-downtime rebuild)
docker compose up -d --build

# Khởi tạo dữ liệu ban đầu cho PostgreSQL nếu database chưa có người dùng
if [ -f "backend/database/init_data.sql" ]; then
    sleep 3
    USER_COUNT=$(docker exec -i center_manager_db psql -U center_user -d center_manager -tAc "SELECT COUNT(*) FROM app_users;" 2>/dev/null || echo "0")
    if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
        echo " -> Khởi tạo dữ liệu PostgreSQL ban đầu..."
        docker exec -i center_manager_db psql -U center_user -d center_manager < backend/database/init_data.sql || true
        docker restart center_manager_backend || true
    else
        echo " -> PostgreSQL đã có dữ liệu ($USER_COUNT users). Áp dụng patch cập nhật mật khẩu nếu có..."
        if [ -f "backend/database/patch_admin_password.sql" ]; then
            docker exec -i center_manager_db psql -U center_user -d center_manager < backend/database/patch_admin_password.sql 2>/dev/null || true
        fi
    fi
fi

echo "=========================================================="
echo " [5/8] BUILD FRONTEND REACT UI MỚI NHẤT"
echo "=========================================================="
cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cd "$PROJECT_DIR"

mkdir -p /var/www/center_manager
rm -rf /var/www/center_manager/dist
cp -r frontend/dist /var/www/center_manager/
chown -R caddy:caddy /var/www/center_manager 2>/dev/null || chown -R www-data:www-data /var/www/center_manager 2>/dev/null || true
chmod -R 755 /var/www/center_manager

echo "=========================================================="
echo " [6/8] CẤU HÌNH CADDY SERVER (REVERSE PROXY & NO-CACHE)"
echo "=========================================================="
mkdir -p /etc/caddy/conf.d

cat << 'EOF' > /etc/caddy/conf.d/center_manager.caddy
upkidscentermanager.io.vn, www.upkidscentermanager.io.vn {
    encode zstd gzip

    handle /api/* {
        reverse_proxy localhost:8000 {
            transport http {
                keepalive 30s
                keepalive_idle_conns 100
            }
        }
    }
    handle /auth/* {
        reverse_proxy localhost:8000 {
            transport http {
                keepalive 30s
                keepalive_idle_conns 100
            }
        }
    }
    handle /users/* {
        reverse_proxy localhost:8000 {
            transport http {
                keepalive 30s
                keepalive_idle_conns 100
            }
        }
    }

    handle /assets/* {
        root * /var/www/center_manager/dist
        header Cache-Control "public, max-age=31536000, immutable"
        file_server
    }

    handle /version.json {
        root * /var/www/center_manager/dist
        header Cache-Control "no-cache, no-store, must-revalidate"
        file_server
    }

    handle {
        root * /var/www/center_manager/dist
        try_files {path} /index.html
        header Cache-Control "no-cache, no-store, must-revalidate"
        file_server
    }
}
EOF

# Đảm bảo Caddyfile nạp conf.d
if [ ! -f /etc/caddy/Caddyfile ]; then
    echo "import /etc/caddy/conf.d/*.caddy" > /etc/caddy/Caddyfile
elif ! grep -q "conf.d" /etc/caddy/Caddyfile 2>/dev/null; then
    if grep -q "upkidscentermanager.io.vn" /etc/caddy/Caddyfile 2>/dev/null; then
        echo "import /etc/caddy/conf.d/*.caddy" > /etc/caddy/Caddyfile
    else
        echo -e "\nimport /etc/caddy/conf.d/*.caddy" >> /etc/caddy/Caddyfile
    fi
fi

systemctl restart caddy || systemctl reload caddy
systemctl enable caddy

echo "=========================================================="
echo " [7/8] CÀI ĐẶT & KÍCH HOẠT SERVICE TỰ ĐỘNG CẬP NHẬT (AUTO-PULL)"
echo "=========================================================="
chmod +x "$PROJECT_DIR/auto_pull.sh"
chmod +x "$PROJECT_DIR/run_vps.sh" 2>/dev/null || true

cat << EOF > /etc/systemd/system/center-autopull.service
[Unit]
Description=Center Manager Auto-Pull & Self-Healing Daemon
After=network-online.target docker.service caddy.service
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=${PROJECT_DIR}
ExecStart=/bin/bash ${PROJECT_DIR}/auto_pull.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable center-autopull.service
systemctl restart center-autopull.service

echo "=========================================================="
echo " [8/8] ĐẢM BẢO TỰ KHỞI ĐỘNG KHI VPS REBOOT & KIỂM TRA TRẠNG THÁI"
echo "=========================================================="
# Bật tự khởi động cho 3 service cốt lõi
systemctl enable docker
systemctl enable caddy
systemctl enable center-autopull.service

echo ""
echo "--- TRẠNG THÁI CÁC DỊCH VỤ CỐT LÕI ---"
echo "Docker Daemon:       $(systemctl is-active docker)"
echo "Caddy Web Server:    $(systemctl is-active caddy)"
echo "Auto-Pull Service:   $(systemctl is-active center-autopull)"
echo ""
echo "--- DOCKER CONTAINERS ĐANG CHẠY ---"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "--- BỘ NHỚ RAM SAU KHI TỐI ƯU ---"
free -h
echo ""
echo "=========================================================="
echo " HOÀN TẤT! HỆ THỐNG ĐÃ SẴN SÀNG & TỰ KHỞI ĐỘNG KHI REBOOT!"
echo " Website: https://upkidscentermanager.io.vn"
echo "=========================================================="
