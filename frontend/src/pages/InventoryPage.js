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
import { toast } from 'sonner';
import { Plus, AlertTriangle, Package, Printer, QrCode, Download, FileSpreadsheet, Search, Filter } from 'lucide-react';
import BulkUpload from '../components/BulkUpload';

const InventoryPage = ({ user }) => {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState({ upiId: '', amount: '', note: '' });
  const [businessSettings, setBusinessSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    min_quantity: '',
    price_per_unit: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchLowStock();
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      setBusinessSettings(response.data.business_settings);
    } catch (error) {
      console.error('Failed to fetch business settings', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API}/inventory`);
      setInventory(response.data);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await axios.get(`${API}/inventory/low-stock`);
      setLowStock(response.data);
    } catch (error) {
      console.error('Failed to fetch low stock', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API}/inventory/${editingItem.id}`, formData);
        toast.success('Inventory item updated!');
      } else {
        await axios.post(`${API}/inventory`, formData);
        toast.success('Inventory item created!');
      }
      setDialogOpen(false);
      fetchInventory();
      fetchLowStock();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save inventory item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '',
      unit: '',
      min_quantity: '',
      price_per_unit: ''
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity,
      price_per_unit: item.price_per_unit
    });
    setDialogOpen(true);
  };

  // Filter inventory based on search and low stock filter
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = filterLowStock ? item.quantity <= item.min_quantity : true;
    return matchesSearch && matchesLowStock;
  });

  // Print inventory report
  const handlePrintInventory = () => {
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.min_quantity);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Report - ${businessSettings?.restaurant_name || 'Restaurant'}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
          .header { text-align: center; padding: 20px; border-bottom: 2px solid #7c3aed; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #7c3aed; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
          .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card h4 { margin: 0 0 5px 0; font-size: 11px; color: #666; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #7c3aed; }
          .low-stock { background: #fef3c7 !important; }
          .low-stock p { color: #d97706 !important; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #7c3aed; color: white; font-weight: 600; }
          tr:nth-child(even) { background: #f9fafb; }
          .low { background: #fef3c7 !important; }
          .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 10px; }
          .no-print { margin-top: 20px; text-align: center; }
          .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin: 5px; }
          .btn-primary { background: #7c3aed; color: white; }
          .btn-secondary { background: #6b7280; color: white; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 ${businessSettings?.restaurant_name || 'Restaurant'}</h1>
          <p>Inventory Report</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h4>Total Items</h4>
            <p>${inventory.length}</p>
          </div>
          <div class="summary-card">
            <h4>Total Value</h4>
            <p>₹${totalValue.toFixed(0)}</p>
          </div>
          <div class="summary-card low-stock">
            <h4>Low Stock</h4>
            <p>${lowStockItems.length}</p>
          </div>
          <div class="summary-card">
            <h4>Healthy Stock</h4>
            <p>${inventory.length - lowStockItems.length}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Current Stock</th>
              <th>Min Required</th>
              <th>Unit Price</th>
              <th>Total Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${inventory.map((item, idx) => {
              const isLow = item.quantity <= item.min_quantity;
              return `
                <tr class="${isLow ? 'low' : ''}">
                  <td>${idx + 1}</td>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>${item.min_quantity} ${item.unit}</td>
                  <td>₹${item.price_per_unit}</td>
                  <td>₹${(item.quantity * item.price_per_unit).toFixed(2)}</td>
                  <td style="color: ${isLow ? '#d97706' : '#16a34a'}; font-weight: bold;">
                    ${isLow ? '⚠️ Low' : '✅ OK'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f3f4f6; font-weight: bold;">
              <td colspan="5" style="text-align: right;">Total Inventory Value:</td>
              <td colspan="2">₹${totalValue.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <p>Generated by BillByteKOT - Restaurant Management System</p>
          <p>${businessSettings?.address || ''}</p>
        </div>

        <div class="no-print">
          <button class="btn btn-primary" onclick="window.print()">🖨️ Print Report</button>
          <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('Inventory report ready for printing!');
  };

  // Export inventory to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Item Name', 'Quantity', 'Unit', 'Min Quantity', 'Price per Unit', 'Total Value', 'Status'],
      ...inventory.map(item => [
        item.name,
        item.quantity,
        item.unit,
        item.min_quantity,
        item.price_per_unit,
        (item.quantity * item.price_per_unit).toFixed(2),
        item.quantity <= item.min_quantity ? 'Low Stock' : 'OK'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Inventory exported to CSV!');
  };

  // Generate UPI QR Code
  const generateUPIQR = (amount, note) => {
    const upiId = qrData.upiId || businessSettings?.upi_id || '';
    if (!upiId) {
      toast.error('Please enter UPI ID');
      return null;
    }
    
    const merchantName = businessSettings?.restaurant_name || 'Restaurant';
    // UPI deep link format
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note || 'Payment')}`;
    
    // Use QR code API to generate image
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
  };

  // Open QR Modal for payment
  const openQRModal = (amount = '', note = '') => {
    setQrData({
      upiId: businessSettings?.upi_id || '',
      amount: amount,
      note: note || 'Inventory Purchase'
    });
    setQrModalOpen(true);
  };

  // Print QR Code
  const handlePrintQR = () => {
    const qrUrl = generateUPIQR(qrData.amount, qrData.note);
    if (!qrUrl) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>UPI Payment QR - ${businessSettings?.restaurant_name || 'Restaurant'}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0;
            padding: 20px;
            background: #f3f4f6;
          }
          .qr-card {
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 350px;
          }
          .logo { font-size: 40px; margin-bottom: 10px; }
          h1 { margin: 0 0 5px 0; color: #7c3aed; font-size: 22px; }
          .subtitle { color: #666; margin-bottom: 20px; font-size: 14px; }
          .qr-container {
            background: white;
            padding: 15px;
            border-radius: 15px;
            border: 3px solid #7c3aed;
            display: inline-block;
            margin: 15px 0;
          }
          .qr-container img { display: block; }
          .amount {
            font-size: 32px;
            font-weight: bold;
            color: #16a34a;
            margin: 15px 0;
          }
          .note { color: #666; font-size: 14px; margin-bottom: 15px; }
          .upi-id {
            background: #f3f4f6;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            color: #374151;
          }
          .footer { margin-top: 20px; font-size: 11px; color: #9ca3af; }
          .apps { margin-top: 15px; font-size: 12px; color: #666; }
          .no-print { margin-top: 20px; }
          .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin: 5px; }
          .btn-primary { background: #7c3aed; color: white; }
          .btn-secondary { background: #6b7280; color: white; }
          @media print { 
            .no-print { display: none; } 
            body { background: white; }
            .qr-card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="qr-card">
          <div class="logo">📱</div>
          <h1>${businessSettings?.restaurant_name || 'Restaurant'}</h1>
          <p class="subtitle">Scan to Pay with UPI</p>
          
          <div class="qr-container">
            <img src="${qrUrl}" alt="UPI QR Code" width="220" height="220" />
          </div>
          
          ${qrData.amount ? `<div class="amount">₹${qrData.amount}</div>` : ''}
          ${qrData.note ? `<p class="note">${qrData.note}</p>` : ''}
          
          <div class="upi-id">${qrData.upiId}</div>
          
          <p class="apps">Pay using GPay, PhonePe, Paytm, or any UPI app</p>
          <p class="footer">Powered by BillByteKOT</p>
        </div>

        <div class="no-print">
          <button class="btn btn-primary" onclick="window.print()">🖨️ Print QR</button>
          <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="inventory-page">
        <TrialBanner user={user} />
        {/* Low Stock Alert Banner */}
        {lowStock.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">Low Stock Alert!</h3>
                <p className="text-sm text-orange-800 mt-1">
                  {lowStock.length} item{lowStock.length > 1 ? 's' : ''} running low on stock. Restock soon to avoid shortages.
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {lowStock.slice(0, 3).map(item => (
                    <span key={item.id} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      {item.name}: {item.quantity} {item.unit}
                    </span>
                  ))}
                  {lowStock.length > 3 && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      +{lowStock.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Inventory Management</h1>
            <p className="text-gray-600 mt-2">Track stock levels and supplies</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Print & Export Buttons */}
            <Button variant="outline" onClick={handlePrintInventory} title="Print Inventory Report">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportCSV} title="Export to CSV">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={() => openQRModal()} 
              className="border-green-500 text-green-600 hover:bg-green-50"
              title="Generate UPI QR Code"
            >
              <QrCode className="w-4 h-4 mr-2" />
              UPI QR
            </Button>
            {['admin', 'cashier'].includes(user?.role) && (
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600" data-testid="add-inventory-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="inventory-dialog">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Item Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        data-testid="inventory-name-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          required
                          data-testid="inventory-quantity-input"
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Input
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          placeholder="kg, liters, pieces"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Min Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.min_quantity}
                          onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Price per Unit (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price_per_unit}
                          onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="save-inventory-button">
                        {editingItem ? 'Update' : 'Create'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={filterLowStock ? "default" : "outline"}
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={filterLowStock ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            <Filter className="w-4 h-4 mr-2" />
            {filterLowStock ? 'Showing Low Stock' : 'Filter Low Stock'}
            {lowStock.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {lowStock.length}
              </span>
            )}
          </Button>
        </div>

        {/* Bulk Upload Component */}
        {['admin', 'manager'].includes(user?.role) && (
          <BulkUpload 
            type="inventory" 
            onSuccess={() => {
              fetchInventory();
              fetchLowStock();
            }}
          />
        )}

        {lowStock.length > 0 && (
          <Card className="border-0 shadow-lg border-l-4 border-l-orange-500" data-testid="low-stock-alert">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-orange-50 rounded-md">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-orange-700">{item.quantity} {item.unit} (Min: {item.min_quantity})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => {
            const isLowStock = item.quantity <= item.min_quantity;
            return (
              <Card
                key={item.id}
                className={`card-hover border-0 shadow-lg ${isLowStock ? 'border-l-4 border-l-orange-500' : ''}`}
                data-testid={`inventory-item-${item.id}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-xs text-gray-500">₹{item.price_per_unit}/{item.unit}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className={`font-bold ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Min Required:</span>
                      <span className="text-sm">{item.min_quantity} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Value:</span>
                      <span className="text-sm font-medium">₹{(item.quantity * item.price_per_unit).toFixed(2)}</span>
                    </div>
                    {['admin', 'cashier'].includes(user?.role) && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEdit(item)}
                          data-testid={`edit-inventory-${item.id}`}
                        >
                          Update Stock
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => openQRModal((item.min_quantity - item.quantity) * item.price_per_unit, `Restock: ${item.name}`)}
                          title="Generate QR for restock payment"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredInventory.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterLowStock ? 'No items match your search/filter' : 'No inventory items found'}
              </p>
            </div>
          )}
        </div>

        {/* UPI QR Code Modal */}
        {qrModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Generate UPI Payment QR
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label>UPI ID *</Label>
                  <Input
                    placeholder="yourname@upi or 9876543210@paytm"
                    value={qrData.upiId}
                    onChange={(e) => setQrData({ ...qrData, upiId: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your UPI ID (GPay, PhonePe, Paytm, etc.)</p>
                </div>

                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount (optional)"
                    value={qrData.amount}
                    onChange={(e) => setQrData({ ...qrData, amount: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Payment Note</Label>
                  <Input
                    placeholder="e.g., Inventory Purchase"
                    value={qrData.note}
                    onChange={(e) => setQrData({ ...qrData, note: e.target.value })}
                    className="mt-1"
                  />
                </div>

                {/* QR Preview */}
                {qrData.upiId && (
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-3">QR Code Preview</p>
                    <img 
                      src={generateUPIQR(qrData.amount, qrData.note)} 
                      alt="UPI QR Code" 
                      className="mx-auto rounded-lg border-4 border-green-500"
                      style={{ width: 180, height: 180 }}
                    />
                    {qrData.amount && (
                      <p className="text-2xl font-bold text-green-600 mt-3">₹{qrData.amount}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handlePrintQR}
                    disabled={!qrData.upiId}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print QR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setQrModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500">
                  Scan with any UPI app: GPay, PhonePe, Paytm, BHIM, etc.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InventoryPage;
