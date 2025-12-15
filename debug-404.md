# Debug 404 - Routes không hoạt động

## Vấn đề
Routes đã được đăng ký (`php artisan route:list` hiển thị đúng) nhưng khi gọi API thì bị 404.

## Các bước debug

### 1. Kiểm tra file index.php có tồn tại
```bash
docker exec -it nginx-api ls -la /var/www/html/public/index.php
```

### 2. Kiểm tra nginx có nhận được request không
```bash
# Xem access logs
docker exec -it nginx-api tail -f /var/log/nginx/access.log

# Xem error logs
docker exec -it nginx-api tail -f /var/log/nginx/error.log
```

### 3. Kiểm tra Laravel có nhận được request không
```bash
docker exec -it api-fpm tail -f /var/www/html/storage/logs/laravel.log
```

### 4. Test trực tiếp từ trong container
```bash
# Test từ nginx container
docker exec -it nginx-api wget -O- http://localhost/api/test-cors

# Test từ api-fpm container
docker exec -it api-fpm php artisan tinker
# Trong tinker:
Route::getRoutes()->match(Request::create('/api/test-cors', 'GET'));
```

### 5. Kiểm tra nginx config có đúng không
```bash
docker exec -it nginx-api nginx -t
```

### 6. Rebuild và restart
```bash
docker-compose down
docker-compose build nginx-api
docker-compose up -d
```

## Nguyên nhân có thể

1. **Nginx không pass request đến PHP-FPM**
   - Kiểm tra: `docker logs nginx-api`
   - Sửa: Đảm bảo `fastcgi_pass php_fpm` đúng

2. **File index.php không tồn tại**
   - Kiểm tra: `docker exec -it nginx-api ls /var/www/html/public/`
   - Sửa: Đảm bảo volume mount đúng

3. **Route cache chưa được clear**
   - Chạy: `docker exec -it api-fpm php artisan route:clear`

4. **Nginx config chưa được reload**
   - Chạy: `docker-compose restart nginx-api`

