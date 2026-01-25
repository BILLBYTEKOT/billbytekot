// ✅ Offline Storage Manager with SQLite-like functionality
// Provides fast local storage with background sync capabilities

import { platformStorage } from './platformStorage';
import { syncController } from './syncController';

class OfflineStorageManager {
  constructor() {
    this.dbName = 'BillByteKOT_DB';
    this.version = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.lastSyncTime = localStorage.getItem('lastSyncTime') || 0;
    this.syncInProgress = false;
    this.platform = this.detectPlatform();
    
    // Initialize online/offline listeners
    this.initNetworkListeners();
    
    // Initialize storage (platform-specific)
    this.initStorage();
    
    // Start background sync (only if sync is enabled)
    this.startBackgroundSync();
  }

  detectPlatform() {
    if (window.electronAPI || window.__ELECTRON__) {
      return 'electron';
    } else if (window.Capacitor) {
      return 'capacitor';
    } else {
      return 'web';
    }
  }

  // Initialize storage based on platform
  async initStorage() {
    try {
      if (this.platform === 'web') {
        // Use IndexedDB for web
        await this.initDB();
      } else {
        // Use platform storage for desktop/mobile
        await platformStorage.initializeStorage();
        console.log(`✅ ${this.platform} storage initialized`);
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      // Fallback to IndexedDB
      await this.initDB();
    }
  }

  // Initialize IndexedDB with proper schema
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Offline database initialized');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Orders table
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('created_at', 'created_at', { unique: false });
          ordersStore.createIndex('table_number', 'table_number', { unique: false });
          ordersStore.createIndex('sync_status', 'sync_status', { unique: false });
        }
        
        // Menu items table
        if (!db.objectStoreNames.contains('menu_items')) {
          const menuStore = db.createObjectStore('menu_items', { keyPath: 'id' });
          menuStore.createIndex('category', 'category', { unique: false });
          menuStore.createIndex('available', 'available', { unique: false });
          menuStore.createIndex('name', 'name', { unique: false });
        }
        
        // Tables table
        if (!db.objectStoreNames.contains('tables')) {
          const tablesStore = db.createObjectStore('tables', { keyPath: 'id' });
          tablesStore.createIndex('table_number', 'table_number', { unique: false });
          tablesStore.createIndex('status', 'status', { unique: false });
        }
        
