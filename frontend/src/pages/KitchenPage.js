import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { 
  Clock, CheckCircle, Printer, AlertTriangle, ChefHat, Timer, Bell,
  RefreshCw, Volume2, VolumeX, Filter, Flame, Eye, X, Play, Pause,
  Maximize, Minimize, Utensils, Coffee, AlertCircle
} from 'lucide-react';
import { printKOT as printKOTUtil, getPrintSettings, generateKOTContent } from '../utils/printUtils';

const KitchenPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchOrders();
    fetchBusinessSettings();
    const interval = autoRefresh ? setInterval(fetchOrders, 5000) : null;
    // Update clock every second
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      interval && clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [autoRefresh]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
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
      
      // Check for new orders and play sound
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
      toast.success(`Order ${status === 'preparing' ? 'started' : status === 'ready' ? 'ready for pickup' : 'completed'}!`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getTimeSince = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };

  const getUrgencyLevel = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes > 20) return 'critical';
    if (minutes > 10) return 'warning';
    return 'normal';
  };

  // Format wait time in a readable way
  const formatWaitTime = (date) => {
    const totalMinutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (totalMinutes < 0) return '0m';
    if (totalMinutes < 60) return `${totalMinutes}m`;
    if (totalMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    // More than 24 hours - show days
    const days = Math.floor(totalMinutes / 1440);
    return `${days}d+`;
  };

  const printKOT = (order) => {
    try {
      // Use centralized print utility with global settings
      printKOTUtil(order, businessSettings);
      toast.success('KOT ready for printing!');
    } catch (error) {
      console.error('Failed to print KOT:', error);
      toast.error('Failed to print KOT');
    }
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  // Calculate average wait time
  const avgWaitTime = orders.length > 0 
    ? Math.round(orders.reduce((sum, o) => sum + Math.floor((new Date() - new Date(o.created_at)) / 60000), 0) / orders.length)
    : 0;

  const OrderCard = ({ order }) => {
    const urgency = getUrgencyLevel(order.created_at);
    const waitTime = formatWaitTime(order.created_at);
    
    const urgencyStyles = {
      critical: {
        border: 'border-l-red-500',
        bg: 'bg-gradient-to-br from-red-50 to-red-100',
        pulse: 'animate-pulse',
        badge: 'bg-red-600 text-white',
        icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
      },
      warning: {
        border: 'border-l-orange-500',
        bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
        pulse: '',
        badge: 'bg-orange-500 text-white',
        icon: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
      },
      normal: {
        border: order.status === 'pending' ? 'border-l-yellow-500' : order.status === 'preparing' ? 'border-l-blue-500' : 'border-l-green-500',
        bg: order.status === 'pending' ? 'bg-yellow-50' : order.status === 'preparing' ? 'bg-blue-50' : 'bg-green-50',
        pulse: '',
        badge: order.status === 'pending' ? 'bg-yellow-500 text-white' : order.status === 'preparing' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white',
        icon: null
      }
    };

    const style = urgencyStyles[urgency];

    return (
      <Card className={`border-0 shadow-lg border-l-4 ${style.border} ${style.bg} ${style.pulse} transition-all overflow-hidden w-full max-w-full`}>
        <CardHeader className="pb-2 px-3 sm:px-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${order.status === 'pending' ? 'bg-yellow-200' : order.status === 'preparing' ? 'bg-blue-200' : 'bg-green-200'}`}>
                <ChefHat className={`w-5 h-5 sm:w-8 sm:h-8 ${order.status === 'pending' ? 'text-yellow-700' : order.status === 'preparing' ? 'text-blue-700' : 'text-green-700'}`} />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <CardTitle className="text-lg sm:text-2xl font-black tracking-tight truncate">
                  Table #{order.table_number}
                </CardTitle>
                <p className="text-[10px] sm:text-xs text-gray-500 font-mono truncate">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase whitespace-nowrap ${style.badge}`}>
                {order.status}
              </span>
              <div className={`mt-1 flex items-center gap-1 whitespace-nowrap ${urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-orange-600' : 'text-gray-500'}`}>
                {style.icon}
                <span className={`text-sm sm:text-lg font-bold ${urgency === 'critical' ? 'animate-pulse' : ''}`}>
                  {waitTime}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4 pb-3">
          {/* Order Type Badge */}
          {order.order_type && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
              order.order_type === 'dine_in' ? 'bg-blue-100 text-blue-800' :
              order.order_type === 'takeaway' ? 'bg-purple-100 text-purple-800' :
              'bg-pink-100 text-pink-800'
            }`}>
              {order.order_type === 'dine_in' && <><Utensils className="w-3 h-3" /> Dine In</>}
              {order.order_type === 'takeaway' && <><Coffee className="w-3 h-3" /> Takeaway</>}
              {order.order_type === 'delivery' && <><Bell className="w-3 h-3" /> Delivery</>}
            </div>
          )}

          {/* Items List */}
          <div className="space-y-1.5 max-h-[35vh] overflow-y-auto">
            {order.items.map((item, idx) => (
              <div key={idx} className={`p-2 rounded-lg ${urgency === 'critical' ? 'bg-red-100 border border-red-200' : 'bg-white/70'} border border-gray-100`}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-violet-600 text-white text-xs sm:text-sm font-bold flex-shrink-0">
                    {item.quantity}
                  </span>
                  <span className="font-bold text-sm sm:text-base text-gray-900 truncate flex-1">{item.name}</span>
                </div>
                {item.notes && (
                  <div className="mt-1 flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs sm:text-sm">
                    <Flame className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium truncate">{item.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total Items Count */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-600 font-medium text-xs sm:text-sm">Total Items:</span>
            <span className="text-lg sm:text-xl font-black text-violet-600">
              {order.items.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            {order.status === 'pending' && (
              <Button 
                onClick={() => handleStatusChange(order.id, 'preparing')} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 h-10 sm:h-12 text-xs sm:text-sm font-bold"
              >
                <Play className="w-4 h-4 mr-1" /> START
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button 
                onClick={() => handleStatusChange(order.id, 'ready')} 
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 h-10 sm:h-12 text-xs sm:text-sm font-bold"
              >
                <CheckCircle className="w-4 h-4 mr-1" /> READY
              </Button>
            )}
            {order.status === 'ready' && (
              <Button 
                onClick={() => handleStatusChange(order.id, 'completed')} 
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 h-10 sm:h-12 text-xs sm:text-sm font-bold"
              >
                <CheckCircle className="w-4 h-4 mr-1" /> SERVED
              </Button>
            )}
            <Button variant="outline" onClick={() => printKOT(order)} className="h-10 sm:h-12 px-2 sm:px-3 border">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => setSelectedOrder(order)} className="h-10 sm:h-12 px-2 sm:px-3 border">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout user={user}>
      <div className={`space-y-4 sm:space-y-6 overflow-x-hidden ${isFullscreen ? 'p-4 sm:p-6 bg-gray-900 min-h-screen' : ''}`} data-testid="kitchen-page">
        {/* Header - Mobile Responsive */}
        <div className={`flex flex-col gap-4 ${isFullscreen ? 'text-white' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${isFullscreen ? 'bg-orange-600' : 'bg-gradient-to-br from-orange-500 to-red-500'} shadow-lg`}>
                <ChefHat className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isFullscreen ? 'text-white' : ''}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Kitchen Display
                </h1>
                <p className={`text-xs sm:text-base mt-0.5 sm:mt-1 ${isFullscreen ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            {/* Mobile Quick Actions */}
            <div className="flex items-center gap-2 sm:hidden">
              <Button 
                variant={autoRefresh ? "default" : "outline"} 
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)} 
                className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleFullscreen}
                className={`${isFullscreen ? 'border-gray-700 text-white hover:bg-gray-800 bg-violet-600' : 'bg-violet-100 border-violet-300 text-violet-700'}`}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className={`flex rounded-lg overflow-hidden border ${isFullscreen ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-violet-600 text-white' 
                    : isFullscreen ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-violet-600 text-white' 
                    : isFullscreen ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
            <Button 
              variant={autoRefresh ? "default" : "outline"} 
              onClick={() => setAutoRefresh(!autoRefresh)} 
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
            <Button variant="outline" onClick={() => setSoundEnabled(!soundEnabled)} className={isFullscreen ? 'border-gray-700 text-white hover:bg-gray-800' : ''}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button variant="outline" onClick={fetchOrders} className={isFullscreen ? 'border-gray-700 text-white hover:bg-gray-800' : ''}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={toggleFullscreen}
              className={`${isFullscreen ? 'border-gray-700 text-white hover:bg-gray-800 bg-violet-600' : 'bg-violet-100 border-violet-300 text-violet-700 hover:bg-violet-200'}`}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Stats Bar - Mobile Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card className={`border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white ${stats.pending > 0 ? 'ring-2 sm:ring-4 ring-yellow-300 ring-opacity-50' : ''}`}>
            <CardContent className="p-3 sm:p-4 flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs sm:text-sm font-medium">Pending</p>
                <p className="text-3xl sm:text-5xl font-black">{stats.pending}</p>
              </div>
              <Bell className={`w-8 h-8 sm:w-14 sm:h-14 opacity-50 ${stats.pending > 0 ? 'animate-bounce' : ''}`} />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardContent className="p-3 sm:p-4 flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Preparing</p>
                <p className="text-3xl sm:text-5xl font-black">{stats.preparing}</p>
              </div>
              <Timer className="w-8 h-8 sm:w-14 sm:h-14 opacity-50" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <CardContent className="p-3 sm:p-4 flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm font-medium">Ready</p>
                <p className="text-3xl sm:text-5xl font-black">{stats.ready}</p>
              </div>
              <CheckCircle className="w-8 h-8 sm:w-14 sm:h-14 opacity-50" />
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-lg ${isFullscreen ? 'bg-gray-800' : 'bg-gradient-to-br from-violet-500 to-purple-500'} text-white`}>
            <CardContent className="p-3 sm:p-4 flex items-center justify-between">
              <div>
                <p className={`text-xs sm:text-sm font-medium ${isFullscreen ? 'text-gray-400' : 'text-violet-100'}`}>Avg Wait</p>
                <p className="text-3xl sm:text-5xl font-black">{avgWaitTime}<span className="text-lg sm:text-2xl">m</span></p>
              </div>
              <Clock className="w-8 h-8 sm:w-14 sm:h-14 opacity-50" />
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs - Mobile Scrollable */}
        <div className={`flex gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-lg sm:rounded-xl overflow-x-auto ${isFullscreen ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {[
            { id: 'all', label: 'All', count: orders.length, color: 'violet' },
            { id: 'pending', label: 'Pending', count: stats.pending, color: 'yellow' },
            { id: 'preparing', label: 'Cooking', count: stats.preparing, color: 'blue' },
            { id: 'ready', label: 'Ready', count: stats.ready, color: 'green' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`px-3 sm:px-5 py-2 sm:py-3 rounded-md sm:rounded-lg font-bold transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                filter === tab.id 
                  ? `bg-${tab.color}-600 text-white shadow-lg` 
                  : isFullscreen ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}>
              {tab.label}
              <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-black ${
                filter === tab.id ? 'bg-white/20' : isFullscreen ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Grid/List - Mobile Responsive */}
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4' 
            : 'flex flex-col gap-3'
        } overflow-hidden`}>
          {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.length === 0 && (
            <div className={`col-span-full text-center py-12 sm:py-20 ${isFullscreen ? 'text-gray-500' : ''}`}>
              <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center mb-4 sm:mb-6 ${isFullscreen ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <ChefHat className={`w-8 h-8 sm:w-12 sm:h-12 ${isFullscreen ? 'text-gray-600' : 'text-gray-300'}`} />
              </div>
              <p className={`text-xl sm:text-2xl font-bold ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
                No {filter === 'all' ? 'active' : filter} orders
              </p>
              <p className={`mt-2 text-sm sm:text-base ${isFullscreen ? 'text-gray-600' : 'text-gray-400'}`}>
                Orders will appear here automatically
              </p>
            </div>
          )}
        </div>

        {/* Order Detail Modal - Mobile Responsive */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setSelectedOrder(null)}>
            <Card className="w-full sm:max-w-lg border-0 shadow-2xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
                <CardTitle className="text-lg sm:text-xl">Order - Table #{selectedOrder.table_number}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div><p className="text-gray-500 text-xs sm:text-sm">Order ID</p><p className="font-mono font-bold text-sm sm:text-base">#{selectedOrder.id.slice(0, 8)}</p></div>
                  <div><p className="text-gray-500 text-xs sm:text-sm">Server</p><p className="font-bold text-sm sm:text-base">{selectedOrder.waiter_name}</p></div>
                  <div><p className="text-gray-500 text-xs sm:text-sm">Customer</p><p className="font-bold text-sm sm:text-base">{selectedOrder.customer_name || 'Walk-in'}</p></div>
                  <div><p className="text-gray-500 text-xs sm:text-sm">Time</p><p className="font-bold text-sm sm:text-base">{new Date(selectedOrder.created_at).toLocaleString()}</p></div>
                </div>
                <div className="border-t pt-4">
                  <p className="font-bold mb-2">Items ({selectedOrder.items.length})</p>
                  <div className="max-h-[30vh] overflow-y-auto">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                        <span className="font-medium">{item.quantity}× {item.name}</span>
                        {item.notes && <span className="text-orange-600 text-sm">{item.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => printKOT(selectedOrder)} className="flex-1 bg-orange-500 hover:bg-orange-600">
                    <Printer className="w-4 h-4 mr-2" /> Print KOT
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
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
