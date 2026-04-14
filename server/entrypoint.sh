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

# Auto import data if DB_AUTO_IMPORT is true and database is empty
if [ "$DB_AUTO_IMPORT" = "true" ]; then
  echo "=== Checking if data import is needed ==="
  
  # Lấy số lượng user từ database để kiểm tra DB có trống không
  USER_COUNT=$(php artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null | grep -E '^[0-9]+$' || echo "0")
  
  if [ "$USER_COUNT" = "0" ]; then
    # Tìm file .sql mới nhất trong thư mục data/
    IMPORT_FILE=$(ls -t data/*.sql 2>/dev/null | head -n 1)
    
    if [ -n "$IMPORT_FILE" ]; then
      echo "=== Importing database from $IMPORT_FILE ==="
      php -r "
        \$pdo = new PDO(
          'mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: '3306') . ';dbname=' . getenv('DB_DATABASE'),
          getenv('DB_USERNAME'),
          getenv('DB_PASSWORD'),
          [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        \$sql = file_get_contents('$IMPORT_FILE');
        \$pdo->exec(\$sql);
        echo 'Import successful' . PHP_EOL;
      "
      echo "=== Import completed ==="
    else
      echo "!!! No .sql file found in data/ directory, skipping import"
    fi
  else
    echo "=== Database already has data ($USER_COUNT users), skipping import ==="
  fi
fi

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