        // Dashboard stats table
        if (!db.objectStoreNames.contains('dashboard_stats')) {
          const statsStore = db.createObjectStore('dashboard_stats', { keyPath: 'date' });
          statsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Sync queue table
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('action', 'action', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('priority', 'priority', { unique: false });
        }
        
        // Business settings table
        if (!db.objectStoreNames.contains('business_settings')) {
          const settingsStore = db.createObjectStore('business_settings', { keyPath: 'key' });
        }
        
        console.log('✅ Database schema created/updated');
      };
    });
  }

  // Network status listeners
  initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - starting sync');
      this.syncWithServer();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Gone offline - switching to local storage');
    });
  }

  // Generic database operation wrapper
  async performDBOperation(storeName, operation, data = null) {
    // Use platform storage if available
    if (this.platform !== 'web' && platformStorage.storage) {
      return await this.performPlatformOperation(storeName, operation, data);
    }
    
    // Fallback to IndexedDB
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let request;
      switch (operation) {
        case 'add':
          request = store.add(data);
          break;
        case 'put':
          request = store.put(data);
          break;
        case 'get':
          request = store.get(data);
          break;
        case 'getAll':
          request = store.getAll();
          break;
        case 'delete':
          request = store.delete(data);
          break;
        case 'clear':
          request = store.clear();
          break;
        default:
          reject(new Error('Invalid operation'));
          return;
      }
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Platform-specific database operations
  async performPlatformOperation(storeName, operation, data = null) {
    try {
      switch (operation) {
        case 'add':
        case 'put':
          if (storeName === 'orders') {
            const sql = `INSERT OR REPLACE INTO orders (id, table_number, customer_name, customer_phone, items, total, status, payment_method, payment_received, balance_amount, is_credit, sync_status, created_at, updated_at, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
              data.id, data.table_number, data.customer_name, data.customer_phone,
              JSON.stringify(data.items), data.total, data.status, data.payment_method,
              data.payment_received || 0, data.balance_amount || 0, data.is_credit || 0,
              data.sync_status || 'pending', data.created_at, data.updated_at || new Date().toISOString(),
              data.last_modified || Date.now()
            ];
            return await platformStorage.query(sql, params);
          } else if (storeName === 'menu_items') {
            const sql = `INSERT OR REPLACE INTO menu_items (id, name, price, category, description, image_url, available, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
              data.id, data.name, data.price, data.category, data.description,
              data.image_url, data.available ? 1 : 0, data.created_at || new Date().toISOString(),
              data.updated_at || new Date().toISOString()
            ];
            return await platformStorage.query(sql, params);
          }
          // Add more table mappings as needed
          break;
          
        case 'get':
          if (storeName === 'orders') {
            const sql = `SELECT * FROM orders WHERE id = ?`;
            const result = await platformStorage.query(sql, [data]);
            return result[0] ? { ...result[0], items: JSON.parse(result[0].items) } : null;
          }
          break;
          
        case 'getAll':
          if (storeName === 'orders') {
            const sql = `SELECT * FROM orders ORDER BY created_at DESC`;
            const results = await platformStorage.query(sql, []);
            return results.map(row => ({ ...row, items: JSON.parse(row.items) }));
          } else if (storeName === 'menu_items') {
            const sql = `SELECT * FROM menu_items ORDER BY name`;
            return await platformStorage.query(sql, []);
          }
          break;
          
        case 'delete':
          if (storeName === 'orders') {
            const sql = `DELETE FROM orders WHERE id = ?`;
            return await platformStorage.query(sql, [data]);
          }
          break;
          
        case 'clear':
          const sql = `DELETE FROM ${storeName}`;
          return await platformStorage.query(sql, []);
          
        default:
          throw new Error('Invalid operation');
      }
    } catch (error) {
      console.error('Platform operation failed:', error);
      throw error;
    }
  }

  // Orders management
  async saveOrder(order) {
    try {
      // Check sync controller validation
      const validation = syncController.validateDataOperation('create_order', order);
      
      if (!validation.allowed) {
        throw new Error(validation.message);
      }
      
      // Add sync metadata based on sync status
      const orderWithMeta = {
        ...order,
        sync_status: validation.mode === 'online' ? 'synced' : 'pending',
        last_modified: Date.now(),
        offline_created: validation.mode === 'offline'
      };
      
      await this.performDBOperation('orders', 'put', orderWithMeta);
      
      // Add to sync queue only if sync is enabled and we're offline
      if (syncController.isSyncEnabled() && !this.isOnline) {
        await this.addToSyncQueue('create_order', orderWithMeta, 'high');
      }
      
      console.log(`💾 Order ${order.id} saved (${validation.mode} mode)`);
      return orderWithMeta;
    } catch (error) {
      console.error('Failed to save order:', error);
      throw error;
    }
  }

  async getOrders(filters = {}) {
    try {
      const allOrders = await this.performDBOperation('orders', 'getAll');
      
      // Apply filters
      let filteredOrders = allOrders;
      
      if (filters.status) {
        filteredOrders = filteredOrders.filter(order => 
          Array.isArray(filters.status) 
            ? filters.status.includes(order.status)
            : order.status === filters.status
        );
      }
      
      if (filters.today) {
        const today = new Date().toDateString();
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.created_at).toDateString() === today
        );
      }
      
      if (filters.table_number) {
        filteredOrders = filteredOrders.filter(order => 
          order.table_number === filters.table_number
        );
      }
      
      // Sort by created_at descending
      filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      console.log(`📋 Retrieved ${filteredOrders.length} orders from local storage`);
      return filteredOrders;
    } catch (error) {
      console.error('Failed to get orders from local storage:', error);
      return [];
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const order = await this.performDBOperation('orders', 'get', orderId);
      if (!order) throw new Error('Order not found');
      
      const updatedOrder = {
        ...order,
        status,
        sync_status: this.isOnline ? 'synced' : 'pending',
        last_modified: Date.now()
      };
      
      await this.performDBOperation('orders', 'put', updatedOrder);
      
      // Add to sync queue if offline
      if (!this.isOnline) {
        await this.addToSyncQueue('update_order_status', { orderId, status }, 'high');
      }
      
      console.log(`✅ Order ${orderId} status updated to ${status}`);
      return updatedOrder;
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }

  // Menu items management
  async saveMenuItems(menuItems) {
    try {
      // Clear existing menu items
      await this.performDBOperation('menu_items', 'clear');
      
      // Save new menu items
      for (const item of menuItems) {
        await this.performDBOperation('menu_items', 'add', {
          ...item,
          last_updated: Date.now()
        });
      }
      
      console.log(`💾 ${menuItems.length} menu items saved locally`);
      return menuItems;
    } catch (error) {
      console.error('Failed to save menu items:', error);
      throw error;
    }
  }

  async getMenuItems(filters = {}) {
    try {
      const allItems = await this.performDBOperation('menu_items', 'getAll');
      
      let filteredItems = allItems;
      
      if (filters.available !== undefined) {
        filteredItems = filteredItems.filter(item => item.available === filters.available);
      }
      
      if (filters.category) {
        filteredItems = filteredItems.filter(item => item.category === filters.category);
      }
      
      console.log(`🍽️ Retrieved ${filteredItems.length} menu items from local storage`);
      return filteredItems;
    } catch (error) {
      console.error('Failed to get menu items:', error);
      return [];
    }
  }

  // Tables management
  async saveTables(tables) {
    try {
      // Clear existing tables
      await this.performDBOperation('tables', 'clear');
      
      // Save new tables
      for (const table of tables) {
        await this.performDBOperation('tables', 'add', {
          ...table,
          last_updated: Date.now()
        });
      }
      
      console.log(`💾 ${tables.length} tables saved locally`);
      return tables;
    } catch (error) {
      console.error('Failed to save tables:', error);
      throw error;
    }
  }

  async getTables() {
    try {
      const tables = await this.performDBOperation('tables', 'getAll');
      console.log(`🪑 Retrieved ${tables.length} tables from local storage`);
      return tables;
    } catch (error) {
      console.error('Failed to get tables:', error);
      return [];
    }
  }

  // Dashboard stats management
  async saveDashboardStats(stats) {
    try {
      const today = new Date().toDateString();
      const statsWithMeta = {
        ...stats,
        date: today,
        timestamp: Date.now()
      };
      
      await this.performDBOperation('dashboard_stats', 'put', statsWithMeta);
      console.log('💾 Dashboard stats saved locally');
      return statsWithMeta;
    } catch (error) {
      console.error('Failed to save dashboard stats:', error);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      const today = new Date().toDateString();
      const stats = await this.performDBOperation('dashboard_stats', 'get', today);
      
      if (stats) {
        console.log('📊 Retrieved dashboard stats from local storage');
        return stats;
      }
      
      // Return default stats if none found
      return {
        todayOrders: 0,
        todaySales: 0,
        activeOrders: 0,
        avgOrderValue: 0,
        pendingOrders: 0,
        preparingOrders: 0,
        readyOrders: 0
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return null;
    }
  }

  // Business settings management
  async saveBusinessSettings(settings) {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await this.performDBOperation('business_settings', 'put', { key, value });
      }
      console.log('💾 Business settings saved locally');
      return settings;
    } catch (error) {
      console.error('Failed to save business settings:', error);
      throw error;
    }
  }

  async getBusinessSettings() {
    try {
      const allSettings = await this.performDBOperation('business_settings', 'getAll');
      const settings = {};
      
      allSettings.forEach(item => {
        settings[item.key] = item.value;
      });
      
      console.log('⚙️ Retrieved business settings from local storage');
      return settings;
    } catch (error) {
      console.error('Failed to get business settings:', error);
      return {};
    }
  }

  // Sync queue management
  async addToSyncQueue(action, data, priority = 'normal') {
    try {
      const queueItem = {
        action,
        data,
        priority,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3
      };
      
      await this.performDBOperation('sync_queue', 'add', queueItem);
      console.log(`📤 Added ${action} to sync queue`);
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  async getSyncQueue() {
    try {
      const queue = await this.performDBOperation('sync_queue', 'getAll');
      // Sort by priority (high first) then by timestamp
      return queue.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return a.timestamp - b.timestamp;
      });
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  }

  async clearSyncQueue() {
    try {
      await this.performDBOperation('sync_queue', 'clear');
      console.log('🧹 Sync queue cleared');
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  // Background sync functionality
  startBackgroundSync() {
    // Only start background sync if sync is enabled
    if (!syncController.isSyncEnabled()) {
      console.log('📴 Background sync disabled by sync controller');
      return;
    }
    
    // Sync every 30 seconds when online and sync is enabled
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress && syncController.isSyncEnabled()) {
        this.syncWithServer();
      }
    }, 30000);
    
    // Initial sync if online and sync enabled
    if (this.isOnline && syncController.isSyncEnabled()) {
      setTimeout(() => this.syncWithServer(), 2000);
    }
  }

  async syncWithServer() {
    // Check if sync is allowed
    if (!syncController.isSyncEnabled()) {
      console.log('� Sync disabled by sync controller');
      return;
    }
    
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    console.log('🔄 Starting background sync...');
    
    try {
      // Get sync queue
      const queue = await this.getSyncQueue();
      
      if (queue.length > 0) {
        console.log(`📤 Syncing ${queue.length} items...`);
        
        for (const item of queue) {
          try {
            await this.processSyncItem(item);
            // Remove from queue after successful sync
            await this.performDBOperation('sync_queue', 'delete', item.id);
          } catch (error) {
            console.error(`Failed to sync item ${item.id}:`, error);
            
            // Increment retry count
            item.retries++;
            if (item.retries >= item.maxRetries) {
              console.error(`Max retries reached for item ${item.id}, removing from queue`);
              await this.performDBOperation('sync_queue', 'delete', item.id);
            } else {
              await this.performDBOperation('sync_queue', 'put', item);
            }
          }
        }
      }
      
      // Update last sync time
      this.lastSyncTime = Date.now();
      localStorage.setItem('lastSyncTime', this.lastSyncTime.toString());
      
      console.log('✅ Background sync completed');
    } catch (error) {
      console.error('Background sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async processSyncItem(item) {
    const { action, data } = item;
    const API = process.env.REACT_APP_API_URL || 'https://billbytekot-backend.onrender.com/api';
    
    switch (action) {
      case 'create_order':
        const response = await fetch(`${API}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to sync order creation');
        
        // Update local order as synced
        await this.performDBOperation('orders', 'put', {
          ...data,
          sync_status: 'synced'
        });
        break;
        
      case 'update_order_status':
        const statusResponse = await fetch(`${API}/orders/${data.orderId}/status?status=${data.status}`, {
          method: 'PUT'
        });
        if (!statusResponse.ok) throw new Error('Failed to sync status update');
        
        // Update local order as synced
        const order = await this.performDBOperation('orders', 'get', data.orderId);
        if (order) {
          await this.performDBOperation('orders', 'put', {
            ...order,
            status: data.status,
            sync_status: 'synced'
          });
        }
        break;
        
      default:
        console.warn(`Unknown sync action: ${action}`);
    }
  }

  // Data export functionality for .kot format
  async exportToKOTFormat() {
    try {
      const orders = await this.getOrders();
      const menuItems = await this.getMenuItems();
      const tables = await this.getTables();
      const settings = await this.getBusinessSettings();
      
      const kotData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        restaurant_name: settings.restaurant_name || 'Restaurant',
        data: {
          orders,
          menu_items: menuItems,
          tables,
          settings
        }
      };
      
      const blob = new Blob([JSON.stringify(kotData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billbyte_backup_${new Date().toISOString().split('T')[0]}.kot`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('📁 Data exported to .kot format');
      return kotData;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  // Data import functionality
  async importFromKOTFormat(file) {
    try {
      const text = await file.text();
      const kotData = JSON.parse(text);
      
      if (!kotData.version || !kotData.data) {
        throw new Error('Invalid .kot file format');
      }
      
      const { orders, menu_items, tables, settings } = kotData.data;
      
      // Import data
      if (orders?.length) await this.saveOrders(orders);
      if (menu_items?.length) await this.saveMenuItems(menu_items);
      if (tables?.length) await this.saveTables(tables);
      if (settings) await this.saveBusinessSettings(settings);
      
      console.log('📁 Data imported from .kot format');
      return kotData;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  // Utility methods
  async getStorageStats() {
    try {
      const orders = await this.performDBOperation('orders', 'getAll');
      const menuItems = await this.performDBOperation('menu_items', 'getAll');
      const tables = await this.performDBOperation('tables', 'getAll');
      const queue = await this.performDBOperation('sync_queue', 'getAll');
      
      return {
        orders: orders.length,
        menuItems: menuItems.length,
        tables: tables.length,
        syncQueue: queue.length,
        lastSync: new Date(parseInt(this.lastSyncTime)).toLocaleString(),
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }

  async clearAllData() {
    try {
      await this.performDBOperation('orders', 'clear');
      await this.performDBOperation('menu_items', 'clear');
      await this.performDBOperation('tables', 'clear');
      await this.performDBOperation('dashboard_stats', 'clear');
      await this.performDBOperation('sync_queue', 'clear');
      await this.performDBOperation('business_settings', 'clear');
      
      console.log('🧹 All local data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageManager();
export default OfflineStorageManager;