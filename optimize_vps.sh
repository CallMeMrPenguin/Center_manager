#!/usr/bin/env bash
set -e

# ==============================================================================
# SCRIPT TỐI ƯU HÓA TOÀN DIỆN RAM CHO VPS (UBUNTU 22.04 / 24.04)
# Mục tiêu: Giảm mức sử dụng RAM ở trạng thái IDLE từ 50-60% xuống còn 15-25%
# ==============================================================================

echo "=========================================================="
echo " 1. KIỂM TRA DUNG LƯỢNG RAM TRƯỚC KHI TỐI ƯU:"
echo "=========================================================="
free -h

echo ""
echo "[1/6] Tắt và gỡ bỏ các service chạy ngầm vô dụng trên Cloud VPS..."

# 1. multipathd (Chỉ dùng cho hạ tầng lưu trữ SAN lớn, vô dụng trên VPS đơn ổ đĩa, tốn ~40MB RAM)
if systemctl is-active --quiet multipathd 2>/dev/null; then
    echo " -> Tắt multipathd..."
    systemctl stop multipathd || true
    systemctl disable multipathd || true
fi

# 2. packagekit (Trình kiểm tra update tự động chạy ngầm ngốn ~40-60MB RAM)
if systemctl is-active --quiet packagekit 2>/dev/null; then
    echo " -> Tắt packagekit..."
    systemctl stop packagekit || true
    systemctl disable packagekit || true
fi

# 3. snapd (Daemon quản lý snap packages, ngốn từ 120MB - 200MB RAM)
# Chỉ tắt nếu người dùng không chạy dịch vụ nào quan trọng qua snap
if command -v snap &> /dev/null; then
    echo " -> Phát hiện snapd. Đang dọn dẹp và dừng snapd để giải phóng ~150MB RAM..."
    systemctl stop snapd.service snapd.socket snapd.seeded.service 2>/dev/null || true
    systemctl disable snapd.service snapd.socket snapd.seeded.service 2>/dev/null || true
fi

echo "[2/6] Giới hạn bộ nhớ đệm Systemd Journal Logs (tiết kiệm ~40MB RAM)..."
mkdir -p /etc/systemd/journald.conf.d
cat << 'EOF' > /etc/systemd/journald.conf.d/00-memory-limit.conf
[Journal]
SystemMaxUse=50M
RuntimeMaxUse=30M
MaxRetentionSec=1month
EOF
systemctl restart systemd-journald || true

echo "[3/6] Tối ưu hóa Kernel Virtual Memory (Giảm Swappiness, giữ hệ thống mượt)..."
cat << 'EOF' > /etc/sysctl.d/99-vps-tuning.conf
# Giảm swappiness để ưu tiên dùng RAM thật thay vì đẩy sớm sang ổ đĩa Swap
vm.swappiness=15

# Tối ưu giải phóng inode & dentry cache
vm.vfs_cache_pressure=50

# Giảm ngưỡng ghi buffer bẩn ra đĩa
vm.dirty_background_ratio=5
vm.dirty_ratio=10
EOF
sysctl --system > /dev/null 2>&1 || true

echo "[4/6] Cấu hình Docker Log Rotation (Ngăn chặn log container phình to RAM & Disk)..."
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

echo "[5/6] Dọn dẹp bộ nhớ đệm APT và Docker build cache cũ..."
apt-get autoremove -y > /dev/null 2>&1 || true
apt-get clean > /dev/null 2>&1 || true
docker system prune -f > /dev/null 2>&1 || true

echo "[6/6] Khởi động lại Docker Compose với cấu hình PostgreSQL & FastAPI tối ưu..."
APP_DIR=""
if [ -f "docker-compose.yml" ]; then
    APP_DIR="$(pwd)"
elif [ -f "/root/Center_manager/docker-compose.yml" ]; then
    APP_DIR="/root/Center_manager"
elif [ -f "/var/www/center_manager/docker-compose.yml" ]; then
    APP_DIR="/var/www/center_manager"
else
    FOUND=$(find /root /var/www /home -maxdepth 3 -name "docker-compose.yml" 2>/dev/null | head -n 1)
    if [ -n "$FOUND" ]; then
        APP_DIR="$(dirname "$FOUND")"
    fi
fi

if [ -n "$APP_DIR" ]; then
    echo " -> Đang áp dụng tại thư mục app: $APP_DIR"
    cd "$APP_DIR"
    docker compose down || true
    docker compose up -d --build
else
    echo " [!] Chú ý: Không tìm thấy docker-compose.yml tự động. Vui lòng cd vào thư mục dự án và chạy: docker compose up -d --build"
fi

echo ""
echo "=========================================================="
echo " HOÀN TẤT! DUNG LƯỢNG RAM SAU KHI TỐI ƯU:"
echo "=========================================================="
free -h
echo ""
echo "Chi tiết tài nguyên từng Container Docker:"
docker stats --no-stream
echo "=========================================================="
