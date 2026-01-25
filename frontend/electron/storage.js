// ✅ Electron Storage Implementation with SQLite (with fallback)
const { app, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Try to load better-sqlite3, fallback to JSON storage if not available
let Database;
let useSQLite = true;

try {
  Database = require('better-sqlite3');
  console.log('✅ better-sqlite3 loaded successfully');
} catch (error) {
  console.warn('⚠️ better-sqlite3 not available, using JSON fallback storage');
  useSQLite = false;
}

class ElectronStorageManager {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.jsonPath = null;
    this.jsonData = {};
    this.isInitialized = false;
    this.useSQLite = useSQLite;
  }

  async initialize() {
    try {
      // Create app data directory
      const userDataPath = app.getPath('userData');
      const dbDir = path.join(userDataPath, 'BillByteKOT');
      
      // Ensure directory exists
      await fs.mkdir(dbDir, { recursive: true });
      
      if (this.useSQLite) {
        await this.initializeSQLite(dbDir);
      } else {
        await this.initializeJSON(dbDir);
      }
      
      this.isInitialized = true;
      console.log(`✅ Electron storage initialized (${this.useSQLite ? 'SQLite' : 'JSON'}):`, this.useSQLite ? this.dbPath : this.jsonPath);
      
    } catch (error) {
      console.error('❌ Failed to initialize Electron storage:', error);
      throw error;
    }
  }

  async initializeSQLite(dbDir) {
    // Database file path
    this.dbPath = path.join(dbDir, 'billbytekot.db');
    
    // Initialize SQLite database
    this.db = new Database(this.dbPath);
    
    // Enable WAL mode for better performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 1000');
    
    // Create tables
    this.createSQLiteTables();
  }

  async initializeJSON(dbDir) {
    // JSON file path
    this.jsonPath = path.join(dbDir, 'billbytekot.json');
    
    // Load existing data
    try {
      const data = await fs.readFile(this.jsonPath, 'utf8');
      this.jsonData = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty data
      this.jsonData = {
        key_value: {},
        orders: [],
        menu_items: [],
        settings: {},
        sync_queue: []
      };
      await this.saveJSON();
    }
  }

  async saveJSON() {
    if (!this.useSQLite) {
      await fs.writeFile(this.jsonPath, JSON.stringify(this.jsonData, null, 2));
    }
  }

  createTables() {
    if (!this.useSQLite) return; // Skip if using JSON
    
    // Key-value storage table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS key_value (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Key-value operations
  async setItem(key, value) {
    if (!this.isInitialized) {
      throw new Error('Storage not initialized');
    }

    const serializedValue = JSON.stringify(value);

    if (this.useSQLite) {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
      stmt.run(key, serializedValue);
    } else {
      this.jsonData.key_value[key] = serializedValue;
      await this.saveJSON();
    }
  }

  async getItem(key) {
    if (!this.isInitialized) {
      throw new Error('Storage not initialized');
    }

    let result;
    
    if (this.useSQLite) {
      const stmt = this.db.prepare('SELECT value FROM key_value WHERE key = ?');
      result = stmt.get(key);
      return result ? JSON.parse(result.value) : null;
    } else {
      const value = this.jsonData.key_value[key];
      return value ? JSON.parse(value) : null;
    }
  }

  async removeItem(key) {
    if (!this.isInitialized) {
      throw new Error('Storage not initialized');
    }

    if (this.useSQLite) {
      const stmt = this.db.prepare('DELETE FROM key_value WHERE key = ?');
      stmt.run(key);
    } else {
      delete this.jsonData.key_value[key];
      await this.saveJSON();
    }
  }

  async clear() {
    if (!this.isInitialized) {
      throw new Error('Storage not initialized');
    }

    if (this.useSQLite) {
      this.db.exec('DELETE FROM key_value');
    } else {
      this.jsonData.key_value = {};
      await this.saveJSON();
    }
  }

  async keys() {
    if (!this.isInitialized) {
      throw new Error('Storage not initialized');
    }

    if (this.useSQLite) {
      const stmt = this.db.prepare('SELECT key FROM key_value');
      const results = stmt.all();
      return results.map(row => row.key);
    } else {
      return Object.keys(this.jsonData.key_value);
    }
  }

  createSQLiteTables() {
    if (!this.useSQLite) return; // Skip if using JSON

    // Key-value storage table
    this.db.exec('CREATE TABLE IF NOT EXISTS key_value (key TEXT PRIMARY KEY, value TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

    // Orders table
    this.db.exec('CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, table_number INTEGER, customer_name TEXT, customer_phone TEXT, items TEXT NOT NULL, total REAL NOT NULL, status TEXT NOT NULL, payment_method TEXT, payment_received REAL DEFAULT 0, balance_amount REAL DEFAULT 0, is_credit BOOLEAN DEFAULT 0, sync_status TEXT DEFAULT "pending", created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_modified INTEGER DEFAULT (strftime("%s", "now")))');

    // Menu items table
    this.db.exec('CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL, category TEXT, description TEXT, image_url TEXT, available BOOLEAN DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

    // Tables table
    this.db.exec('CREATE TABLE IF NOT EXISTS tables (id TEXT PRIMARY KEY, table_number INTEGER UNIQUE NOT NULL, capacity INTEGER DEFAULT 4, status TEXT DEFAULT "available", current_order_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

    // Business settings table
    this.db.exec('CREATE TABLE IF NOT EXISTS business_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

    // Sync queue table
    this.db.exec('CREATE TABLE IF NOT EXISTS sync_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, data TEXT NOT NULL, priority TEXT DEFAULT "normal", retries INTEGER DEFAULT 0, max_retries INTEGER DEFAULT 3, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

    // Create indexes for better performance
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority)');

    console.log('✅ SQLite tables and indexes created');
  }

  // Key-value operations (SQLite only)
  get(key) {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    if (!this.useSQLite) throw new Error('get() method only available with SQLite');
    
    const stmt = this.db.prepare('SELECT value FROM key_value WHERE key = ?');
    const result = stmt.get(key);
    
    if (result) {
      try {
        return JSON.parse(result.value);
      } catch (error) {
        return result.value;
      }
    }
    return null;
  }

  set(key, value) {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    if (!this.useSQLite) throw new Error('set() method only available with SQLite');
    
    const stmt = this.db.prepare('INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    stmt.run(key, valueStr);
  }

  remove(key) {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    if (!this.useSQLite) throw new Error('remove() method only available with SQLite');
    
    const stmt = this.db.prepare('DELETE FROM key_value WHERE key = ?');
    stmt.run(key);
  }

  clear() {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    if (!this.useSQLite) throw new Error('clear() method only available with SQLite');
    
    this.db.exec('DELETE FROM key_value');
  }

  keys() {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    if (!this.useSQLite) throw new Error('keys() method only available with SQLite');
    
    const stmt = this.db.prepare('SELECT key FROM key_value');
    const results = stmt.all();
    return results.map(row => row.key);
  }

  // SQL query operations
  query(sql, params = []) {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    if (!this.useSQLite) throw new Error('query() method only available with SQLite');
    
    try {
      const stmt = this.db.prepare(sql);
      
      if (sql.trim().toLowerCase().startsWith('select')) {
        return stmt.all(...params);
      } else {
        return stmt.run(...params);
      }
    } catch (error) {
      console.error('SQL query error:', error);
      throw error;
    }
  }

  // Batch operations
  executeBatch(operations) {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    if (!this.useSQLite) throw new Error('executeBatch() method only available with SQLite');
    
    const transaction = this.db.transaction(() => {
      const results = [];
      
      for (const op of operations) {
        try {
          switch (op.type) {
            case 'set':
              this.set(op.key, op.value);
              results.push({ success: true });
              break;
            case 'remove':
              this.remove(op.key);
              results.push({ success: true });
              break;
            case 'query':
              const result = this.query(op.sql, op.params);
              results.push({ success: true, result });
              break;
            default:
              results.push({ success: false, error: 'Unknown operation' });
          }
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      
      return results;
    });
    
    return transaction();
  }

  // Storage information
  getStorageInfo() {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      if (this.useSQLite) {
        // Get database file size
        const stats = require('fs').statSync(this.dbPath);
        const fileSizeBytes = stats.size;
        
        // Get table counts
        const tableStats = {};
        const tables = ['orders', 'menu_items', 'tables', 'business_settings', 'sync_queue', 'key_value'];
        
        for (const table of tables) {
          const stmt = this.db.prepare('SELECT COUNT(*) as count FROM ' + table);
          const result = stmt.get();
          tableStats[table] = result.count;
        }
        
        return {
          platform: 'electron',
          type: 'SQLite',
          dbPath: this.dbPath,
          fileSizeBytes,
          fileSizeMB: (fileSizeBytes / 1048576).toFixed(2),
          tableStats,
          totalRecords: Object.values(tableStats).reduce((sum, count) => sum + count, 0)
        };
      } else {
        // JSON storage info
        const jsonStr = JSON.stringify(this.jsonData);
        const fileSizeBytes = Buffer.byteLength(jsonStr, 'utf8');
        
        return {
          platform: 'electron',
          type: 'JSON',
          jsonPath: this.jsonPath,
          fileSizeBytes,
          fileSizeMB: (fileSizeBytes / 1048576).toFixed(2),
          recordCounts: {
            key_value: Object.keys(this.jsonData.key_value || {}).length,
            orders: (this.jsonData.orders || []).length,
            menu_items: (this.jsonData.menu_items || []).length,
            settings: Object.keys(this.jsonData.settings || {}).length,
            sync_queue: (this.jsonData.sync_queue || []).length
          }
        };
      }
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { platform: 'electron', type: this.useSQLite ? 'SQLite' : 'JSON', error: error.message };
    }
  }

  // File operations
  async exportToFile(data, filename) {
    try {
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: filename,
        filters: [
          { name: 'KOT Files', extensions: ['kot'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (filePath) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        return { success: true, path: filePath };
      }
      
      return { success: false, cancelled: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error.message };
    }
  }

  async importFromFile(filepath) {
    try {
      let actualPath = filepath;
      
      if (!filepath) {
        const { filePaths } = await dialog.showOpenDialog({
          filters: [
            { name: 'KOT Files', extensions: ['kot'] },
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['openFile']
        });
        
        if (filePaths.length === 0) {
          return { success: false, cancelled: true };
        }
        
        actualPath = filePaths[0];
      }
      
      const fileContent = await fs.readFile(actualPath, 'utf8');
      const data = JSON.parse(fileContent);
      
      return { success: true, data, path: actualPath };
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Database backup and restore
  async createBackup() {
    try {
      const backupDir = path.join(app.getPath('userData'), 'BillByteKOT', 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup_${timestamp}.db`);
      
      // Create backup using SQLite backup API
      const backup = this.db.backup(backupPath);
      await backup.run();
      
      return { success: true, path: backupPath };
    } catch (error) {
      console.error('Backup failed:', error);
      return { success: false, error: error.message };
    }
  }

  async restoreFromBackup(backupPath) {
    try {
      // Close current database
      this.db.close();
      
      // Copy backup file to current database location
      await fs.copyFile(backupPath, this.dbPath);
      
      // Reinitialize database
      await this.initialize();
      
      return { success: true };
    } catch (error) {
      console.error('Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Cleanup and maintenance
  vacuum() {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    this.db.exec('VACUUM');
    console.log('✅ Database vacuumed');
  }

  analyze() {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    this.db.exec('ANALYZE');
    console.log('✅ Database analyzed');
  }

  close() {
    if (this.db) {
      this.db.close();
      this.isInitialized = false;
      console.log('✅ Database connection closed');
    }
  }
}

// Create singleton instance
const storageManager = new ElectronStorageManager();

// IPC handlers
function setupStorageIPC() {
  // Initialize storage
  ipcMain.handle('storage:init', async () => {
    try {
      await storageManager.initialize();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Key-value operations
  ipcMain.handle('storage:get', (event, key) => {
    return storageManager.get(key);
  });

  ipcMain.handle('storage:set', (event, key, value) => {
    storageManager.set(key, value);
    return { success: true };
  });

  ipcMain.handle('storage:remove', (event, key) => {
    storageManager.remove(key);
    return { success: true };
  });

  ipcMain.handle('storage:clear', () => {
    storageManager.clear();
    return { success: true };
  });

  ipcMain.handle('storage:keys', () => {
    return storageManager.keys();
  });

  // SQL operations
  ipcMain.handle('storage:query', (event, sql, params) => {
    return storageManager.query(sql, params);
  });

  ipcMain.handle('storage:batch', (event, operations) => {
    return storageManager.executeBatch(operations);
  });

  // File operations
  ipcMain.handle('storage:export', async (event, data, filename) => {
    return await storageManager.exportToFile(data, filename);
  });

  ipcMain.handle('storage:import', async (event, filepath) => {
    return await storageManager.importFromFile(filepath);
  });

  // Storage info
  ipcMain.handle('storage:info', () => {
    return storageManager.getStorageInfo();
  });

  // Backup operations
  ipcMain.handle('storage:backup', async () => {
    return await storageManager.createBackup();
  });

  ipcMain.handle('storage:restore', async (event, backupPath) => {
    return await storageManager.restoreFromBackup(backupPath);
  });

  // Maintenance
  ipcMain.handle('storage:vacuum', () => {
    storageManager.vacuum();
    return { success: true };
  });

  ipcMain.handle('storage:analyze', () => {
    storageManager.analyze();
    return { success: true };
  });

  console.log('✅ Storage IPC handlers registered');
}

module.exports = { ElectronStorageManager, storageManager, setupStorageIPC };