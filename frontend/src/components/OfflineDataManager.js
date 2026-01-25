// ✅ Offline Data Management Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Download, Upload, Trash2, RefreshCw, Database, 
  HardDrive, Wifi, WifiOff, Settings, AlertTriangle,
  CheckCircle, Clock, FileText, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useOfflineStats, useSyncStatus } from '../hooks/useOfflineData';
import { kotDataFormat } from '../utils/kotDataFormat';
import { dataSyncService } from '../utils/dataSyncService';
import { offlineStorage } from '../utils/offlineStorage';
import OfflineIndicator from './OfflineIndicator';

const OfflineDataManager = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [exportOptions, setExportOptions] = useState({
    includeOrders: true,
    includeMenu: true,
    includeTables: true,
    includeSettings: true,
    dateRange: null
  });
  const [importFile, setImportFile] = useState(null);
  const [exportStats, setExportStats] = useState(null);
  
  const offlineStats = useOfflineStats();
  const { syncStatus } = useSyncStatus();

  useEffect(() => {
    loadExportStats();
  }, []);

  const loadExportStats = async () => {
    try {
      const stats = await kotDataFormat.getExportStats();
      setExportStats(stats);
    } catch (error) {
      console.error('Failed to load export stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      await kotDataFormat.exportToKOT(exportOptions);
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      const result = await kotDataFormat.importFromKOT(importFile, {
        mergeStrategy: 'merge',
        validateData: true
      });
      
      toast.success(`Import completed! ${result.stats.orders + result.stats.menuItems + result.stats.tables} items imported`);
      setImportFile(null);
      loadExportStats();
    } catch (error) {
      toast.error('Import failed: ' + error.message);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      return;
    }

    try {
      await offlineStorage.clearAllData();
      toast.success('All offline data cleared');
      loadExportStats();
    } catch (error) {
      toast.error('Failed to clear data: ' + error.message);
    }
  };

  const handleForceSync = async () => {
    try {
      const success = await dataSyncService.forceSyncNow();
      if (success) {
        toast.success('Sync completed successfully!');
      }
    } catch (error) {
      toast.error('Sync failed: ' + error.message);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Database },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'import', label: 'Import', icon: Upload },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Offline Data Manager</h2>
          <p className="text-gray-600 mt-1">Manage your offline data and sync settings</p>
        </div>
        <OfflineIndicator showDetails={true} />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                Storage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {offlineStats ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {offlineStats.storage?.orders || 0}
                      </div>
                      <div className="text-sm text-gray-600">Orders</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {offlineStats.storage?.menuItems || 0}
                      </div>
                      <div className="text-sm text-gray-600">Menu Items</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {offlineStats.storage?.tables || 0}
                      </div>
                      <div className="text-sm text-gray-600">Tables</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {offlineStats.storage?.syncQueue || 0}
                      </div>
                      <div className="text-sm text-gray-600">Pending Sync</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Sync:</span>
                      <span className="font-medium">
                        {offlineStats.storage?.lastSync || 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium flex items-center gap-1 ${
                        offlineStats.storage?.isOnline ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {offlineStats.storage?.isOnline ? (
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
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  Loading statistics...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-600" />
                Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncStatus ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Connection</span>
                    <span className={`flex items-center gap-1 text-sm ${
                      syncStatus.isOnline ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {syncStatus.isOnline ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Online
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Offline
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Sync Status</span>
                    <span className={`flex items-center gap-1 text-sm ${
                      syncStatus.syncInProgress ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {syncStatus.syncInProgress ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Idle
                        </>
                      )}
                    </span>
                  </div>
                  
                  {syncStatus.pendingCount > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Pending Items</span>
                      <span className="text-sm font-bold text-blue-600">
                        {syncStatus.pendingCount}
                      </span>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleForceSync}
                    disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Force Sync Now
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  Loading sync status...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Options */}
            <div>
              <Label className="text-base font-medium mb-3 block">What to export:</Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'includeOrders', label: 'Orders', count: exportStats?.orders },
                  { key: 'includeMenu', label: 'Menu Items', count: exportStats?.menuItems },
                  { key: 'includeTables', label: 'Tables', count: exportStats?.tables },
                  { key: 'includeSettings', label: 'Settings', count: exportStats?.hasSettings ? 1 : 0 }
                ].map(({ key, label, count }) => (
                  <label key={key} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={exportOptions[key]}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="w-4 h-4 text-violet-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-gray-500">{count || 0} items</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Stats */}
            {exportStats && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Export Preview</span>
                </div>
                <div className="text-sm text-blue-700">
                  Total size: ~{formatBytes(exportStats.totalSize)}
                </div>
              </div>
            )}

            <Button onClick={handleExport} className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Export to .kot file
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="import-file" className="text-base font-medium mb-3 block">
                Select .kot file to import:
              </Label>
              <Input
                id="import-file"
                type="file"
                accept=".kot,.json"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="cursor-pointer"
              />
              {importFile && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">{importFile.name}</span>
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Size: {formatBytes(importFile.size)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">Import Notes:</div>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Existing data will be merged with imported data</li>
                    <li>• Newer data takes precedence in conflicts</li>
                    <li>• Import process may take a few minutes</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleImport} 
              disabled={!importFile}
              className="w-full" 
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Sync Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Auto Sync</div>
                  <div className="text-sm text-gray-600">Automatically sync when online</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-violet-600 rounded" />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Background Sync</div>
                  <div className="text-sm text-gray-600">Sync data in background</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-violet-600 rounded" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="font-medium text-red-800 mb-2">Clear All Offline Data</div>
                <div className="text-sm text-red-700 mb-4">
                  This will permanently delete all locally stored data. This action cannot be undone.
                </div>
                <Button 
                  onClick={handleClearData}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OfflineDataManager;