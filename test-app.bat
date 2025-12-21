@echo off
echo Testing BillByteKOT Desktop App...
echo.

REM Test the unpacked version directly
if exist "frontend\dist-electron\win-unpacked\BillByteKOT.exe" (
    echo Running unpacked version for testing...
    cd "frontend\dist-electron\win-unpacked"
    start BillByteKOT.exe
    echo.
    echo App launched! Check for any console errors.
    echo If you see errors, please copy and paste them.
) else (
    echo Error: Built app not found!
    echo Please run: cd frontend && npm run electron:build:win
)

echo.
pause