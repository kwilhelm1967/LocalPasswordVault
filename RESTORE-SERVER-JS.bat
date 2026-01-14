@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo Restoring server.js from Backup
==========================================
echo.

set SERVER=172.236.111.48
set USER=root

echo Step 1: Uploading clean server.js from backup...
echo.

scp backend/server.js.backup %USER%@%SERVER%:/var/www/lpv-api/Vault/backend/server.js
if errorlevel 1 (
    echo ERROR: Failed to upload
    pause
    exit /b 1
)

echo.
echo Step 2: Fixing encoding and line endings on server...
echo.

ssh %USER%@%SERVER% "cd /var/www/lpv-api/Vault/backend && sed -i '1s/^\xEF\xBB\xBF//' server.js && echo 'Removed BOM' || echo 'No BOM'; dos2unix server.js 2>/dev/null || sed -i 's/\r$//' server.js && echo 'Fixed line endings' || echo 'Line endings OK'"

echo.
echo Step 3: Validating syntax...
echo.

ssh %USER%@%SERVER% "cd /var/www/lpv-api/Vault/backend && /www/server/nodejs/v20.19.6/bin/node -c server.js && echo 'Syntax OK' || echo 'Syntax ERROR'"

echo.
echo Step 4: Restarting PM2...
echo.

ssh %USER%@%SERVER% "cd /var/www/lpv-api/Vault/backend && pm2 restart lpv-api --update-env"

echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo.
echo Step 5: Checking PM2 status...
echo.

ssh %USER%@%SERVER% "pm2 status"

echo.
echo Step 6: Checking port 3001...
echo.

ssh %USER%@%SERVER% "ss -lntp | grep :3001 || echo 'Port 3001 not listening'"

echo.
echo Step 7: Testing health endpoint...
echo.

ssh %USER%@%SERVER% "curl -i http://127.0.0.1:3001/health 2>&1 | head -10 || curl -i http://127.0.0.1:3001/api/health 2>&1 | head -10"

echo.
echo ==========================================
echo Done!
==========================================
echo.
pause
