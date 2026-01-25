// ✅ Developer Tools Access for Internal Data
// Provides console access to internal app data for debugging

import { offlineStorage } from './offlineStorage';
import { offlineDataManager } from './offlineDataManager';
import { dataSyncService } from './dataSyncService';
import { kotDataFormat } from './kotDataFormat';

class DevToolsAccess {
  constructor() {
    this.initializeConsoleAPI();
  }

  initializeConsoleAPI() {
    // Only expose in development or when explicitly enabled
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('enableDevTools') === 'true') {
      window.BillByteKOT = {
        // Storage access
        storage: {
          getOrders: () => offlineStorage.getOrders(),
          getMenuItems: () => offlineStorage.getMenuItems(),
          getTables: () => offlineStorage.getTables(),
          getDashboardStats: () => offlineStorage.getDashboardStats(),
          getBusinessSettings: () => offlineStorage.getBusinessSettings(),
          getSyncQueue: () => offlineStorage.getSyncQueue(),
          getStorageStats: () => offlineStorage.getStorageStats(),
          clearAllData: () => offlineStorage.clearAllData(),
          
          // Direct database operations
          performDBOperation: (store, operation, data) => 
            offlineStorage.performDBOperation(store, operation, data)
        },
        
        // Data manager access
        dataManager: {
          fetchData: (endpoint, options) => offlineDataManager.fetchData(endpoint, options),
          mutateData: (endpoint, data, method) => offlineDataManager.mutateData(endpoint, data, method),
          getStatus: () => offlineDataManager.getStatus(),
          getSyncStatus: () => offlineDataManager.getSyncStatus(),
          preloadCriticalData: () => offlineDataManager.preloadCriticalData()
        },
        
        // Sync service access
        sync: {
          forceSyncNow: () => dataSyncService.forceSyncNow(),
          getSyncStatus: () => dataSyncService.getSyncStatus(),
          getPendingSyncCount: () => dataSyncService.getPendingSyncCount(),
          performFullSync: () => dataSyncService.performFullSync(),
          performQuickSync: () => dataSyncService.performQuickSync()
        },
        
        // Data export/import
        dataFormat: {
          exportToKOT: (options) => kotDataFormat.exportToKOT(options),
          importFromKOT: (file, options) => kotDataFormat.importFromKOT(file, options),
          getExportStats: () => kotDataFormat.getExportStats()
        },
        
        // Utility functions
        utils: {
          enableDevTools: () => {
            localStorage.setItem('enableDevTools', 'true');
            console.log('✅ Dev tools enabled. Refresh the page to access all features.');
          },
          disableDevTools: () => {
            localStorage.removeItem('enableDevTools');
            delete window.BillByteKOT;
            console.log('❌ Dev tools disabled.');
          },
          
          // Quick data inspection
          inspectOrder: async (orderId) => {
            const orders = await offlineStorage.getOrders();
            const order = orders.find(o => o.id === orderId);
            console.table(order);
            return order;
          },
          
          inspectTable: async (tableNumber) => {
            const tables = await offlineStorage.getTables();
            const table = tables.find(t => t.table_number === tableNumber);
            console.table(table);
            return table;
          },
          
          // Data manipulation helpers
          createTestOrder: async () => {
            const testOrder = {
              id: `test_${Date.now()}`,
              table_number: 1,
              customer_name: 'Test Customer',
              items: [
                { name: 'Test Item', price: 100, quantity: 1 }
              ],
              total: 100,
              status: 'pending',
              created_at: new Date().toISOString(),
              sync_status: 'pending'
            };
            
            await offlineStorage.saveOrder(testOrder);
            console.log('✅ Test order created:', testOrder);
            return testOrder;
          },
          
          // Performance monitoring
          measurePerformance: async (operation) => {
            const start = performance.now();
            const result = await operation();
            const end = performance.now();
            console.log(`⏱️ Operation took ${end - start} milliseconds`);
            return result;
          },
          
          // Memory usage
          getMemoryUsage: () => {
            if (performance.memory) {
              const memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
              };
              console.table(memory);
              return memory;
            }
            return null;
          }
        },
        
        // Help and documentation
        help: () => {
          console.log(`
🚀 BillByteKOT Developer Tools

📦 Storage Access:
  BillByteKOT.storage.getOrders()           - Get all orders
  BillByteKOT.storage.getMenuItems()        - Get menu items
  BillByteKOT.storage.getTables()           - Get tables
  BillByteKOT.storage.getStorageStats()     - Get storage statistics
  BillByteKOT.storage.clearAllData()        - Clear all data (⚠️ Destructive)

🔄 Data Management:
  BillByteKOT.dataManager.fetchData('/orders')     - Fetch data with fallback
  BillByteKOT.dataManager.getStatus()              - Get manager status
  BillByteKOT.dataManager.preloadCriticalData()    - Preload critical data

🔄 Sync Operations:
  BillByteKOT.sync.forceSyncNow()           - Force immediate sync
  BillByteKOT.sync.getSyncStatus()          - Get sync status
  BillByteKOT.sync.getPendingSyncCount()    - Get pending sync count

📁 Data Export/Import:
  BillByteKOT.dataFormat.exportToKOT()      - Export data to .kot format
  BillByteKOT.dataFormat.getExportStats()   - Get export statistics

🛠️ Utilities:
  BillByteKOT.utils.inspectOrder('order_id')       - Inspect specific order
  BillByteKOT.utils.createTestOrder()              - Create test order
  BillByteKOT.utils.getMemoryUsage()               - Check memory usage
  BillByteKOT.utils.measurePerformance(fn)         - Measure operation performance

❓ Help:
  BillByteKOT.help()                        - Show this help message

Example Usage:
  // Get all orders
  const orders = await BillByteKOT.storage.getOrders();
  console.table(orders);
  
  // Check sync status
  const syncStatus = await BillByteKOT.sync.getSyncStatus();
  console.log(syncStatus);
  
  // Export data
  await BillByteKOT.dataFormat.exportToKOT();
          `);
        }
      };
      
