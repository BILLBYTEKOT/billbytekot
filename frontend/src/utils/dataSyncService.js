// ✅ Data Synchronization Service
// Handles background sync, conflict resolution, and data consistency

import { offlineStorage } from './offlineStorage';
import { toast } from 'sonner';

class DataSyncService {
  constructor() {
    this.syncInterval = null;
    this.syncInProgress = false;
    this.lastSyncTime = localStorage.getItem('lastSyncTime') || 0;
    this.syncFrequency = 15000; // 15 seconds
    this.conflictResolutionStrategy = 'server_wins'; // 'server_wins', 'client_wins', 'merge'
    this.maxRetries = 3;
    this.baseURL = process.env.REACT_APP_API_URL || 'https://billbytekot-backend.onrender.com/api';
    
    // Initialize sync service
    this.init();
  }

  init() {
    // Start periodic sync
    this.startPeriodicSync();
    
    // Listen for network changes
    window.addEventListener('online', () => {
      console.log('🌐 Network restored - starting immediate sync');
      this.performFullSync();
    });
    
    // Listen for visibility changes (user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        console.log('👁️ Tab visible - checking for updates');
        this.performQuickSync();
      }
    });
    
    // Listen for focus events
    window.addEventListener('focus', () => {
      if (navigator.onLine) {
        console.log('🎯 Window focused - syncing data');
        this.performQuickSync();
      }
    });
  }

  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.performQuickSync();
      }
    }, this.syncFrequency);
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async performFullSync() {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    console.log('🔄 Starting full data sync...');
    
    try {
      // Step 1: Sync pending local changes to server
      await this.syncLocalChangesToServer();
      
      // Step 2: Fetch latest data from server
      await this.fetchLatestDataFromServer();
      
      // Step 3: Resolve any conflicts
      await this.resolveDataConflicts();
      
      // Update last sync time
      this.lastSyncTime = Date.now();
      localStorage.setItem('lastSyncTime', this.lastSyncTime.toString());
      
      console.log('✅ Full sync completed successfully');
      
      // Notify user if there were significant changes
      this.notifyUserOfChanges();
      
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      toast.error('Sync failed - some data may be outdated');
    } finally {
      this.syncInProgress = false;
    }
  }

  async performQuickSync() {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      // Quick sync - only critical data
      await Promise.all([
        this.syncOrders(),
        this.syncDashboardStats()
      ]);
      
      this.lastSyncTime = Date.now();
      localStorage.setItem('lastSyncTime', this.lastSyncTime.toString());
      
    } catch (error) {
      console.warn('⚠️ Quick sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncLocalChangesToServer() {
    console.log('📤 Syncing local changes to server...');
    
    // Get all pending sync items
    const syncQueue = await offlineStorage.getSyncQueue();
    
    for (const item of syncQueue) {
      try {
        await this.processSyncItem(item);
        
        // Remove from queue after successful sync
        await offlineStorage.performDBOperation('sync_queue', 'delete', item.id);
        
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        
        // Increment retry count
        item.retries = (item.retries || 0) + 1;
        
        if (item.retries >= this.maxRetries) {
          console.error(`Max retries reached for item ${item.id}, removing from queue`);
          await offlineStorage.performDBOperation('sync_queue', 'delete', item.id);
          
          // Notify user of failed sync
          toast.error(`Failed to sync ${item.action} after ${this.maxRetries} attempts`);
        } else {
          // Update retry count
          await offlineStorage.performDBOperation('sync_queue', 'put', item);
        }
      }
    }
  }

  async processSyncItem(item) {
    const { action, data } = item;
    
    switch (action) {
      case 'create_order':
        await this.syncCreateOrder(data);
        break;
      case 'update_order_status':
        await this.syncUpdateOrderStatus(data);
        break;
      case 'update_order':
        await this.syncUpdateOrder(data);
        break;
      case 'delete_order':
        await this.syncDeleteOrder(data);
        break;
      default:
        console.warn(`Unknown sync action: ${action}`);
    }
  }

  async syncCreateOrder(orderData) {
    const response = await fetch(`${this.baseURL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }
    
    const serverOrder = await response.json();
    
    // Update local order with server ID and mark as synced
    await offlineStorage.performDBOperation('orders', 'put', {
      ...serverOrder,
      sync_status: 'synced',
      last_modified: Date.now()
    });
    
    // Remove the offline order if it had a different ID
    if (orderData.id !== serverOrder.id && orderData.id.startsWith('offline_')) {
      await offlineStorage.performDBOperation('orders', 'delete', orderData.id);
    }
    
    console.log(`✅ Order ${serverOrder.id} synced to server`);
  }

  async syncUpdateOrderStatus(data) {
    const { orderId, status } = data;
    
    const response = await fetch(`${this.baseURL}/orders/${orderId}/status?status=${status}`, {
      method: 'PUT'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update order status: ${response.statusText}`);
    }
    
    // Update local order as synced
    const order = await offlineStorage.performDBOperation('orders', 'get', orderId);
    if (order) {
      await offlineStorage.performDBOperation('orders', 'put', {
        ...order,
        status,
        sync_status: 'synced',
        last_modified: Date.now()
      });
    }
    
    console.log(`✅ Order ${orderId} status synced to server`);
  }

  async syncUpdateOrder(orderData) {
    const response = await fetch(`${this.baseURL}/orders/${orderData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update order: ${response.statusText}`);
    }
    
    const updatedOrder = await response.json();
    
    // Update local order
    await offlineStorage.performDBOperation('orders', 'put', {
      ...updatedOrder,
      sync_status: 'synced',
      last_modified: Date.now()
    });
    
    console.log(`✅ Order ${orderData.id} updated on server`);
  }

  async syncDeleteOrder(data) {
    const { orderId } = data;
    
    const response = await fetch(`${this.baseURL}/orders/${orderId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete order: ${response.statusText}`);
    }
    
    // Remove from local storage
    await offlineStorage.performDBOperation('orders', 'delete', orderId);
    
    console.log(`✅ Order ${orderId} deleted from server`);
  }

  async fetchLatestDataFromServer() {
    console.log('📥 Fetching latest data from server...');
    
    try {
      // Fetch all critical data in parallel
      const [ordersRes, todaysBillsRes, menuRes, tablesRes, dashboardRes, settingsRes] = await Promise.all([
        fetch(`${this.baseURL}/orders`),
        fetch(`${this.baseURL}/orders/today-bills`),
        fetch(`${this.baseURL}/menu`),
        fetch(`${this.baseURL}/tables`),
        fetch(`${this.baseURL}/dashboard`),
        fetch(`${this.baseURL}/business/settings`)
      ]);
      
      // Process responses
      if (ordersRes.ok) {
        const orders = await ordersRes.json();
        await this.updateLocalOrders(orders);
      }
      
      if (todaysBillsRes.ok) {
        const todaysBills = await todaysBillsRes.json();
        await this.updateLocalTodaysBills(todaysBills);
      }
      
      if (menuRes.ok) {
        const menuItems = await menuRes.json();
        await offlineStorage.saveMenuItems(menuItems);
      }
      
      if (tablesRes.ok) {
        const tables = await tablesRes.json();
        await offlineStorage.saveTables(tables);
      }
      
      if (dashboardRes.ok) {
        const dashboardStats = await dashboardRes.json();
        await offlineStorage.saveDashboardStats(dashboardStats);
      }
      
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        await offlineStorage.saveBusinessSettings(settingsData.business_settings || {});
      }
      
    } catch (error) {
      console.error('Failed to fetch latest data:', error);
      throw error;
    }
  }

  async updateLocalOrders(serverOrders) {
    for (const serverOrder of serverOrders) {
      const localOrder = await offlineStorage.performDBOperation('orders', 'get', serverOrder.id);
      
      if (!localOrder) {
        // New order from server
        await offlineStorage.performDBOperation('orders', 'put', {
          ...serverOrder,
          sync_status: 'synced',
          last_modified: Date.now()
        });
      } else if (localOrder.sync_status === 'synced') {
        // Check if server version is newer
        const serverTime = new Date(serverOrder.updated_at || serverOrder.created_at).getTime();
        const localTime = localOrder.last_modified || 0;
        
        if (serverTime > localTime) {
          await offlineStorage.performDBOperation('orders', 'put', {
            ...serverOrder,
            sync_status: 'synced',
            last_modified: Date.now()
          });
        }
      }
      // Skip orders with pending sync status to avoid overwriting local changes
    }
  }

  async updateLocalTodaysBills(serverBills) {
    for (const serverBill of serverBills) {
      const localBill = await offlineStorage.performDBOperation('orders', 'get', serverBill.id);
      
      if (!localBill || localBill.sync_status === 'synced') {
        await offlineStorage.performDBOperation('orders', 'put', {
          ...serverBill,
          sync_status: 'synced',
          last_modified: Date.now()
        });
      }
    }
  }

  async syncOrders() {
    try {
      const response = await fetch(`${this.baseURL}/orders`);
      if (response.ok) {
        const orders = await response.json();
        await this.updateLocalOrders(orders);
      }
    } catch (error) {
      console.warn('Failed to sync orders:', error);
    }
  }

  async syncDashboardStats() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard`);
      if (response.ok) {
        const stats = await response.json();
        await offlineStorage.saveDashboardStats(stats);
      }
    } catch (error) {
      console.warn('Failed to sync dashboard stats:', error);
    }
  }

  async resolveDataConflicts() {
    console.log('🔧 Resolving data conflicts...');
    
    // Get all orders with pending sync status
    const allOrders = await offlineStorage.performDBOperation('orders', 'getAll');
    const conflictedOrders = allOrders.filter(order => 
      order.sync_status === 'pending' && !order.id.startsWith('offline_')
    );
    
    for (const localOrder of conflictedOrders) {
      try {
        // Fetch server version
        const response = await fetch(`${this.baseURL}/orders/${localOrder.id}`);
        
        if (response.ok) {
          const serverOrder = await response.json();
          const resolvedOrder = await this.resolveOrderConflict(localOrder, serverOrder);
          
          // Save resolved order
          await offlineStorage.performDBOperation('orders', 'put', resolvedOrder);
          
        } else if (response.status === 404) {
          // Order doesn't exist on server, create it
          await this.syncCreateOrder(localOrder);
        }
        
      } catch (error) {
        console.error(`Failed to resolve conflict for order ${localOrder.id}:`, error);
      }
    }
  }

  async resolveOrderConflict(localOrder, serverOrder) {
    const localTime = localOrder.last_modified || 0;
    const serverTime = new Date(serverOrder.updated_at || serverOrder.created_at).getTime();
    
    switch (this.conflictResolutionStrategy) {
      case 'server_wins':
        return {
          ...serverOrder,
          sync_status: 'synced',
          last_modified: Date.now()
        };
        
      case 'client_wins':
        // Update server with local version
        await this.syncUpdateOrder(localOrder);
        return {
          ...localOrder,
          sync_status: 'synced',
          last_modified: Date.now()
        };
        
      case 'merge':
        // Merge based on timestamps and field priority
        const mergedOrder = {
          ...serverOrder,
          // Prefer local changes for certain fields
          customer_name: localTime > serverTime ? localOrder.customer_name : serverOrder.customer_name,
          customer_phone: localTime > serverTime ? localOrder.customer_phone : serverOrder.customer_phone,
          // Always prefer server status and totals
          status: serverOrder.status,
          total: serverOrder.total,
          sync_status: 'synced',
          last_modified: Date.now()
        };
        
        // Update server if local version is newer
        if (localTime > serverTime) {
          await this.syncUpdateOrder(mergedOrder);
        }
        
        return mergedOrder;
        
      default:
        return {
          ...serverOrder,
          sync_status: 'synced',
          last_modified: Date.now()
        };
    }
  }

  notifyUserOfChanges() {
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    
    // Only notify if it's been more than 5 minutes since last sync
    if (timeSinceLastSync > 300000) {
      toast.success('Data synchronized successfully', {
        description: 'Your orders and data are up to date'
      });
    }
  }

  // Public methods for manual sync
  async forceSyncNow() {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline');
      return false;
    }
    
    toast.loading('Syncing data...', { id: 'force-sync' });
    
    try {
      await this.performFullSync();
      toast.success('Sync completed successfully', { id: 'force-sync' });
      return true;
    } catch (error) {
      toast.error('Sync failed', { id: 'force-sync' });
      return false;
    }
  }

  getSyncStatus() {
    return {
      isOnline: navigator.onLine,
      syncInProgress: this.syncInProgress,
      lastSyncTime: new Date(parseInt(this.lastSyncTime)).toLocaleString(),
      syncFrequency: this.syncFrequency / 1000 + ' seconds'
    };
  }

  async getPendingSyncCount() {
    const queue = await offlineStorage.getSyncQueue();
    return queue.length;
  }

  // Configuration methods
  setSyncFrequency(seconds) {
    this.syncFrequency = seconds * 1000;
    this.startPeriodicSync(); // Restart with new frequency
  }

  setConflictResolutionStrategy(strategy) {
    if (['server_wins', 'client_wins', 'merge'].includes(strategy)) {
      this.conflictResolutionStrategy = strategy;
    }
  }

  // Cleanup
  destroy() {
    this.stopPeriodicSync();
    window.removeEventListener('online', this.performFullSync);
    document.removeEventListener('visibilitychange', this.performQuickSync);
    window.removeEventListener('focus', this.performQuickSync);
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();
export default DataSyncService;