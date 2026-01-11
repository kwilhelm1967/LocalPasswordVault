@echo off
echo ========================================================================
echo RESTART BACKEND SERVER
echo ========================================================================
echo.
echo This will restart your backend server (assumes code is already updated).
echo.
echo Server IP: 172.236.111.48
echo.
pause

echo.
echo Connecting to server and restarting...
echo.

ssh root@172.236.111.48 "cd /var/www/lpv-api/backend && pm2 restart lpv-api && pm2 status"

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
    echo Could not connect to server.
    echo.
)

pause
