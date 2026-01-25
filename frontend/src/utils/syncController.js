// ✅ Sync Controller - Manages sync on/off with staff permissions
// Prevents data mismatch by controlling when offline mode is allowed

class SyncController {
  constructor() {
    this.syncEnabled = this.getSyncStatus();
    this.offlineAllowed = false;
    this.listeners = [];
    this.staffPermissions = this.getStaffPermissions();
    
    // Initialize sync status
    this.initializeSyncController();
  }

  initializeSyncController() {
    // Check if sync is properly disabled before allowing offline mode
    if (!this.syncEnabled) {
      this.offlineAllowed = true;
      console.log('🔄 Sync disabled - Offline mode allowed');
    } else {
      this.offlineAllowed = false;
      console.log('🌐 Sync enabled - Online mode only');
    }
    
    this.notifyListeners();
  }

  // Get current sync status from storage
  getSyncStatus() {
    try {
      const status = localStorage.getItem('billbytekot_sync_enabled');
      return status !== null ? JSON.parse(status) : true; // Default: sync enabled
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return true; // Default: sync enabled for safety
    }
  }

  // Get staff permissions for sync control
  getStaffPermissions() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        canControlSync: user.role === 'admin' || user.role === 'manager',
        canViewSyncStatus: true,
        userId: user.id,
        role: user.role
      };
    } catch (error) {
      console.error('Failed to get staff permissions:', error);
      return {
        canControlSync: false,
        canViewSyncStatus: true,
        userId: null,
        role: 'staff'
      };
    }
  }

  // Enable sync (online mode only)
  async enableSync(staffId = null) {
    if (!this.staffPermissions.canControlSync) {
      throw new Error('Insufficient permissions to control sync');
    }

    try {
      this.syncEnabled = true;
      this.offlineAllowed = false;
      
      // Save to storage
      localStorage.setItem('billbytekot_sync_enabled', 'true');
      localStorage.setItem('billbytekot_sync_changed_by', staffId || this.staffPermissions.userId);
      localStorage.setItem('billbytekot_sync_changed_at', new Date().toISOString());
      
      // Force sync all pending data immediately
      await this.forceSyncAllData();
      
      console.log('🌐 Sync ENABLED - Online mode only');
      this.notifyListeners();
      
      return {
        success: true,
        message: 'Sync enabled successfully. All data will be synchronized with server.',
        syncEnabled: true,
        offlineAllowed: false
      };
    } catch (error) {
      console.error('Failed to enable sync:', error);
      throw error;
    }
  }

  // Disable sync (allow offline mode)
  async disableSync(staffId = null, reason = '') {
    if (!this.staffPermissions.canControlSync) {
      throw new Error('Insufficient permissions to control sync');
    }

    try {
      // First, ensure all data is synced before disabling
      const syncResult = await this.forceSyncAllData();
      
      if (!syncResult.success) {
        throw new Error('Cannot disable sync: Failed to sync all data. Please ensure internet connection and try again.');
      }

      this.syncEnabled = false;
      this.offlineAllowed = true;
      
      // Save to storage with audit trail
      localStorage.setItem('billbytekot_sync_enabled', 'false');
      localStorage.setItem('billbytekot_sync_changed_by', staffId || this.staffPermissions.userId);
      localStorage.setItem('billbytekot_sync_changed_at', new Date().toISOString());
      localStorage.setItem('billbytekot_sync_disable_reason', reason);
      
      console.log('📴 Sync DISABLED - Offline mode allowed');
      this.notifyListeners();
      
      return {
        success: true,
        message: 'Sync disabled successfully. Offline mode is now available.',
        syncEnabled: false,
        offlineAllowed: true
      };
    } catch (error) {
      console.error('Failed to disable sync:', error);
      throw error;
    }
  }

  // Force sync all pending data
  async forceSyncAllData() {
    try {
      console.log('🔄 Force syncing all data...');
      
      // Import sync services
      const { offlineDataManager } = await import('./offlineDataManager');
      const { dataSyncService } = await import('./dataSyncService');
      
      // Get all pending sync items
      const pendingItems = await offlineDataManager.getPendingSyncItems();
      
      if (pendingItems.length === 0) {
        console.log('✅ No pending sync items');
        return { success: true, synced: 0 };
      }
      
      console.log(`📤 Syncing ${pendingItems.length} pending items...`);
      
      // Sync all items
      let syncedCount = 0;
      const errors = [];
      
      for (const item of pendingItems) {
        try {
          await dataSyncService.syncItem(item);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          errors.push({ item: item.id, error: error.message });
        }
      }
      
      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} items failed to sync:`, errors);
        return {
          success: false,
          synced: syncedCount,
          failed: errors.length,
          errors
        };
      }
      
      console.log(`✅ Successfully synced ${syncedCount} items`);
      return { success: true, synced: syncedCount };
      
    } catch (error) {
      console.error('Force sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if offline mode is allowed
  isOfflineAllowed() {
    return this.offlineAllowed && !this.syncEnabled;
  }

  // Check if sync is enabled
  isSyncEnabled() {
    return this.syncEnabled;
  }

  // Get sync status with details
  getSyncStatusDetails() {
    const changedBy = localStorage.getItem('billbytekot_sync_changed_by');
    const changedAt = localStorage.getItem('billbytekot_sync_changed_at');
    const disableReason = localStorage.getItem('billbytekot_sync_disable_reason');
    
    return {
      syncEnabled: this.syncEnabled,
      offlineAllowed: this.offlineAllowed,
      canControlSync: this.staffPermissions.canControlSync,
      staffRole: this.staffPermissions.role,
      lastChangedBy: changedBy,
      lastChangedAt: changedAt ? new Date(changedAt) : null,
      disableReason: disableReason || null,
      currentUser: this.staffPermissions.userId
    };
  }

  // Add listener for sync status changes
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners of sync status changes
  notifyListeners() {
    const status = this.getSyncStatusDetails();
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  // Validate data operation based on sync status
  validateDataOperation(operation, data = null) {
    const status = this.getSyncStatusDetails();
    
    // If sync is enabled, all operations must go through server
    if (status.syncEnabled) {
      return {
        allowed: true,
        mode: 'online',
        message: 'Operation will be performed online with server sync'
      };
    }
    
    // If sync is disabled, offline operations are allowed
    if (status.offlineAllowed) {
      return {
        allowed: true,
        mode: 'offline',
        message: 'Operation will be performed offline (sync disabled)'
      };
    }
    
    // Default: require online mode
    return {
      allowed: false,
      mode: 'blocked',
      message: 'Operation blocked: Sync status unclear'
    };
  }

  // Emergency sync enable (for critical situations)
  async emergencyEnableSync() {
    console.warn('🚨 Emergency sync enable triggered');
    
    this.syncEnabled = true;
    this.offlineAllowed = false;
    
    localStorage.setItem('billbytekot_sync_enabled', 'true');
    localStorage.setItem('billbytekot_sync_changed_by', 'EMERGENCY');
    localStorage.setItem('billbytekot_sync_changed_at', new Date().toISOString());
    localStorage.setItem('billbytekot_sync_disable_reason', '');
    
    this.notifyListeners();
    
    return {
      success: true,
      message: 'Emergency sync enabled. All operations will be online only.'
    };
  }

  // Get audit trail
  getAuditTrail() {
    try {
      const trail = [];
      
      // Get sync change history from localStorage
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('billbytekot_sync_')
      );
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        trail.push({
          key: key.replace('billbytekot_sync_', ''),
          value,
          timestamp: key.includes('changed_at') ? new Date(value) : null
        });
      });
      
      return trail;
    } catch (error) {
      console.error('Failed to get audit trail:', error);
      return [];
    }
  }
}

// Export singleton instance
export const syncController = new SyncController();
export default SyncController;