      console.log(`
🚀 BillByteKOT Developer Tools Loaded!

Type BillByteKOT.help() for available commands.

Quick Start:
• BillByteKOT.storage.getOrders() - View all orders
• BillByteKOT.sync.getSyncStatus() - Check sync status  
• BillByteKOT.help() - Full documentation
      `);
    }
  }
  
  // Browser storage inspection
  static inspectBrowserStorage() {
    console.group('🔍 Browser Storage Inspection');
    
    // LocalStorage
    console.group('📦 LocalStorage');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`${key}:`, value);
    }
    console.groupEnd();
    
    // SessionStorage
    console.group('📦 SessionStorage');
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      console.log(`${key}:`, value);
    }
    console.groupEnd();
    
    // IndexedDB databases
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        console.group('🗄️ IndexedDB Databases');
        databases.forEach(db => {
          console.log(`Database: ${db.name} (version: ${db.version})`);
        });
        console.groupEnd();
      });
    }
    
    console.groupEnd();
  }
  
  // Network monitoring
  static monitorNetworkRequests() {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
      const start = performance.now();
      console.log('🌐 Network Request:', args[0]);
      
      return originalFetch.apply(this, args)
        .then(response => {
          const end = performance.now();
          console.log(`✅ Response (${end - start}ms):`, response.status, args[0]);
          return response;
        })
        .catch(error => {
          const end = performance.now();
          console.log(`❌ Error (${end - start}ms):`, error.message, args[0]);
          throw error;
        });
    };
    
    console.log('🔍 Network monitoring enabled');
  }
}

// Initialize dev tools
const devToolsAccess = new DevToolsAccess();

// Export for manual initialization
export { DevToolsAccess, devToolsAccess };
export default DevToolsAccess;