# Hướng dẫn Debug CORS

## Vấn đề
CORS headers không được thêm vào response từ Laravel API.

## Các bước đã thực hiện

### 1. Cấu hình Laravel (`server/bootstrap/app.php`)
- ✅ Đăng ký `HandleCors` middleware cho API routes
- ✅ Disable CSRF cho API routes

### 2. Cấu hình CORS (`server/config/cors.php`)
- ✅ Đã cấu hình `allowed_origins` với `http://localhost:3005`
- ✅ `supports_credentials: true`
- ✅ `paths: ['api/*', 'sanctum/csrf-cookie']`

### 3. Cấu hình Nginx (`server/nginx-api.conf`)
- ✅ Pass qua tất cả requests cho Laravel
- ✅ Không can thiệp vào CORS headers

## Các bước cần thực hiện

### Bước 1: Rebuild Docker containers
```bash
docker-compose down
docker-compose build nginx-api api-fpm
docker-compose up -d
```

### Bước 2: Clear Laravel cache (trong container)
```bash
docker exec -it api-fpm php artisan config:clear
docker exec -it api-fpm php artisan cache:clear
docker exec -it api-fpm php artisan route:clear
```

### Bước 3: Kiểm tra config CORS
```bash
docker exec -it api-fpm php artisan config:show cors
```

### Bước 4: Test CORS với curl
```bash
# Test OPTIONS request (preflight)
curl -X OPTIONS http://localhost:8000/api/auth/login \
  -H "Origin: http://localhost:3005" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

# Kiểm tra headers trong response
```

### Bước 5: Kiểm tra logs
```bash
# Xem logs của nginx
docker logs nginx-api

# Xem logs của Laravel
docker exec -it api-fpm tail -f storage/logs/laravel.log
```

## Test CORS với routes đã thêm

✅ **Đã thêm các route test vào `routes/api.php`:**

### Test GET request
```bash
curl -X GET http://localhost:8000/api/test-cors \
  -H "Origin: http://localhost:3005" \
  -v
```

### Test POST request
```bash
curl -X POST http://localhost:8000/api/test-cors \
  -H "Origin: http://localhost:3005" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  -v
```

### Test OPTIONS request (preflight)
```bash
curl -X OPTIONS http://localhost:8000/api/test-cors \
  -H "Origin: http://localhost:3005" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

### Test từ browser console (F12)
```javascript
// Test GET
fetch('http://localhost:8000/api/test-cors', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));

// Test POST
fetch('http://localhost:8000/api/test-cors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({ test: 'data' })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

### Kiểm tra CORS headers trong response
Khi test, bạn sẽ thấy các headers sau trong response nếu CORS hoạt động:
- `Access-Control-Allow-Origin: http://localhost:3005`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: *`
- `Access-Control-Allow-Credentials: true`

## Lưu ý quan trọng

1. **Frontend KHÔNG cần làm gì** - CORS được xử lý hoàn toàn ở server
2. **Phải rebuild Docker** sau khi sửa nginx config
3. **Phải clear cache** sau khi sửa Laravel config
4. **Kiểm tra logs** nếu vẫn không hoạt động

