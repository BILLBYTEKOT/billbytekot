// ✅ Sync Control Panel - Staff interface for managing sync on/off
// Prevents data mismatch by requiring proper sync disable before offline mode

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { 
  Wifi, WifiOff, AlertTriangle, CheckCircle, Clock, 
  User, Shield, Database, RefreshCw, SyncOff, Info,
  AlertCircle, Lock, Unlock
} from 'lucide-react';
import { toast } from 'sonner';
import { syncController } from '../utils/syncController';

const SyncControlPanel = ({ user }) => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);

  useEffect(() => {
    loadSyncStatus();
    loadAuditTrail();
    
    // Listen for sync status changes
    const unsubscribe = syncController.addListener((status) => {
      setSyncStatus(status);
    });
    
    return unsubscribe;
  }, []);

  const loadSyncStatus = () => {
    const status = syncController.getSyncStatusDetails();
    setSyncStatus(status);
  };

  const loadAuditTrail = () => {
    const trail = syncController.getAuditTrail();
    setAuditTrail(trail);
  };

  const handleSyncToggle = async (enable) => {
    if (!syncStatus?.canControlSync) {
      toast.error('You do not have permission to control sync settings');
      return;
    }

    setPendingAction(enable ? 'enable' : 'disable');
    setShowConfirmDialog(true);
  };

  const confirmSyncAction = async () => {
    setLoading(true);
    setShowConfirmDialog(false);
    
    try {
      let result;
      
      if (pendingAction === 'enable') {
        result = await syncController.enableSync(user?.id);
        toast.success(result.message);
      } else {
        if (!disableReason.trim()) {
          toast.error('Please provide a reason for disabling sync');
          setLoading(false);
          return;
        }
        
        result = await syncController.disableSync(user?.id, disableReason);
        toast.success(result.message);
        setDisableReason('');
      }
      
      loadSyncStatus();
      loadAuditTrail();
      
    } catch (error) {
      console.error('Sync control error:', error);
      toast.error(error.message || 'Failed to change sync settings');
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const handleForcSync = async () => {
    setLoading(true);
    
    try {
      const result = await syncController.forceSyncAllData();
      
      if (result.success) {
        toast.success(`Successfully synced ${result.synced} items`);
      } else {
        toast.error(`Sync failed: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Force sync error:', error);
      toast.error('Failed to force sync data');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyEnable = async () => {
    if (!window.confirm('Emergency sync enable will force online mode. Continue?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await syncController.emergencyEnableSync();
      toast.success(result.message);
      loadSyncStatus();
      loadAuditTrail();
    } catch (error) {
      toast.error('Emergency sync enable failed');
    } finally {
      setLoading(false);
    }
  };

  if (!syncStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading sync status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Status Overview */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {syncStatus.syncEnabled ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            Sync Control Panel
            {!syncStatus.canControlSync && (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Sync Status</span>
              </div>
              <div className="flex items-center gap-2">
                {syncStatus.syncEnabled ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">Enabled (Online Mode)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-red-700 font-medium">Disabled (Offline Allowed)</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Your Access</span>
              </div>
              <div className="flex items-center gap-2">
                {syncStatus.canControlSync ? (
                  <>
                    <Unlock className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">Can Control Sync</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">View Only</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">Role: {syncStatus.staffRole}</p>
            </div>
          </div>

          {/* Warning Messages */}
          {!syncStatus.syncEnabled && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Offline Mode Active</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Data is being saved locally only. Changes will not sync to server until sync is re-enabled.
                    This can cause data mismatches if multiple devices are used.
                  </p>
                  {syncStatus.disableReason && (
                    <p className="text-sm text-yellow-700 mt-2">
                      <strong>Reason:</strong> {syncStatus.disableReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {syncStatus.syncEnabled && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Online Mode Active</h4>
                  <p className="text-sm text-green-700 mt-1">
                    All data is being synchronized with the server in real-time. 
                    This ensures data consistency across all devices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sync Controls */}
          {syncStatus.canControlSync && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Data Synchronization</h4>
                  <p className="text-sm text-gray-600">
                    {syncStatus.syncEnabled 
                      ? 'Disable to allow offline mode (requires data sync first)'
                      : 'Enable to force online mode and sync all data'
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    checked={syncStatus.syncEnabled}
                    onCheckedChange={handleSyncToggle}
                    disabled={loading}
                  />
                  <span className="text-sm font-medium">
                    {syncStatus.syncEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Disable Reason Input */}
              {!syncStatus.syncEnabled && pendingAction === 'disable' && (
                <div className="space-y-2">
                  <Label htmlFor="disable-reason">Reason for disabling sync:</Label>
                  <Input
                    id="disable-reason"
                    value={disableReason}
                    onChange={(e) => setDisableReason(e.target.value)}
                    placeholder="e.g., Network issues, maintenance, testing..."
                    className="w-full"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleForcSync}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Force Sync Now
                </Button>
                
                {!syncStatus.syncEnabled && (
                  <Button
                    onClick={handleEmergencyEnable}
                    disabled={loading}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Emergency Enable
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Last Changed Info */}
          {syncStatus.lastChangedAt && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  Last changed by {syncStatus.lastChangedBy} on{' '}
                  {syncStatus.lastChangedAt.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Sync History
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {auditTrail.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No sync history available</p>
          ) : (
            <div className="space-y-2">
              {auditTrail.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{entry.key}</span>
                  <span className="text-sm text-gray-600">{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {pendingAction === 'enable' ? 'Enable Sync?' : 'Disable Sync?'}
            </h3>
            
            <div className="mb-4">
              {pendingAction === 'enable' ? (
                <p className="text-gray-600">
                  This will enable online mode and sync all local data to the server immediately.
                  Offline mode will be disabled.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    This will first sync all pending data to the server, then disable sync.
                    Offline mode will be allowed after successful sync.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-reason">Reason (required):</Label>
                    <Input
                      id="confirm-reason"
                      value={disableReason}
                      onChange={(e) => setDisableReason(e.target.value)}
                      placeholder="Why are you disabling sync?"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPendingAction(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSyncAction}
                disabled={loading || (pendingAction === 'disable' && !disableReason.trim())}
                variant={pendingAction === 'enable' ? 'default' : 'destructive'}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  pendingAction === 'enable' ? 'Enable Sync' : 'Disable Sync'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncControlPanel;