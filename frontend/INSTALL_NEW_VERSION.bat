@echo off
echo ========================================
echo RestoBill v1.1.0 Installation Helper
echo ========================================
echo.
echo This will help you install the new version with WhatsApp Pro
echo.
echo STEP 1: Close RestoBill
echo ----------------------------------------
echo Please close RestoBill app completely before continuing.
echo Press any key when RestoBill is closed...
pause > nul
echo.
echo STEP 2: Uninstall Old Version
echo ----------------------------------------
echo Opening Windows Settings to uninstall old version...
echo.
echo In the Settings window that opens:
echo 1. Search for "RestoBill"
echo 2. Click on it
echo 3. Click "Uninstall"
echo 4. Wait for it to complete
echo.
start ms-settings:appsfeatures
echo.
echo Press any key after you've uninstalled the old version...
pause > nul
echo.
echo STEP 3: Install New Version
echo ----------------------------------------
echo Opening the new installer...
echo.
start "" "%~dp0dist-electron\RestoBill-Setup-1.1.0-win.exe"
echo.
echo Follow the installation wizard to complete installation.
echo.
echo STEP 4: After Installation
echo ----------------------------------------
echo 1. Launch RestoBill
echo 2. Login with your credentials
echo 3. Go to Settings
echo 4. Look for "WhatsApp Pro" tab (6th tab)
echo 5. Click it to see the WhatsApp login option!
echo.
echo ========================================
echo Installation helper completed!
echo ========================================
pause
