/**
 * Ultra-Fast POS Data Manager
 * Instant data access with intelligent caching and real-time synchronization
 * Superior to Petpooja's architecture with advanced performance optimizations
 */

import { openDB } from 'idb';
import wsManager from './websocket';

class POSDataManager {
  constructor() {
    this.db = null;
    this.memoryCache = new Map();
    this.serviceWorkerReady = false;
    this.realtimeListeners = new Map();
    this.performanceMetrics = {
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      avgResponseTime: 0,
      lastSyncTime: null
    };
    
    // Cache configuration
    this.cacheConfig = {
      menu: { ttl: 5 * 60 * 1000, priority: 'high' }, // 5 minutes
      orders: { ttl: 30 * 1000, priority: 'critical' }, // 30 seconds
      tables: { ttl: 10 * 1000, priority: 'critical' }, // 10 seconds
      settings: { ttl: 30 * 60 * 1000, priority: 'medium' }, // 30 minutes
      customers: { ttl: 60 * 60 * 1000, priority: 'low' } // 1 hour
    };
    
    this.init();
  }

  /**
   * Initialize the data manager
   */
  async init() {
    await this.initDatabase();
    await this.initServiceWorker();
    this.setupWebSocketListeners();
    await this.preloadCriticalData();
  }

  /**
   * Initialize IndexedDB for persistent storage
   */
  async initDatabase() {
    this.db = await openDB('pos-data-store', 1, {
      upgrade(db) {
        // Create object stores for different data types
        db.createObjectStore('menu', { keyPath: 'id' });
        db.createObjectStore('orders', { keyPath: 'id' });
        db.createObjectStore('tables', { keyPath: 'id' });
        db.createObjectStore('settings', { keyPath: 'key' });
        db.createObjectStore('customers', { keyPath: 'id' });
        db.createObjectStore('cache-metadata', { keyPath: 'key' });
      }
    });
  }

  /**
   * Initialize service worker for advanced caching
   */
  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/pos-service-worker.js');
        console.log('✅ POS Service Worker registered');
        
