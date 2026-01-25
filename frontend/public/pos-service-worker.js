/**
 * Ultra-Fast POS Service Worker
 * Real-time data caching and instant access for Point of Sale operations
 * Better than Petpooja's architecture with advanced caching strategies
 */

const CACHE_NAME = 'pos-cache-v1';
const DATA_CACHE_NAME = 'pos-data-cache-v1';
const MENU_CACHE_NAME = 'pos-menu-cache-v1';

// Critical data that should always be available instantly
const CRITICAL_ENDPOINTS = [
  '/api/menu',
  '/api/tables',
  '/api/orders/active',
  '/api/business-settings',
  '/api/user/profile'
];

// Cache strategies for different data types
const CACHE_STRATEGIES = {
  // Menu items - cache first, network when stale
  menu: {
    strategy: 'cacheFirst',
    maxAge: 5 * 60 * 1000, // 5 minutes
    backgroundSync: true
  },
  // Orders - network first, cache as fallback
  orders: {
    strategy: 'networkFirst',
    maxAge: 30 * 1000, // 30 seconds
    backgroundSync: true
  },
  // Tables - network first with instant cache fallback
  tables: {
    strategy: 'networkFirst',
    maxAge: 10 * 1000, // 10 seconds
    backgroundSync: true
  },
  // Business settings - cache first, long TTL
  settings: {
    strategy: 'cacheFirst',
    maxAge: 30 * 60 * 1000, // 30 minutes
    backgroundSync: false
  }
};

// In-memory cache for ultra-fast access
let memoryCache = new Map();
let backgroundSyncQueue = [];
let isOnline = navigator.onLine;

// WebSocket connection for real-time updates
let wsConnection = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

