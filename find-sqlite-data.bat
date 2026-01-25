@echo off
echo ========================================
echo   BillByteKOT SQLite Data Finder
echo ========================================
echo.

REM Set the app data path
set "APP_DATA_PATH=%APPDATA%\BillByteKOT"
set "DB_FILE=%APP_DATA_PATH%\billbytekot.db"
set "BACKUP_PATH=%APP_DATA_PATH%\backups"

echo 📍 Checking SQLite data location...
echo    App Data Path: %APP_DATA_PATH%
echo    Database File: %DB_FILE%
echo    Backup Path: %BACKUP_PATH%
echo.

REM Check if directory exists
if exist "%APP_DATA_PATH%" (
    echo ✅ App directory found!
    
    REM Check if database file exists
    if exist "%DB_FILE%" (
        echo ✅ SQLite database found!
        
        REM Get file size
        for %%A in ("%DB_FILE%") do (
            echo    Database size: %%~zA bytes
            echo    Last modified: %%~tA
        )
        
        echo.
        echo 📋 Directory contents:
        dir "%APP_DATA_PATH%" /B
        
        echo.
        echo 💾 Backup files:
        if exist "%BACKUP_PATH%" (
            dir "%BACKUP_PATH%" /B 2>nul
            if errorlevel 1 echo    (No backup files)
        ) else (
            echo    (Backup directory not found)
        )
        
    ) else (
        echo ❌ SQLite database not found
        echo    The app may not have been run yet, or data is stored elsewhere
    )
    
) else (
    echo ❌ App directory not found
    echo    Creating directory structure...
    mkdir "%APP_DATA_PATH%" 2>nul
    mkdir "%BACKUP_PATH%" 2>nul
    echo ✅ Directory structure created
)

echo.
echo 🔧 Quick Actions:
echo    1. Open folder in Explorer
echo    2. Run Node.js test script
echo    3. Exit
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo Opening folder in Explorer...
    explorer "%APP_DATA_PATH%"
) else if "%choice%"=="2" (
    echo Running Node.js test script...
    node test-sqlite-roaming.js
    pause
) else (
    echo Goodbye!
)

echo.
echo 📖 Manual Access Instructions:
echo    1. Press Win+R
echo    2. Type: %%APPDATA%%\BillByteKOT
echo    3. Press Enter
echo    4. Look for billbytekot.db file
echo.
echo 🔍 SQLite Browser Download:
echo    https://sqlitebrowser.org/
echo.
pause