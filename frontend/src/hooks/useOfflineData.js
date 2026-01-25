// ✅ React Hook for Offline-First Data Management
import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDataManager } from '../utils/offlineDataManager';
import { toast } from 'sonner';

export function useOfflineData(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const mountedRef = useRef(true);
  const refreshIntervalRef = useRef(null);
  
  const {
    refreshInterval = 0,
    enableRealtime = false,
    onError,
    onSuccess,
    dependencies = []
  } = options;

  // Fetch data function
  const fetchData = useCallback(async (showLoading = true) => {
    if (!mountedRef.current) return;
    
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const result = await offlineDataManager.fetchData(endpoint, options);
      
      if (mountedRef.current) {
        setData(result);
        setLastUpdated(new Date());
        onSuccess?.(result);
      }
      
    } catch (err) {
      console.error(`Failed to fetch ${endpoint}:`, err);
      
      if (mountedRef.current) {
        setError(err);
        onError?.(err);
        
        if (navigator.onLine) {
          toast.error(`Failed to load data: ${err.message}`);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint, onError, onSuccess, ...dependencies]);

  // Mutate data function
  const mutateData = useCallback(async (mutationData, method = 'POST') => {
    try {
      const result = await offlineDataManager.mutateData(endpoint, mutationData, method);
      
      // Refresh data after mutation
      await fetchData(false);
      
      return result;
    } catch (err) {
      console.error(`Failed to mutate ${endpoint}:`, err);
      throw err;
    }
  }, [endpoint, fetchData]);

  // Force refresh function
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Initialize data fetching
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        if (navigator.onLine && !document.hidden) {
          fetchData(false);
        }
      }, refreshInterval);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, fetchData]);

  // Set up network status listener
  useEffect(() => {
    const unsubscribe = offlineDataManager.subscribe('network', ({ isOnline: online }) => {
      setIsOffline(!online);
      
      if (online) {
        // Refresh data when coming back online
        fetchData(false);
      }
    });
    
    return unsubscribe;
  }, [fetchData]);

  // Set up realtime updates
  useEffect(() => {
    if (enableRealtime) {
      const handleVisibilityChange = () => {
        if (!document.hidden && navigator.onLine) {
          fetchData(false);
        }
      };
      
      const handleFocus = () => {
        if (navigator.onLine) {
          fetchData(false);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [enableRealtime, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    isOffline,
    lastUpdated,
    refresh,
    mutateData
  };
}

// Specialized hooks for common data types
export function useOrders(filters = {}) {
  const endpoint = filters.today ? '/orders/today-bills' : '/orders';
  
  return useOfflineData(endpoint, {
    refreshInterval: 2000,
    enableRealtime: true,
    ...filters
  });
}

export function useMenuItems() {
  return useOfflineData('/menu', {
    refreshInterval: 60000, // Refresh every minute
  });
}

export function useTables() {
  return useOfflineData('/tables', {
    refreshInterval: 5000,
    enableRealtime: true
  });
}

export function useDashboardStats() {
  return useOfflineData('/dashboard', {
    refreshInterval: 10000,
    enableRealtime: true
  });
}

export function useBusinessSettings() {
  return useOfflineData('/business/settings', {
    refreshInterval: 300000, // Refresh every 5 minutes
  });
}

// Hook for sync status
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const updateSyncStatus = useCallback(async () => {
    try {
      const status = await offlineDataManager.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to get sync status:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    updateSyncStatus();
    
    // Update sync status every 5 seconds
    const interval = setInterval(updateSyncStatus, 5000);
    
    return () => clearInterval(interval);
  }, [updateSyncStatus]);
  
  return { syncStatus, loading, refresh: updateSyncStatus };
}

// Hook for offline storage stats
export function useOfflineStats() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const updateStats = async () => {
      try {
        const storageStats = await offlineDataManager.offlineStorage.getStorageStats();
        const managerStatus = offlineDataManager.getStatus();
        
        setStats({
          storage: storageStats,
          manager: managerStatus
        });
      } catch (error) {
        console.error('Failed to get offline stats:', error);
      }
    };
    
    updateStats();
    
    // Update stats every 10 seconds
    const interval = setInterval(updateStats, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return stats;
}