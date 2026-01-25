# ✅ BillByteKOT SQLite Data Finder (PowerShell)
# Advanced script to locate and analyze SQLite data in roaming directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BillByteKOT SQLite Data Finder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$AppDataPath = "$env:APPDATA\BillByteKOT"
$DatabasePath = "$AppDataPath\billbytekot.db"
$BackupPath = "$AppDataPath\backups"

Write-Host "📍 Checking SQLite data location..." -ForegroundColor Yellow
Write-Host "   App Data Path: $AppDataPath" -ForegroundColor Gray
Write-Host "   Database File: $DatabasePath" -ForegroundColor Gray
Write-Host "   Backup Path: $BackupPath" -ForegroundColor Gray
Write-Host ""

# Function to format file size
function Format-FileSize {
    param([long]$Size)
    
    if ($Size -eq 0) { return "0 Bytes" }
    
    $Units = @("Bytes", "KB", "MB", "GB", "TB")
    $Index = 0
    $SizeDouble = [double]$Size
    
    while ($SizeDouble -ge 1024 -and $Index -lt $Units.Length - 1) {
        $SizeDouble /= 1024
        $Index++
    }
    
    return "{0:N2} {1}" -f $SizeDouble, $Units[$Index]
}

# Check if app directory exists
if (Test-Path $AppDataPath) {
    Write-Host "✅ App directory found!" -ForegroundColor Green
    
    # Check if database file exists
    if (Test-Path $DatabasePath) {
        Write-Host "✅ SQLite database found!" -ForegroundColor Green
        
        # Get file information
        $DbFile = Get-Item $DatabasePath
        $FileSize = Format-FileSize $DbFile.Length
        
        Write-Host "   Database size: $FileSize" -ForegroundColor Gray
        Write-Host "   Last modified: $($DbFile.LastWriteTime)" -ForegroundColor Gray
        Write-Host "   Created: $($DbFile.CreationTime)" -ForegroundColor Gray
        
        # Check if file is locked (in use)
        try {
            $FileStream = [System.IO.File]::Open($DatabasePath, 'Open', 'Read', 'None')
            $FileStream.Close()
            Write-Host "   Status: Available (not in use)" -ForegroundColor Green
        } catch {
            Write-Host "   Status: In use (app may be running)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ SQLite database not found" -ForegroundColor Red
        Write-Host "   The app may not have been run yet, or data is stored elsewhere" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "📋 Directory contents:" -ForegroundColor Yellow
    
    $Items = Get-ChildItem $AppDataPath -ErrorAction SilentlyContinue
    if ($Items) {
        foreach ($Item in $Items) {
            $Icon = if ($Item.PSIsContainer) { "📁" } else { "📄" }
            $Size = if ($Item.PSIsContainer) { "" } else { " (" + (Format-FileSize $Item.Length) + ")" }
            Write-Host "   $Icon $($Item.Name)$Size" -ForegroundColor Gray
        }
    } else {
        Write-Host "   (Empty directory)" -ForegroundColor Gray
    }
    
    # Check backup directory
    Write-Host ""
    Write-Host "💾 Backup files:" -ForegroundColor Yellow
    
    if (Test-Path $BackupPath) {
        $Backups = Get-ChildItem $BackupPath -ErrorAction SilentlyContinue
        if ($Backups) {
            foreach ($Backup in $Backups) {
                $Size = Format-FileSize $Backup.Length
                Write-Host "   📄 $($Backup.Name) ($Size)" -ForegroundColor Gray
                Write-Host "      Modified: $($Backup.LastWriteTime)" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "   (No backup files)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   (Backup directory not found)" -ForegroundColor Gray
    }
    
} else {
    Write-Host "❌ App directory not found" -ForegroundColor Red
    Write-Host "   Creating directory structure..." -ForegroundColor Yellow
    
    try {
        New-Item -Path $AppDataPath -ItemType Directory -Force | Out-Null
        New-Item -Path $BackupPath -ItemType Directory -Force | Out-Null
        Write-Host "✅ Directory structure created" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create directories: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔧 Quick Actions:" -ForegroundColor Cyan

$Choice = Read-Host @"
   1. Open folder in Explorer
   2. Copy database path to clipboard
   3. Show SQLite connection string
   4. Run Node.js test script
   5. Exit

Enter your choice (1-5)
"@

switch ($Choice) {
    "1" {
        Write-Host "Opening folder in Explorer..." -ForegroundColor Green
        Invoke-Item $AppDataPath
    }
    "2" {
        Write-Host "Copying database path to clipboard..." -ForegroundColor Green
        $DatabasePath | Set-Clipboard
        Write-Host "✅ Path copied: $DatabasePath" -ForegroundColor Green
    }
    "3" {
        Write-Host "SQLite Connection String:" -ForegroundColor Green
        $ConnectionString = "Data Source=$DatabasePath;Version=3;"
        Write-Host $ConnectionString -ForegroundColor Yellow
        $ConnectionString | Set-Clipboard
        Write-Host "✅ Connection string copied to clipboard" -ForegroundColor Green
    }
    "4" {
        if (Test-Path "test-sqlite-roaming.js") {
            Write-Host "Running Node.js test script..." -ForegroundColor Green
            node test-sqlite-roaming.js
        } else {
            Write-Host "❌ test-sqlite-roaming.js not found in current directory" -ForegroundColor Red
        }
    }
    default {
        Write-Host "Goodbye!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📖 Manual Access Instructions:" -ForegroundColor Cyan
Write-Host "   1. Press Win+R" -ForegroundColor Gray
Write-Host "   2. Type: %APPDATA%\BillByteKOT" -ForegroundColor Gray
Write-Host "   3. Press Enter" -ForegroundColor Gray
Write-Host "   4. Look for billbytekot.db file" -ForegroundColor Gray

Write-Host ""
Write-Host "🔍 Recommended SQLite Tools:" -ForegroundColor Cyan
Write-Host "   • DB Browser for SQLite: https://sqlitebrowser.org/" -ForegroundColor Gray
Write-Host "   • SQLite Studio: https://sqlitestudio.pl/" -ForegroundColor Gray
Write-Host "   • DBeaver: https://dbeaver.io/" -ForegroundColor Gray

Write-Host ""
Write-Host "💡 Pro Tips:" -ForegroundColor Cyan
Write-Host "   • Database is created when Electron app first runs" -ForegroundColor Gray
Write-Host "   • Backup files are created automatically" -ForegroundColor Gray
Write-Host "   • Data persists between app sessions" -ForegroundColor Gray
Write-Host "   • Use SQLite browser to view/edit data" -ForegroundColor Gray

Write-Host ""
Read-Host "Press Enter to exit"