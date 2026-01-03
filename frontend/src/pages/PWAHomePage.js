import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Utensils, ShoppingCart, ChefHat, BarChart3, 
  Settings, Users, Package, CreditCard,
  Bell, Wifi, WifiOff, Battery, Clock,
  ArrowRight, Sparkles, TrendingUp
} from 'lucide-react';

const PWAHomePage = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ todayOrders: 0, todaySales: 0, pendingKOT: 0 });

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      navigate('/login');
      return;
    }
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {}
    }

    // Online/offline listener
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update time every minute
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);

    // Fetch quick stats
    fetchStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timeInterval);
    };
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          todayOrders: data.today_orders || 0,
          todaySales: data.today_sales || 0,
          pendingKOT: data.pending_kot || 0
        });
      }
    } catch (e) {}
  };

  const quickActions = [
    { icon: ShoppingCart, label: 'New Order', path: '/orders', color: 'from-violet-500 to-purple-600', badge: null },
    { icon: ChefHat, label: 'Kitchen', path: '/kitchen', color: 'from-orange-500 to-red-500', badge: stats.pendingKOT > 0 ? stats.pendingKOT : null },
    { icon: Utensils, label: 'Tables', path: '/tables', color: 'from-emerald-500 to-green-600', badge: null },
    { icon: CreditCard, label: 'Billing', path: '/billing', color: 'from-blue-500 to-cyan-500', badge: null },
  ];

  const menuItems = [
    { icon: BarChart3, label: 'Reports', path: '/reports', desc: 'Sales & Analytics' },
    { icon: Package, label: 'Inventory', path: '/inventory', desc: 'Stock Management' },
    { icon: Users, label: 'Staff', path: '/staff', desc: 'Team Management' },
    { icon: Settings, label: 'Settings', path: '/settings', desc: 'App Configuration' },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Status Bar */}
      <div className="sticky top-0 z-50 bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-white/70">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/notifications')} className="relative">
              <Bell className="w-5 h-5 text-white/70" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-24">
        {/* Header */}
        <div className="pt-6 pb-4">
          <p className="text-white/60 text-sm">{greeting()}</p>
          <h1 className="text-2xl font-bold text-white">
            {user?.restaurant_name || user?.name || 'Restaurant'}
          </h1>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/70 text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> Today's Overview
            </span>
            <span className="text-xs text-white/50">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold text-white">{stats.todayOrders}</p>
              <p className="text-white/60 text-sm">Orders</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">{formatCurrency(stats.todaySales)}</p>
              <p className="text-white/60 text-sm">Sales</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`relative bg-gradient-to-br ${action.color} rounded-2xl p-4 text-left transition-transform active:scale-95 shadow-lg`}
              >
                {action.badge && (
                  <span className="absolute top-2 right-2 bg-white text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {action.badge}
                  </span>
                )}
                <action.icon className="w-8 h-8 text-white mb-2" />
                <p className="text-white font-semibold">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div>
          <h2 className="text-white/80 text-sm font-medium mb-3">More Options</h2>
          <div className="space-y-2">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 backdrop-blur rounded-xl p-4 transition-all active:scale-98 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-white/50 text-xs">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/30" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 px-6 py-3 safe-area-pb">
        <div className="flex items-center justify-around">
          <button onClick={() => navigate('/pwa')} className="flex flex-col items-center text-purple-400">
            <Utensils className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button onClick={() => navigate('/orders')} className="flex flex-col items-center text-white/50">
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs mt-1">Orders</span>
          </button>
          <button onClick={() => navigate('/kitchen')} className="flex flex-col items-center text-white/50 relative">
            <ChefHat className="w-6 h-6" />
            {stats.pendingKOT > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {stats.pendingKOT}
              </span>
            )}
            <span className="text-xs mt-1">Kitchen</span>
          </button>
          <button onClick={() => navigate('/reports')} className="flex flex-col items-center text-white/50">
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs mt-1">Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAHomePage;
