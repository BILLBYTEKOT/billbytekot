/**
 * React Hook for Offline Storage Integration
 * Provides easy access to offline storage functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '../utils/offlineStorage';
import { toast } from 'sonner';

export const useOfflineStorage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize offline storage
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        setIsLoading(true);
        const success = await offlineStorage.initialize();
        setIsInitialized(success);
        
        if (success) {
          setSyncQueueCount(offlineStorage.getSyncQueueCount());
          console.log('✅ Offline storage hook initialized');
        }
      } catch (error) {
        console.error('❌ Failed to initialize offline storage:', error);
        toast.error('Failed to initialize offline storage');
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing data...');
      offlineStorage.startAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Changes will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync queue count periodically
  useEffect(() => {
    if (!isInitialized) return;

    const updateSyncCount = () => {
      setSyncQueueCount(offlineStorage.getSyncQueueCount());
    };

    const interval = setInterval(updateSyncCount, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [isInitialized]);

  // CRUD operations with offline support
  const createRecord = useCallback(async (tableName, data) => {
    try {
      if (!isInitialized) {
        throw new Error('Offline storage not initialized');
      }

      const id = await offlineStorage.insert(tableName, data);
      setSyncQueueCount(offlineStorage.getSyncQueueCount());
      
      if (!isOnline) {
        toast.info('Record saved offline. Will sync when online.');
      }
      
      return id;
    } catch (error) {
      console.error(`❌ Failed to create ${tableName} record:`, error);
      toast.error(`Failed to create ${tableName} record`);
      throw error;
    }
  }, [isInitialized, isOnline]);

  const updateRecord = useCallback(async (tableName, id, data) => {
    try {
      if (!isInitialized) {
        throw new Error('Offline storage not initialized');
      }

      const success = await offlineStorage.update(tableName, id, data);
      setSyncQueueCount(offlineStorage.getSyncQueueCount());
      
      if (!isOnline) {
        toast.info('Record updated offline. Will sync when online.');
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Failed to update ${tableName} record:`, error);
      toast.error(`Failed to update ${tableName} record`);
      throw error;
    }
  }, [isInitialized, isOnline]);

  const deleteRecord = useCallback(async (tableName, id) => {
    try {
      if (!isInitialized) {
        throw new Error('Offline storage not initialized');
      }

      const success = await offlineStorage.delete(tableName, id);
      setSyncQueueCount(offlineStorage.getSyncQueueCount());
      
      if (!isOnline) {
        toast.info('Record deleted offline. Will sync when online.');
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Failed to delete ${tableName} record:`, error);
      toast.error(`Failed to delete ${tableName} record`);
      throw error;
    }
  }, [isInitialized, isOnline]);

  const getRecord = useCallback(async (tableName, id) => {
    try {
      if (!isInitialized) {
        throw new Error('Offline storage not initialized');
      }

      return await offlineStorage.findById(tableName, id);
    } catch (error) {
      console.error(`❌ Failed to get ${tableName} record:`, error);
      return null;
    }
  }, [isInitialized]);

  const getRecords = useCallback(async (tableName, options = {}) => {
    try {
      if (!isInitialized) {
        throw new Error('Offline storage not initialized');
      }

      return await offlineStorage.findAll(tableName, options);
    } catch (error) {
      console.error(`❌ Failed to get ${tableName} records:`, error);
      return [];
    }
  }, [isInitialized]);

  // Specialized methods for common operations
  const getOrders = useCallback(async (options = {}) => {
    return await getRecords('orders', options);
  }, [getRecords]);

  const createOrder = useCallback(async (orderData) => {
    return await createRecord('orders', orderData);
  }, [createRecord]);

  const updateOrder = useCallback(async (orderId, orderData) => {
    return await updateRecord('orders', orderId, orderData);
  }, [updateRecord]);

  const deleteOrder = useCallback(async (orderId) => {
    return await deleteRecord('orders', orderId);
  }, [deleteRecord]);

  const getMenuItems = useCallback(async (options = {}) => {
    return await getRecords('menu_items', options);
  }, [getRecords]);

  const createMenuItem = useCallback(async (itemData) => {
    return await createRecord('menu_items', itemData);
  }, [createRecord]);

  const updateMenuItem = useCallback(async (itemId, itemData) => {
    return await updateRecord('menu_items', itemId, itemData);
  }, [updateRecord]);

  const deleteMenuItem = useCallback(async (itemId) => {
    return await deleteRecord('menu_items', itemId);
  }, [deleteRecord]);

  const getTables = useCallback(async (options = {}) => {
    return await getRecords('tables', options);
  }, [getRecords]);

  const createTable = useCallback(async (tableData) => {
    return await createRecord('tables', tableData);
  }, [createRecord]);

  const updateTable = useCallback(async (tableId, tableData) => {
    return await updateRecord('tables', tableId, tableData);
  }, [updateRecord]);

  const deleteTable = useCallback(async (tableId) => {
    return await deleteRecord('tables', tableId);
  }, [deleteRecord]);

  const getInventory = useCallback(async (options = {}) => {
    return await getRecords('inventory', options);
  }, [getRecords]);

  const createInventoryItem = useCallback(async (itemData) => {
    return await createRecord('inventory', itemData);
  }, [createRecord]);

  const updateInventoryItem = useCallback(async (itemId, itemData) => {
    return await updateRecord('inventory', itemId, itemData);
  }, [updateRecord]);

  const deleteInventoryItem = useCallback(async (itemId) => {
    return await deleteRecord('inventory', itemId);
  }, [deleteRecord]);

  const getExpenses = useCallback(async (options = {}) => {
    return await getRecords('expenses', options);
  }, [getRecords]);

  const createExpense = useCallback(async (expenseData) => {
    return await createRecord('expenses', expenseData);
  }, [createRecord]);

  const updateExpense = useCallback(async (expenseId, expenseData) => {
    return await updateRecord('expenses', expenseId, expenseData);
  }, [updateRecord]);

  const deleteExpense = useCallback(async (expenseId) => {
    return await deleteRecord('expenses', expenseId);
  }, [deleteRecord]);

  // Sync operations
  const forcSync = useCallback(async () => {
    try {
      if (!isInitialized) {
        throw new Error('Offline storage not initialized');
      }

      if (!isOnline) {
        toast.warning('Cannot sync while offline');
        return false;
      }

      await offlineStorage.startAutoSync();
      setSyncQueueCount(offlineStorage.getSyncQueueCount());
      toast.success('Sync completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to sync:', error);
      toast.error('Sync failed');
      return false;
    }
  }, [isInitialized, isOnline]);

  const clearAllData = useCallback(async () => {
    try {
      if (!isInitialized) {
        throw new Error('Offline storage not initialized');
      }

      const success = await offlineStorage.clearAllData();
      if (success) {
        setSyncQueueCount(0);
        toast.success('All offline data cleared');
      }
      return success;
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      toast.error('Failed to clear offline data');
      return false;
    }
  }, [isInitialized]);

  // Status methods
  const getStorageInfo = useCallback(() => {
    if (!isInitialized) return null;

    return {
      isInitialized,
      isOnline,
      syncQueueCount,
      isOfflineMode: offlineStorage.isOfflineMode(),
      platform: offlineStorage.isAndroid ? 'Android' : 
                offlineStorage.isElectron ? 'Desktop' : 'Web'
    };
  }, [isInitialized, isOnline, syncQueueCount]);

  return {
    // Status
    isInitialized,
    isOnline,
    isLoading,
    syncQueueCount,
    
    // Generic CRUD operations
    createRecord,
    updateRecord,
    deleteRecord,
    getRecord,
    getRecords,
    
    // Orders
    getOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    
    // Menu Items
    getMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    
    // Tables
    getTables,
    createTable,
    updateTable,
    deleteTable,
    
    // Inventory
    getInventory,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    
    // Expenses
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    
    // Sync operations
    forcSync,
    clearAllData,
    
    // Utility
    getStorageInfo
  };
};

export default useOfflineStorage;