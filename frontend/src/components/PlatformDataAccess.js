// ✅ Platform-Specific Data Access Component
// Unified interface for Web, Desktop, and Mobile data access

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Smartphone, Monitor, Globe, Database, HardDrive, 
  Download, Upload, RefreshCw, Settings, Info,
  Wifi, WifiOff, Battery, Cpu, MemoryStick,
  FolderOpen, FileText, Copy, Trash2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { platformStorage } from '../utils/platformStorage';

const PlatformDataAccess = ({ className = '' }) => {
  const [platform, setPlatform] = useState('web');
  const [storageInfo, setStorageInfo] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [data, setData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initializePlatformData();
  }, []);

  const initializePlatformData = async () => {
    setLoading(true);
    try {
      // Detect platform
      const detectedPlatform = detectPlatform();
      setPlatform(detectedPlatform);
      
      // Get storage information
      const info = await platformStorage.getStorageInfo();
      setStorageInfo(info);
      
      // Get device information (mobile only)
      if (detectedPlatform === 'capacitor') {
        try {
          const deviceInfo = await platformStorage.storage.getDeviceInfo();
          setDeviceInfo(deviceInfo);
        } catch (error) {
          console.warn('Failed to get device info:', error);
        }
      }
      
      // Load sample data
      await loadPlatformData();
      
    } catch (error) {
      console.error('Failed to initialize platform data:', error);
      toast.error('Failed to initialize platform data');
    } finally {
      setLoading(false);
    }
  };

  const detectPlatform = () => {
    if (window.electronAPI || window.__ELECTRON__) {
      return 'electron';
    } else if (window.Capacitor) {
      return 'capacitor';
    } else {
      return 'web';
    }
  };

  const loadPlatformData = async () => {
    try {
      const keys = await platformStorage.keys();
      const loadedData = {};
      
      for (const key of keys.slice(0, 20)) { // Limit to first 20 keys
        try {
          const value = await platformStorage.get(key);
          loadedData[key] = value;
        } catch (error) {
          console.warn(`Failed to load key ${key}:`, error);
        }
      }
      
      setData(loadedData);
    } catch (error) {
      console.error('Failed to load platform data:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        platform,
        timestamp: new Date().toISOString(),
        storageInfo,
        deviceInfo,
        data
      };
      
      const filename = `billbytekot_${platform}_export_${new Date().toISOString().split('T')[0]}.json`;
      
      const result = await platformStorage.exportToFile(exportData, filename);
      
      if (result.success) {
        toast.success(`Data exported successfully to ${result.path}`);
      } else {
        toast.error('Export failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    }
  };

  const handleImportData = async (file) => {
    try {
      const result = await platformStorage.importFromFile(file);
      
      if (result.success || result.data) {
        const importedData = result.data || result;
        
        // Import data based on platform
        if (importedData.data) {
          for (const [key, value] of Object.entries(importedData.data)) {
            await platformStorage.set(key, value);
          }
        }
        
        toast.success('Data imported successfully');
        await loadPlatformData();
      } else {
        toast.error('Import failed: ' + (result.error || 'Invalid file format'));
      }
    } catch (error) {
      toast.error('Import failed: ' + error.message);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      return;
    }
    
    try {
      await platformStorage.clear();
      toast.success('All data cleared successfully');
      await loadPlatformData();
    } catch (error) {
      toast.error('Failed to clear data: ' + error.message);
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'electron':
        return Monitor;
      case 'capacitor':
        return Smartphone;
      default:
        return Globe;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'electron':
        return 'Desktop (Electron)';
      case 'capacitor':
        return 'Mobile (Capacitor)';
      default:
        return 'Web Browser';
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredData = Object.entries(data).filter(([key, value]) => {
    if (!searchQuery) return true;
    return key.toLowerCase().includes(searchQuery.toLowerCase()) ||
           JSON.stringify(value).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const PlatformIcon = getPlatformIcon();

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading platform data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Platform Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <PlatformIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getPlatformName()}</h2>
            <p className="text-gray-600">Platform-specific data access and management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={initializePlatformData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Platform Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Storage Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="w-5 h-5 text-blue-600" />
              Storage Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {storageInfo ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{storageInfo.type}</span>
                </div>
                
                {storageInfo.fileSizeMB && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{storageInfo.fileSizeMB} MB</span>
                  </div>
                )}
                
                {storageInfo.used && storageInfo.available && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usage:</span>
                    <span className="font-medium">
                      {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.available)}
                    </span>
                  </div>
                )}
                
                {storageInfo.totalRecords && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Records:</span>
                    <span className="font-medium">{storageInfo.totalRecords}</span>
                  </div>
                )}
                
                {storageInfo.dbPath && (
                  <div className="text-xs text-gray-500 break-all">
                    Path: {storageInfo.dbPath}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                No storage info available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Info (Mobile only) */}
        {platform === 'capacitor' && deviceInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="w-5 h-5 text-green-600" />
                Device Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Model:</span>
                <span className="font-medium">{deviceInfo.model}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">OS:</span>
                <span className="font-medium">{deviceInfo.operatingSystem} {deviceInfo.osVersion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Manufacturer:</span>
                <span className="font-medium">{deviceInfo.manufacturer}</span>
              </div>
              {deviceInfo.memUsed && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Memory:</span>
                  <span className="font-medium">{formatBytes(deviceInfo.memUsed)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Platform Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-purple-600" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">SQL Support:</span>
              <span className={`font-medium ${platform !== 'web' ? 'text-green-600' : 'text-red-600'}`}>
                {platform !== 'web' ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">File Export:</span>
              <span className="font-medium text-green-600">Yes</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Offline Storage:</span>
              <span className="font-medium text-green-600">Yes</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Background Sync:</span>
              <span className="font-medium text-green-600">Yes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Browser */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Data Browser
              <span className="text-sm font-normal text-gray-500">
                ({Object.keys(data).length} items)
              </span>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Button variant="destructive" size="sm" onClick={handleClearAllData}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No data found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredData.map(([key, value]) => (
                <div key={key} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{key}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(value, null, 2));
                        toast.success('Copied to clipboard');
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded font-mono max-h-32 overflow-y-auto">
                    {typeof value === 'object' 
                      ? JSON.stringify(value, null, 2)
                      : String(value)
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-file">Select file to import:</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json,.kot"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleImportData(file);
                  }
                }}
                className="mt-1"
              />
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Supported formats:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• JSON files (.json)</li>
                    <li>• KOT backup files (.kot)</li>
                    <li>• Platform-specific exports</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformDataAccess;