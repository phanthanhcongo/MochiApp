# Fix Database Configuration

## Vấn đề
Laravel vẫn đang dùng SQLite thay vì MySQL dù đã set `DB_CONNECTION=mysql` trong docker-compose.yml

## Giải pháp

### 1. Restart container để load environment variables mới:
```bash
docker-compose down
docker-compose up -d api-fpm
```

### 2. Clear config cache (QUAN TRỌNG):
```bash
docker exec -it api-fpm php artisan config:clear
docker exec -it api-fpm php artisan cache:clear
```

### 3. Kiểm tra environment variables trong container:
```bash
docker exec -it api-fpm env | grep DB_
```

Kết quả mong đợi:
```
DB_CONNECTION=mysql
DB_HOST=host.docker.internal
DB_PORT=3306
DB_DATABASE=mochi
DB_USERNAME=appuser
DB_PASSWORD=StrongPass!123
```

### 4. Kiểm tra config đã được load đúng chưa:
```bash
docker exec -it api-fpm php artisan tinker
```
Trong tinker:
```php
config('database.default');
// Phải trả về: "mysql"
```

### 5. Test kết nối database:
```bash
docker exec -it api-fpm php artisan migrate:status
```

Nếu vẫn lỗi, kiểm tra MySQL có đang chạy không:
```bash
# Test kết nối từ container đến MySQL trên Windows
docker exec -it api-fpm ping host.docker.internal
```

## Lưu ý

- **Phải restart container** sau khi sửa docker-compose.yml
- **Phải clear config cache** để Laravel đọc lại config mới
- Kiểm tra MySQL trên Windows có đang chạy và có thể truy cập từ Docker không

