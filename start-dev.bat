@echo off
cd /d "%~dp0"
echo Starting Local Password Vault dev server...
echo Open http://localhost:5173 in your browser.
echo.
npm run dev:vite:lpv
pause
