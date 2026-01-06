import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import {
  Clock, CheckCircle, Printer, AlertTriangle, ChefHat, Timer, Bell,
  RefreshCw, Volume2, VolumeX, Flame, Eye, X, Play,
  Maximize, Minimize, Utensils, Coffee, AlertCircle, Grid3X3, List, Zap, Truck
} from 'lucide-react';
import { printKOT as printKOTUtil } from '../utils/printUtils';

const KitchenPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchBusinessSettings();
    const interval = autoRefresh ? setInterval(fetchOrders, 5000) : null;
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      interval && clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [autoRefresh]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      setBusinessSettings(response.data.business_settings);
    } catch (error) {
      console.error('Failed to fetch business settings', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const activeOrders = response.data.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
      const sorted = activeOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      if (soundEnabled && orders.length > 0) {
        const newOrders = sorted.filter(o => o.status === 'pending' && !orders.find(old => old.id === o.id));
        if (newOrders.length > 0) playNotificationSound();
      }
      
      setOrders(sorted);
      setStats({
        pending: sorted.filter(o => o.status === 'pending').length,
        preparing: sorted.filter(o => o.status === 'preparing').length,
        ready: sorted.filter(o => o.status === 'ready').length
      });
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6djHhxeYaRnZ2Ui3x0fIqWnpuPgXZ0gI2bnJaIe3V6h5OamZOGe3d8iZWZl5GEenh9i5aZlpCDeXl+jJeZlY+CeXl/jZeZlI6BeHmAjpeYk42Ad3mBj5eYko2AdnmCkJeXkYx/dnmDkZeXkIt+dnqEkpeWj4p9dXqFk5eVjol8dXuGlJeUjYh7dHuHlZeTjId6dHyIlpeSi4Z5dH2Jl5aRioV4dH6KmJaQiYR3dH+LmJWPiIN2dICMmZWOh4J1dIGNmZSNhoF0dIKOmpSMhYB0dIOPmpOLhH9zdISQm5KKg350dIWRm5GJgn1zdYaSm5CIgXxzdoeT');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      toast.success(status === 'preparing' ? '🔥 Cooking started!' : status === 'ready' ? '✅ Ready for pickup!' : '🎉 Order served!');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getUrgencyLevel = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes > 20) return 'critical';
    if (minutes > 10) return 'warning';
    return 'normal';
  };

  const formatWaitTime = (date) => {
    const totalMinutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (totalMinutes < 0) return '0m';
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  const printKOT = (order) => {
    try {
      printKOTUtil(order, businessSettings);
      toast.success('KOT printed!');
    } catch (error) {
      toast.error('Failed to print KOT');
    }
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  const waitTimeStats = (() => {
    if (orders.length === 0) return { avg: 0, min: 0, max: 0, status: 'good' };
    const waitTimes = orders.map(o => Math.floor((new Date() - new Date(o.created_at)) / 60000));
    const avg = Math.round(waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length);
    let status = 'good';
    if (avg > 20) status = 'critical';
    else if (avg > 10) status = 'warning';
    return { avg, min: Math.min(...waitTimes), max: Math.max(...waitTimes), status };
  })();

  // Enhanced Order Card Component
  const OrderCard = ({ order }) => {
    const urgency = getUrgencyLevel(order.created_at);
    const waitTime = formatWaitTime(order.created_at);
    const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);

    const statusConfig = {
      pending: { bg: 'from-amber-500 to-orange-500', icon: Bell, label: 'NEW', glow: 'shadow-amber-500/30' },
      preparing: { bg: 'from-blue-500 to-cyan-500', icon: Flame, label: 'COOKING', glow: 'shadow-blue-500/30' },
      ready: { bg: 'from-emerald-500 to-green-500', icon: CheckCircle, label: 'READY', glow: 'shadow-emerald-500/30' }
    };
    const config = statusConfig[order.status];
    const StatusIcon = config.icon;

    const orderTypeConfig = {
      dine_in: { icon: Utensils, label: 'Dine In', color: 'bg-blue-100 text-blue-700' },
      takeaway: { icon: Coffee, label: 'Takeaway', color: 'bg-purple-100 text-purple-700' },
      delivery: { icon: Truck, label: 'Delivery', color: 'bg-pink-100 text-pink-700' }
    };
    const orderType = orderTypeConfig[order.order_type] || orderTypeConfig.dine_in;
    const OrderTypeIcon = orderType.icon;

    return (
      <div className={`relative rounded-2xl overflow-hidden shadow-xl ${config.glow} shadow-lg transition-all hover:scale-[1.02] ${urgency === 'critical' ? 'animate-pulse ring-2 ring-red-500' : ''}`}>
        {/* Status Header */}
        <div className={`bg-gradient-to-r ${config.bg} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <StatusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tight">
                {order.table_number ? `Table ${order.table_number}` : 'Counter'}
              </h3>
              <p className="text-white/70 text-xs font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold">
              {config.label}
            </span>
            <div className={`mt-1 flex items-center justify-end gap-1 ${urgency === 'critical' ? 'text-red-200' : 'text-white/80'}`}>
              <Clock className="w-3.5 h-3.5" />
              <span className="font-bold text-sm">{waitTime}</span>
              {urgency === 'critical' && <AlertCircle className="w-4 h-4 text-red-300 animate-bounce" />}
            </div>
          </div>
        </div>

        {/* Order Content */}
        <div className="bg-white p-4">
          {/* Order Type & Customer */}
          <div className="flex items-center justify-between mb-3">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${orderType.color}`}>
              <OrderTypeIcon className="w-3.5 h-3.5" />
              {orderType.label}
            </div>
            {order.customer_name && (
              <span className="text-gray-500 text-xs">👤 {order.customer_name}</span>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {order.items.map((item, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-2.5 rounded-xl ${urgency === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center font-black text-sm">
                  {item.quantity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  {item.notes && (
                    <div className="flex items-center gap-1 mt-1 text-orange-600 text-xs">
                      <Flame className="w-3 h-3" />
                      <span className="font-medium">{item.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Stats */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">Items: <strong className="text-violet-600">{totalItems}</strong></span>
              {order.waiter_name && <span className="text-gray-500">Server: <strong>{order.waiter_name}</strong></span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            {order.status === 'pending' && (
              <Button onClick={() => handleStatusChange(order.id, 'preparing')} className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-bold text-sm">
                <Play className="w-4 h-4 mr-2" /> START COOKING
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button onClick={() => handleStatusChange(order.id, 'ready')} className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 font-bold text-sm">
                <CheckCircle className="w-4 h-4 mr-2" /> MARK READY
              </Button>
            )}
            {order.status === 'ready' && (
              <Button onClick={() => handleStatusChange(order.id, 'completed')} className="flex-1 h-12 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 font-bold text-sm">
                <CheckCircle className="w-4 h-4 mr-2" /> SERVED
              </Button>
            )}
            <Button variant="outline" onClick={() => printKOT(order)} className="h-12 px-4 border-2">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => setSelectedOrder(order)} className="h-12 px-4 border-2">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <Layout user={user}>
      <div className={`space-y-4 ${isFullscreen ? 'p-4 bg-slate-900 min-h-screen' : ''}`} data-testid="kitchen-page">
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isFullscreen ? 'text-white' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isFullscreen ? 'bg-orange-600' : 'bg-gradient-to-br from-orange-500 to-red-500'} shadow-lg`}>
              <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Kitchen Display
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-sm ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                {autoRefresh && (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex rounded-xl overflow-hidden border-2 ${isFullscreen ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm font-medium ${viewMode === 'grid' ? 'bg-violet-600 text-white' : isFullscreen ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-violet-600 text-white' : isFullscreen ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={() => setAutoRefresh(!autoRefresh)} className={`h-9 ${autoRefresh ? 'bg-green-600 hover:bg-green-700' : ''}`}>
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSoundEnabled(!soundEnabled)} className={`h-9 ${isFullscreen ? 'border-gray-700 text-white' : ''}`}>
              {soundEnabled ? <Volume2 className="w-4 h-4 text-green-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleManualRefresh} className={`h-9 ${isFullscreen ? 'border-gray-700 text-white' : ''}`} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-violet-600' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen} className={`h-9 ${isFullscreen ? 'bg-violet-600 border-violet-600 text-white' : 'bg-violet-100 border-violet-300 text-violet-700'}`}>
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`rounded-2xl p-4 ${stats.pending > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500 ring-2 ring-amber-300/50' : 'bg-gradient-to-br from-amber-500 to-orange-500'} text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">Pending</p>
                <p className="text-4xl sm:text-5xl font-black mt-1">{stats.pending}</p>
              </div>
              <Bell className={`w-10 h-10 sm:w-12 sm:h-12 opacity-40 ${stats.pending > 0 ? 'animate-bounce' : ''}`} />
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Cooking</p>
                <p className="text-4xl sm:text-5xl font-black mt-1">{stats.preparing}</p>
              </div>
              <Flame className="w-10 h-10 sm:w-12 sm:h-12 opacity-40" />
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Ready</p>
                <p className="text-4xl sm:text-5xl font-black mt-1">{stats.ready}</p>
              </div>
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 opacity-40" />
            </div>
          </div>
          <div className={`rounded-2xl p-4 ${waitTimeStats.status === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-600 ring-2 ring-red-300 animate-pulse' : waitTimeStats.status === 'warning' ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-violet-500 to-purple-500'} text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wide ${waitTimeStats.status === 'critical' ? 'text-red-100' : waitTimeStats.status === 'warning' ? 'text-orange-100' : 'text-violet-100'}`}>
                  Avg Wait {waitTimeStats.status === 'critical' && '⚠️'}
                </p>
                <p className="text-4xl sm:text-5xl font-black mt-1">{waitTimeStats.avg}<span className="text-xl">m</span></p>
              </div>
              <Clock className={`w-10 h-10 sm:w-12 sm:h-12 opacity-40 ${waitTimeStats.status === 'critical' ? 'animate-bounce' : ''}`} />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`flex gap-1 p-1.5 rounded-2xl ${isFullscreen ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {[
            { id: 'all', label: 'All Orders', count: orders.length, color: 'violet' },
            { id: 'pending', label: 'Pending', count: stats.pending, color: 'amber' },
            { id: 'preparing', label: 'Cooking', count: stats.preparing, color: 'blue' },
            { id: 'ready', label: 'Ready', count: stats.ready, color: 'emerald' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`flex-1 px-3 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
                filter === tab.id
                  ? `bg-${tab.color}-600 text-white shadow-lg`
                  : isFullscreen ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-white'
              }`}>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === 'all' ? 'All' : tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${filter === tab.id ? 'bg-white/20' : isFullscreen ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'flex flex-col gap-4'}`}>
          {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.length === 0 && (
            <div className={`col-span-full text-center py-16 ${isFullscreen ? 'text-gray-500' : ''}`}>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isFullscreen ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <ChefHat className={`w-10 h-10 ${isFullscreen ? 'text-gray-600' : 'text-gray-300'}`} />
              </div>
              <p className={`text-xl font-bold ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                No {filter === 'all' ? 'active' : filter} orders
              </p>
              <p className={`mt-2 ${isFullscreen ? 'text-gray-600' : 'text-gray-400'}`}>
                Orders will appear here automatically
              </p>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setSelectedOrder(null)}>
            <Card className="w-full sm:max-w-lg border-0 shadow-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black">
                      {selectedOrder.table_number ? `Table ${selectedOrder.table_number}` : 'Counter Order'}
                    </CardTitle>
                    <p className="text-violet-200 text-sm font-mono">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)} className="text-white hover:bg-white/20">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">Server</p>
                    <p className="font-bold">{selectedOrder.waiter_name || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">Customer</p>
                    <p className="font-bold">{selectedOrder.customer_name || 'Walk-in'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">Time</p>
                    <p className="font-bold">{new Date(selectedOrder.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">Wait Time</p>
                    <p className="font-bold text-violet-600">{formatWaitTime(selectedOrder.created_at)}</p>
                  </div>
                </div>
                <div>
                  <p className="font-bold mb-3 flex items-center gap-2">
                    <Utensils className="w-4 h-4" /> Items ({selectedOrder.items.length})
                  </p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-sm">{item.quantity}</span>
                        <div className="flex-1">
                          <p className="font-semibold">{item.name}</p>
                          {item.notes && <p className="text-orange-600 text-sm flex items-center gap-1"><Flame className="w-3 h-3" />{item.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => printKOT(selectedOrder)} className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-500">
                    <Printer className="w-4 h-4 mr-2" /> Print KOT
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedOrder(null)} className="h-12 px-6">Close</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default KitchenPage;
