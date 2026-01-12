import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import TrialBanner from '../components/TrialBanner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, Clock, DollarSign, CheckCircle, XCircle, 
  RefreshCw, Eye, Trash2, AlertTriangle
} from 'lucide-react';

const TablesPage = ({ user }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTables();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTables, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/tables`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTables(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('Failed to load tables');
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const clearTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to clear this table?')) return;

    try {
      await axios.post(`${API}/tables/${tableId}/clear`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Table cleared successfully');
      fetchTables();
    } catch (error) {
      console.error('Error clearing table:', error);
      toast.error('Failed to clear table');
    }
  };

  const getTableStatus = (table) => {
    if (!table.current_order) return 'available';
    
    const order = table.current_order;
    if (order.status === 'completed' && order.payment_status === 'paid') {
      return 'completed';
    } else if (order.payment_status === 'partial') {
      return 'partial';
    } else if (order.payment_status === 'unpaid') {
      return 'unpaid';
    } else {
      return 'occupied';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'occupied': return <Users className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'partial': return <AlertTriangle className="w-4 h-4" />;
      case 'unpaid': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const occupiedTables = tables.filter(table => getTableStatus(table) !== 'available');
  const availableTables = tables.filter(table => getTableStatus(table) === 'available');

  if (loading && tables.length === 0) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <TrialBanner user={user} />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Users className="w-8 h-8" />
                  Tables Management
                </h1>
                <p className="text-white/80 mt-2">
                  Monitor table status, manage orders, and track occupancy
                </p>
              </div>
              <Button 
                onClick={fetchTables}
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tables</p>
                  <p className="text-2xl font-bold">{tables.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">{availableTables.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold text-blue-600">{occupiedTables.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupancy Rate</p>
                  <p className="text-2xl font-bold">
                    {tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0}%
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Tables Overview ({tables.length} tables)</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-red-600">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <p>{error}</p>
                <Button onClick={fetchTables} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>No tables found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map((table) => {
                  const status = getTableStatus(table);
                  const order = table.current_order;
                  
                  return (
                    <Card key={table.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-lg">Table {table.number}</h3>
                          <Badge className={getStatusColor(status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(status)}
                              <span className="capitalize">{status}</span>
                            </div>
                          </Badge>
                        </div>
                        
                        {table.capacity && (
                          <p className="text-sm text-gray-600 mb-2">
                            Capacity: {table.capacity} people
                          </p>
                        )}
                        
                        {order && (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Order ID:</span>
                              <span className="font-mono">#{order.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total:</span>
                              <span className="font-bold">₹{order.total_amount}</span>
                            </div>
                            {order.payment_status && (
                              <div className="flex justify-between">
                                <span>Payment:</span>
                                <Badge variant={order.payment_status === 'paid' ? 'default' : 'destructive'}>
                                  {order.payment_status}
                                </Badge>
                              </div>
                            )}
                            {order.created_at && (
                              <div className="flex justify-between">
                                <span>Started:</span>
                                <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {status !== 'available' && (
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => clearTable(table.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Clear
                            </Button>
                            {order && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/billing?table=${table.id}`, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TablesPage;