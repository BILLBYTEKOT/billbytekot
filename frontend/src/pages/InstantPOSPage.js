/**
 * Instant POS Page
 * Complete one-click POS implementation with zero loading delays
 * Superior to Petpooja with ultra-fast performance and instant data access
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import InstantPOS from '../components/InstantPOS';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Zap, Activity, Clock, Database, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import posDataManager from '../utils/posDataManager';
import instantMenuCache from '../utils/instantMenuCache';

const InstantPOSPage = ({ user }) => {
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);

  // Initialize the ultra-fast POS system
  useEffect(() => {
    initializeInstantPOS();
    setupNetworkListeners();
    
    return () => {
      cleanup();
    };
  }, []);

  /**
   * Initialize the instant POS system with preloading
   */
  const initializeInstantPOS = async () => {
    const startTime = performance.now();
    
    try {
      console.log('🚀 Initializing Instant POS System...');
      
      // Warm up all caches for instant access
      await Promise.all([
        posDataManager.preloadCriticalData(),
        instantMenuCache.warmUpCache()
      ]);
      
      // Get initial performance metrics
      const metrics = posDataManager.getMetrics();
      setPerformanceMetrics(metrics);
      setLastSyncTime(metrics.lastSyncTime);
      
      const initTime = performance.now() - startTime;
      console.log(`⚡ Instant POS initialized in ${initTime.toFixed(2)}ms`);
      
      setIsInitialized(true);
      toast.success('POS System Ready - Instant Access Enabled');
      
    } catch (error) {
      console.error('❌ Failed to initialize Instant POS:', error);
      toast.error('Failed to initialize POS system');
    }
  };

  /**
   * Setup network status listeners
   */
  const setupNetworkListeners = () => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - Real-time sync enabled');
      
      // Trigger background sync when coming back online
      posDataManager.forceSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline mode - Working with cached data');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  /**
   * Cleanup resources
   */
  const cleanup = () => {
    // Any cleanup needed
  };

  /**
   * Force sync all data
   */
  const handleForceSync = async () => {
    try {
      toast.loading('Syncing data...');
      await posDataManager.forceSync();
      
      const metrics = posDataManager.getMetrics();
      setPerformanceMetrics(metrics);
      setLastSyncTime(metrics.lastSyncTime);
      
      toast.success('Data synchronized successfully');
    } catch (error) {
      console.error('❌ Sync failed:', error);
      toast.error('Failed to sync data');
    }
  };

  /**
   * Clear all caches
   */
  const handleClearCaches = async () => {
    try {
      await posDataManager.clearCaches();
      instantMenuCache.clearCache();
      
      toast.success('Caches cleared successfully');
      
      // Reinitialize
      await initializeInstantPOS();
    } catch (error) {
      console.error('❌ Failed to clear caches:', error);
      toast.error('Failed to clear caches');
    }
  };

  /**
   * Get performance status color
   */
  const getPerformanceColor = (avgResponseTime) => {
    if (avgResponseTime < 50) return 'text-green-600';
    if (avgResponseTime < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Format last sync time
   */
  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  /**
   * Performance metrics panel
   */
  const PerformancePanel = () => {
    if (!showMetrics || !performanceMetrics) return null;

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance Metrics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Cache Hits</p>
              <p className="text-lg font-bold text-green-600">
                {performanceMetrics.cacheHits}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Avg Response</p>
              <p className={`text-lg font-bold ${getPerformanceColor(performanceMetrics.avgResponseTime)}`}>
                {performanceMetrics.avgResponseTime.toFixed(2)}ms
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Memory Cache</p>
              <p className="text-lg font-bold text-blue-600">
                {performanceMetrics.memoryCacheSize} items
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Last Sync</p>
              <p className="text-lg font-bold text-purple-600">
                {formatLastSync(lastSyncTime)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  /**
   * Status bar component
   */
  const StatusBar = () => (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-4">
        <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Offline
            </>
          )}
        </Badge>
        
        <Badge variant="outline" className="flex items-center gap-1">
          <Database className="w-3 h-3" />
          Instant Cache
        </Badge>
        
        <Badge variant="outline" className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Ultra-Fast
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMetrics(!showMetrics)}
        >
          {showMetrics ? 'Hide' : 'Show'} Metrics
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleForceSync}
          disabled={!isOnline}
        >
          Sync Now
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCaches}
        >
          Clear Cache
        </Button>
      </div>
    </div>
  );

  if (!isInitialized) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Initializing Instant POS</h2>
            <p className="text-gray-600">Loading ultra-fast data access system...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="w-8 h-8 text-yellow-500" />
              Instant POS System
            </h1>
            <p className="text-gray-600">
              One-click Point of Sale with zero loading delays - Better than Petpooja
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar />

        {/* Performance Panel */}
        <PerformancePanel />

        {/* Main POS Component */}
        <InstantPOS user={user} onOrderComplete={(order) => {
          console.log('Order completed:', order);
          toast.success(`Order #${order.id} completed successfully!`);
        }} />

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Instant Access</h3>
              <p className="text-sm text-gray-600">
                Menu items load in milliseconds with intelligent caching
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Real-time Sync</h3>
              <p className="text-sm text-gray-600">
                Live updates via WebSocket with offline support
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Smart Caching</h3>
              <p className="text-sm text-gray-600">
                Multi-layer caching for ultra-fast performance
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default InstantPOSPage;
