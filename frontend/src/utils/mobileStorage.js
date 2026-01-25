// ✅ Mobile Storage Implementation for Capacitor
// Provides SQLite storage with Capacitor plugins

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Conditional import for SQLite to prevent build issues
let CapacitorSQLite, SQLiteConnection, SQLiteDBConnection;

// Only import SQLite modules in mobile environment
if (typeof window !== 'undefined' && window.Capacitor) {
  try {
    const sqliteModule = require('@capacitor-community/sqlite');
    CapacitorSQLite = sqliteModule.CapacitorSQLite;
    SQLiteConnection = sqliteModule.SQLiteConnection;
    SQLiteDBConnection = sqliteModule.SQLiteDBConnection;
  } catch (error) {
    console.warn('SQLite modules not available:', error.message);
  }
}

class MobileStorageManager {
  constructor() {
    this.isInitialized = false;
    this.sqlite = null;
    this.db = null;
    this.dbName = 'billbytekot.db';
    this.platform = Capacitor.getPlatform();
  }

  async initialize() {
    try {
      console.log(`🚀 Initializing mobile storage for ${this.platform}...`);
      
      // Check if SQLite is available
      if (!CapacitorSQLite || !SQLiteConnection) {
        console.warn('SQLite not available, falling back to Preferences API');
        this.isInitialized = true;
        return;
      }
      
      // Initialize SQLite connection
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      
      // Create database connection
      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;
      
      if (ret.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        this.db = await this.sqlite.createConnection(
          this.dbName,
          false,
          'no-encryption',
          1,
          false
        );
      }
      
      // Open database
      await this.db.open();
      
      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      console.log('✅ Mobile SQLite storage initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize mobile storage:', error);
      throw error;
    }
  }

  async createTables() {
    const createTableStatements = `
      -- Key-value storage table
      CREATE TABLE IF NOT EXISTS key_value (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        timestamp INTEGER DEFAULT (strftime('%s', 'now')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        table_number INTEGER,
        customer_name TEXT,
        customer_phone TEXT,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        payment_method TEXT,
        payment_received REAL DEFAULT 0,
        balance_amount REAL DEFAULT 0,
        is_credit BOOLEAN DEFAULT 0,
        sync_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_modified INTEGER DEFAULT (strftime('%s', 'now'))
      );

      -- Menu items table
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT,
        description TEXT,
        image_url TEXT,
        available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tables table
      CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        table_number INTEGER UNIQUE NOT NULL,
        capacity INTEGER DEFAULT 4,
        status TEXT DEFAULT 'available',
        current_order_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Business settings table
      CREATE TABLE IF NOT EXISTS business_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Sync queue table
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        retries INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status);
      CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
      CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
      CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority);
    `;

    await this.db.execute(createTableStatements);
    console.log('✅ Mobile SQLite tables and indexes created');
  }

  // Key-value operations using Capacitor Storage
  async get(key) {
    try {
      const result = await Preferences.get({ key });
      return result.value ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  async set(key, value) {
    try {
      await Preferences.set({ 
        key, 
        value: JSON.stringify(value) 
      });
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }

  async remove(key) {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  }

  async clear() {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }

  async keys() {
    try {
      const result = await Preferences.keys();
      return result.keys;
    } catch (error) {
      console.error('Storage keys error:', error);
      return [];
    }
  }

  // SQL operations
  async query(sql, params = []) {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      const result = await this.db.query(sql, params);
      return result.values || [];
    } catch (error) {
      console.error('SQL query error:', error);
      throw error;
    }
  }

  async executeBatch(operations) {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      const statements = operations.map(op => ({
        statement: op.sql || `INSERT OR REPLACE INTO key_value (key, value) VALUES (?, ?)`,
        values: op.params || [op.key, JSON.stringify(op.value)]
      }));
      
      const result = await this.db.executeSet(statements);
      return result.changes;
    } catch (error) {
      console.error('Batch execution error:', error);
      throw error;
    }
  }

  // Storage information
  async getStorageInfo() {
    try {
      const keys = await this.keys();
      let totalSize = 0;
      
      // Calculate storage size
      for (const key of keys) {
        const value = await this.get(key);
        if (value) {
          totalSize += JSON.stringify(value).length;
        }
      }
      
      // Get SQLite database info
      let dbInfo = {};
      if (this.isInitialized) {
        try {
          const tableStats = {};
          const tables = ['orders', 'menu_items', 'tables', 'business_settings', 'sync_queue'];
          
          for (const table of tables) {
            const result = await this.query(`SELECT COUNT(*) as count FROM ${table}`);
            tableStats[table] = result[0]?.count || 0;
          }
          
          dbInfo = {
            tableStats,
            totalRecords: Object.values(tableStats).reduce((sum, count) => sum + count, 0)
          };
        } catch (error) {
          console.warn('Failed to get database stats:', error);
        }
      }
      
      return {
        platform: this.platform,
        type: 'SQLite + Capacitor Storage',
        keyValueItems: keys.length,
        estimatedSize: totalSize,
        sizeFormatted: `${(totalSize / 1024).toFixed(2)} KB`,
        ...dbInfo
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { 
        platform: this.platform, 
        type: 'SQLite + Capacitor Storage', 
        error: error.message 
      };
    }
  }

  // File operations
  async exportToFile(data, filename) {
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: JSON.stringify(data, null, 2),
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      
      return { success: true, path: result.uri };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error.message };
    }
  }

