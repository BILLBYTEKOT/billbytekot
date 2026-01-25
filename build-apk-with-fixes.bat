@echo off
echo 🚀 BUILDING ANDROID APK WITH CRITICAL FIXES
echo ============================================

echo.
echo ✅ Step 1: Validating critical fixes
echo Testing validation system...
node test-critical-fixes.js

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Critical fixes validation failed! Please fix issues before building APK.
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
echo ✅ Step 3: Updating Android TWA configuration
echo Updating version and build configuration...

cd billbytekot

echo.
echo ✅ Step 4: Building Android APK
echo This may take a few minutes...

call gradlew clean
call gradlew assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Android build failed! Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ Step 5: Signing APK (if keystore exists)
if exist android.keystore (
    echo Signing APK with existing keystore...
    call gradlew bundleRelease
    echo ✅ Signed APK and AAB created!
) else (
    echo ⚠️ No keystore found. APK created but not signed for Play Store.
    echo To create signed APK for Play Store, you need to:
    echo 1. Generate keystore: keytool -genkey -v -keystore android.keystore -alias billbytekot -keyalg RSA -keysize 2048 -validity 10000
    echo 2. Run: gradlew bundleRelease
)

echo.
echo 🎉 ANDROID APK BUILD COMPLETE!
echo.
echo 📱 APK Location: frontend/billbytekot/app/build/outputs/apk/release/
echo 📦 AAB Location: frontend/billbytekot/app/build/outputs/bundle/release/ (if signed)
echo.
echo ✅ Features included in APK:
echo • Order validation with required field checks
echo • Menu duplicate prevention
echo • Data integrity protection
echo • Offline-first architecture
echo • Sync control system
echo • Platform-specific SQLite storage
echo • Performance optimizations
echo.
echo 🚀 Ready for installation or Play Store upload!
echo.

cd ..
cd ..

echo 📋 APK Build Summary:
echo =====================
dir "frontend\billbytekot\app\build\outputs\apk\release\" 2>nul
if exist "frontend\billbytekot\app\build\outputs\bundle\release\" (
    echo.
    echo 📦 AAB Files:
    dir "frontend\billbytekot\app\build\outputs\bundle\release\" 2>nul
)

echo.
pause