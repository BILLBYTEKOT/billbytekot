// ✅ Data Access Panel - View and manage internal app data
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Database, Search, Eye, Download, Copy, Trash2, 
  RefreshCw, Filter, ChevronDown, ChevronRight,
  FileText, Calendar, User, ShoppingCart, Settings,
  HardDrive, Wifi, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { offlineStorage } from '../utils/offlineStorage';
import { useOfflineStats } from '../hooks/useOfflineData';

const DataAccessPanel = ({ className = '' }) => {
  const [activeDataType, setActiveDataType] = useState('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedData, setSelectedData] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    status: 'all',
    limit: 100
  });

  const offlineStats = useOfflineStats();

  const dataTypes = [
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: ShoppingCart, 
      color: 'blue',
      description: 'All order data including items, status, and customer info'
    },
    { 
      id: 'menu_items', 
      label: 'Menu Items', 
      icon: FileText, 
      color: 'green',
      description: 'Menu items with prices, categories, and availability'
    },
    { 
      id: 'tables', 
      label: 'Tables', 
      icon: Database, 
      color: 'purple',
      description: 'Table configuration and current status'
    },
    { 
      id: 'dashboard_stats', 
      label: 'Dashboard Stats', 
      icon: Calendar, 
      color: 'orange',
      description: 'Daily statistics and performance metrics'
    },
    { 
      id: 'business_settings', 
      label: 'Settings', 
      icon: Settings, 
      color: 'gray',
      description: 'Business configuration and preferences'
    },
    { 
      id: 'sync_queue', 
      label: 'Sync Queue', 
      icon: RefreshCw, 
      color: 'red',
      description: 'Pending synchronization operations'
    }
  ];

  useEffect(() => {
    loadData();
  }, [activeDataType, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      let data = [];
      
      switch (activeDataType) {
        case 'orders':
          data = await offlineStorage.getOrders();
          break;
        case 'menu_items':
          data = await offlineStorage.getMenuItems();
          break;
        case 'tables':
          data = await offlineStorage.getTables();
          break;
        case 'dashboard_stats':
          const stats = await offlineStorage.getDashboardStats();
          data = stats ? [stats] : [];
          break;
        case 'business_settings':
          const settings = await offlineStorage.getBusinessSettings();
          data = Object.keys(settings).length > 0 ? [settings] : [];
          break;
        case 'sync_queue':
          data = await offlineStorage.getSyncQueue();
          break;
        default:
          data = [];
      }

      // Apply filters
      if (filters.dateRange !== 'all' && data.length > 0 && data[0].created_at) {
        const now = new Date();
        const filterDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            filterDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        data = data.filter(item => new Date(item.created_at) >= filterDate);
      }

      if (filters.status !== 'all' && data.length > 0 && data[0].status) {
        data = data.filter(item => item.status === filters.status);
      }

      // Apply search
      if (searchQuery) {
        data = data.filter(item => 
          JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply limit
      if (filters.limit && data.length > filters.limit) {
        data = data.slice(0, filters.limit);
      }

      setSelectedData(data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const dataToExport = {
        type: activeDataType,
        timestamp: new Date().toISOString(),
        count: selectedData.length,
        data: selectedData
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeDataType}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${activeDataType} data exported successfully!`);
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    }
  };

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(selectedData, null, 2));
      toast.success('Data copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy data');
    }
  };

  const handleClearData = async () => {
    if (!window.confirm(`Are you sure you want to clear all ${activeDataType} data? This cannot be undone.`)) {
      return;
    }

    try {
      switch (activeDataType) {
        case 'orders':
          await offlineStorage.performDBOperation('orders', 'clear');
          break;
        case 'menu_items':
          await offlineStorage.performDBOperation('menu_items', 'clear');
          break;
        case 'tables':
          await offlineStorage.performDBOperation('tables', 'clear');
          break;
        case 'dashboard_stats':
          await offlineStorage.performDBOperation('dashboard_stats', 'clear');
          break;
        case 'business_settings':
          await offlineStorage.performDBOperation('business_settings', 'clear');
          break;
        case 'sync_queue':
          await offlineStorage.performDBOperation('sync_queue', 'clear');
          break;
      }

      toast.success(`${activeDataType} data cleared successfully!`);
      loadData();
    } catch (error) {
      toast.error('Failed to clear data: ' + error.message);
    }
  };

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return value.toString();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      preparing: 'text-blue-600 bg-blue-100',
      ready: 'text-green-600 bg-green-100',
      completed: 'text-gray-600 bg-gray-100',
      cancelled: 'text-red-600 bg-red-100',
      synced: 'text-green-600 bg-green-100',
      available: 'text-green-600 bg-green-100',
      occupied: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const currentDataType = dataTypes.find(dt => dt.id === activeDataType);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Internal Data Access</h2>
          <p className="text-gray-600 mt-1">View and manage all internal app data</p>
        </div>
        
        {/* Storage Stats */}
        {offlineStats && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>{offlineStats.storage?.orders || 0} orders</span>
            </div>
            <div className="flex items-center gap-1">
              <Database className="w-4 h-4 text-green-600" />
              <span>{offlineStats.storage?.menuItems || 0} items</span>
            </div>
            <div className="flex items-center gap-1">
              {offlineStats.storage?.isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-600" />
              )}
              <span>{offlineStats.storage?.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Data Type Selector */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dataTypes.map((dataType) => {
                const Icon = dataType.icon;
                const isActive = activeDataType === dataType.id;
                
                return (
                  <button
                    key={dataType.id}
                    onClick={() => setActiveDataType(dataType.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isActive 
                        ? `bg-${dataType.color}-100 text-${dataType.color}-700 border-${dataType.color}-200 border`
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? `text-${dataType.color}-600` : 'text-gray-500'}`} />
                      <div className="flex-1">
                        <div className="font-medium">{dataType.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{dataType.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Data Viewer */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {currentDataType && <currentDataType.icon className={`w-5 h-5 text-${currentDataType.color}-600`} />}
                  {currentDataType?.label} Data
                  <span className="text-sm font-normal text-gray-500">
                    ({selectedData.length} items)
                  </span>
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyData}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleClearData}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-sm font-medium mb-1 block">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search data..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                {activeDataType === 'orders' && (
                  <>
                    <div>
                      <Label className="text-sm font-medium mb-1 block">Date Range</Label>
                      <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-1 block">Status</Label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </>
                )}
                
                <div>
                  <Label className="text-sm font-medium mb-1 block">Limit</Label>
                  <select
                    value={filters.limit}
                    onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value={50}>50 items</option>
                    <option value={100}>100 items</option>
                    <option value={500}>500 items</option>
                    <option value={0}>All items</option>
                  </select>
                </div>
              </div>

              {/* Data Display */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
                    <p className="text-gray-500">Loading data...</p>
                  </div>
                ) : selectedData.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">No data found</p>
                  </div>
                ) : (
                  selectedData.map((item, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div 
                        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleExpanded(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedItems.has(index) ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            
                            <div>
                              <div className="font-medium">
                                {item.id || item.name || `Item ${index + 1}`}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                {item.created_at && (
                                  <span>{new Date(item.created_at).toLocaleString()}</span>
                                )}
                                {item.status && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                    {item.status}
                                  </span>
                                )}
                                {item.sync_status && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.sync_status)}`}>
                                    {item.sync_status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            {Object.keys(item).length} fields
                          </div>
                        </div>
                      </div>
                      
                      {expandedItems.has(index) && (
                        <div className="p-4 border-t bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(item).map(([key, value]) => (
                              <div key={key} className="space-y-1">
                                <div className="text-sm font-medium text-gray-700">{key}</div>
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded font-mono">
                                  {formatValue(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataAccessPanel;