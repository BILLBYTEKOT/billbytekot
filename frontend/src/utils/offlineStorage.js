/**
 * Offline Storage System for BillByteKOT
 * Supports both Android (SQLite) and Desktop (IndexedDB/SQLite) platforms
 * Provides seamless offline functionality with automatic sync
 */

// Database configuration
const DB_NAME = 'BillByteKOT_Offline';
const DB_VERSION = 1;
const SYNC_QUEUE_KEY = 'billbytekot_sync_queue';

// Table schemas for offline storage
const TABLES = {
  orders: {
    name: 'orders',
    schema: `
      id TEXT PRIMARY KEY,
      table_id TEXT,
      table_number INTEGER,
      items TEXT,
      subtotal REAL,
      tax REAL,
      discount REAL,
      total REAL,
      status TEXT,
      waiter_id TEXT,
      waiter_name TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      payment_method TEXT,
      is_credit BOOLEAN,
      payment_received REAL,
      balance_amount REAL,
      created_at TEXT,
      updated_at TEXT,
      synced BOOLEAN DEFAULT 0,
      organization_id TEXT
    `
  },
  menu_items: {
    name: 'menu_items',
    schema: `
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      price REAL,
      description TEXT,
      image_url TEXT,
      available BOOLEAN,
      ingredients TEXT,
      preparation_time INTEGER,
      organization_id TEXT,
      created_at TEXT,
      synced BOOLEAN DEFAULT 0
    `
  },
  tables: {
    name: 'tables',
    schema: `
      id TEXT PRIMARY KEY,
      table_number INTEGER,
      capacity INTEGER,
      status TEXT,
      current_order_id TEXT,
      location TEXT,
      section TEXT,
      table_type TEXT,
      notes TEXT,
      organization_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      synced BOOLEAN DEFAULT 0
    `
  },
  inventory: {
    name: 'inventory',
    schema: `
      id TEXT PRIMARY KEY,
      name TEXT,
      quantity REAL,
      unit TEXT,
      min_quantity REAL,
      max_quantity REAL,
      price_per_unit REAL,
      cost_price REAL,
      category_id TEXT,
      supplier_id TEXT,
      sku TEXT,
      barcode TEXT,
      description TEXT,
      location TEXT,
      expiry_date TEXT,
      batch_number TEXT,
      organization_id TEXT,
      last_updated TEXT,
      synced BOOLEAN DEFAULT 0
    `
  },
  expenses: {
    name: 'expenses',
    schema: `
      id TEXT PRIMARY KEY,
      date TEXT,
      amount REAL,
      category TEXT,
      description TEXT,
      payment_method TEXT,
      vendor_name TEXT,
      receipt_url TEXT,
      notes TEXT,
      organization_id TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      synced BOOLEAN DEFAULT 0
    `
  },
  sync_queue: {
    name: 'sync_queue',
    schema: `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT,
      record_id TEXT,
      action TEXT,
      data TEXT,
      created_at TEXT,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT
    `
  }
};

