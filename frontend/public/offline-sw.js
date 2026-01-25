// ✅ Offline Service Worker for BillByteKOT
// Provides advanced caching and offline functionality

const CACHE_NAME = 'billbytekot-v1.2';
const OFFLINE_URL = '/offline.html';

// Resources to cache immediately
const PRECACHE_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html',
  // Add critical fonts and icons
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/menu$/,
  /\/api\/tables$/,
  /\/api\/business\/settings$/,
  /\/api\/dashboard$/,
  /\/api\/orders$/
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Precaching resources...');
        return cache.addAll(PRECACHE_RESOURCES);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
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

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with Cache Fallback
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    // Static assets - Cache First
    event.respondWith(handleStaticAssets(request));
  } else if (request.destination === 'document') {
    // HTML pages - Network First with Offline Fallback
    event.respondWith(handleDocumentRequest(request));
  } else {
    // Other resources - Cache First
    event.respondWith(handleOtherResources(request));
  }
});

// Network First strategy for API requests
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request, {
      timeout: 5000 // 5 second timeout
    });
    
    // Cache successful responses
    if (networkResponse.ok) {
      // Only cache GET requests for specific endpoints
      const shouldCache = API_CACHE_PATTERNS.some(pattern => 
        pattern.test(request.url)
      );
      
      if (shouldCache) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('🔄 Network failed, trying cache for:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'ServiceWorker-Cache');
      return response;
    }
    
    // No cache available, return error response
    return new Response(
      JSON.stringify({ 
        error: 'Offline - No cached data available',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache First strategy for static assets
async function handleStaticAssets(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Network First with Offline fallback for documents
async function handleDocumentRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
    
  } catch (error) {
    console.log('🔄 Network failed for document, serving offline page');
    
    const cache = await caches.open(CACHE_NAME);
    const offlineResponse = await cache.match(OFFLINE_URL);
    
    return offlineResponse || new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Cache First for other resources
async function handleOtherResources(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // For images, return a placeholder
    if (request.destination === 'image') {
      return new Response(
        '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" fill="#999">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

// Sync offline orders when connection is restored
async function syncOfflineOrders() {
  try {
    // This would integrate with your IndexedDB offline storage
    console.log('🔄 Syncing offline orders...');
    
    // Send message to main thread to trigger sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        action: 'sync-orders'
      });
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, action } = event.data;
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (type === 'CACHE_UPDATE') {
    // Force cache update
    event.waitUntil(updateCache());
  }
});

// Update cache with fresh data
async function updateCache() {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    await cache.addAll(PRECACHE_RESOURCES);
    console.log('✅ Cache updated successfully');
  } catch (error) {
    console.error('❌ Cache update failed:', error);
  }
}

// Periodic cache cleanup
setInterval(() => {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      if (cacheName !== CACHE_NAME) {
        caches.delete(cacheName);
      }
    });
  });
}, 24 * 60 * 60 * 1000); // Clean up daily

console.log('🚀 BillByteKOT Service Worker loaded');