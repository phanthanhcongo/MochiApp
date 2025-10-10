@echo off
echo =====================================================
echo  STARTING BACKUP OF DATABASE: MOCHI
echo  Time: %DATE% %TIME%
echo =====================================================

REM ===== Set variables =====
set DB_USER=appuser
set DB_PASS=StrongPass!123
set DB_NAME=mochi
set OUT_DIR=C:\Users\thanh\Documents\dumps\BackupMochi

REM ===== Create timestamp =====
set TIMESTAMP=%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo [INFO] Database: %DB_NAME%
echo [INFO] User: %DB_USER%
echo [INFO] Output file: %OUT_DIR%\%DB_NAME%_%TIMESTAMP%.sql

REM ===== Ensure output folder exists =====
if not exist "%OUT_DIR%" (
    echo [INFO] Output folder does not exist. Creating...
    mkdir "%OUT_DIR%"
)

REM ===== Run mysqldump using full path =====
echo -----------------------------------------------------
echo [RUN] Executing mysqldump ...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u %DB_USER% -p%DB_PASS% ^
  --databases %DB_NAME% ^
  --routines ^
  --events ^
  --triggers ^
  > "%OUT_DIR%\%DB_NAME%_%TIMESTAMP%.sql"

REM ===== Check result =====
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backup completed successfully!
) else (
    echo [ERROR] Backup failed!
    echo Please check your user/password or mysqldump path.
)

echo =====================================================
echo  BACKUP FINISHED
echo =====================================================

pause
exit /b %ERRORLEVEL%
