# ---- Single container: Nginx + PHP-FPM ----
FROM php:8.2-fpm-alpine

# Install system deps + nginx + supervisor
RUN apk add --no-cache bash git unzip icu-dev libzip-dev oniguruma-dev \
    libpng-dev libjpeg-turbo-dev libxml2-dev mysql-client \
    nginx supervisor \
 && docker-php-ext-configure gd --with-jpeg \
 && docker-php-ext-install pdo_mysql zip gd intl bcmath opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Cache-friendly deps install
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader || true

# Copy source
COPY . ./

# Rebuild autoloader with all source classes
RUN composer dump-autoload --optimize --no-interaction

# Create Laravel directories
RUN mkdir -p storage/app/public storage/framework/{sessions,views,cache} storage/logs bootstrap/cache && \
    chmod -R 775 storage bootstrap/cache && \
    chown -R www-data:www-data storage bootstrap/cache

# PHP tuning
RUN set -eux; \
  { \
    echo "opcache.enable=1"; \
    echo "opcache.validate_timestamps=1"; \
    echo "opcache.revalidate_freq=0"; \
    echo "opcache.jit=1255"; \
    echo "opcache.jit_buffer_size=64M"; \
    echo "memory_limit=512M"; \
  } > /usr/local/etc/php/conf.d/z-opcache.ini

# Nginx config — points to 127.0.0.1:9000 (same container)
COPY nginx-api.conf /etc/nginx/http.d/default.conf

# Supervisor config to run both nginx + php-fpm
COPY supervisord.conf /etc/supervisord.conf

# Default port 8080
ENV PORT=8080

EXPOSE 8080

# Entrypoint: run migrations then start supervisor
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
