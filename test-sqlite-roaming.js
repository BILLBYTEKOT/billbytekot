// ✅ Test SQLite Data in Roaming Directory
// This script helps you find and verify SQLite data storage location

const fs = require('fs');
const path = require('path');
const os = require('os');

// Function to get the expected SQLite database path
function getSQLiteDataPath() {
  const platform = os.platform();
  const userDataPath = os.homedir();
  
  let appDataPath;
  
  switch (platform) {
    case 'win32':
      // Windows: %APPDATA%\BillByteKOT\billbytekot.db
      appDataPath = path.join(userDataPath, 'AppData', 'Roaming', 'BillByteKOT');
      break;
    case 'darwin':
      // macOS: ~/Library/Application Support/BillByteKOT/billbytekot.db
      appDataPath = path.join(userDataPath, 'Library', 'Application Support', 'BillByteKOT');
      break;
    case 'linux':
      // Linux: ~/.config/BillByteKOT/billbytekot.db
      appDataPath = path.join(userDataPath, '.config', 'BillByteKOT');
      break;
    default:
      appDataPath = path.join(userDataPath, '.billbytekot');
  }
  
  return {
    appDataPath,
    dbPath: path.join(appDataPath, 'billbytekot.db'),
    backupPath: path.join(appDataPath, 'backups'),
    platform
  };
}

// Function to check if directory/file exists
function checkPath(filePath, type = 'file') {
  try {
    const stats = fs.statSync(filePath);
    if (type === 'file') {
      return stats.isFile();
    } else if (type === 'directory') {
      return stats.isDirectory();
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Function to get file size in human readable format
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const bytes = stats.size;
    
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  } catch (error) {
    return 'Unknown';
  }
}

// Function to list directory contents
function listDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return files.map(file => {
      const fullPath = path.join(dirPath, file);
      const stats = fs.statSync(fullPath);
      return {
        name: file,
        path: fullPath,
        isDirectory: stats.isDirectory(),
        size: stats.isFile() ? getFileSize(fullPath) : null,
        modified: stats.mtime.toISOString()
      };
    });
  } catch (error) {
    return [];
  }
}

// Function to create test data directory structure
function createTestStructure(appDataPath) {
  try {
    // Create main directory
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
      console.log(`✅ Created directory: ${appDataPath}`);
    }
    
    // Create backups directory
    const backupPath = path.join(appDataPath, 'backups');
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
      console.log(`✅ Created backup directory: ${backupPath}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create directory structure:', error.message);
    return false;
  }
}

// Main test function
function testSQLiteRoaming() {
  console.log('🔍 Testing SQLite Data in Roaming Directory\n');
  
  const paths = getSQLiteDataPath();
  
  console.log('📍 Platform Information:');
  console.log(`   Platform: ${paths.platform}`);
  console.log(`   User Home: ${os.homedir()}`);
  console.log(`   App Data Path: ${paths.appDataPath}`);
  console.log(`   Database Path: ${paths.dbPath}`);
  console.log(`   Backup Path: ${paths.backupPath}\n`);
  
  // Check if app data directory exists
  console.log('📂 Directory Status:');
  const appDirExists = checkPath(paths.appDataPath, 'directory');
  console.log(`   App Directory: ${appDirExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  
  if (!appDirExists) {
    console.log('\n🔧 Creating directory structure...');
    createTestStructure(paths.appDataPath);
  }
  
  // Check if database file exists
  const dbExists = checkPath(paths.dbPath, 'file');
  console.log(`   Database File: ${dbExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  
  if (dbExists) {
    console.log(`   Database Size: ${getFileSize(paths.dbPath)}`);
    
    // Get file modification time
    try {
      const stats = fs.statSync(paths.dbPath);
      console.log(`   Last Modified: ${stats.mtime.toLocaleString()}`);
    } catch (error) {
      console.log(`   Last Modified: Unknown`);
    }
  }
  
  // Check backup directory
  const backupDirExists = checkPath(paths.backupPath, 'directory');
  console.log(`   Backup Directory: ${backupDirExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  
  // List all files in app directory
  console.log('\n📋 Directory Contents:');
  if (appDirExists) {
    const contents = listDirectory(paths.appDataPath);
    
    if (contents.length === 0) {
      console.log('   (Empty directory)');
    } else {
      contents.forEach(item => {
        const type = item.isDirectory ? '📁' : '📄';
        const size = item.size ? ` (${item.size})` : '';
        console.log(`   ${type} ${item.name}${size}`);
        console.log(`      Path: ${item.path}`);
        console.log(`      Modified: ${new Date(item.modified).toLocaleString()}`);
      });
    }
  } else {
    console.log('   Directory not found');
  }
  
  // List backup files if backup directory exists
  if (backupDirExists) {
    console.log('\n💾 Backup Files:');
    const backups = listDirectory(paths.backupPath);
    
    if (backups.length === 0) {
      console.log('   (No backup files)');
    } else {
      backups.forEach(backup => {
        console.log(`   📄 ${backup.name} (${backup.size})`);
        console.log(`      Path: ${backup.path}`);
        console.log(`      Modified: ${new Date(backup.modified).toLocaleString()}`);
      });
    }
  }
  
  // Provide instructions
  console.log('\n📖 How to Access SQLite Data:');
  console.log('1. Open File Explorer (Windows) or Finder (Mac)');
  console.log(`2. Navigate to: ${paths.appDataPath}`);
  console.log('3. Look for: billbytekot.db');
  console.log('4. Use SQLite browser to view data:');
  console.log('   - Download: https://sqlitebrowser.org/');
  console.log('   - Open the .db file to view tables and data');
  
  console.log('\n🔧 Alternative Access Methods:');
  console.log('1. Windows Run Dialog: Win+R, type: %APPDATA%\\BillByteKOT');
  console.log('2. Command Prompt: cd "%APPDATA%\\BillByteKOT"');
  console.log('3. PowerShell: cd "$env:APPDATA\\BillByteKOT"');
  
  // Return paths for programmatic use
  return paths;
}

// Run the test if this script is executed directly
if (require.main === module) {
  const paths = testSQLiteRoaming();
  
  console.log('\n🎯 Quick Access Commands:');
  console.log(`Windows Explorer: explorer "${paths.appDataPath}"`);
  console.log(`Command Prompt: start "" "${paths.appDataPath}"`);
  console.log(`PowerShell: Invoke-Item "${paths.appDataPath}"`);
}

module.exports = {
  getSQLiteDataPath,
  testSQLiteRoaming,
  checkPath,
  getFileSize,
  listDirectory
};