@echo off
echo ========================================================================
echo QUICK RESTART - LINODE SERVER
echo ========================================================================
echo.
echo Server: root@172.236.111.48
echo.
echo This will restart the backend server (assumes code is already updated).
echo.
pause

ssh -o StrictHostKeyChecking=no root@172.236.111.48 "cd /var/www/lpv-api/backend && pm2 restart lpv-api && echo '' && echo 'Server Status:' && pm2 status"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================================
    echo SUCCESS! Server restarted.
    echo ========================================================================
) else (
    echo.
    echo ========================================================================
    echo ERROR: Could not restart server
    echo ========================================================================
    echo.
    echo Check the error message above.
    echo.
)

pause
