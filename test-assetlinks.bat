@echo off
echo Testing assetlinks.json endpoints...
echo.
echo ========================================
echo Testing Backend (Render) directly:
echo ========================================
curl -s https://restro-ai.onrender.com/.well-known/assetlinks.json
echo.
echo.
echo ========================================
echo Testing Frontend (Vercel) with proxy:
echo ========================================
curl -s https://billbytekot.in/.well-known/assetlinks.json
echo.
echo.
echo ========================================
echo Testing with cache-busting:
echo ========================================
curl -s "https://billbytekot.in/.well-known/assetlinks.json?t=%RANDOM%"
echo.
pause
