import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Shield, Users, DollarSign, TrendingUp, Eye, Edit, Search, RefreshCw,
  BarChart3, PieChart, Calendar, Clock, Mail, Phone, MapPin, Star,
  CheckCircle, XCircle, AlertCircle, Download, Filter, Plus, Trash2,
  Settings, Bell, MessageSquare, CreditCard, Target, Zap, Activity
} from 'lucide-react';

const SuperAdminPage = ({ user }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [revenue, setRevenue] = useState({});
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  
  const itemsPerPage = 20;

  useEffect(() => {
    const superAdminAuth = localStorage.getItem('superAdminAuth');
    if (superAdminAuth === 'true') {
      setAuthenticated(true);
      fetchAllData();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Store credentials for API calls
      localStorage.setItem('superAdminUsername', credentials.username);
      localStorage.setItem('superAdminPassword', credentials.password);
      
      // Test login with POST method
      const response = await axios.post(`${API}/api/super-admin/login`, credentials);
      if (response.data.success) {
        setAuthenticated(true);
        localStorage.setItem('superAdminAuth', 'true');
        toast.success('SuperAdmin access granted');
        fetchAllData();
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      console.error('SuperAdmin login error:', error);
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const username = localStorage.getItem('superAdminUsername');
      const password = localStorage.getItem('superAdminPassword');
      
      if (!username || !password) {
        toast.error('Authentication credentials missing');
        handleLogout();
        return;
      }

      const [usersRes, subscriptionsRes, ticketsRes, leadsRes, analyticsRes, revenueRes] = await Promise.all([
        axios.get(`${API}/api/super-admin/users?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`),
        axios.get(`${API}/api/super-admin/subscriptions?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`),
        axios.get(`${API}/api/super-admin/tickets?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`),
        axios.get(`${API}/api/super-admin/leads?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`),
        axios.get(`${API}/api/super-admin/analytics?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`),
        axios.get(`${API}/api/super-admin/revenue?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`)
      ]);
      
      setUsers(usersRes.data.users || []);
      setSubscriptions(subscriptionsRes.data.subscriptions || []);
      setTickets(ticketsRes.data.tickets || []);
      setLeads(leadsRes.data.leads || []);
      setAnalytics(analyticsRes.data || {});
      setRevenue(revenueRes.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 403) {
        toast.error('Authentication failed - please login again');
        handleLogout();
      } else {
        toast.error('Failed to fetch dashboard data');
      }
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    localStorage.removeItem('superAdminAuth');
    localStorage.removeItem('superAdminUsername');
    localStorage.removeItem('superAdminPassword');
    setCredentials({ username: '', password: '' });
    toast.success('Logged out successfully');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-purple-500/20 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center gap-3 justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl text-white font-bold">SuperAdmin Portal</CardTitle>
            <p className="text-purple-200 text-sm">Advanced Startup Management Dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white font-medium">Username</Label>
                <Input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500"
                  placeholder="Enter admin username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white font-medium">Password</Label>
                <Input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500"
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Access Dashboard
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold flex items-center gap-4 mb-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                    <Shield className="w-8 h-8" />
                  </div>
                  SuperAdmin Dashboard
                </h1>
                <p className="text-purple-100 text-lg">
                  Complete startup management & analytics platform
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm text-purple-200">
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Live Data
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={fetchAllData}
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
              { id: 'tickets', label: 'Support', icon: MessageSquare },
              { id: 'leads', label: 'Leads', icon: Target },
              { id: 'analytics', label: 'Analytics', icon: PieChart },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Users</p>
                      <p className="text-3xl font-bold text-blue-900">{analytics.totalUsers || 0}</p>
                      <p className="text-blue-600 text-xs mt-1">+{analytics.newUsersToday || 0} today</p>
                    </div>
                    <div className="p-3 bg-blue-500 rounded-full">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Active Subscriptions</p>
                      <p className="text-3xl font-bold text-green-900">{analytics.activeSubscriptions || 0}</p>
                      <p className="text-green-600 text-xs mt-1">{analytics.subscriptionGrowth || 0}% growth</p>
                    </div>
                    <div className="p-3 bg-green-500 rounded-full">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-purple-900">₹{(revenue.monthly || 0).toLocaleString()}</p>
                      <p className="text-purple-600 text-xs mt-1">+{revenue.growth || 0}% vs last month</p>
                    </div>
                    <div className="p-3 bg-purple-500 rounded-full">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Support Tickets</p>
                      <p className="text-3xl font-bold text-orange-900">{analytics.openTickets || 0}</p>
                      <p className="text-orange-600 text-xs mt-1">{analytics.avgResponseTime || 0}h avg response</p>
                    </div>
                    <div className="p-3 bg-orange-500 rounded-full">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Revenue Trend (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2 p-4">
                    {[...Array(30)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div 
                          className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm w-3"
                          style={{ height: `${Math.random() * 200 + 20}px` }}
                        />
                        <span className="text-xs text-gray-500">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-600" />
                    User Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full" />
                        <span className="text-sm">Premium Users</span>
                      </div>
                      <span className="font-semibold">{analytics.premiumUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full" />
                        <span className="text-sm">Free Users</span>
                      </div>
                      <span className="font-semibold">{analytics.freeUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-orange-500 rounded-full" />
                        <span className="text-sm">Trial Users</span>
                      </div>
                      <span className="font-semibold">{analytics.trialUsers || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'user', message: 'New user registration: john@example.com', time: '2 minutes ago', icon: Users, color: 'blue' },
                    { type: 'subscription', message: 'Premium subscription activated', time: '5 minutes ago', icon: CreditCard, color: 'green' },
                    { type: 'ticket', message: 'Support ticket resolved #1234', time: '10 minutes ago', icon: CheckCircle, color: 'purple' },
                    { type: 'lead', message: 'New lead from contact form', time: '15 minutes ago', icon: Target, color: 'orange' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 bg-${activity.color}-100 rounded-full`}>
                        <activity.icon className={`w-4 h-4 text-${activity.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    User Management
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="premium">Premium</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Subscription</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Last Active</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 10).map((user, index) => (
                        <tr key={user.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.username || user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status || 'active'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Badge variant={user.subscription_status === 'active' ? 'default' : 'outline'}>
                                {user.subscription_status || 'free'}
                              </Badge>
                              {user.subscription_expires_at && (
                                <span className="text-xs text-gray-500">
                                  Expires: {new Date(user.subscription_expires_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-green-600">
                              ₹{(user.total_revenue || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-500">
                              {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-green-900">{subscriptions.filter(s => s.status === 'active').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 text-sm font-medium">Expiring Soon</p>
                      <p className="text-2xl font-bold text-yellow-900">{subscriptions.filter(s => s.expires_soon).length}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 text-sm font-medium">Cancelled</p>
                      <p className="text-2xl font-bold text-red-900">{subscriptions.filter(s => s.status === 'cancelled').length}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Subscription Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Plan</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Next Billing</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.slice(0, 10).map((subscription, index) => (
                        <tr key={subscription.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {(subscription.customer_name || 'C').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{subscription.customer_name}</p>
                                <p className="text-sm text-gray-500">{subscription.customer_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline">{subscription.plan_name || 'Premium'}</Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={
                              subscription.status === 'active' ? 'default' :
                              subscription.status === 'cancelled' ? 'destructive' : 'secondary'
                            }>
                              {subscription.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold">₹{(subscription.amount || 0).toLocaleString()}</span>
                            <span className="text-sm text-gray-500">/{subscription.billing_cycle || 'month'}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">
                              {subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Support Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Open Tickets</p>
                      <p className="text-2xl font-bold text-blue-900">{tickets.filter(t => t.status === 'open').length}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 text-sm font-medium">In Progress</p>
                      <p className="text-2xl font-bold text-yellow-900">{tickets.filter(t => t.status === 'in_progress').length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Resolved</p>
                      <p className="text-2xl font-bold text-green-900">{tickets.filter(t => t.status === 'resolved').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Avg Response</p>
                      <p className="text-2xl font-bold text-purple-900">{analytics.avgResponseTime || 2.5}h</p>
                    </div>
                    <Zap className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                  Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.slice(0, 10).map((ticket, index) => (
                    <div key={ticket.id || index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{ticket.subject || 'Support Request'}</h3>
                            <Badge variant={
                              ticket.priority === 'high' ? 'destructive' :
                              ticket.priority === 'medium' ? 'default' : 'secondary'
                            }>
                              {ticket.priority || 'low'}
                            </Badge>
                            <Badge variant={
                              ticket.status === 'open' ? 'destructive' :
                              ticket.status === 'in_progress' ? 'default' : 'secondary'
                            }>
                              {ticket.status || 'open'}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {ticket.customer_email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Today'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-600 text-sm font-medium">New Leads</p>
                      <p className="text-2xl font-bold text-indigo-900">{leads.filter(l => l.status === 'new').length}</p>
                    </div>
                    <Target className="w-8 h-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Qualified</p>
                      <p className="text-2xl font-bold text-blue-900">{leads.filter(l => l.status === 'qualified').length}</p>
                    </div>
                    <Star className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Converted</p>
                      <p className="text-2xl font-bold text-green-900">{leads.filter(l => l.status === 'converted').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Conversion Rate</p>
                      <p className="text-2xl font-bold text-purple-900">{analytics.conversionRate || 15}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Lead Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Source</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.slice(0, 10).map((lead, index) => (
                        <tr key={lead.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{lead.name}</p>
                              <p className="text-sm text-gray-500">{lead.email}</p>
                              {lead.phone && <p className="text-xs text-gray-400">{lead.phone}</p>}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline">{lead.source || 'Website'}</Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={
                              lead.status === 'converted' ? 'default' :
                              lead.status === 'qualified' ? 'secondary' : 'outline'
                            }>
                              {lead.status || 'new'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${lead.score || 50}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{lead.score || 50}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">
                              {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Today'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold">₹{(revenue.total || 0).toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Monthly Recurring Revenue</p>
                      <p className="text-2xl font-bold">₹{(revenue.mrr || 0).toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Customer Lifetime Value</p>
                      <p className="text-2xl font-bold">₹{(analytics.clv || 0).toLocaleString()}</p>
                    </div>
                    <Star className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Churn Rate</p>
                      <p className="text-2xl font-bold">{analytics.churnRate || 5}%</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>Revenue chart would be rendered here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 mx-auto mb-2" />
                      <p>User growth chart would be rendered here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Company Name</Label>
                        <Input defaultValue="BillByteKOT" />
                      </div>
                      <div>
                        <Label>Support Email</Label>
                        <Input defaultValue="support@billbytekot.com" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Email notifications for new users</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>SMS alerts for critical issues</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Daily revenue reports</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                    <div className="space-y-4">
                      <Button variant="outline">
                        <Shield className="w-4 h-4 mr-2" />
                        Change Admin Password
                      </Button>
                      <Button variant="outline">
                        <Bell className="w-4 h-4 mr-2" />
                        Configure 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SuperAdminPage;