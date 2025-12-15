# ---- Base PHP-FPM with extensions & composer ----
FROM php:8.2-fpm-alpine AS php-base

RUN apk add --no-cache bash git unzip icu-dev libzip-dev oniguruma-dev \
    libpng-dev libjpeg-turbo-dev libxml2-dev \
 && docker-php-ext-configure gd --with-jpeg \
 && docker-php-ext-install pdo_mysql zip gd intl bcmath opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Cache-friendly deps install
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader || true

# Copy source (sẽ bỏ qua các file trong .dockerignore như public/storage)
COPY . ./

# Tạo các thư mục cần thiết cho Laravel
RUN mkdir -p storage/app/public storage/framework/{sessions,views,cache} storage/logs bootstrap/cache && \
    chmod -R 775 storage bootstrap/cache

# PHP tuning for speed
RUN set -eux; \
  { \
    echo "opcache.enable=1"; \
    echo "opcache.validate_timestamps=1"; \
    echo "opcache.revalidate_freq=0"; \
    echo "opcache.jit=1255"; \
    echo "opcache.jit_buffer_size=64M"; \
    echo "memory_limit=512M"; \
  } > /usr/local/etc/php/conf.d/z-opcache.ini

# ---- Final PHP runtime ----
FROM php-base AS php-runtime
WORKDIR /var/www/html
# Tạo thư mục nếu thiếu và set quyền cho Laravel
RUN set -eux; \
    mkdir -p storage bootstrap/cache; \
    chown -R www-data:www-data storage bootstrap/cache
# Không tạo user/group mới; php-fpm đã dùng www-data sẵn
# USER www-data  # không bắt buộc
EXPOSE 9000
# php-fpm sẽ được khởi chạy bởi image php-fpm mặc định

# ---- Nginx runtime for API ----
FROM nginx:1.27-alpine AS nginx-runtime
WORKDIR /var/www/html
COPY --from=php-base /var/www/html /var/www/html
COPY nginx-api.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1
