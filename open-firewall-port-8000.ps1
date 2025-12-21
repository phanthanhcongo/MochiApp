# Script mở firewall cho port 8000
# Chạy với quyền Administrator

Write-Host "Mở firewall cho port 8000..." -ForegroundColor Yellow

try {
    # Kiểm tra xem rule đã tồn tại chưa
    $existingRule = Get-NetFirewallRule -DisplayName "Allow Port 8000" -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "Rule đã tồn tại, đang cập nhật..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "Allow Port 8000" -ErrorAction SilentlyContinue
    }
    
    # Tạo rule mới
    New-NetFirewallRule -DisplayName "Allow Port 8000" `
        -Direction Inbound `
        -LocalPort 8000 `
        -Protocol TCP `
        -Action Allow `
        -Description "Cho phép kết nối đến API server trên port 8000 từ Tailscale"
    
    Write-Host "✓ Đã tạo firewall rule thành công!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Kiểm tra rule:" -ForegroundColor Cyan
    Get-NetFirewallRule -DisplayName "Allow Port 8000" | Format-Table DisplayName, Direction, Action, Enabled
    
} catch {
    Write-Host "✗ Lỗi: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Đảm bảo bạn đang chạy PowerShell với quyền Administrator!" -ForegroundColor Yellow
}

