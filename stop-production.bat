@echo off
REM Stop Production Services Script for BillByteKOT (Windows)

echo 🛑 STOPPING BILLBYTEKOT PRODUCTION SERVICES
echo ==========================================

REM Stop Python processes (Backend)
echo 🔧 Stopping Backend Services...
taskkill /f /im python.exe >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No Python processes found
) else (
    echo ✅ Backend services stopped
)

REM Stop Node processes (Frontend serve)
echo 🌐 Stopping Frontend Services...
taskkill /f /im node.exe >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No Node processes found
) else (
    echo ✅ Frontend services stopped
)

REM Stop serve processes specifically
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh 2^>nul') do (
    taskkill /f /pid %%i >nul 2>&1
)

echo.
echo 🎉 ALL SERVICES STOPPED SUCCESSFULLY!
echo ====================================
echo.
echo 💡 To restart services: deploy-production.bat
echo.
pause