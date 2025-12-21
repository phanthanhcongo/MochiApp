# Hướng dẫn mở Firewall cho Port 8000

## Kiểm tra hiện tại

Port 8000 đang được sử dụng bởi Docker container `nginx-api`.

## Mở Firewall (Cần quyền Administrator)

### Cách 1: Dùng script PowerShell

1. Mở PowerShell với quyền Administrator (Right-click → Run as Administrator)
2. Chạy:
```powershell
.\open-firewall-port-8000.ps1
```

### Cách 2: Dùng lệnh trực tiếp

Mở PowerShell với quyền Administrator và chạy:

```powershell
New-NetFirewallRule -DisplayName "Allow Port 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

### Cách 3: Dùng netsh

Mở Command Prompt với quyền Administrator và chạy:

```cmd
netsh advfirewall firewall add rule name="Allow Port 8000 (API Server)" dir=in action=allow protocol=TCP localport=8000
```

## Kiểm tra sau khi mở

```powershell
Get-NetFirewallRule -DisplayName "Allow Port 8000"
```

## Lưu ý

- Sau khi mở firewall, iPhone qua Tailscale sẽ có thể kết nối đến port 8000
- Đảm bảo iPhone đã kết nối Tailscale VPN
- Đảm bảo CORS đã được cấu hình đúng (đã sửa trong `server/config/cors.php`)

