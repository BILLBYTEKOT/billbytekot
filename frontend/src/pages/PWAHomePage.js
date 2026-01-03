import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { 
  Utensils, ShoppingCart, ChefHat, BarChart3, 
  Settings, Users, Package, CreditCard,
  Bell, Wifi, WifiOff, Clock, Plus,
  ArrowRight, TrendingUp, IndianRupee,
  Menu as MenuIcon, LogOut, Home
} from 'lucide-react';

const PWAHomePage = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ todayOrders: 0, todaySales: 0, activeOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

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
      } catch (e) {
        console.log('Error parsing user data');
      }
    }

    // Online/offline listener
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update time every minute
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);

    // Fetch stats
    fetchStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timeInterval);
    };
  }, [navigate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [dailyReport, ordersRes] = await Promise.all([
        axios.get(`${API}/reports/daily`).catch(() => ({ data: { total_orders: 0, total_sales: 0 } })),
        axios.get(`${API}/orders`).catch(() => ({ data: [] }))
      ]);
      
      const activeOrders = ordersRes.data.filter(o => ['pending', 'preparing'].includes(o.status));
      
      setStats({
        todayOrders: dailyReport.data.total_orders || 0,
        todaySales: dailyReport.data.total_sales || 0,
        activeOrders: activeOrders.length
      });
    } catch (e) {
      console.log('Stats fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(amount || 0);
  };

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    { icon: Plus, label: 'New Order', path: '/orders', color: 'bg-gradient-to-br from-violet-500 to-purple-600' },
    { icon: ChefHat, label: 'Kitchen', path: '/kitchen', color: 'bg-gradient-to-br from-orange-500 to-red-500', badge: stats.activeOrders },
    { icon: Utensils, label: 'Tables', path: '/tables', color: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { icon: CreditCard, label: 'Billing', path: '/billing', color: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
  ];

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', desc: 'Full Dashboard' },
    { icon: MenuIcon, label: 'Menu', path: '/menu', desc: 'Manage Menu Items' },
    { icon: BarChart3, label: 'Reports', path: '/reports', desc: 'Sales & Analytics' },
    { icon: Package, label: 'Inventory', path: '/inventory', desc: 'Stock Management' },
    { icon: Users, label: 'Staff', path: '/staff', desc: 'Team Management' },
    { icon: Settings, label: 'Settings', path: '/settings', desc: 'App Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">BillByteKOT</h1>
              <p className="text-xs text-white/70">{user?.restaurant_name || 'Restaurant'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 text-red-300" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Greeting Section */}
        <div className="px-4 pb-6 pt-2">
          <p className="text-white/70 text-sm">{greeting()}</p>
          <h2 className="text-2xl font-bold">{user?.username || 'User'} 👋</h2>
          <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Slide Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div 
            className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold">{user?.username}</p>
                  <p className="text-xs text-white/70">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => { navigate(item.path); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-violet-50 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </button>
              ))}
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-red-600"
              >
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              Today's Overview
            </h3>
            <button onClick={fetchStats} className="text-xs text-violet-600 font-medium">
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <IndianRupee className="w-4 h-4 text-white" />
                </div>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(stats.todaySales)}</p>
                <p className="text-xs text-gray-500">Sales</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <p className="text-lg font-bold text-gray-800">{stats.todayOrders}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <ChefHat className="w-4 h-4 text-white" />
                </div>
                <p className="text-lg font-bold text-gray-800">{stats.activeOrders}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className={`relative ${action.color} rounded-2xl p-4 text-left text-white shadow-lg active:scale-95 transition-transform`}
            >
              {action.badge > 0 && (
                <span className="absolute top-2 right-2 bg-white text-violet-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                  {action.badge}
                </span>
              )}
              <action.icon className="w-8 h-8 mb-2" />
              <p className="font-semibold">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* More Options */}
      <div className="px-4 mt-6 pb-24">
        <h3 className="font-semibold text-gray-800 mb-3">More Options</h3>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {menuItems.slice(0, 4).map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-violet-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 safe-area-pb">
        <div className="flex items-center justify-around">
          <button onClick={() => navigate('/pwa')} className="flex flex-col items-center py-1 px-3 text-violet-600">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-0.5 font-medium">Home</span>
          </button>
          <button onClick={() => navigate('/orders')} className="flex flex-col items-center py-1 px-3 text-gray-400">
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs mt-0.5">Orders</span>
          </button>
          <button 
            onClick={() => navigate('/orders')} 
            className="w-14 h-14 -mt-6 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
          >
            <Plus className="w-7 h-7 text-white" />
          </button>
          <button onClick={() => navigate('/kitchen')} className="flex flex-col items-center py-1 px-3 text-gray-400 relative">
            <ChefHat className="w-6 h-6" />
            {stats.activeOrders > 0 && (
              <span className="absolute -top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {stats.activeOrders}
              </span>
            )}
            <span className="text-xs mt-0.5">Kitchen</span>
          </button>
          <button onClick={() => navigate('/reports')} className="flex flex-col items-center py-1 px-3 text-gray-400">
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs mt-0.5">Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAHomePage;
