import { useState, useEffect, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, Users, QrCode, X, Edit, Trash2, Clock, Calendar,
  MapPin, BarChart3, TrendingUp, RefreshCw, Download, Printer,
  Search, Filter, Eye, CheckCircle, XCircle, AlertTriangle,
  Grid3X3, List, Settings, Phone, Mail, User, Utensils,
  Timer, DollarSign, Star, Award, Target, Activity
} from 'lucide-react';

const TablesPage = ({ user }) => {
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tableAnalytics, setTableAnalytics] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, table: null });
  const [selfOrderEnabled, setSelfOrderEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or floor
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: '',
    status: 'available',
    location: '',
    section: '',
    table_type: 'regular',
    notes: ''
  });
  const [reservationFormData, setReservationFormData] = useState({
    table_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: '',
    reservation_date: '',
    reservation_time: '',
    duration: '120',
    notes: '',
    status: 'confirmed'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTables(),
        fetchReservations(),
        fetchTableAnalytics(),
        fetchWhatsappSettings()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsappSettings = async () => {
    try {
      const response = await axios.get(`${API}/whatsapp/settings`);
      setSelfOrderEnabled(response.data.customer_self_order_enabled || false);
    } catch (error) {
      console.error('Failed to fetch WhatsApp settings');
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API}/tables`);
      setTables(response.data.sort((a, b) => a.table_number - b.table_number));
    } catch (error) {
      toast.error('Failed to fetch tables');
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${API}/tables/reservations`);
      setReservations(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
      setReservations([]);
    }
  };

  const fetchTableAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/tables/analytics`);
      setTableAnalytics(response.data || {});
    } catch (error) {
      console.error('Failed to fetch table analytics:', error);
      setTableAnalytics({});
    }
  };

  // Auto-generate QR URL using current window location
  const generateQRUrl = (tableNumber) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/order/${user?.id}?table=${tableNumber}`;
  };
  
  // Generate tracking URL
  const generateTrackingUrl = (trackingToken) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/track/${trackingToken}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await axios.put(`${API}/tables/${editingTable.id}`, formData);
        toast.success('Table updated successfully!');
      } else {
        await axios.post(`${API}/tables`, formData);
        toast.success('Table created successfully!');
      }
      setDialogOpen(false);
      fetchTables();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save table');
    }
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tables/reservations`, reservationFormData);
      toast.success('Reservation created successfully!');
      setReservationDialogOpen(false);
      fetchReservations();
      resetReservationForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create reservation');
    }
  };

  const resetForm = () => {
    setFormData({
      table_number: '',
      capacity: '',
      status: 'available',
      location: '',
      section: '',
      table_type: 'regular',
      notes: ''
    });
    setEditingTable(null);
  };

  const resetReservationForm = () => {
    setReservationFormData({
      table_id: '',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      party_size: '',
      reservation_date: '',
      reservation_time: '',
      duration: '120',
      notes: '',
      status: 'confirmed'
    });
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      status: table.status,
      location: table.location || '',
      section: table.section || '',
      table_type: table.table_type || 'regular',
      notes: table.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    
    try {
      await axios.delete(`${API}/tables/${tableId}`);
      toast.success('Table deleted successfully!');
      fetchTables();
    } catch (error) {
      toast.error('Failed to delete table');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-500',
      occupied: 'bg-red-500',
      reserved: 'bg-yellow-500',
      maintenance: 'bg-gray-500',
      cleaning: 'bg-blue-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-700 border-green-200',
      occupied: 'bg-red-100 text-red-700 border-red-200',
      reserved: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      maintenance: 'bg-gray-100 text-gray-700 border-gray-200',
      cleaning: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTableTypeIcon = (type) => {
    switch (type) {
      case 'vip': return Star;
      case 'outdoor': return MapPin;
      case 'booth': return Award;
      default: return Utensils;
    }
  };

  // Enhanced filtering
  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      const matchesSearch = table.table_number.toString().includes(searchTerm) ||
                           (table.section && table.section.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (table.location && table.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || table.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tables, searchTerm, filterStatus]);

  // Table analytics
  const analytics = useMemo(() => {
    const totalTables = tables.length;
    const availableTables = tables.filter(t => t.status === 'available').length;
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const reservedTables = tables.filter(t => t.status === 'reserved').length;
    const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);
    const occupancyRate = totalTables > 0 ? ((occupiedTables + reservedTables) / totalTables) * 100 : 0;
    
    const sectionDistribution = tables.reduce((acc, t) => {
      const section = t.section || 'Main';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables,
      totalCapacity,
      occupancyRate,
      sectionDistribution,
      avgCapacity: totalTables > 0 ? totalCapacity / totalTables : 0
    };
  }, [tables]);

  // Export table data
  const handleExportTables = () => {
    const csvContent = [
      ['Table Number', 'Capacity', 'Status', 'Section', 'Location', 'Type', 'Notes'],
      ...filteredTables.map(table => [
        table.table_number,
        table.capacity || '',
        table.status,
        table.section || '',
        table.location || '',
        table.table_type || 'regular',
        table.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tables-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Table data exported to CSV!');
  };

  const handleClearTable = async (table) => {
    // Confirm before clearing
    const confirmed = window.confirm(
      `Clear Table #${table.table_number}?\n\nThis will:\n- Mark table as available\n- Complete any pending orders\n- Cannot be undone`
    );
    
    if (!confirmed) return;

    try {
      // Update table status to available
      await axios.put(`${API}/tables/${table.id}`, {
        ...table,
        status: 'available',
        cleared_at: new Date().toISOString()
      });

      toast.success(`Table #${table.table_number} cleared successfully!`);
      fetchTables();
    } catch (error) {
      console.error('Failed to clear table:', error);
      toast.error('Failed to clear table. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="space-y-6">
          <TrialBanner user={user} />
          
          {/* Header Skeleton */}
          <div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-80 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded animate-pulse w-96"></div>
          </div>

          {/* Analytics Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border-0 shadow-lg rounded-lg p-6 bg-white">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>

          {/* Table Cards Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border-0 shadow-lg rounded-lg p-6 bg-white">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-12 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mx-auto mb-2"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="tables-page">
        <TrialBanner user={user} />
        
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Table Management
            </h1>
            <p className="text-gray-600 mt-2">Manage restaurant tables, reservations, and floor plan</p>
            
            {/* Quick Stats */}
            <div className="flex gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">{analytics.availableTables} Available</span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">{analytics.occupiedTables} Occupied</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">{analytics.reservedTables} Reserved</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">{analytics.totalCapacity} Total Seats</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={handleExportTables}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            
            <Button 
              variant="outline" 
              onClick={fetchAllData}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            {['admin', 'cashier'].includes(user?.role) && (
              <>
                <Dialog open={reservationDialogOpen} onOpenChange={(open) => { setReservationDialogOpen(open); if (!open) resetReservationForm(); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                      <Calendar className="w-4 h-4 mr-2" />
                      New Reservation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl" data-testid="reservation-dialog">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        New Reservation
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleReservationSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Table</Label>
                          <Select value={reservationFormData.table_id} onValueChange={(value) => setReservationFormData({ ...reservationFormData, table_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select table" />
                            </SelectTrigger>
                            <SelectContent>
                              {tables.filter(t => t.status === 'available').map(table => (
                                <SelectItem key={table.id} value={table.id}>
                                  Table {table.table_number} ({table.capacity} seats)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Party Size</Label>
                          <Input
                            type="number"
                            value={reservationFormData.party_size}
                            onChange={(e) => setReservationFormData({ ...reservationFormData, party_size: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Customer Name</Label>
                          <Input
                            value={reservationFormData.customer_name}
                            onChange={(e) => setReservationFormData({ ...reservationFormData, customer_name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Phone Number</Label>
                          <Input
                            value={reservationFormData.customer_phone}
                            onChange={(e) => setReservationFormData({ ...reservationFormData, customer_phone: e.target.value })}
                            placeholder="+91 1234567890"
                          />
                        </div>
                        <div>
                          <Label>Email (Optional)</Label>
                          <Input
                            type="email"
                            value={reservationFormData.customer_email}
                            onChange={(e) => setReservationFormData({ ...reservationFormData, customer_email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Duration (minutes)</Label>
                          <Select value={reservationFormData.duration} onValueChange={(value) => setReservationFormData({ ...reservationFormData, duration: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="90">1.5 hours</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                              <SelectItem value="180">3 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={reservationFormData.reservation_date}
                            onChange={(e) => setReservationFormData({ ...reservationFormData, reservation_date: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Time</Label>
                          <Input
                            type="time"
                            value={reservationFormData.reservation_time}
                            onChange={(e) => setReservationFormData({ ...reservationFormData, reservation_time: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Special Notes</Label>
                        <Input
                          value={reservationFormData.notes}
                          onChange={(e) => setReservationFormData({ ...reservationFormData, notes: e.target.value })}
                          placeholder="Birthday celebration, dietary restrictions, etc."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600">
                          Create Reservation
                        </Button>
                        <Button type="button" variant="outline" onClick={() => { setReservationDialogOpen(false); resetReservationForm(); }}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-violet-600 to-purple-600" data-testid="add-table-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Table
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl" data-testid="table-dialog">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Utensils className="w-5 h-5" />
                        {editingTable ? 'Edit Table' : 'Add New Table'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Basic Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Table Number *</Label>
                            <Input
                              type="number"
                              value={formData.table_number}
                              onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                              required
                              data-testid="table-number-input"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <Label>Capacity *</Label>
                            <Input
                              type="number"
                              value={formData.capacity}
                              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                              required
                              data-testid="table-capacity-input"
                              placeholder="4"
                            />
                          </div>
                          <div>
                            <Label>Table Type</Label>
                            <Select value={formData.table_type} onValueChange={(value) => setFormData({ ...formData, table_type: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="booth">Booth</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                                <SelectItem value="outdoor">Outdoor</SelectItem>
                                <SelectItem value="bar">Bar Seating</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="reserved">Reserved</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="cleaning">Cleaning</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Location Information */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Section</Label>
                            <Input
                              value={formData.section}
                              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                              placeholder="Main Hall, Patio, VIP Area"
                            />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={formData.location}
                              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                              placeholder="Near window, Corner, Center"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Notes */}
                      <div>
                        <Label>Notes</Label>
                        <Input
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Special features, accessibility notes, etc."
                        />
                      </div>

                      <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="save-table-button">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {editingTable ? 'Update Table' : 'Create Table'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                Total Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-violet-600">{analytics.totalTables}</p>
              <p className="text-sm text-gray-500 mt-1">
                {analytics.totalCapacity} total seats
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Occupancy Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{analytics.occupancyRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">
                {analytics.occupiedTables + analytics.reservedTables} of {analytics.totalTables} tables
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Available Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{analytics.availableTables}</p>
              <p className="text-sm text-gray-500 mt-1">
                Ready for seating
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Avg Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{analytics.avgCapacity.toFixed(1)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Seats per table
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex gap-4 flex-wrap items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by table number, section, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'floor' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('floor')}
                className="rounded-none"
              >
                <MapPin className="w-4 h-4" />
              </Button>
            </div>

            {/* Clear Filters */}
            {(searchTerm || filterStatus !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="tables" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredTables.map((table) => {
            const TableTypeIcon = getTableTypeIcon(table.table_type);
            const isActive = table.status === 'available';
            
            return (
              <Card
                key={table.id}
                className={`card-hover border-0 shadow-lg relative overflow-hidden transition-all hover:shadow-xl ${
                  !isActive ? 'opacity-90' : ''
                }`}
                data-testid={`table-card-${table.id}`}
              >
                <div className={`absolute top-0 right-0 w-3 h-3 rounded-full m-3 ${getStatusColor(table.status)}`}></div>
                
                {/* Table Type Badge */}
                {table.table_type && table.table_type !== 'regular' && (
                  <div className="absolute top-2 left-2">
                    <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                      <TableTypeIcon className="w-3 h-3 mr-1" />
                      {table.table_type.toUpperCase()}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2 pt-6">
                  <CardTitle className="text-3xl font-bold text-violet-600">#{table.table_number}</CardTitle>
                  {table.section && (
                    <p className="text-xs text-gray-500">{table.section}</p>
                  )}
                </CardHeader>
                
                <CardContent className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{table.capacity} seats</span>
                  </div>
                  
                  <Badge className={`text-xs ${getStatusBadgeColor(table.status)}`}>
                    {table.status.replace('_', ' ').toUpperCase()}
                  </Badge>

                  {table.location && (
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{table.location}</span>
                    </div>
                  )}

                  <div className="space-y-2 mt-3">
                    <div className="flex gap-1">
                      {selfOrderEnabled && table.status === 'available' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQrModal({ open: true, table })}
                          className="flex-1 text-xs"
                          title="Generate QR Code"
                        >
                          <QrCode className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {['admin', 'cashier'].includes(user?.role) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(table)}
                          className="flex-1 text-xs"
                          title="Edit table"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    {table.status === 'occupied' && ['admin', 'cashier', 'waiter'].includes(user?.role) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleClearTable(table)}
                        className="w-full text-xs"
                        data-testid={`clear-table-${table.id}`}
                      >
                        Clear Table
                      </Button>
                    )}

                    {['admin'].includes(user?.role) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(table.id)}
                        className="w-full text-xs border-red-500 text-red-600 hover:bg-red-50"
                        title="Delete table"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredTables.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Click "Add Table" to create your first table'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && ['admin', 'cashier'].includes(user?.role) && (
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="bg-gradient-to-r from-violet-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Table
                </Button>
              )}
            </div>
          )}
        </div>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-600" />
                  Today's Reservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reservations.length > 0 ? (
                  <div className="space-y-4">
                    {reservations.map((reservation, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {reservation.table_number || 'T'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{reservation.customer_name}</p>
                            <p className="text-sm text-gray-500">
                              {reservation.party_size} guests • {reservation.reservation_time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${
                            reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {reservation.status}
                          </Badge>
                          {reservation.customer_phone && (
                            <p className="text-xs text-gray-500 mt-1">{reservation.customer_phone}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No reservations for today</p>
                    <p className="text-sm text-gray-400 mt-1">Reservations will appear here when created</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section Distribution */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-violet-600" />
                    Section Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.sectionDistribution).map(([section, count]) => {
                      const percentage = (count / analytics.totalTables) * 100;
                      return (
                        <div key={section} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{section}</span>
                            <span className="text-sm text-gray-600">{count} tables ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Table Status Overview */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                    Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Available Tables</p>
                      <p className="text-2xl font-bold text-green-600">{analytics.availableTables}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Occupied Tables</p>
                      <p className="text-2xl font-bold text-red-600">{analytics.occupiedTables}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Reserved Tables</p>
                      <p className="text-2xl font-bold text-yellow-600">{analytics.reservedTables}</p>
                    </div>
                    <div className="p-3 bg-violet-50 rounded-lg">
                      <p className="text-sm text-gray-600">Occupancy Rate</p>
                      <p className="text-2xl font-bold text-violet-600">{analytics.occupancyRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* QR Code Modal */}
        {qrModal.open && qrModal.table && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="relative text-center">
                <button
                  onClick={() => setQrModal({ open: false, table: null })}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <CardTitle>Table {qrModal.table.table_number} QR Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  {/* QR Code using Google Charts API */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateQRUrl(qrModal.table.table_number))}`}
                    alt={`QR Code for Table ${qrModal.table.table_number}`}
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Scan to order from Table {qrModal.table.table_number}</p>
                  <p className="text-xs mt-1 break-all">{generateQRUrl(qrModal.table.table_number)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const printWindow = window.open('', '', 'width=400,height=500');
                      printWindow.document.write(`
                        <html>
                          <head><title>Table ${qrModal.table.table_number} QR</title></head>
                          <body style="text-align:center;padding:20px;font-family:sans-serif;">
                            <h2>Table ${qrModal.table.table_number}</h2>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateQRUrl(qrModal.table.table_number))}" />
                            <p>Scan to view menu & order</p>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }}
                    className="flex-1 bg-violet-600"
                  >
                    Print QR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generateQRUrl(qrModal.table.table_number));
                      toast.success('Link copied!');
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TablesPage;
