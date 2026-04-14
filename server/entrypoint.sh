#!/bin/bash
set -e

cd /var/www/html

# Tạo file .env nếu chưa có (Laravel cần file này để key:generate hoạt động)
if [ ! -f .env ]; then
  echo "=== Creating .env from environment variables ==="
  env | grep -E '^(APP_|DB_|SESSION_|CACHE_|QUEUE_|MAIL_|LOG_|REDIS_|BROADCAST_|FILESYSTEM_)' > .env 2>/dev/null || true
fi

# Generate app key nếu chưa có
if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then
  echo "=== Generating APP_KEY ==="
  php artisan key:generate --force --no-interaction 2>/dev/null || true
fi

# Tạo thư mục views nếu chưa có
mkdir -p resources/views

# Run migrations — chỉ chạy những migration chưa chạy, bỏ qua lỗi
echo "=== Running migrations ==="
php artisan migrate --force --no-interaction 2>/dev/null || echo "Migration skipped (already up-to-date or error)"

# Clear and cache config
php artisan config:clear 2>/dev/null || true
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

# Fix permissions
chown -R www-data:www-data storage bootstrap/cache

# Create storage link
php artisan storage:link 2>/dev/null || true

echo "=== Starting Nginx + PHP-FPM ==="
exec /usr/bin/supervisord -c /etc/supervisord.conf
