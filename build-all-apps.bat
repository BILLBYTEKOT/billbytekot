@echo off
echo 🚀 BUILDING ALL APPS (APK + DESKTOP) WITH CRITICAL FIXES
echo ========================================================

echo.
echo 🎯 This script will build:
echo • 📱 Android APK (TWA)
echo • 🖥️ Windows Desktop App (Electron)
echo • ✅ All critical validation fixes included
echo.

set /p choice="Continue with full build? (y/n): "
if /i "%choice%" neq "y" (
    echo Build cancelled.
    pause
    exit /b 0
)

echo.
echo ⏰ Estimated build time: 10-15 minutes
echo 💾 Required disk space: ~3GB
echo.

echo ==========================================
echo 🧪 STEP 1: VALIDATING CRITICAL FIXES
echo ==========================================
echo.
echo Testing all validation systems...
node test-critical-fixes.js

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Critical fixes validation failed!
    echo Please fix all issues before building apps.
    pause
    exit /b 1
)

echo.
echo ✅ All critical fixes validated successfully!
echo.

echo ==========================================
echo 🌐 STEP 2: BUILDING REACT FRONTEND
echo ==========================================
echo.
cd frontend
echo Building optimized production frontend...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend build failed!
    echo Please fix build errors before continuing.
    pause
    exit /b 1
)

echo ✅ Frontend build completed successfully!
echo.

echo ==========================================
echo 📱 STEP 3: BUILDING ANDROID APK
echo ==========================================
echo.
echo Building Android TWA (Trusted Web Activity)...
cd billbytekot

call gradlew clean
call gradlew assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Android APK build failed!
    echo Please check Android build configuration.
    set APK_BUILD_FAILED=1
) else (
    echo ✅ Android APK build completed successfully!
    set APK_BUILD_FAILED=0
)

cd ..
echo.

echo ==========================================
echo 🖥️ STEP 4: BUILDING DESKTOP APP
echo ==========================================
echo.
echo Installing Electron dependencies...
call npm install

echo.
echo Building Windows Desktop App...
call npm run electron:build:win

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Desktop app build failed!
    echo Please check Electron build configuration.
    set DESKTOP_BUILD_FAILED=1
) else (
    echo ✅ Desktop app build completed successfully!
    set DESKTOP_BUILD_FAILED=0
)

cd ..

echo.
echo ==========================================
echo 🎉 BUILD SUMMARY
echo ==========================================
echo.

if %APK_BUILD_FAILED%==0 (
    echo ✅ ANDROID APK: SUCCESS
    echo 📱 Location: frontend/billbytekot/app/build/outputs/apk/release/
    if exist "frontend\billbytekot\app\build\outputs\apk\release\app-release.apk" (
        for %%f in (frontend\billbytekot\app\build\outputs\apk\release\app-release.apk) do (
            echo 📊 Size: %%~zf bytes
        )
    )
) else (
    echo ❌ ANDROID APK: FAILED
)

echo.

if %DESKTOP_BUILD_FAILED%==0 (
    echo ✅ DESKTOP APP: SUCCESS
    echo 🖥️ Location: frontend/dist/
    if exist "frontend\dist\" (
        for %%f in (frontend\dist\*.exe) do (
            echo 📦 Installer: %%~nxf
            echo 📊 Size: %%~zf bytes
        )
    )
) else (
    echo ❌ DESKTOP APP: FAILED
)

echo.
echo ==========================================
echo 🚀 DEPLOYMENT READY APPS
echo ==========================================
echo.

if %APK_BUILD_FAILED%==0 if %DESKTOP_BUILD_FAILED%==0 (
    echo 🎉 ALL BUILDS SUCCESSFUL!
    echo.
    echo Your BillByteKOT restaurant management system is ready with:
    echo.
    echo 📱 ANDROID APK FEATURES:
    echo • Trusted Web Activity (TWA) for native Android experience
    echo • Offline-first architecture with local storage
    echo • Order validation and menu duplicate prevention
    echo • Sync control system for data consistency
    echo • Push notifications support
    echo • App shortcuts for quick actions
    echo • Play Store ready (if signed)
    echo.
    echo 🖥️ DESKTOP APP FEATURES:
    echo • Native Windows application
    echo • SQLite database in roaming folder
    echo • Offline functionality with sync control
    echo • System tray integration
    echo • Auto-updater support
    echo • Bluetooth printing support
    echo • WhatsApp integration
    echo • Performance optimizations
    echo.
    echo ✅ CRITICAL FIXES INCLUDED:
    echo • Order validation with required field checks
    echo • Menu item duplicate prevention
    echo • Data type validation and sanitization
    echo • Concurrent modification protection
    echo • Business logic validation
    echo.
    echo 🎯 NEXT STEPS:
    echo 1. Test both apps thoroughly
    echo 2. Distribute APK to Android devices
    echo 3. Install desktop app on Windows PCs
    echo 4. Train staff on new validation features
    echo 5. Monitor system performance
    echo.
    echo 🚀 READY FOR PRODUCTION DEPLOYMENT!
    
) else (
    echo ⚠️ PARTIAL BUILD SUCCESS
    echo Some builds failed. Please check the errors above and retry.
    echo.
    if %APK_BUILD_FAILED%==1 (
        echo 💡 APK Build Tips:
        echo • Check Android SDK installation
        echo • Verify Gradle configuration
        echo • Ensure Java 8+ is installed
    )
    echo.
    if %DESKTOP_BUILD_FAILED%==1 (
        echo 💡 Desktop Build Tips:
        echo • Check Node.js version (16+ recommended)
        echo • Run: npm install electron-builder --save-dev
        echo • Disable antivirus temporarily
        echo • Ensure sufficient disk space
    )
)

echo.
echo ==========================================
echo 📊 BUILD STATISTICS
echo ==========================================
echo.
echo Build completed at: %date% %time%
echo Total build time: [Manual calculation needed]
echo.

if exist "frontend\billbytekot\app\build\outputs\apk\release\" (
    echo 📱 APK Files:
    dir "frontend\billbytekot\app\build\outputs\apk\release\" /b
)

echo.

if exist "frontend\dist\" (
    echo 🖥️ Desktop Files:
    dir "frontend\dist\" /b
)

echo.
echo 🎉 BUILD PROCESS COMPLETE!
echo.
pause