        // Wait for service worker to be ready
        if (registration.active) {
          this.serviceWorkerReady = true;
          registration.active.postMessage({ type: 'INIT' });
        } else {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                this.serviceWorkerReady = true;
                newWorker.postMessage({ type: 'INIT' });
              }
            });
          });
        }
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });
        
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Setup WebSocket listeners for real-time updates
   */
  setupWebSocketListeners() {
    // Menu updates
    wsManager.on('menu_update', (data) => {
      this.updateCache('menu', data.payload);
      this.notifyListeners('menu', data.payload);
    });

    // Order updates
    wsManager.on('order_update', (data) => {
      this.updateCache('orders', data.payload);
      this.notifyListeners('orders', data.payload);
    });

    // Table updates
    wsManager.on('table_update', (data) => {
      this.updateCache('tables', data.payload);
      this.notifyListeners('tables', data.payload);
    });

    // Settings updates
    wsManager.on('settings_update', (data) => {
      this.updateCache('settings', data.payload);
      this.notifyListeners('settings', data.payload);
    });

    // Real-time updates from service worker
    wsManager.on('realTimeUpdate', (data) => {
      this.handleRealtimeUpdate(data);
    });
  }

  /**
   * Get data with intelligent caching strategy
   */
  async getData(type, options = {}) {
    const startTime = performance.now();
    const cacheKey = `${type}_${options.id || 'all'}`;
    
    try {
      // 1. Check memory cache first (ultra-fast)
      const memoryData = this.memoryCache.get(cacheKey);
      if (memoryData && !this.isDataStale(memoryData, type)) {
        this.performanceMetrics.cacheHits++;
        this.updateResponseTime(startTime);
        return memoryData.data;
      }

      // 2. Check IndexedDB (fast)
      const indexedDBData = await this.getFromIndexedDB(type, options.id);
      if (indexedDBData && !this.isDataStale(indexedDBData, type)) {
        // Update memory cache
        this.memoryCache.set(cacheKey, indexedDBData);
        this.performanceMetrics.cacheHits++;
        this.updateResponseTime(startTime);
        
        // Background refresh if stale
        if (this.isDataStale(indexedDBData, type, true)) {
          this.backgroundRefresh(type, options);
        }
        
        return indexedDBData.data;
      }

      // 3. Fetch from network (slowest but most current)
      const networkData = await this.fetchFromNetwork(type, options);
      if (networkData) {
        // Update all caches
        await this.updateAllCaches(type, networkData, options.id);
        this.performanceMetrics.networkRequests++;
        this.updateResponseTime(startTime);
        return networkData;
      }

      // 4. Return cached data as fallback
      if (memoryData) {
        return memoryData.data;
      }
      if (indexedDBData) {
        return indexedDBData.data;
      }

      throw new Error(`No data available for ${type}`);

    } catch (error) {
      console.error(`❌ Failed to get ${type} data:`, error);
      
      // Return any cached data as last resort
      const fallbackData = this.memoryCache.get(cacheKey) || 
                           await this.getFromIndexedDB(type, options.id);
      
      if (fallbackData) {
        return fallbackData.data;
      }
      
      throw error;
    }
  }

  /**
   * Get menu items instantly
   */
  async getMenu(category = null) {
    const options = category ? { category } : {};
    return await this.getData('menu', options);
  }

  /**
   * Get active orders instantly
   */
  async getActiveOrders() {
    return await this.getData('orders', { status: 'active' });
  }

  /**
   * Get tables status instantly
   */
  async getTables() {
    return await this.getData('tables');
  }

  /**
   * Get business settings instantly
   */
  async getSettings() {
    return await this.getData('settings');
  }

  /**
   * Search menu items with instant results
   */
  async searchMenuItems(query) {
    const startTime = performance.now();
    
    // Try memory cache first
    const menuData = this.memoryCache.get('menu_all');
    if (menuData) {
      const results = this.performSearch(menuData.data, query);
      this.updateResponseTime(startTime);
      return results;
    }

    // Fallback to IndexedDB
    const indexedDBData = await this.getFromIndexedDB('menu');
    if (indexedDBData) {
      const results = this.performSearch(indexedDBData.data, query);
      this.updateResponseTime(startTime);
      return results;
    }

    // Fetch from network as last resort
    const menu = await this.getMenu();
    return this.performSearch(menu, query);
  }

  /**
   * Perform search on menu items
   */
  performSearch(menuItems, query) {
    if (!query || query.length < 2) return [];
    
    const searchTerm = query.toLowerCase();
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.category?.toLowerCase().includes(searchTerm) ||
      item.code?.toLowerCase().includes(searchTerm)
    ).slice(0, 20); // Limit results for performance
  }

  /**
   * Get data from IndexedDB
   */
  async getFromIndexedDB(type, id = null) {
    if (!this.db) return null;
    
    try {
      const tx = this.db.transaction(type, 'readonly');
      const store = tx.objectStore(type);
      
      if (id) {
        const data = await store.get(id);
        if (data) {
          const metadata = await this.getCacheMetadata(`${type}_${id}`);
          return { data, timestamp: metadata?.timestamp };
        }
      } else {
        const allData = await store.getAll();
        if (allData.length > 0) {
          const metadata = await this.getCacheMetadata(`${type}_all`);
          return { data: allData, timestamp: metadata?.timestamp };
        }
      }
    } catch (error) {
      console.error(`❌ IndexedDB read failed for ${type}:`, error);
    }
    
    return null;
  }

  /**
   * Fetch data from network
   */
  async fetchFromNetwork(type, options = {}) {
    try {
      let url = `/api/${type}`;
      
      if (options.id) {
        url += `/${options.id}`;
      }
      
      if (options.status) {
        url += `?status=${options.status}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error(`❌ Network fetch failed for ${type}:`, error);
      throw error;
    }
  }

  /**
   * Update all caches with new data
   */
  async updateAllCaches(type, data, id = null) {
    const cacheKey = `${type}_${id || 'all'}`;
    const timestamp = Date.now();
    
    // Update memory cache
    this.memoryCache.set(cacheKey, { data, timestamp });
    
    // Update IndexedDB
    await this.updateIndexedDB(type, data, id);
    
    // Update cache metadata
    await this.setCacheMetadata(cacheKey, timestamp);
    
    // Limit memory cache size
    if (this.memoryCache.size > 100) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Update IndexedDB
   */
  async updateIndexedDB(type, data, id = null) {
    if (!this.db) return;
    
    try {
      const tx = this.db.transaction(type, 'readwrite');
      const store = tx.objectStore(type);
      
      if (id && typeof data === 'object') {
        await store.put({ ...data, id });
      } else if (Array.isArray(data)) {
        await store.clear();
        for (const item of data) {
          await store.put(item);
        }
      } else {
        await store.put({ key: type, value: data });
      }
      
      await tx.complete;
    } catch (error) {
      console.error(`❌ IndexedDB update failed for ${type}:`, error);
    }
  }

  /**
   * Get cache metadata
   */
  async getCacheMetadata(key) {
    if (!this.db) return null;
    
    try {
      const tx = this.db.transaction('cache-metadata', 'readonly');
      const store = tx.objectStore('cache-metadata');
      return await store.get(key);
    } catch (error) {
      return null;
    }
  }

  /**
   * Set cache metadata
   */
  async setCacheMetadata(key, timestamp) {
    if (!this.db) return;
    
    try {
      const tx = this.db.transaction('cache-metadata', 'readwrite');
      const store = tx.objectStore('cache-metadata');
      await store.put({ key, timestamp });
      await tx.complete;
    } catch (error) {
      console.error('❌ Failed to set cache metadata:', error);
    }
  }

  /**
   * Check if data is stale
   */
  isDataStale(data, type, extended = false) {
    if (!data.timestamp) return true;
    
    const config = this.cacheConfig[type];
    if (!config) return true;
    
    const ttl = extended ? config.ttl * 2 : config.ttl;
    return (Date.now() - data.timestamp) > ttl;
  }

  /**
   * Background refresh of stale data
   */
  async backgroundRefresh(type, options) {
    if (!navigator.onLine) return;
    
    try {
      const data = await this.fetchFromNetwork(type, options);
      await this.updateAllCaches(type, data, options.id);
      console.log(`🔄 Background refresh completed for ${type}`);
    } catch (error) {
      console.log(`🔄 Background refresh failed for ${type}:`, error);
    }
  }

  /**
   * Update cache with new data
   */
  updateCache(type, data) {
    const cacheKey = `${type}_all`;
    const timestamp = Date.now();
    
    this.memoryCache.set(cacheKey, { data, timestamp });
    this.updateIndexedDB(type, data);
    this.setCacheMetadata(cacheKey, timestamp);
  }

  /**
   * Handle real-time updates
   */
  handleRealtimeUpdate(message) {
    const { type, data } = message.data;
    
    switch (type) {
      case 'menu_update':
        this.updateCache('menu', data);
        break;
      case 'order_update':
        this.updateCache('orders', data);
        break;
      case 'table_update':
        this.updateCache('tables', data);
        break;
      case 'settings_update':
        this.updateCache('settings', data);
        break;
    }
    
    this.notifyListeners(type, data);
  }

  /**
   * Handle service worker messages
   */
  handleServiceWorkerMessage(message) {
    switch (message.type) {
      case 'dataUpdated':
        this.handleRealtimeUpdate(message);
        break;
      case 'realTimeUpdate':
        this.handleRealtimeUpdate(message);
        break;
    }
  }

  /**
   * Add real-time listener
   */
  addListener(type, callback) {
    if (!this.realtimeListeners.has(type)) {
      this.realtimeListeners.set(type, []);
    }
    this.realtimeListeners.get(type).push(callback);
  }

  /**
   * Remove real-time listener
   */
  removeListener(type, callback) {
    if (this.realtimeListeners.has(type)) {
      const listeners = this.realtimeListeners.get(type);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Notify all listeners
   */
  notifyListeners(type, data) {
    if (this.realtimeListeners.has(type)) {
      this.realtimeListeners.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Listener error for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Update response time metrics
   */
  updateResponseTime(startTime) {
    const responseTime = performance.now() - startTime;
    
    if (this.performanceMetrics.avgResponseTime === 0) {
      this.performanceMetrics.avgResponseTime = responseTime;
    } else {
      this.performanceMetrics.avgResponseTime = 
        (this.performanceMetrics.avgResponseTime * 0.9) + (responseTime * 0.1);
    }
  }

  /**
   * Preload critical data for instant access
   */
  async preloadCriticalData() {
    console.log('🚀 Preloading critical POS data...');
    
    const criticalData = [
      { type: 'menu', priority: 'high' },
      { type: 'tables', priority: 'high' },
      { type: 'settings', priority: 'medium' }
    ];
    
    // Sort by priority
    criticalData.sort((a, b) => {
      const priorities = { high: 3, medium: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });
    
    for (const { type } of criticalData) {
      try {
        await this.getData(type);
        console.log(`✅ Preloaded ${type} data`);
      } catch (error) {
        console.error(`❌ Failed to preload ${type}:`, error);
      }
    }
    
    console.log('🎉 Critical data preloading completed');
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      memoryCacheSize: this.memoryCache.size,
      serviceWorkerReady: this.serviceWorkerReady,
      isOnline: navigator.onLine
    };
  }

  /**
   * Clear all caches
   */
  async clearCaches(type = null) {
    if (type) {
      this.memoryCache.delete(`${type}_all`);
      if (this.db) {
        await this.db.delete(type);
      }
    } else {
      this.memoryCache.clear();
      if (this.db) {
        await this.db.clear();
      }
    }
    
    // Notify service worker
    if (this.serviceWorkerReady) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CLEAR_CACHE',
        data: { endpoint: type }
      });
    }
  }

  /**
   * Force sync all data
   */
  async forceSync() {
    const types = ['menu', 'orders', 'tables', 'settings'];
    
    for (const type of types) {
      try {
        const data = await this.fetchFromNetwork(type);
        await this.updateAllCaches(type, data);
        console.log(`🔄 Synced ${type} data`);
      } catch (error) {
        console.error(`❌ Failed to sync ${type}:`, error);
      }
    }
    
    this.performanceMetrics.lastSyncTime = Date.now();
  }
}

// Create singleton instance
const posDataManager = new POSDataManager();

export default posDataManager;
export { POSDataManager };
