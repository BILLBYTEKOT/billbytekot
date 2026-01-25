/**
 * Instant Menu Cache System
 * Ultra-fast menu fetching with intelligent preloading and caching
 * Better than Petpooja's menu system with advanced performance optimizations
 */

import posDataManager from './posDataManager';

class InstantMenuCache {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.lastAccessTime = new Map();
    this.accessFrequency = new Map();
    this.cacheConfig = {
      maxSize: 1000,
      preloadThreshold: 0.8,
      backgroundRefreshInterval: 5 * 60 * 1000, // 5 minutes
      maxAge: 30 * 60 * 1000 // 30 minutes
    };
    
    this.init();
  }

  /**
   * Initialize the menu cache system
   */
  async init() {
    await this.loadPersistedCache();
    this.startBackgroundRefresh();
    this.setupPerformanceMonitoring();
  }

  /**
   * Get menu items instantly with smart caching
   */
  async getMenuItems(options = {}) {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(options);
    
    try {
      // 1. Check memory cache (fastest)
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && !this.isStale(cachedData)) {
        this.updateAccessMetrics(cacheKey);
        this.logPerformance('memory_hit', startTime);
        return cachedData.data;
      }

      // 2. Check IndexedDB via POS data manager
      const indexedDBData = await posDataManager.getData('menu', options);
      if (indexedDBData) {
        this.updateCache(cacheKey, indexedDBData);
        this.updateAccessMetrics(cacheKey);
        this.logPerformance('indexeddb_hit', startTime);
        return indexedDBData;
      }

      // 3. Fetch from network
      const networkData = await this.fetchFromNetwork(options);
      this.updateCache(cacheKey, networkData);
      this.updateAccessMetrics(cacheKey);
      this.logPerformance('network_hit', startTime);
      
      // Trigger preloading if cache is getting full
      this.checkPreloadThreshold();
      
      return networkData;

    } catch (error) {
      console.error('❌ Failed to get menu items:', error);
      
      // Return stale cache if available
      const staleData = this.cache.get(cacheKey);
      if (staleData) {
        console.log('⚠️ Returning stale cache data');
        return staleData.data;
      }
      
      throw error;
    }
  }

  /**
   * Search menu items with instant results
   */
  async searchMenuItems(query, options = {}) {
    const startTime = performance.now();
    
    // Try to get all menu items first
    const allItems = await this.getMenuItems();
    
    // Perform search in memory for instant results
    const results = this.performSearch(allItems, query);
    
    this.logPerformance('search', startTime);
    return results;
  }

  /**
   * Perform search on menu items
   */
  performSearch(items, query) {
    if (!query || query.length < 2) return [];
    
    const searchTerm = query.toLowerCase();
    const searchTerms = searchTerm.split(' ');
    
    // Advanced search with scoring
    const scoredResults = items.map(item => {
      let score = 0;
      const name = item.name?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      const category = item.category?.toLowerCase() || '';
      const code = item.code?.toLowerCase() || '';
      
      // Exact name match gets highest score
      if (name === searchTerm) score += 100;
      
      // Name contains search term
      if (name.includes(searchTerm)) score += 50;
      
      // Multiple word matches
      searchTerms.forEach(term => {
        if (name.includes(term)) score += 25;
        if (description.includes(term)) score += 10;
        if (category.includes(term)) score += 15;
        if (code.includes(term)) score += 20;
      });
      
      // Popularity boost
      if (item.popularity) score += Math.min(item.popularity, 20);
      
      // Recently accessed boost
      const lastAccess = this.lastAccessTime.get(item.id);
      if (lastAccess && (Date.now() - lastAccess) < 24 * 60 * 60 * 1000) {
        score += 10;
      }
      
      return { item, score };
    });
    
    // Filter and sort by score
    return scoredResults
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(result => result.item);
  }

  /**
   * Get menu categories instantly
   */
  async getCategories() {
    const cacheKey = 'categories';
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isStale(cached)) {
      return cached.data;
    }
    
    const menuItems = await this.getMenuItems();
    const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];
    
    this.updateCache(cacheKey, categories);
    return categories;
  }

  /**
   * Get popular items instantly
   */
  async getPopularItems(limit = 10) {
    const cacheKey = `popular_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isStale(cached)) {
      return cached.data;
    }
    
    const menuItems = await this.getMenuItems();
    const popularItems = menuItems
      .filter(item => item.popularity > 0)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
    
    this.updateCache(cacheKey, popularItems);
    return popularItems;
  }

  /**
   * Get items by category instantly
   */
  async getItemsByCategory(category) {
    const cacheKey = `category_${category}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isStale(cached)) {
      return cached.data;
    }
    
    const allItems = await this.getMenuItems();
    const categoryItems = allItems.filter(item => item.category === category);
    
    this.updateCache(cacheKey, categoryItems);
    return categoryItems;
  }

  /**
   * Fetch menu from network
   */
  async fetchFromNetwork(options = {}) {
    let url = '/api/menu';
    
    if (options.category) {
      url += `?category=${encodeURIComponent(options.category)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  }

  /**
   * Update cache with new data
   */
  updateCache(key, data) {
    // Check cache size limit
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1
    });
    
    // Persist to localStorage for recovery
    this.persistCache();
  }

  /**
   * Update access metrics for intelligent caching
   */
  updateAccessMetrics(key) {
    const now = Date.now();
    this.lastAccessTime.set(key, now);
    
    const currentFreq = this.accessFrequency.get(key) || 0;
    this.accessFrequency.set(key, currentFreq + 1);
    
    // Update cache entry access count
    const cached = this.cache.get(key);
    if (cached) {
      cached.accessCount = (cached.accessCount || 0) + 1;
      cached.lastAccess = now;
    }
  }

  /**
   * Check if cache entry is stale
   */
  isStale(cached) {
    if (!cached.timestamp) return true;
    return (Date.now() - cached.timestamp) > this.cacheConfig.maxAge;
  }

  /**
   * Generate cache key from options
   */
  generateCacheKey(options) {
    const parts = ['menu'];
    
    if (options.category) parts.push(`cat_${options.category}`);
    if (options.limit) parts.push(`limit_${options.limit}`);
    if (options.sort) parts.push(`sort_${options.sort}`);
    
    return parts.join('_');
  }

  /**
   * Evict least used items from cache
   */
  evictLeastUsed() {
    const entries = Array.from(this.cache.entries());
    
    // Sort by access frequency and last access time
    entries.sort((a, b) => {
      const [, dataA] = a;
      const [, dataB] = b;
      
      const scoreA = (dataA.accessCount || 0) + (dataA.lastAccess ? 1 : 0);
      const scoreB = (dataB.accessCount || 0) + (dataB.lastAccess ? 1 : 0);
      
      return scoreA - scoreB;
    });
    
    // Remove bottom 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      this.lastAccessTime.delete(key);
      this.accessFrequency.delete(key);
    }
  }

  /**
   * Check if preloading should be triggered
   */
  checkPreloadThreshold() {
    const usageRatio = this.cache.size / this.cacheConfig.maxSize;
    
    if (usageRatio > this.cacheConfig.preloadThreshold && !this.isPreloading) {
      this.triggerPreloading();
    }
  }

  /**
   * Trigger intelligent preloading
   */
  async triggerPreloading() {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('🚀 Triggering intelligent menu preloading...');
    
    try {
      // Get frequently accessed categories
      const frequentCategories = this.getFrequentCategories();
      
      // Preload popular items
      await this.getPopularItems(20);
      
      // Preload frequent categories
      for (const category of frequentCategories) {
        await this.getItemsByCategory(category);
      }
      
      console.log('✅ Intelligent preloading completed');
    } catch (error) {
      console.error('❌ Preloading failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Get frequently accessed categories
   */
  getFrequentCategories() {
    const categoryFreq = new Map();
    
    this.accessFrequency.forEach((freq, key) => {
      if (key.startsWith('category_')) {
        const category = key.replace('category_', '');
        categoryFreq.set(category, freq);
      }
    });
    
    return Array.from(categoryFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);
  }

  /**
   * Start background refresh process
   */
  startBackgroundRefresh() {
    setInterval(async () => {
      if (!navigator.onLine) return;
      
      try {
        // Refresh popular items
        const popularKey = 'popular_10';
        const popularData = this.cache.get(popularKey);
        
        if (popularData && this.isStale(popularData)) {
          await this.getPopularItems(10);
        }
        
        // Refresh categories
        const categoriesKey = 'categories';
        const categoriesData = this.cache.get(categoriesKey);
        
        if (categoriesData && this.isStale(categoriesData)) {
          await this.getCategories();
        }
        
        console.log('🔄 Background refresh completed');
      } catch (error) {
        console.error('❌ Background refresh failed:', error);
      }
    }, this.cacheConfig.backgroundRefreshInterval);
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Log performance metrics periodically
    setInterval(() => {
      const metrics = this.getPerformanceMetrics();
      console.log('📊 Menu Cache Performance:', metrics);
    }, 60000); // Every minute
  }

  /**
   * Log performance metrics
   */
  logPerformance(type, startTime) {
    const duration = performance.now() - startTime;
    
    if (duration > 100) { // Log slow operations
      console.log(`⚠️ Slow ${type}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      cacheSize: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
      hitRate: this.calculateHitRate(),
      avgAccessTime: this.calculateAverageAccessTime()
    };
  }

  /**
   * Estimate memory usage
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    this.cache.forEach((value) => {
      totalSize += JSON.stringify(value.data).length;
    });
    
    return (totalSize / 1024 / 1024).toFixed(2) + ' MB';
  }

  /**
   * Calculate cache hit rate
   */
  calculateHitRate() {
    const totalAccess = Array.from(this.accessFrequency.values())
      .reduce((sum, freq) => sum + freq, 0);
    
    const networkHits = totalAccess - this.cache.size;
    
    return totalAccess > 0 ? ((this.cache.size / totalAccess) * 100).toFixed(2) + '%' : '0%';
  }

  /**
   * Calculate average access time
   */
  calculateAverageAccessTime() {
    // This would need to be implemented with actual timing data
    return 'N/A';
  }

  /**
   * Persist cache to localStorage
   */
  persistCache() {
    try {
      const persistData = {
        cache: Array.from(this.cache.entries()),
        lastAccessTime: Array.from(this.lastAccessTime.entries()),
        accessFrequency: Array.from(this.accessFrequency.entries()),
        timestamp: Date.now()
      };
      
      localStorage.setItem('pos-menu-cache', JSON.stringify(persistData));
    } catch (error) {
      console.error('❌ Failed to persist cache:', error);
    }
  }

  /**
   * Load persisted cache from localStorage
   */
  async loadPersistedCache() {
    try {
      const persisted = localStorage.getItem('pos-menu-cache');
      
      if (persisted) {
        const data = JSON.parse(persisted);
        
        // Restore cache (only if not too old)
        if (Date.now() - data.timestamp < this.cacheConfig.maxAge) {
          this.cache = new Map(data.cache);
          this.lastAccessTime = new Map(data.lastAccessTime);
          this.accessFrequency = new Map(data.accessFrequency);
          
          console.log('✅ Loaded persisted cache from localStorage');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load persisted cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.lastAccessTime.clear();
    this.accessFrequency.clear();
    localStorage.removeItem('pos-menu-cache');
    console.log('🗑️ Menu cache cleared');
  }

  /**
   * Warm up cache with common queries
   */
  async warmUpCache() {
    console.log('🔥 Warming up menu cache...');
    
    try {
      await Promise.all([
        this.getMenuItems(),
        this.getCategories(),
        this.getPopularItems(20)
      ]);
      
      console.log('✅ Menu cache warmed up');
    } catch (error) {
      console.error('❌ Cache warm-up failed:', error);
    }
  }
}

// Create singleton instance
const instantMenuCache = new InstantMenuCache();

export default instantMenuCache;
export { InstantMenuCache };
