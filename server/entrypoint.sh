#!/usr/bin/env sh
set -e

cd /var/www/html

# Tạo .env nếu chưa có (không sửa nội dung của bạn)
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    touch .env
  fi
fi

# Tạo APP_KEY nếu trống (không ghi đè nếu đã có)
php artisan key:generate --force || true

# Tables cho session/cache/queue nếu bạn đang dùng database drivers
php artisan session:table || true
php artisan cache:table || true
php artisan queue:table || true

# Seed data from SQL dumps if available (conditional overwrite)
if [ "$DB_AUTO_IMPORT" = "true" ]; then
    echo "[INFO] DB_AUTO_IMPORT is true. Importing latest SQL dump..."
    php artisan app:import-sql --force || true
else
    echo "[INFO] DB_AUTO_IMPORT is false. Skipping SQL import."
fi

# Migrate (có thể fail lần đầu nếu DB chưa sẵn sàng; không làm hỏng container)
php artisan migrate --force || true

exec "$@"
