@echo off
echo 🧪 QUICK BUILD TEST - VALIDATION ONLY
echo =====================================

echo.
echo This script will test if everything is ready for building without actually building the apps.
echo.

echo ✅ Step 1: Testing critical fixes
node test-critical-fixes.js

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Critical fixes test failed!
    pause
    exit /b 1
)

echo.
echo ✅ Step 2: Testing frontend build
cd frontend
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend build test failed!
    pause
    exit /b 1
)

echo.
echo ✅ Step 3: Checking Android build environment
cd billbytekot
call gradlew --version

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Gradle not found or not working!
    echo Please install Android Studio or Gradle
    pause
    exit /b 1
)

echo.
echo ✅ Step 4: Checking Electron build environment
cd ..
call npm list electron-builder

if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Electron Builder not found, installing...
    call npm install electron-builder --save-dev
)

cd ..

echo.
echo 🎉 BUILD ENVIRONMENT TEST COMPLETE!
echo.
echo ✅ All systems ready for building:
echo • Critical fixes: VALIDATED
echo • Frontend build: WORKING
echo • Android environment: READY
echo • Desktop environment: READY
echo.
echo 🚀 You can now run:
echo • build-apk-with-fixes.bat (for Android APK)
echo • build-desktop-with-fixes.bat (for Desktop App)
echo • build-all-apps.bat (for both)
echo.
pause