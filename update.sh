#!/usr/bin/env bash
set -e

echo "Applying latest Caddy configuration and permissions..."
mkdir -p /var/www/center_manager
rm -rf /var/www/center_manager/dist
cp -r frontend/dist /var/www/center_manager/
chown -R caddy:caddy /var/www/center_manager || true
chmod -R 755 /var/www/center_manager

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

# Setup post-merge hook so future 'git pull' automatically triggers update.sh!
mkdir -p .git/hooks
cat << 'HOOK' > .git/hooks/post-merge
#!/usr/bin/env bash
bash update.sh
HOOK
chmod +x .git/hooks/post-merge

echo "=========================================================="
echo " CADDY UPDATED AND RELOADED! WEBSITE IS READY!"
echo "=========================================================="
