# Script kiểm tra và mở firewall cho port 8000

Write-Host "=== Kiểm tra Firewall cho Port 8000 ===" -ForegroundColor Cyan
Write-Host ""

# 1. Kiểm tra port có đang listen không
Write-Host "1. Kiểm tra port 8000 có đang listen..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr ":8000"
if ($portCheck) {
    Write-Host "   ✓ Port 8000 đang được sử dụng" -ForegroundColor Green
    Write-Host "   $portCheck" -ForegroundColor Gray
} else {
    Write-Host "   ✗ Port 8000 không được sử dụng" -ForegroundColor Red
}
Write-Host ""

# 2. Kiểm tra firewall rules
Write-Host "2. Kiểm tra firewall rules cho port 8000..." -ForegroundColor Yellow
$firewallRules = netsh advfirewall firewall show rule name=all | findstr "8000"
if ($firewallRules) {
    Write-Host "   ✓ Tìm thấy firewall rules:" -ForegroundColor Green
    Write-Host "   $firewallRules" -ForegroundColor Gray
} else {
    Write-Host "   ✗ Không có firewall rule cho port 8000" -ForegroundColor Red
    Write-Host "   → Cần tạo rule để cho phép kết nối từ bên ngoài" -ForegroundColor Yellow
}
Write-Host ""

# 3. Kiểm tra kết nối localhost
Write-Host "3. Test kết nối localhost:8000..." -ForegroundColor Yellow
try {
    $test = Test-NetConnection -ComputerName localhost -Port 8000 -WarningAction SilentlyContinue
    if ($test.TcpTestSucceeded) {
        Write-Host "   ✓ Kết nối localhost thành công" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Kết nối localhost thất bại" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Lỗi khi test: $_" -ForegroundColor Red
}
Write-Host ""

# 4. Kiểm tra Docker container
Write-Host "4. Kiểm tra Docker container..." -ForegroundColor Yellow
try {
    $docker = docker ps --filter "publish=8000" --format "{{.Names}}: {{.Ports}}" 2>$null
    if ($docker) {
        Write-Host "   ✓ Docker container đang chạy:" -ForegroundColor Green
        Write-Host "   $docker" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ Không tìm thấy container trên port 8000" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Lỗi khi kiểm tra Docker: $_" -ForegroundColor Red
}
Write-Host ""

# 5. Hướng dẫn mở firewall (nếu cần)
Write-Host "=== Hướng dẫn mở Firewall ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nếu cần mở firewall cho port 8000, chạy lệnh sau với quyền Administrator:" -ForegroundColor Yellow
Write-Host ""
$cmd1 = 'netsh advfirewall firewall add rule name="Allow Port 8000 (API Server)" dir=in action=allow protocol=TCP localport=8000'
Write-Host $cmd1 -ForegroundColor White
Write-Host ""
Write-Host "Hoặc mở PowerShell với quyền Admin và chạy:" -ForegroundColor Yellow
$cmd2 = 'New-NetFirewallRule -DisplayName "Allow Port 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow'
Write-Host $cmd2 -ForegroundColor White
Write-Host ""

