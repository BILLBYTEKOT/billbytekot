/**
 * Offline Indicator Component
 * Shows offline status and sync queue information
 */

import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Database, Smartphone, Monitor, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { useOfflineStorage } from '../hooks/useOfflineStorage';

const OfflineIndicator = ({ className = '' }) => {
  const { 
    isInitialized, 
    isOnline, 
    syncQueueCount, 
    forcSync, 
    getStorageInfo 
  } = useOfflineStorage();

  if (!isInitialized) {
    return null;
  }

  const storageInfo = getStorageInfo();
  const hasUnsyncedData = syncQueueCount > 0;

  const getPlatformIcon = () => {
    switch (storageInfo?.platform) {
      case 'Android':
        return <Smartphone className="w-3 h-3" />;
      case 'Desktop':
        return <Monitor className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (hasUnsyncedData) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (hasUnsyncedData) return `${syncQueueCount} pending`;
    return 'Online';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Main Status Indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
        
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-600" />
        )}
        
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
      </div>

      {/* Platform Indicator */}
      <div className="flex items-center gap-1">
        {getPlatformIcon()}
        <Database className="w-3 h-3 text-gray-500" />
      </div>

      {/* Sync Button (when there's pending data) */}
      {hasUnsyncedData && isOnline && (
        <Button
          variant="outline"
          size="sm"
          onClick={forcSync}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Sync
        </Button>
      )}

      {/* Offline Badge */}
      {!isOnline && (
        <Badge variant="destructive" className="text-xs">
          <CloudOff className="w-3 h-3 mr-1" />
          Offline Mode
        </Badge>
      )}

      {/* Sync Pending Badge */}
      {hasUnsyncedData && (
        <Badge variant="secondary" className="text-xs">
          <Cloud className="w-3 h-3 mr-1" />
          {syncQueueCount}
        </Badge>
      )}
    </div>
  );
};

// Detailed Offline Status Card
export const OfflineStatusCard = ({ className = '' }) => {
  const { 
    isInitialized, 
    isOnline, 
    syncQueueCount, 
    forcSync, 
    clearAllData,
    getStorageInfo 
  } = useOfflineStorage();

  if (!isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Database className="w-4 h-4" />
            <span>Offline storage not available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const storageInfo = getStorageInfo();

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Storage Status</h3>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
          </div>

          {/* Platform Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {storageInfo?.platform === 'Android' && <Smartphone className="w-4 h-4" />}
            {storageInfo?.platform === 'Desktop' && <Monitor className="w-4 h-4" />}
            {storageInfo?.platform === 'Web' && <Globe className="w-4 h-4" />}
            <span>Platform: {storageInfo?.platform || 'Unknown'}</span>
          </div>

          {/* Sync Queue Info */}
          {syncQueueCount > 0 && (
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Cloud className="w-4 h-4" />
                <span className="text-sm">
                  {syncQueueCount} item{syncQueueCount !== 1 ? 's' : ''} pending sync
                </span>
              </div>
              {isOnline && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={forcSync}
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Sync Now
                </Button>
              )}
            </div>
          )}

          {/* Offline Mode Info */}
          {!isOnline && (
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <Database className="w-4 h-4" />
                <span>Working offline - changes saved locally</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {syncQueueCount > 0 && isOnline && (
              <Button
                variant="outline"
                size="sm"
                onClick={forcSync}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Force Sync
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllData}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              <Database className="w-4 h-4 mr-2" />
              Clear Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineIndicator;