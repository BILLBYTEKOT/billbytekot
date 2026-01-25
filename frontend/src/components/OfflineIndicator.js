// ✅ Offline Status Indicator Component
import React from 'react';
import { Wifi, WifiOff, RefreshCw, Database, Clock, AlertTriangle } from 'lucide-react';
import { useSyncStatus } from '../hooks/useOfflineData';

const OfflineIndicator = ({ className = '', showDetails = false }) => {
  const { syncStatus, loading } = useSyncStatus();
  
  if (loading || !syncStatus) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    );
  }
  
  const { isOnline, syncInProgress, pendingCount, lastSyncTime } = syncStatus;
  
  if (showDetails) {
    return (
      <div className={`bg-white rounded-lg border shadow-sm p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm text-gray-800">Connection Status</h3>
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-orange-600" />
          )}
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {pendingCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending sync:</span>
              <span className="font-medium text-blue-600 flex items-center gap-1">
                {syncInProgress && <RefreshCw className="w-3 h-3 animate-spin" />}
                {pendingCount} items
              </span>
            </div>
          )}
          
          {lastSyncTime && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last sync:</span>
              <span className="font-medium text-gray-700">
                {new Date(lastSyncTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}
          
          {!isOnline && (
            <div className="flex items-center gap-1 text-orange-600 bg-orange-50 rounded px-2 py-1">
              <Database className="w-3 h-3" />
              <span>Using cached data</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Compact indicator
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className} ${
      isOnline 
        ? 'bg-green-100 text-green-700' 
        : 'bg-orange-100 text-orange-700'
    }`}>
      {isOnline ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Online</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span>Offline</span>
        </>
      )}
      
      {pendingCount > 0 && (
        <>
          <span>•</span>
          <div className="flex items-center gap-1">
            {syncInProgress && <RefreshCw className="w-3 h-3 animate-spin" />}
            <span>{pendingCount} pending</span>
          </div>
        </>
      )}
    </div>
  );
};

// Sync Status Badge
export const SyncStatusBadge = ({ className = '' }) => {
  const { syncStatus } = useSyncStatus();
  
  if (!syncStatus) return null;
  
  const { syncInProgress, pendingCount } = syncStatus;
  
  if (!syncInProgress && pendingCount === 0) return null;
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium ${className}`}>
      <RefreshCw className={`w-3 h-3 ${syncInProgress ? 'animate-spin' : ''}`} />
      <span>
        {syncInProgress ? 'Syncing...' : `${pendingCount} pending`}
      </span>
    </div>
  );
};

// Network Status Toast
export const NetworkStatusToast = () => {
  const { syncStatus } = useSyncStatus();
  const [lastOnlineStatus, setLastOnlineStatus] = React.useState(navigator.onLine);
  
  React.useEffect(() => {
    if (syncStatus && syncStatus.isOnline !== lastOnlineStatus) {
      setLastOnlineStatus(syncStatus.isOnline);
      
      if (syncStatus.isOnline) {
        // Coming back online
        const pendingText = syncStatus.pendingCount > 0 
          ? ` - syncing ${syncStatus.pendingCount} items`
          : '';
        
        toast.success(`Back online${pendingText}`, {
          icon: <Wifi className="w-4 h-4" />,
          duration: 3000
        });
      } else {
        // Going offline
        toast.info('Working offline - data will sync when reconnected', {
          icon: <WifiOff className="w-4 h-4" />,
          duration: 4000
        });
      }
    }
  }, [syncStatus, lastOnlineStatus]);
  
  return null;
};

// Data Freshness Indicator
export const DataFreshnessIndicator = ({ lastUpdated, className = '' }) => {
  const [timeAgo, setTimeAgo] = React.useState('');
  
  React.useEffect(() => {
    if (!lastUpdated) return;
    
    const updateTimeAgo = () => {
      const now = new Date();
      const diff = now - new Date(lastUpdated);
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      if (minutes > 0) {
        setTimeAgo(`${minutes}m ago`);
      } else {
        setTimeAgo(`${seconds}s ago`);
      }
    };
    
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    
    return () => clearInterval(interval);
  }, [lastUpdated]);
  
  if (!lastUpdated) return null;
  
  const isStale = new Date() - new Date(lastUpdated) > 60000; // 1 minute
  
  return (
    <div className={`flex items-center gap-1 text-xs ${
      isStale ? 'text-orange-600' : 'text-gray-500'
    } ${className}`}>
      <Clock className="w-3 h-3" />
      <span>{timeAgo}</span>
      {isStale && <AlertTriangle className="w-3 h-3" />}
    </div>
  );
};

export default OfflineIndicator;