class OfflineStorage {
  constructor() {
    this.db = null;
    this.isAndroid = this.detectAndroid();
    this.isElectron = this.detectElectron();
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.startAutoSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  detectAndroid() {
    return /Android/i.test(navigator.userAgent) || 
           (window.cordova && window.cordova.platformId === 'android') ||
           window.AndroidInterface;
  }

  detectElectron() {
    return window.electronAPI || 
           (typeof window !== 'undefined' && window.process && window.process.type);
  }

  async initialize() {
    try {
      console.log('🔄 Initializing offline storage...');
      
      if (this.isAndroid) {
        await this.initializeAndroidSQLite();
      } else if (this.isElectron) {
        await this.initializeElectronSQLite();
      } else {
        await this.initializeIndexedDB();
      }
      
      // Load sync queue
      await this.loadSyncQueue();
      
      // Start auto-sync if online
      if (this.isOnline) {
        this.startAutoSync();
      }
      
      console.log('✅ Offline storage initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize offline storage:', error);
      return false;
    }
  }

  // Android SQLite Implementation
  async initializeAndroidSQLite() {
    if (window.sqlitePlugin) {
      // Cordova SQLite Plugin
      this.db = window.sqlitePlugin.openDatabase({
        name: `${DB_NAME}.db`,
        location: 'default'
      });
    } else if (window.AndroidInterface) {
      // Custom Android WebView Interface
      this.db = {
        executeSql: (sql, params = []) => {
          return new Promise((resolve, reject) => {
            try {
              const result = window.AndroidInterface.executeSql(sql, JSON.stringify(params));
              resolve(JSON.parse(result));
            } catch (error) {
              reject(error);
            }
          });
        }
      };
    } else {
      throw new Error('Android SQLite not available');
    }

    // Create tables
    for (const table of Object.values(TABLES)) {
      await this.executeSql(`CREATE TABLE IF NOT EXISTS ${table.name} (${table.schema})`);
    }
  }

  // Electron SQLite Implementation
  async initializeElectronSQLite() {
    try {
      // Import desktop SQLite bridge
      const { desktopSQLite } = await import('./desktopSQLite.js');
      await desktopSQLite.initialize();
      
      this.db = {
        executeSql: async (sql, params = []) => {
          return await desktopSQLite.executeSql(sql, params);
        },
        transaction: async (callback) => {
          return await desktopSQLite.transaction(callback);
        },
        close: async () => {
          return await desktopSQLite.close();
        }
      };

      // Create tables
      for (const table of Object.values(TABLES)) {
        await this.executeSql(`CREATE TABLE IF NOT EXISTS ${table.name} (${table.schema})`);
      }
    } catch (error) {
      console.warn('⚠️ Desktop SQLite not available, falling back to IndexedDB');
      await this.initializeIndexedDB();
    }
  }

  // IndexedDB Implementation (Web/PWA)
  async initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for each table
        Object.values(TABLES).forEach(table => {
          if (!db.objectStoreNames.contains(table.name)) {
            const store = db.createObjectStore(table.name, { keyPath: 'id' });
            
            // Create indexes for common queries
            if (table.name === 'orders') {
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('table_id', 'table_id', { unique: false });
              store.createIndex('created_at', 'created_at', { unique: false });
            }
            
            if (table.name === 'menu_items') {
              store.createIndex('category', 'category', { unique: false });
              store.createIndex('available', 'available', { unique: false });
            }
          }
        });
      };
    });
  }

  // Universal SQL execution
  async executeSql(sql, params = []) {
    if (this.isAndroid || this.isElectron) {
      return await this.db.executeSql(sql, params);
    } else {
      // IndexedDB doesn't use SQL, so we need to translate
      throw new Error('SQL execution not supported in IndexedDB mode');
    }
  }

  // CRUD Operations
  async insert(tableName, data) {
    try {
      const id = data.id || this.generateId();
      const record = {
        ...data,
        id,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
      };

      if (this.isAndroid || this.isElectron) {
        // SQLite implementation
        const columns = Object.keys(record).join(', ');
        const placeholders = Object.keys(record).map(() => '?').join(', ');
        const values = Object.values(record).map(v => 
          typeof v === 'object' ? JSON.stringify(v) : v
        );

        await this.executeSql(
          `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
          values
        );
      } else {
        // IndexedDB implementation
        const transaction = this.db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        await this.promisifyRequest(store.add(record));
      }

      // Add to sync queue
      await this.addToSyncQueue(tableName, id, 'INSERT', record);
      
      console.log(`✅ Inserted record into ${tableName}:`, id);
      return id;
    } catch (error) {
      console.error(`❌ Failed to insert into ${tableName}:`, error);
      throw error;
    }
  }

  async update(tableName, id, data) {
    try {
      const record = {
        ...data,
        id,
        updated_at: new Date().toISOString(),
        synced: false
      };

      if (this.isAndroid || this.isElectron) {
        // SQLite implementation
        const setClause = Object.keys(record)
          .map(key => `${key} = ?`)
          .join(', ');
        const values = Object.values(record).map(v => 
          typeof v === 'object' ? JSON.stringify(v) : v
        );

        await this.executeSql(
          `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
          [...values, id]
        );
      } else {
        // IndexedDB implementation
        const transaction = this.db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        await this.promisifyRequest(store.put(record));
      }

      // Add to sync queue
      await this.addToSyncQueue(tableName, id, 'UPDATE', record);
      
      console.log(`✅ Updated record in ${tableName}:`, id);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update ${tableName}:`, error);
      throw error;
    }
  }

  async delete(tableName, id) {
    try {
      if (this.isAndroid || this.isElectron) {
        // SQLite implementation
        await this.executeSql(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
      } else {
        // IndexedDB implementation
        const transaction = this.db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);
        await this.promisifyRequest(store.delete(id));
      }

      // Add to sync queue
      await this.addToSyncQueue(tableName, id, 'DELETE', { id });
      
      console.log(`✅ Deleted record from ${tableName}:`, id);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete from ${tableName}:`, error);
      throw error;
    }
  }

  async findById(tableName, id) {
    try {
      if (this.isAndroid || this.isElectron) {
        // SQLite implementation
        const result = await this.executeSql(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [id]
        );
        return result.rows.length > 0 ? this.parseRecord(result.rows[0]) : null;
      } else {
        // IndexedDB implementation
        const transaction = this.db.transaction([tableName], 'readonly');
        const store = transaction.objectStore(tableName);
        const result = await this.promisifyRequest(store.get(id));
        return result || null;
      }
    } catch (error) {
      console.error(`❌ Failed to find by ID in ${tableName}:`, error);
      return null;
    }
  }

  async findAll(tableName, options = {}) {
    try {
      const { limit = 100, offset = 0, where = '', orderBy = 'created_at DESC' } = options;

      if (this.isAndroid || this.isElectron) {
        // SQLite implementation
        let sql = `SELECT * FROM ${tableName}`;
        if (where) sql += ` WHERE ${where}`;
        sql += ` ORDER BY ${orderBy}`;
        sql += ` LIMIT ${limit} OFFSET ${offset}`;

        const result = await this.executeSql(sql);
        return result.rows.map(row => this.parseRecord(row));
      } else {
        // IndexedDB implementation
        const transaction = this.db.transaction([tableName], 'readonly');
        const store = transaction.objectStore(tableName);
        const request = store.getAll();
        const results = await this.promisifyRequest(request);
        
        // Apply basic filtering and sorting
        return results
          .slice(offset, offset + limit)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    } catch (error) {
      console.error(`❌ Failed to find all in ${tableName}:`, error);
      return [];
    }
  }

  // Sync Queue Management
  async addToSyncQueue(tableName, recordId, action, data) {
    const queueItem = {
      id: Date.now() + Math.random(),
      table_name: tableName,
      record_id: recordId,
      action,
      data: JSON.stringify(data),
      created_at: new Date().toISOString(),
      retry_count: 0,
      last_error: null
    };

    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();
  }

  async loadSyncQueue() {
    try {
      if (this.isAndroid || this.isElectron) {
        const result = await this.executeSql('SELECT * FROM sync_queue ORDER BY created_at ASC');
        this.syncQueue = result.rows.map(row => this.parseRecord(row));
      } else {
        const stored = localStorage.getItem(SYNC_QUEUE_KEY);
        this.syncQueue = stored ? JSON.parse(stored) : [];
      }
    } catch (error) {
      console.error('❌ Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  async saveSyncQueue() {
    try {
      if (this.isAndroid || this.isElectron) {
        // Clear and repopulate sync_queue table
        await this.executeSql('DELETE FROM sync_queue');
        for (const item of this.syncQueue) {
          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          const values = Object.values(item);
          
          await this.executeSql(
            `INSERT INTO sync_queue (${columns}) VALUES (${placeholders})`,
            values
          );
        }
      } else {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
      }
    } catch (error) {
      console.error('❌ Failed to save sync queue:', error);
    }
  }

  // Sync Operations
  async startAutoSync() {
    if (this.syncInProgress || !this.isOnline) return;

    try {
      this.syncInProgress = true;
      console.log('🔄 Starting auto-sync...');

      // Process sync queue
      await this.processSyncQueue();

      // Sync data from server
      await this.syncFromServer();

      console.log('✅ Auto-sync completed');
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async processSyncQueue() {
    const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';
    
    for (let i = this.syncQueue.length - 1; i >= 0; i--) {
      const item = this.syncQueue[i];
      
      try {
        const data = JSON.parse(item.data);
        let endpoint = '';
        let method = '';
        let body = null;

        // Determine API endpoint and method
        switch (item.table_name) {
          case 'orders':
            endpoint = '/api/orders';
            break;
          case 'menu_items':
            endpoint = '/api/menu';
            break;
          case 'tables':
            endpoint = '/api/tables';
            break;
          case 'inventory':
            endpoint = '/api/inventory';
            break;
          case 'expenses':
            endpoint = '/api/expenses';
            break;
          default:
            continue;
        }

        switch (item.action) {
          case 'INSERT':
            method = 'POST';
            body = data;
            break;
          case 'UPDATE':
            method = 'PUT';
            endpoint += `/${item.record_id}`;
            body = data;
            break;
          case 'DELETE':
            method = 'DELETE';
            endpoint += `/${item.record_id}`;
            break;
        }

        // Make API request
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: body ? JSON.stringify(body) : null
        });

        if (response.ok) {
          // Mark as synced in local database
          await this.markAsSynced(item.table_name, item.record_id);
          
          // Remove from sync queue
          this.syncQueue.splice(i, 1);
          console.log(`✅ Synced ${item.action} for ${item.table_name}:${item.record_id}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ Failed to sync ${item.table_name}:${item.record_id}:`, error);
        
        // Increment retry count
        item.retry_count++;
        item.last_error = error.message;
        
        // Remove from queue if too many retries
        if (item.retry_count >= 5) {
          this.syncQueue.splice(i, 1);
          console.warn(`⚠️ Removed from sync queue after 5 retries: ${item.table_name}:${item.record_id}`);
        }
      }
    }

    await this.saveSyncQueue();
  }

  async syncFromServer() {
    // Implement server-to-local sync
    // This would fetch latest data from server and update local storage
    console.log('🔄 Syncing from server...');
    // TODO: Implement based on your API structure
  }

  async markAsSynced(tableName, recordId) {
    try {
      if (this.isAndroid || this.isElectron) {
        await this.executeSql(
          `UPDATE ${tableName} SET synced = 1 WHERE id = ?`,
          [recordId]
        );
      } else {
        const record = await this.findById(tableName, recordId);
        if (record) {
          record.synced = true;
          const transaction = this.db.transaction([tableName], 'readwrite');
          const store = transaction.objectStore(tableName);
          await this.promisifyRequest(store.put(record));
        }
      }
    } catch (error) {
      console.error(`❌ Failed to mark as synced: ${tableName}:${recordId}`, error);
    }
  }

  // Utility methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  parseRecord(row) {
    const record = { ...row };
    
    // Parse JSON fields
    ['items', 'ingredients', 'business_settings'].forEach(field => {
      if (record[field] && typeof record[field] === 'string') {
        try {
          record[field] = JSON.parse(record[field]);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    });

    return record;
  }

  promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Public API methods
  async getOrders(options = {}) {
    return await this.findAll('orders', options);
  }

  async getMenuItems(options = {}) {
    return await this.findAll('menu_items', options);
  }

  async getTables(options = {}) {
    return await this.findAll('tables', options);
  }

  async getInventory(options = {}) {
    return await this.findAll('inventory', options);
  }

  async getExpenses(options = {}) {
    return await this.findAll('expenses', options);
  }

  async createOrder(orderData) {
    return await this.insert('orders', orderData);
  }

  async updateOrder(orderId, orderData) {
    return await this.update('orders', orderId, orderData);
  }

  async deleteOrder(orderId) {
    return await this.delete('orders', orderId);
  }

  // Status methods
  isOfflineMode() {
    return !this.isOnline;
  }

  getSyncQueueCount() {
    return this.syncQueue.length;
  }

  async clearAllData() {
    try {
      for (const table of Object.values(TABLES)) {
        if (this.isAndroid || this.isElectron) {
          await this.executeSql(`DELETE FROM ${table.name}`);
        } else {
          const transaction = this.db.transaction([table.name], 'readwrite');
          const store = transaction.objectStore(table.name);
          await this.promisifyRequest(store.clear());
        }
      }
      
      this.syncQueue = [];
      await this.saveSyncQueue();
      
      console.log('✅ All offline data cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();
export default offlineStorage;