  async importFromFile(filepath) {
    try {
      const result = await Filesystem.readFile({
        path: filepath,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      
      const data = JSON.parse(result.data);
      return { success: true, data };
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Database backup operations
  async createBackup() {
    try {
      // Export all data
      const allData = {
        keyValue: {},
        orders: await this.query('SELECT * FROM orders'),
        menuItems: await this.query('SELECT * FROM menu_items'),
        tables: await this.query('SELECT * FROM tables'),
        businessSettings: await this.query('SELECT * FROM business_settings'),
        syncQueue: await this.query('SELECT * FROM sync_queue')
      };
      
      // Get key-value data
      const keys = await this.keys();
      for (const key of keys) {
        allData.keyValue[key] = await this.get(key);
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `billbytekot_backup_${timestamp}.json`;
      
      const result = await this.exportToFile(allData, backupFilename);
      return result;
    } catch (error) {
      console.error('Backup failed:', error);
      return { success: false, error: error.message };
    }
  }

  async restoreFromBackup(filepath) {
    try {
      const result = await this.importFromFile(filepath);
      
      if (!result.success) {
        return result;
      }
      
      const { data } = result;
      
      // Clear existing data
      await this.clear();
      await this.db.execute('DELETE FROM orders');
      await this.db.execute('DELETE FROM menu_items');
      await this.db.execute('DELETE FROM tables');
      await this.db.execute('DELETE FROM business_settings');
      await this.db.execute('DELETE FROM sync_queue');
      
      // Restore key-value data
      if (data.keyValue) {
        for (const [key, value] of Object.entries(data.keyValue)) {
          await this.set(key, value);
        }
      }
      
      // Restore database tables
      const tables = ['orders', 'menuItems', 'tables', 'businessSettings', 'syncQueue'];
      const tableMap = {
        orders: 'orders',
        menuItems: 'menu_items',
        tables: 'tables',
        businessSettings: 'business_settings',
        syncQueue: 'sync_queue'
      };
      
      for (const table of tables) {
        const tableData = data[table];
        if (tableData && Array.isArray(tableData)) {
          const dbTable = tableMap[table];
          
          for (const row of tableData) {
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = columns.map(() => '?').join(', ');
            
            const sql = `INSERT INTO ${dbTable} (${columns.join(', ')}) VALUES (${placeholders})`;
            await this.db.run(sql, values);
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Maintenance operations
  async vacuum() {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      await this.db.execute('VACUUM');
      console.log('✅ Mobile database vacuumed');
    } catch (error) {
      console.error('Vacuum failed:', error);
      throw error;
    }
  }

  async analyze() {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      await this.db.execute('ANALYZE');
      console.log('✅ Mobile database analyzed');
    } catch (error) {
      console.error('Analyze failed:', error);
      throw error;
    }
  }

  async close() {
    if (this.db) {
      try {
        await this.db.close();
        this.isInitialized = false;
        console.log('✅ Mobile database connection closed');
      } catch (error) {
        console.error('Failed to close database:', error);
      }
    }
  }

  // Platform-specific features
  async getDeviceInfo() {
    try {
      const { Device } = await import('@capacitor/device');
      const info = await Device.getInfo();
      return {
        platform: info.platform,
        model: info.model,
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        isVirtual: info.isVirtual,
        memUsed: info.memUsed,
        diskFree: info.diskFree,
        diskTotal: info.diskTotal
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return { platform: this.platform };
    }
  }

  async requestPermissions() {
    try {
      // Storage permissions are handled automatically in Capacitor 6
      // No explicit permission request needed for basic storage operations
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mobileStorage = new MobileStorageManager();
export default MobileStorageManager;