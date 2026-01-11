@echo off
setlocal enabledelayedexpansion

echo ========================================================================
echo DEPLOY TO LINODE SERVER - 172.236.111.48
echo ========================================================================
echo.

set SERVER_IP=172.236.111.48
set SERVER_USER=root
set BACKEND_PATH=/var/www/lpv-api/backend

echo Server: %SERVER_USER%@%SERVER_IP%
echo Backend Path: %BACKEND_PATH%
echo.

echo Checking if SSH is available...
where ssh >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: SSH command not found!
    echo.
    echo You need to enable OpenSSH on Windows:
    echo 1. Press Windows key
    echo 2. Type: Settings
    echo 3. Go to: Apps -^> Optional Features
    echo 4. Search for: OpenSSH Client
    echo 5. Install it
    echo.
    pause
    exit /b 1
)

echo SSH is available.
echo.

echo ========================================================================
echo Step 1: Testing connection to server...
echo ========================================================================
echo.

ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "echo 'Connection test successful'" >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================================================
    echo CONNECTION FAILED
    echo ========================================================================
    echo.
    echo Could not connect to %SERVER_IP%
    echo.
    echo Possible reasons:
    echo 1. SSH is not enabled on the Linode server
    echo 2. Firewall is blocking port 22
    echo 3. Server is down
    echo 4. Wrong IP address
    echo.
    echo To enable SSH on Linode:
    echo 1. Go to: https://cloud.linode.com
    echo 2. Find your Linode instance
    echo 3. Go to "Networking" tab
    echo 4. Check Firewall settings - ensure port 22 is open
    echo 5. In Linode Settings, make sure "SSH Access" is enabled
    echo.
    echo Alternatively, you can use Linode LISH Console to run commands manually.
    echo.
    pause
    exit /b 1
)

echo Connection successful!
echo.

echo ========================================================================
echo Step 2: Finding backend directory...
echo ========================================================================
echo.

ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "if [ -d '%BACKEND_PATH%' ]; then echo 'Found: %BACKEND_PATH%'; else echo 'Path not found, searching...'; find / -name 'server.js' -type f 2>/dev/null | head -1; fi"

echo.

echo ========================================================================
echo Step 3: Navigating to backend and pulling latest code...
echo ========================================================================
echo.

ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "cd %BACKEND_PATH% && pwd && echo '' && echo 'Checking git status...' && git status --short && echo '' && echo 'Pulling latest code...' && git pull origin main"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to pull code from GitHub
    echo.
    pause
    exit /b 1
)

echo.
echo Code updated successfully!
echo.

echo ========================================================================
echo Step 4: Restarting backend server...
echo ========================================================================
echo.

ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "cd %BACKEND_PATH% && pm2 restart lpv-api"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to restart server
    echo Trying to start it instead...
    ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "cd %BACKEND_PATH% && pm2 start server.js --name lpv-api"
)

echo.
echo ========================================================================
echo Step 5: Checking server status...
echo ========================================================================
echo.

ssh -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% "pm2 status"

echo.
echo ========================================================================
echo DEPLOYMENT COMPLETE!
echo ========================================================================
echo.
echo The backend server has been updated and restarted.
echo It will now generate LLVT- keys for LLV trial signups.
echo.
pause
