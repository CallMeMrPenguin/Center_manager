#!/usr/bin/env bash
set -e

echo "=== [1/4] Syncing database records into PostgreSQL ==="
if [ -f "backend/database/init_data.sql" ]; then
    docker exec -i center_manager_db psql -U center_user -d center_manager < backend/database/init_data.sql || true
    docker restart center_manager_backend || true
fi

echo "=== [2/4] Building latest Frontend UI ==="
cd frontend
npm run build
cd ..

echo "=== [3/4] Updating web directory permissions ==="
mkdir -p /var/www/center_manager
rm -rf /var/www/center_manager/dist
cp -r frontend/dist /var/www/center_manager/
chown -R caddy:caddy /var/www/center_manager || true
chmod -R 755 /var/www/center_manager

echo "=== [4/4] Updating and reloading Caddy Web Server ==="
cat << 'EOF' > /etc/caddy/Caddyfile
upkidscentermanager.io.vn, www.upkidscentermanager.io.vn, :80 {
    handle /api/* {
        reverse_proxy localhost:8000
    }
    handle /auth/* {
        reverse_proxy localhost:8000
    }
    handle /users/* {
        reverse_proxy localhost:8000
    }

    handle {
        root * /var/www/center_manager/dist
        try_files {path} /index.html
        file_server
    }
}
EOF

systemctl restart caddy

# Setup post-merge hook so future 'git pull' automatically runs this!
mkdir -p .git/hooks
cat << 'HOOK' > .git/hooks/post-merge
#!/usr/bin/env bash
bash update.sh
HOOK
chmod +x .git/hooks/post-merge

echo "=========================================================="
echo " ALL DATA IMPORTED & UI UPDATED SUCCESSFULLY!"
echo " Web: https://upkidscentermanager.io.vn"
echo "=========================================================="
