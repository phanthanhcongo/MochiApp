# Debug Login Error 500

## Lỗi
POST `/api/auth/login` trả về 500 Internal Server Error

## Nguyên nhân có thể

1. **Database connection error**
   - Kiểm tra: Database có kết nối được không?
   
2. **Personal access tokens table chưa được migrate**
   - Sanctum cần bảng `personal_access_tokens`
   - Chạy: `php artisan migrate`

3. **Exception không được handle**
   - Đã thêm try-catch và logging

## Các bước debug

### 1. Kiểm tra database connection
```bash
docker exec -it api-fpm php artisan migrate:status
```

### 2. Chạy migrations (nếu chưa)
```bash
docker exec -it api-fpm php artisan migrate
```

### 3. Xem Laravel logs
```bash
docker exec -it api-fpm tail -f storage/logs/laravel.log
```

### 4. Test login với curl
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name":"test","password":"test123"}'
```

### 5. Kiểm tra Sanctum migrations
```bash
docker exec -it api-fpm php artisan migrate:status | grep personal_access_tokens
```

## Đã sửa

✅ Thêm try-catch trong `login()` method
✅ Thêm error logging để debug
✅ Trả về error message rõ ràng hơn

## Sau khi sửa

Sau khi thêm try-catch, lỗi sẽ được log vào `storage/logs/laravel.log`. Kiểm tra log để xem lỗi cụ thể.

