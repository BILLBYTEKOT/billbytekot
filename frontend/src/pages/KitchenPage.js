import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { 
  Clock, CheckCircle, Printer, AlertTriangle, ChefHat, Timer, Bell,
  RefreshCw, Volume2, VolumeX, Filter, Flame, Eye, X, Play, Pause
} from 'lucide-react';

const KitchenPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchBusinessSettings();
    const interval = autoRefresh ? setInterval(fetchOrders, 5000) : null;
    return () => interval && clearInterval(interval);
  }, [autoRefresh]);

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

  const printKOT = (order) => {
    const width = 48;
    const sep = '='.repeat(width);
    const dash = '-'.repeat(width);
    
    let kot = `${sep}\n`;
    kot += '*** KITCHEN ORDER TICKET ***'.padStart((width + 28) / 2).padEnd(width) + '\n';
    kot += `${sep}\n\n`;
    kot += `ORDER #: ${order.id.slice(0, 8).toUpperCase()}\n`;
    kot += `TABLE: ${order.table_number}\n`;
    kot += `SERVER: ${order.waiter_name}\n`;
    kot += `TIME: ${new Date(order.created_at).toLocaleTimeString()}\n`;
    kot += `\n${dash}\nITEMS TO PREPARE:\n${dash}\n\n`;
    
    order.items.forEach(item => {
      kot += `>>> ${item.quantity}x ${item.name.toUpperCase()} <<<\n`;
      if (item.notes) kot += `    *** ${item.notes} ***\n`;
      kot += '\n';
    });
    
    kot += `${dash}\nTOTAL ITEMS: ${order.items.reduce((sum, i) => sum + i.quantity, 0)}\n${sep}`;

    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html><head><title>KOT - Table ${order.table_number}</title>
      <style>
        @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; } .no-print { display: none; } }
        body { font-family: 'Courier New', monospace; font-size: 14px; padding: 10px; width: 80mm; }
        pre { margin: 0; white-space: pre-wrap; }
        .no-print { text-align: center; margin: 20px 0; }
        .btn { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin: 5px; }
        .btn-print { background: linear-gradient(135deg, #f97316, #ea580c); color: white; }
        .btn-close { background: #6b7280; color: white; }
      </style></head><body>
      <pre>${kot}</pre>
      <div class="no-print">
        <button class="btn btn-print" onclick="window.print()">🖨️ Print KOT</button>
        <button class="btn btn-close" onclick="window.close()">✕ Close</button>
      </div></body></html>
    `);
    printWindow.document.close();
    toast.success('KOT ready for printing!');
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  const OrderCard = ({ order }) => {
    const urgency = getUrgencyLevel(order.created_at);
    const urgencyColors = {
      critical: 'border-l-red-500 bg-red-50',
      warning: 'border-l-orange-500 bg-orange-50',
      normal: order.status === 'pending' ? 'border-l-yellow-500' : order.status === 'preparing' ? 'border-l-blue-500' : 'border-l-green-500'
    };

    return (
      <Card className={`border-0 shadow-xl border-l-4 ${urgencyColors[urgency]} transition-all hover:shadow-2xl`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-black flex items-center gap-2">
                <ChefHat className="w-8 h-8 text-orange-500" />
                Table #{order.table_number}
              </CardTitle>
              <p className="text-sm text-gray-500 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                order.status === 'pending' ? 'bg-yellow-200 text-yellow-800 animate-pulse' : 
                order.status === 'preparing' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'
              }`}>
                {order.status}
              </span>
              <p className={`text-sm mt-1 flex items-center justify-end gap-1 ${urgency === 'critical' ? 'text-red-600 font-bold' : urgency === 'warning' ? 'text-orange-600' : 'text-gray-500'}`}>
                {urgency === 'critical' && <AlertTriangle className="w-4 h-4" />}
                <Clock className="w-3 h-3" />
                {getTimeSince(order.created_at)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${urgency === 'critical' ? 'bg-red-100' : 'bg-white'} border`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-xl">{item.quantity}× {item.name}</p>
                    {item.notes && (
                      <p className="text-sm mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded inline-flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            {order.status === 'pending' && (
              <Button onClick={() => handleStatusChange(order.id, 'preparing')} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 h-12 text-lg">
                <Play className="w-5 h-5 mr-2" /> Start
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button onClick={() => handleStatusChange(order.id, 'ready')} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 h-12 text-lg">
                <CheckCircle className="w-5 h-5 mr-2" /> Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button onClick={() => handleStatusChange(order.id, 'completed')} className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 h-12 text-lg">
                <CheckCircle className="w-5 h-5 mr-2" /> Complete
              </Button>
            )}
            <Button variant="outline" onClick={() => printKOT(order)} className="h-12 px-4">
              <Printer className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={() => setSelectedOrder(order)} className="h-12 px-4">
              <Eye className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="kitchen-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <ChefHat className="w-10 h-10 text-orange-500" />
              Kitchen Display
            </h1>
            <p className="text-gray-600 mt-1">Real-time order management</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant={autoRefresh ? "default" : "outline"} onClick={() => setAutoRefresh(!autoRefresh)} className={autoRefresh ? "bg-green-600" : ""}>
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
            <Button variant="outline" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button variant="outline" onClick={fetchOrders}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pending</p>
                <p className="text-4xl font-black">{stats.pending}</p>
              </div>
              <Bell className="w-12 h-12 opacity-50" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Preparing</p>
                <p className="text-4xl font-black">{stats.preparing}</p>
              </div>
              <Timer className="w-12 h-12 opacity-50" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Ready</p>
                <p className="text-4xl font-black">{stats.ready}</p>
              </div>
              <CheckCircle className="w-12 h-12 opacity-50" />
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
          {[
            { id: 'all', label: 'All Orders', count: orders.length },
            { id: 'pending', label: 'Pending', count: stats.pending },
            { id: 'preparing', label: 'Preparing', count: stats.preparing },
            { id: 'ready', label: 'Ready', count: stats.ready },
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                filter === tab.id ? 'bg-white shadow text-violet-600' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${filter === tab.id ? 'bg-violet-100' : 'bg-gray-200'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.length === 0 && (
            <div className="col-span-full text-center py-16">
              <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No {filter === 'all' ? 'active' : filter} orders</p>
              <p className="text-gray-400 text-sm">Orders will appear here automatically</p>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
            <Card className="w-full max-w-lg border-0 shadow-2xl" onClick={e => e.stopPropagation()}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Order Details - Table #{selectedOrder.table_number}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}><X className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Order ID</p><p className="font-mono font-bold">#{selectedOrder.id.slice(0, 8)}</p></div>
                  <div><p className="text-gray-500">Server</p><p className="font-bold">{selectedOrder.waiter_name}</p></div>
                  <div><p className="text-gray-500">Customer</p><p className="font-bold">{selectedOrder.customer_name || 'Walk-in'}</p></div>
                  <div><p className="text-gray-500">Time</p><p className="font-bold">{new Date(selectedOrder.created_at).toLocaleString()}</p></div>
                </div>
                <div className="border-t pt-4">
                  <p className="font-bold mb-2">Items ({selectedOrder.items.length})</p>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                      <span className="font-medium">{item.quantity}× {item.name}</span>
                      {item.notes && <span className="text-orange-600 text-sm">{item.notes}</span>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
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
