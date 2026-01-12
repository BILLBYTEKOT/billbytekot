import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import TrialBanner from '../components/TrialBanner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, AlertTriangle, Package, Search, Filter, 
  Eye, Edit, Trash2, RefreshCw, X
} from 'lucide-react';

const InventoryPage = ({ user }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    cost_price: '',
    selling_price: '',
    supplier: '',
    min_stock_level: '',
    description: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to access inventory');
        toast.error('Please login to access inventory');
        return;
      }
      
      const response = await axios.get(`${API}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
      } else {
        setError('Failed to load inventory');
        toast.error('Failed to load inventory');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.quantity) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to add/edit items');
        return;
      }
      
      const url = editingItem 
        ? `${API}/inventory/${editingItem.id}`
        : `${API}/inventory`;
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await axios({
        method,
        url,
        data: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        toast.success(editingItem ? 'Item updated successfully' : 'Item added successfully');
        fetchInventory();
        resetForm();
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
      } else {
        toast.error('Failed to save item');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || '',
      quantity: item.quantity || '',
      unit: item.unit || '',
      cost_price: item.cost_price || '',
      selling_price: item.selling_price || '',
      supplier: item.supplier || '',
      min_stock_level: item.min_stock_level || '',
      description: item.description || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to delete items');
        return;
      }
      
      await axios.delete(`${API}/inventory/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Item deleted successfully');
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
      } else {
        toast.error('Failed to delete item');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '',
      unit: '',
      cost_price: '',
      selling_price: '',
      supplier: '',
      min_stock_level: '',
      description: ''
    });
    setEditingItem(null);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterLowStock || (item.quantity <= (item.min_stock_level || 10));
    return matchesSearch && matchesFilter;
  });

  const lowStockItems = inventory.filter(item => item.quantity <= (item.min_stock_level || 10));

  if (loading) {
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
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Package className="w-8 h-8" />
                  Inventory Management
                </h1>
                <p className="text-white/80 mt-2">
                  Manage your restaurant inventory, track stock levels, and monitor supplies
                </p>
              </div>
              <div className="flex gap-3">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        resetForm();
                        setDialogOpen(true);
                      }}
                      className="bg-white text-violet-600 hover:bg-white/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? 'Edit Item' : 'Add New Item'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Item Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Enter item name"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vegetables">Vegetables</SelectItem>
                            <SelectItem value="meat">Meat & Poultry</SelectItem>
                            <SelectItem value="seafood">Seafood</SelectItem>
                            <SelectItem value="dairy">Dairy Products</SelectItem>
                            <SelectItem value="grains">Grains & Cereals</SelectItem>
                            <SelectItem value="spices">Spices & Herbs</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                            <SelectItem value="oils">Oils & Fats</SelectItem>
                            <SelectItem value="frozen">Frozen Items</SelectItem>
                            <SelectItem value="canned">Canned Goods</SelectItem>
                            <SelectItem value="cleaning">Cleaning Supplies</SelectItem>
                            <SelectItem value="packaging">Packaging Materials</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="quantity">Quantity *</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                            placeholder="0"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="unit">Unit</Label>
                          <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                              <SelectItem value="grams">Grams (g)</SelectItem>
                              <SelectItem value="liters">Liters (L)</SelectItem>
                              <SelectItem value="ml">Milliliters (ml)</SelectItem>
                              <SelectItem value="pieces">Pieces (pcs)</SelectItem>
                              <SelectItem value="packets">Packets</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                              <SelectItem value="bottles">Bottles</SelectItem>
                              <SelectItem value="cans">Cans</SelectItem>
                              <SelectItem value="bags">Bags</SelectItem>
                              <SelectItem value="dozen">Dozen</SelectItem>
                              <SelectItem value="units">Units</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="cost_price">Cost Price</Label>
                          <Input
                            id="cost_price"
                            type="number"
                            step="0.01"
                            value={formData.cost_price}
                            onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="min_stock_level">Min Stock Level</Label>
                          <Input
                            id="min_stock_level"
                            type="number"
                            value={formData.min_stock_level}
                            onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})}
                            placeholder="10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          value={formData.supplier}
                          onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                          placeholder="Supplier name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Item description"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1">
                          {editingItem ? 'Update Item' : 'Add Item'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{inventory.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">
                    ₹{inventory.reduce((sum, item) => sum + (item.quantity * (item.cost_price || 0)), 0).toFixed(2)}
                  </p>
                </div>
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                variant={filterLowStock ? "default" : "outline"}
                onClick={() => setFilterLowStock(!filterLowStock)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Low Stock Only
              </Button>
              <Button variant="outline" onClick={fetchInventory}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory List */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-red-600">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <p>{error}</p>
                <Button onClick={fetchInventory} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4" />
                <p>No inventory items found</p>
                <Button onClick={() => setDialogOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInventory.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{item.name}</h3>
                          {item.quantity <= (item.min_stock_level || 10) && (
                            <Badge variant="destructive">Low Stock</Badge>
                          )}
                          {item.category && (
                            <Badge variant="secondary">{item.category}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span>Quantity: {item.quantity} {item.unit}</span>
                          {item.cost_price && (
                            <span className="ml-4">Cost: ₹{item.cost_price}</span>
                          )}
                          {item.supplier && (
                            <span className="ml-4">Supplier: {item.supplier}</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InventoryPage;