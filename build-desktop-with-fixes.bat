@echo off
echo 🖥️ BUILDING DESKTOP APP WITH CRITICAL FIXES
echo ============================================

echo.
echo ✅ Step 1: Validating critical fixes
echo Testing validation system...
node test-critical-fixes.js

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Critical fixes validation failed! Please fix issues before building desktop app.
    pause
    exit /b 1
)

echo.
echo ✅ Step 2: Building React frontend with fixes
cd frontend
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend build failed! Please fix build errors.
    pause
    exit /b 1
)

echo.
echo ✅ Step 3: Installing Electron dependencies
call npm install

echo.
echo ✅ Step 4: Building Desktop App for Windows
echo This may take several minutes...
echo Building optimized desktop application...

call npm run electron:build:win

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Desktop build failed! Please check the error messages above.
    echo.
    echo 💡 Troubleshooting tips:
    echo • Make sure you have the latest Node.js installed
    echo • Try running: npm install electron-builder --save-dev
    echo • Check if Windows Defender is blocking the build
    echo • Ensure you have enough disk space (at least 2GB free)
    pause
    exit /b 1
)

echo.
echo 🎉 DESKTOP APP BUILD COMPLETE!
echo.
echo 📁 Desktop App Location: frontend/dist/
echo.
echo ✅ Features included in Desktop App:
echo • Order validation with required field checks
echo • Menu duplicate prevention  
echo • Data integrity protection
echo • Offline-first architecture with SQLite
echo • Sync control system
echo • Local data storage in Windows roaming folder
echo • Performance optimizations
echo • WhatsApp integration
echo • Bluetooth printing support
echo • Auto-updater support
echo.

cd ..

echo 📋 Desktop Build Summary:
echo =========================
if exist "frontend\dist\" (
    echo ✅ Build successful! Files created:
    dir "frontend\dist\" /b
    echo.
    
    for %%f in (frontend\dist\*.exe) do (
        echo 📦 Installer: %%f
        echo 📊 Size: 
        dir "%%f" | find "%%~nxf"
    )
    
    echo.
    echo 🚀 Installation Instructions:
    echo 1. Navigate to frontend/dist/ folder
    echo 2. Run the .exe installer
    echo 3. Follow the installation wizard
    echo 4. Launch BillByteKOT from Start Menu or Desktop
    echo.
    echo 💾 Data Storage Location:
    echo %APPDATA%\BillByteKOT\billbytekot.db
    echo.
    echo 🔧 Features:
    echo • Works completely offline
    echo • Automatic data sync when online
    echo • Local SQLite database
    echo • Windows native notifications
    echo • System tray integration
    echo • Auto-start with Windows (optional)
    
) else (
    echo ❌ Build directory not found. Build may have failed.
)

echo.
echo 🎯 Next Steps:
echo • Test the desktop app installation
echo • Verify offline functionality
echo • Test sync control features
echo • Distribute to restaurant staff
echo.
pause