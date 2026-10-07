#!/usr/bin/env bash
set -e

# ==============================================================================
# Center Manager App - 1-Click VPS Deployment Script
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS or Debian 12
# ==============================================================================

echo "=========================================================="
echo " Starting Center Manager App Deployment on VPS"
echo "=========================================================="

# 1. Update system
echo "[1/6] Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y git curl ufw fail2ban ca-certificates apt-transport-https debian-keyring debian-archive-keyring

# Auto register client SSH public key for passwordless login
mkdir -p /root/.ssh
CLIENT_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICqfonfEzne6QWYenI25Ev6s3baneW0J8+PX83rM/V0Y mgw.ps99@gmail.com"
grep -qxF "$CLIENT_KEY" /root/.ssh/authorized_keys 2>/dev/null || echo "$CLIENT_KEY" >> /root/.ssh/authorized_keys
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys

# 2. Setup Firewall (UFW)
echo "[2/6] Configuring UFW Firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
echo "y" | ufw enable || true

# 3. Install Docker & Docker Compose
echo "[3/6] Installing Docker & Docker Compose..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    apt-get install -y docker-compose-plugin
fi

# 4. Start Docker Compose (PostgreSQL 16 + FastAPI Backend)
echo "[4/6] Building and starting Backend + Database containers..."
docker compose up -d --build

# 5. Install Node.js & Build Frontend
echo "[5/6] Building React Frontend..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

cd frontend
npm install
npm run build
cd ..

# 6. Install & Configure Caddy Server
echo "[6/6] Setting up Caddy Web Server..."
if ! command -v caddy &> /dev/null; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -y
    apt-get install -y caddy
fi

PROJECT_DIR=$(pwd)
cat << EOF > /etc/caddy/Caddyfile
:80 {
    root * ${PROJECT_DIR}/frontend/dist
    file_server
    try_files {path} /index.html

    handle /api/* {
        reverse_proxy localhost:8000
    }
    handle /auth/* {
        reverse_proxy localhost:8000
    }
    handle /users/* {
        reverse_proxy localhost:8000
    }
}
EOF

systemctl restart caddy
systemctl enable caddy

echo "=========================================================="
echo " DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo " Web Application URL: http://$(curl -s ifconfig.me || echo '160.30.161.121')"
echo " Backend Health API: http://$(curl -s ifconfig.me || echo '160.30.161.121')/api/health"
echo "=========================================================="
