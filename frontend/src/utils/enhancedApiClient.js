// ✅ Enhanced API Client with Offline-First Architecture
import { offlineStorage } from './offlineStorage';

class EnhancedAPIClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://billbytekot-backend.onrender.com/api';
    this.isOnline = navigator.onLine;
    this.requestQueue = [];
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    
    // Initialize network listeners
    this.initNetworkListeners();
    
    // Initialize offline storage
    this.storage = offlineStorage;
  }

  initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - processing queued requests');
      this.processRequestQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Gone offline - switching to offline mode');
    });
  }

  // Enhanced fetch with offline fallback
  async enhancedFetch(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    if (!this.isOnline) {
      console.log('📴 Offline mode - using local storage');
      return this.handleOfflineRequest(url, options);
    }
    
    try {
      const response = await this.fetchWithRetry(fullUrl, options);
      
      // Cache successful responses
      if (response.ok && options.method === 'GET') {
        await this.cacheResponse(url, response.clone());
      }
      
      return response;
    } catch (error) {
      console.warn('🔄 Network request failed, falling back to offline storage:', error);
      return this.handleOfflineRequest(url, options);
    }
  }

  async fetchWithRetry(url, options, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (attempt < this.retryAttempts && error.name !== 'AbortError') {
        console.log(`🔄 Retry attempt ${attempt} for ${url}`);
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  async handleOfflineRequest(url, options) {
    const method = options.method || 'GET';
    
    switch (method.toUpperCase()) {
      case 'GET':
        return this.handleOfflineGet(url);
      case 'POST':
        return this.handleOfflinePost(url, options);
      case 'PUT':
        return this.handleOfflinePut(url, options);
      case 'DELETE':
        return this.handleOfflineDelete(url, options);
      default:
        throw new Error(`Offline mode doesn't support ${method} requests`);
    }
  }

  async handleOfflineGet(url) {
    try {
      let data = null;
      
      if (url.includes('/orders')) {
        if (url.includes('/today-bills')) {
          data = await this.storage.getOrders({ today: true, status: ['completed', 'cancelled'] });
        } else {
          data = await this.storage.getOrders({ status: ['pending', 'preparing', 'ready'] });
        }
      } else if (url.includes('/menu')) {
        data = await this.storage.getMenuItems({ available: true });
      } else if (url.includes('/tables')) {
        data = await this.storage.getTables();
      } else if (url.includes('/dashboard')) {
        data = await this.storage.getDashboardStats();
      } else if (url.includes('/business/settings')) {
        const settings = await this.storage.getBusinessSettings();
        data = { business_settings: settings };
      }
      
      return {
        ok: true,
        status: 200,
        json: async () => data,
        clone: () => ({ json: async () => data })
      };
    } catch (error) {
      console.error('Offline GET request failed:', error);
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Offline storage error' })
      };
    }
  }

  async handleOfflinePost(url, options) {
    try {
      const body = JSON.parse(options.body || '{}');
      
      if (url.includes('/orders')) {
        // Create new order offline
        const orderId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const order = {
          id: orderId,
          ...body,
          status: 'pending',
          created_at: new Date().toISOString(),
          total: body.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
        };
        
        await this.storage.saveOrder(order);
        
        return {
          ok: true,
          status: 201,
          json: async () => order
        };
      }
      
      // Queue other POST requests for later sync
      await this.storage.addToSyncQueue('post_request', { url, body }, 'normal');
      
      return {
        ok: true,
        status: 202,
        json: async () => ({ message: 'Request queued for sync' })
      };
    } catch (error) {
      console.error('Offline POST request failed:', error);
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Offline storage error' })
      };
    }
  }

  async handleOfflinePut(url, options) {
    try {
      const body = JSON.parse(options.body || '{}');
      
      if (url.includes('/orders/') && url.includes('/status')) {
        // Update order status offline
        const orderId = url.split('/orders/')[1].split('/status')[0];
        const status = new URLSearchParams(url.split('?')[1] || '').get('status');
        
        if (orderId && status) {
          await this.storage.updateOrderStatus(orderId, status);
          
          return {
            ok: true,
            status: 200,
            json: async () => ({ message: 'Status updated offline' })
          };
        }
      } else if (url.includes('/orders/')) {
        // Update entire order offline
        const orderId = url.split('/orders/')[1];
        const existingOrder = await this.storage.performDBOperation('orders', 'get', orderId);
        
        if (existingOrder) {
          const updatedOrder = { ...existingOrder, ...body };
          await this.storage.saveOrder(updatedOrder);
          
          return {
            ok: true,
            status: 200,
            json: async () => updatedOrder
          };
        }
      }
      
      // Queue other PUT requests for later sync
      await this.storage.addToSyncQueue('put_request', { url, body }, 'normal');
      
      return {
        ok: true,
        status: 202,
        json: async () => ({ message: 'Request queued for sync' })
      };
    } catch (error) {
      console.error('Offline PUT request failed:', error);
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Offline storage error' })
      };
    }
  }

  async handleOfflineDelete(url, options) {
    try {
      if (url.includes('/orders/')) {
        const orderId = url.split('/orders/')[1];
        await this.storage.performDBOperation('orders', 'delete', orderId);
        
        return {
          ok: true,
          status: 200,
          json: async () => ({ message: 'Order deleted offline' })
        };
      }
      
      // Queue other DELETE requests for later sync
      await this.storage.addToSyncQueue('delete_request', { url }, 'normal');
      
      return {
        ok: true,
        status: 202,
        json: async () => ({ message: 'Request queued for sync' })
      };
    } catch (error) {
      console.error('Offline DELETE request failed:', error);
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Offline storage error' })
      };
    }
  }

  async cacheResponse(url, response) {
    try {
      const data = await response.json();
      
      if (url.includes('/orders')) {
        if (url.includes('/today-bills')) {
          // Cache today's bills
          for (const order of data) {
            await this.storage.saveOrder(order);
          }
        } else {
          // Cache active orders
          for (const order of data) {
            await this.storage.saveOrder(order);
          }
        }
      } else if (url.includes('/menu')) {
        await this.storage.saveMenuItems(data);
      } else if (url.includes('/tables')) {
        await this.storage.saveTables(data);
      } else if (url.includes('/dashboard')) {
        await this.storage.saveDashboardStats(data);
      } else if (url.includes('/business/settings')) {
        await this.storage.saveBusinessSettings(data.business_settings || {});
      }
      
      console.log(`💾 Cached response for ${url}`);
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  async processRequestQueue() {
    const queue = await this.storage.getSyncQueue();
    
    for (const item of queue) {
      try {
        await this.processQueuedRequest(item);
        await this.storage.performDBOperation('sync_queue', 'delete', item.id);
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }

  async processQueuedRequest(item) {
    const { action, data } = item;
    
    switch (action) {
      case 'post_request':
        await this.enhancedFetch(data.url, {
          method: 'POST',
          body: JSON.stringify(data.body)
        });
        break;
      case 'put_request':
        await this.enhancedFetch(data.url, {
          method: 'PUT',
          body: JSON.stringify(data.body)
        });
        break;
      case 'delete_request':
        await this.enhancedFetch(data.url, {
          method: 'DELETE'
        });
        break;
    }
  }

  // Convenience methods
  async get(url, options = {}) {
    const response = await this.enhancedFetch(url, { ...options, method: 'GET' });
    return response.json();
  }

  async post(url, data, options = {}) {
    const response = await this.enhancedFetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async put(url, data, options = {}) {
    const response = await this.enhancedFetch(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async delete(url, options = {}) {
    const response = await this.enhancedFetch(url, { ...options, method: 'DELETE' });
    return response.json();
  }

  // Utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.requestQueue.length
    };
  }

  // Preload critical data
  async preloadCriticalData() {
    if (!this.isOnline) return;
    
    try {
      console.log('🚀 Preloading critical data...');
      
      // Preload in parallel for better performance
      await Promise.all([
        this.get('/orders'),
        this.get('/orders/today-bills'),
        this.get('/menu'),
        this.get('/tables'),
        this.get('/dashboard'),
        this.get('/business/settings')
      ]);
      
      console.log('✅ Critical data preloaded');
    } catch (error) {
      console.warn('Failed to preload critical data:', error);
    }
  }
}

// Export singleton instance
export const enhancedApiClient = new EnhancedAPIClient();
export default EnhancedAPIClient;