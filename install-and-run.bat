@echo off
echo Installing BillByteKOT Desktop App...
echo.

REM Check if installer exists
if not exist "frontend\dist-electron\BillByteKOT-Setup-1.3.0-win.exe" (
    echo Error: Installer not found!
    echo Please run: cd frontend && npm run electron:build:win
    pause
    exit /b 1
)

echo Running installer...
start /wait "BillByteKOT Installer" "frontend\dist-electron\BillByteKOT-Setup-1.3.0-win.exe"

echo.
echo Installation complete!
echo You can now run BillByteKOT from your Start Menu or Desktop shortcut.
echo.
pause