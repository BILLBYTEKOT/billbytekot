@echo off
echo ========================================
echo BillByteKOT Desktop Release Verification
echo ========================================
echo.

cd frontend\dist-electron

echo 📁 Checking release files...
if exist "BillByteKOT-Setup-2.0.2-win.exe" (
    echo ✅ Main installer found
    for %%A in ("BillByteKOT-Setup-2.0.2-win.exe") do echo    Size: %%~zA bytes ^(~105.83 MB^)
) else (
    echo ❌ Main installer NOT found
    goto :error
)

if exist "BillByteKOT-Setup-2.0.2-win.exe.blockmap" (
    echo ✅ Blockmap file found
) else (
    echo ❌ Blockmap file NOT found
    goto :error
)

if exist "win-unpacked" (
    echo ✅ Unpacked files directory found
) else (
    echo ❌ Unpacked files directory NOT found
    goto :error
)

echo.
echo 🔍 Release Details:
echo Version: 2.0.2
echo Platform: Windows x64
echo Electron: 28.3.3
echo Build Date: %date% %time%
echo.
echo 🚀 Key Features in This Release:
echo ✅ PDF Generation Fix - No more Windows protocol errors
echo ✅ Secret Console - Ctrl+Shift+O for debugging
echo ✅ MongoDB Atlas Flex compatibility
echo ✅ Enhanced Reports with GST
echo ✅ Super Admin panel fixes
echo.
echo 📋 Installation Instructions:
echo 1. Close any running BillByteKOT applications
echo 2. Run BillByteKOT-Setup-2.0.2-win.exe as Administrator
echo 3. Follow installation wizard
echo 4. Test PDF generation in Reports section
echo 5. Try Ctrl+Shift+O for secret console
echo.
echo ✅ RELEASE VERIFICATION SUCCESSFUL!
echo Ready for distribution.
goto :end

:error
echo.
echo ❌ RELEASE VERIFICATION FAILED!
echo Some required files are missing.
echo Please rebuild the desktop version.

:end
echo.
pause