@echo off
title Get LPV site from GitHub only
cd /d "%~dp0.."

if "%~1"=="" (
    echo Pass a tag or commit SHA. Examples:
    echo   scripts\GET-LPV-FROM-GITHUB-ONLY.bat V1.2.0
    echo   scripts\GET-LPV-FROM-GITHUB-ONLY.bat V1.2.1
    echo   scripts\GET-LPV-FROM-GITHUB-ONLY.bat main
    echo.
    pause
    exit /b 0
)

echo.
echo Downloading from GitHub: %~1. Zip will be on your Desktop.
echo.
if exist "node_modules\unzipper" (
    node scripts\get-lpv-from-github.js "%~1"
) else (
    if exist "scripts\build-lpv-website-from-github-release.ps1" (
        powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\build-lpv-website-from-github-release.ps1" -Tag "%~1"
    ) else (
        echo ERROR: Run npm install first, or use PowerShell script.
        pause
        exit /b 1
    )
)
echo.
pause
