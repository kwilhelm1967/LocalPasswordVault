@echo off
echo ========================================================================
echo DEPLOY BACKEND TO LINODE SERVER
echo ========================================================================
echo.
echo This will connect to your Linode server and restart it with new code.
echo.
echo Server IP: 172.236.111.48
echo.
pause

echo.
echo Connecting to server...
echo.

ssh root@172.236.111.48 "cd /var/www/lpv-api/backend && git pull origin main && pm2 restart lpv-api && pm2 status"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================================
    echo SUCCESS! Server restarted.
    echo ========================================================================
) else (
    echo.
    echo ========================================================================
    echo CONNECTION FAILED
    echo ========================================================================
    echo.
    echo Possible reasons:
    echo 1. SSH is not enabled on the server
    echo 2. Firewall is blocking the connection
    echo 3. Server is down
    echo.
    echo You may need to:
    echo 1. Enable SSH in Linode Cloud Manager
    echo 2. Check firewall settings
    echo 3. Use Linode LISH Console instead
    echo.
)

pause
