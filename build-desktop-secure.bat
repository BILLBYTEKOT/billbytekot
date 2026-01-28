@echo off
echo ========================================
echo BillByteKOT - Secure Desktop Build v3.1.0
echo ========================================
echo.

echo [1/5] Cleaning previous builds...
if exist "frontend\dist-electron" rmdir /s /q "frontend\dist-electron"
if exist "frontend\build" rmdir /s /q "frontend\build"

echo [2/5] Installing dependencies...
cd frontend
call npm install

echo [3/5] Building React application...
call npm run build

echo [4/5] Building Electron desktop app...
call npm run electron:build:win

echo [5/5] Build completed!
echo.
echo ========================================
echo BillByteKOT v3.1.0 Build Complete
echo ========================================
echo.
echo Output location: frontend\dist-electron\
echo.
echo Features:
echo - Secure desktop application
echo - Hidden developer tools (Ctrl+H+S only)
echo - Restaurant Automation Platform
echo - Offline storage support
echo - WhatsApp integration
echo - Thermal printer support
echo.
echo Installation file: BillByteKOT-Setup-3.1.0-win.exe
echo.
pause