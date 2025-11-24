import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Clock, CheckCircle } from 'lucide-react';

const KitchenPage = ({ user }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const activeOrders = response.data.filter(o => ['pending', 'preparing'].includes(o.status));
      setOrders(activeOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      toast.success('Order status updated!');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getTimeSince = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    return `${minutes} min ago`;
  };

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="kitchen-page">
        <div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Kitchen Display</h1>
          <p className="text-gray-600 mt-2">Active orders to prepare</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={`border-0 shadow-xl ${
                order.status === 'pending' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-blue-500'
              }`}
              data-testid={`kitchen-order-${order.id}`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Table #{order.table_number}</CardTitle>
                    <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {getTimeSince(order.created_at)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg">{item.quantity}x {item.name}</p>
                          {item.notes && <p className="text-sm text-gray-600 mt-1">Note: {item.notes}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <Button
                      onClick={() => handleStatusChange(order.id, 'preparing')}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
                      data-testid={`start-preparing-${order.id}`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      onClick={() => handleStatusChange(order.id, 'ready')}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                      data-testid={`mark-ready-${order.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Ready
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {orders.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No active orders</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default KitchenPage;