// Performance metrics
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  avgResponseTime: 0,
  lastSyncTime: null
};

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🚀 POS Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/static/js/bundle.js',
          '/static/css/main.css',
          '/manifest.json'
        ]);
      })
      .then(() => {
        console.log('✅ Critical assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 POS Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== DATA_CACHE_NAME && 
                cacheName !== MENU_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Network status monitoring
self.addEventListener('online', () => {
  console.log('🌐 Back online - processing background sync queue');
  isOnline = true;
  processBackgroundSyncQueue();
  establishWebSocketConnection();
});

self.addEventListener('offline', () => {
  console.log('📴 Gone offline - enabling offline mode');
  isOnline = false;
});

// Fetch event - main request handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle API requests
  if (!url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Determine cache strategy based on endpoint
  const strategy = getCacheStrategy(url.pathname);
  
  if (strategy) {
    event.respondWith(handleRequest(request, strategy));
  }
});

// Get cache strategy for endpoint
function getCacheStrategy(pathname) {
  if (pathname.includes('/menu')) return CACHE_STRATEGIES.menu;
  if (pathname.includes('/orders')) return CACHE_STRATEGIES.orders;
  if (pathname.includes('/tables')) return CACHE_STRATEGIES.tables;
  if (pathname.includes('/settings') || pathname.includes('/business')) {
    return CACHE_STRATEGIES.settings;
  }
  return null;
}

// Handle requests based on strategy
async function handleRequest(request, strategy) {
  const startTime = performance.now();
  const cacheKey = generateCacheKey(request);
  
  try {
    switch (strategy.strategy) {
      case 'cacheFirst':
        return await cacheFirstStrategy(request, strategy, cacheKey, startTime);
      case 'networkFirst':
        return await networkFirstStrategy(request, strategy, cacheKey, startTime);
      default:
        return await networkFirstStrategy(request, strategy, cacheKey, startTime);
    }
  } catch (error) {
    console.error('❌ Request handling failed:', error);
    return await getCacheFallback(request, cacheKey);
  }
}

// Cache-first strategy - fastest for static data
async function cacheFirstStrategy(request, strategy, cacheKey, startTime) {
  // Check memory cache first (ultra-fast)
  const memoryData = memoryCache.get(cacheKey);
  if (memoryData && !isDataStale(memoryData, strategy.maxAge)) {
    performanceMetrics.cacheHits++;
    updateResponseTime(startTime);
    return new Response(JSON.stringify(memoryData.data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check disk cache
  const cachedResponse = await caches.open(DATA_CACHE_NAME)
    .then(cache => cache.match(cacheKey));
  
  if (cachedResponse) {
    const data = await cachedResponse.json();
    
    // Update memory cache
    memoryCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Background refresh if stale
    if (isDataStale({ timestamp: cachedResponse.headers.get('x-timestamp') }, strategy.maxAge)) {
      backgroundRefresh(request, cacheKey, strategy);
    }
    
    performanceMetrics.cacheHits++;
    updateResponseTime(startTime);
    return cachedResponse;
  }
  
  // Cache miss - fetch from network
  return await fetchAndCache(request, strategy, cacheKey, startTime);
}

// Network-first strategy - best for dynamic data
async function networkFirstStrategy(request, strategy, cacheKey, startTime) {
  if (isOnline) {
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        const clonedResponse = networkResponse.clone();
        const data = await clonedResponse.json();
        
        // Update both caches
        await updateCache(cacheKey, clonedResponse, strategy);
        memoryCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        performanceMetrics.networkRequests++;
        updateResponseTime(startTime);
        return networkResponse;
      }
    } catch (error) {
      console.log('🌐 Network failed, trying cache:', error);
    }
  }
  
  // Fallback to cache
  return await getCacheFallback(request, cacheKey);
}

// Fetch and cache response
async function fetchAndCache(request, strategy, cacheKey, startTime) {
  if (!isOnline) {
    throw new Error('Offline - cannot fetch');
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const clonedResponse = networkResponse.clone();
    const data = await clonedResponse.json();
    
    // Update caches
    await updateCache(cacheKey, clonedResponse, strategy);
    memoryCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    performanceMetrics.networkRequests++;
    updateResponseTime(startTime);
    
    // Notify all clients about data update
    notifyClients('dataUpdated', {
      endpoint: request.url,
      data,
      timestamp: Date.now()
    });
    
    return networkResponse;
  }
  
  throw new Error(`Network error: ${networkResponse.status}`);
}

// Update cache with response
async function updateCache(cacheKey, response, strategy) {
  const cache = await caches.open(DATA_CACHE_NAME);
  
  // Add timestamp header
  const headers = new Headers(response.headers);
  headers.set('x-timestamp', Date.now().toString());
  
  const cachedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
  
  await cache.put(cacheKey, cachedResponse);
  
  // Limit memory cache size
  if (memoryCache.size > 100) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
}

// Get cache fallback
async function getCacheFallback(request, cacheKey) {
  // Try memory cache first
  const memoryData = memoryCache.get(cacheKey);
  if (memoryData) {
    performanceMetrics.cacheHits++;
    return new Response(JSON.stringify(memoryData.data), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Cache': 'memory-fallback'
      }
    });
  }
  
  // Try disk cache
  const cachedResponse = await caches.open(DATA_CACHE_NAME)
    .then(cache => cache.match(cacheKey));
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }
  
  // Return offline fallback
  return new Response(JSON.stringify({ 
    error: 'Offline - no cached data available',
    offline: true 
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Background refresh for stale data
async function backgroundRefresh(request, cacheKey, strategy) {
  if (!isOnline || !strategy.backgroundSync) return;
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await updateCache(cacheKey, networkResponse.clone(), strategy);
      
      const data = await networkResponse.json();
      memoryCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      console.log('🔄 Background refresh completed for:', request.url);
    }
  } catch (error) {
    console.log('🔄 Background refresh failed:', error);
  }
}

// Generate cache key
function generateCacheKey(request) {
  const url = new URL(request.url);
  return `${url.pathname}${url.search}`;
}

// Check if data is stale
function isDataStale(data, maxAge) {
  if (!data.timestamp) return true;
  return (Date.now() - parseInt(data.timestamp)) > maxAge;
}

// Update response time metrics
function updateResponseTime(startTime) {
  const responseTime = performance.now() - startTime;
  
  if (performanceMetrics.avgResponseTime === 0) {
    performanceMetrics.avgResponseTime = responseTime;
  } else {
    performanceMetrics.avgResponseTime = 
      (performanceMetrics.avgResponseTime * 0.9) + (responseTime * 0.1);
  }
}

// Process background sync queue
async function processBackgroundSyncQueue() {
  if (backgroundSyncQueue.length === 0) return;
  
  console.log(`🔄 Processing ${backgroundSyncQueue.length} background sync items`);
  
  const queue = [...backgroundSyncQueue];
  backgroundSyncQueue = [];
  
  for (const item of queue) {
    try {
      await fetch(item.request);
      console.log('✅ Background sync completed for:', item.request.url);
    } catch (error) {
      console.error('❌ Background sync failed:', error);
      // Re-queue for later
      backgroundSyncQueue.push(item);
    }
  }
}

// Establish WebSocket connection for real-time updates
function establishWebSocketConnection() {
  if (!isOnline || wsConnection) return;
  
  try {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws`;
    
    wsConnection = new WebSocket(wsUrl);
    
    wsConnection.onopen = () => {
      console.log('🔌 POS WebSocket connected');
      reconnectAttempts = 0;
      performanceMetrics.lastSyncTime = Date.now();
    };
    
    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('❌ WebSocket message parsing failed:', error);
      }
    };
    
    wsConnection.onclose = () => {
      console.log('🔌 POS WebSocket disconnected');
      wsConnection = null;
      
      // Attempt reconnection
      if (reconnectAttempts < maxReconnectAttempts) {
        setTimeout(() => {
          reconnectAttempts++;
          establishWebSocketConnection();
        }, Math.pow(2, reconnectAttempts) * 1000);
      }
    };
    
    wsConnection.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
    
  } catch (error) {
    console.error('❌ Failed to establish WebSocket connection:', error);
  }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'menu_update':
      updateMenuCache(data.payload);
      break;
    case 'order_update':
      updateOrderCache(data.payload);
      break;
    case 'table_update':
      updateTableCache(data.payload);
      break;
    case 'settings_update':
      updateSettingsCache(data.payload);
      break;
    default:
      console.log('📨 Unknown WebSocket message type:', data.type);
  }
  
  // Notify all clients
  notifyClients('realTimeUpdate', data);
}

// Update specific caches
async function updateMenuCache(menuData) {
  const cacheKey = '/api/menu';
  memoryCache.set(cacheKey, {
    data: menuData,
    timestamp: Date.now()
  });
  
  const response = new Response(JSON.stringify(menuData), {
    headers: { 
      'Content-Type': 'application/json',
      'x-timestamp': Date.now().toString()
    }
  });
  
  const cache = await caches.open(DATA_CACHE_NAME);
  await cache.put(cacheKey, response);
  
  console.log('🍽️ Menu cache updated via WebSocket');
}

async function updateOrderCache(orderData) {
  const cacheKey = `/api/orders/active`;
  
  // Update memory cache
  const existing = memoryCache.get(cacheKey);
  if (existing) {
    const updatedOrders = existing.data.map(order => 
      order.id === orderData.id ? orderData : order
    );
    
    memoryCache.set(cacheKey, {
      data: updatedOrders,
      timestamp: Date.now()
    });
  }
  
  console.log('📋 Order cache updated via WebSocket');
}

async function updateTableCache(tableData) {
  const cacheKey = '/api/tables';
  
  // Update memory cache
  const existing = memoryCache.get(cacheKey);
  if (existing) {
    const updatedTables = existing.data.map(table => 
      table.id === tableData.id ? tableData : table
    );
    
    memoryCache.set(cacheKey, {
      data: updatedTables,
      timestamp: Date.now()
    });
  }
  
  console.log('🪑 Table cache updated via WebSocket');
}

async function updateSettingsCache(settingsData) {
  const cacheKey = '/api/business-settings';
  
  memoryCache.set(cacheKey, {
    data: settingsData,
    timestamp: Date.now()
  });
  
  const response = new Response(JSON.stringify(settingsData), {
    headers: { 
      'Content-Type': 'application/json',
      'x-timestamp': Date.now().toString()
    }
  });
  
  const cache = await caches.open(DATA_CACHE_NAME);
  await cache.put(cacheKey, response);
  
  console.log('⚙️ Settings cache updated via WebSocket');
}

// Notify all clients
async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    if (client.url.includes(self.location.origin)) {
      client.postMessage({
        type,
        data,
        timestamp: Date.now()
      });
    }
  });
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'GET_METRICS':
      event.ports[0].postMessage({
        type: 'METRICS',
        data: {
          ...performanceMetrics,
          memoryCacheSize: memoryCache.size,
          backgroundSyncQueueSize: backgroundSyncQueue.length,
          isOnline
        }
      });
      break;
      
    case 'CLEAR_CACHE':
      clearCaches(data);
      break;
      
    case 'PRELOAD_DATA':
      preloadCriticalData();
      break;
      
    case 'SYNC_NOW':
      processBackgroundSyncQueue();
      break;
  }
});

// Clear caches
async function clearCaches(options = {}) {
  if (options.all) {
    await caches.delete(DATA_CACHE_NAME);
    memoryCache.clear();
    console.log('🗑️ All caches cleared');
  } else if (options.endpoint) {
    const cacheKey = options.endpoint;
    memoryCache.delete(cacheKey);
    
    const cache = await caches.open(DATA_CACHE_NAME);
    await cache.delete(cacheKey);
    
    console.log('🗑️ Cache cleared for:', options.endpoint);
  }
}

// Preload critical data
async function preloadCriticalData() {
  console.log('🚀 Preloading critical POS data...');
  
  const criticalEndpoints = [
    '/api/menu',
    '/api/tables',
    '/api/business-settings'
  ];
  
  for (const endpoint of criticalEndpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const cacheKey = endpoint;
        const strategy = getCacheStrategy(endpoint);
        
        await updateCache(cacheKey, response, strategy);
        
        const data = await response.json();
        memoryCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        console.log('✅ Preloaded:', endpoint);
      }
    } catch (error) {
      console.error('❌ Failed to preload:', endpoint, error);
    }
  }
  
  console.log('🎉 Critical data preloading completed');
}

// Initialize service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT') {
    console.log('🚀 POS Service Worker initialized');
    establishWebSocketConnection();
    preloadCriticalData();
  }
});

// Auto-establish WebSocket when service worker starts
if (isOnline) {
  establishWebSocketConnection();
}
