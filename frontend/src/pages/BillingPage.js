import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, CreditCard, Wallet, Smartphone, Download, MessageCircle, X, ArrowLeft, Check, Plus, Minus, Trash2, Search } from 'lucide-react';
import { printReceipt } from '../utils/printUtils';

const BillingPage = ({ user }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percent'
  const [discountValue, setDiscountValue] = useState('');
  const [customTaxRate, setCustomTaxRate] = useState(null);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchOrder();
    fetchBusinessSettings();
    fetchMenuItems();
  }, [orderId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
      setOrderItems(response.data.items || []);
      if (response.data.customer_phone) {
        setWhatsappPhone(response.data.customer_phone);
      }
      // Load existing discount
      if (response.data.discount || response.data.discount_amount) {
        setDiscount(response.data.discount || response.data.discount_amount || 0);
        setDiscountType(response.data.discount_type || 'amount');
        setDiscountValue(response.data.discount_value || response.data.discount || '');
      }
    } catch (error) {
      toast.error('Failed to fetch order');
      navigate('/orders');
    }
  };

  const fetchBusinessSettings = async () => {
    try {
      const response = await axios.get(`${API}/business/settings`);
      setBusinessSettings(response.data.business_settings);
    } catch (error) {
      console.error('Failed to fetch business settings', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      const items = Array.isArray(response.data) ? response.data : [];
      setMenuItems(items.filter(item => item.available));
    } catch (error) {
      console.error('Failed to fetch menu items', error);
    }
  };

  const getCurrencySymbol = () => {
    const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' };
    return symbols[businessSettings?.currency || 'INR'] || '₹';
  };

  const getEffectiveTaxRate = () => {
    if (customTaxRate !== null) return customTaxRate;
    if (order?.tax_rate !== undefined) return order.tax_rate;
    if (order?.subtotal > 0 && order?.tax !== undefined) {
      return Math.round((order.tax / order.subtotal) * 100 * 100) / 100;
    }
    return businessSettings?.tax_rate ?? 5;
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    const value = parseFloat(discountValue) || 0;
    if (discountType === 'percent') {
      return (subtotal * value) / 100;
    }
    return value;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discountAmt = calculateDiscountAmount();
    const taxableAmount = subtotal - discountAmt;
    return (taxableAmount * getEffectiveTaxRate()) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscountAmount();
  };

  // Add menu item from dropdown
  const handleAddMenuItem = (menuItem) => {
    const existingIndex = orderItems.findIndex(item => item.menu_item_id === menuItem.id);
    if (existingIndex !== -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += 1;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        notes: ''
      }]);
    }
    setShowMenuDropdown(false);
    setMenuSearch('');
    toast.success(`Added: ${menuItem.name}`);
  };

  // Manual item functions
  const handleAddManualItem = () => {
    const name = manualItemName.trim();
    const price = parseFloat(manualItemPrice) || 0;
    
    if (!name) {
      toast.error('Enter item name');
      return;
    }
    if (price <= 0) {
      toast.error('Enter valid price');
      return;
    }
    
    setOrderItems([...orderItems, {
      menu_item_id: `manual_${Date.now()}`,
      name: name,
      price: price,
      quantity: 1,
      notes: 'Manual entry'
    }]);
    
    setManualItemName('');
    setManualItemPrice('');
    toast.success(`Added: ${name}`);
  };

  const handleItemQuantityChange = (index, delta) => {
    const updated = [...orderItems];
    const newQty = updated[index].quantity + delta;
    if (newQty < 1) {
      // Remove item if quantity goes to 0
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setOrderItems(updated);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Update order with new items before payment
  const updateOrderItems = async () => {
    if (orderItems.length === 0) {
      toast.error('Order must have at least one item');
      return false;
    }
    
    try {
      const subtotal = calculateSubtotal();
      const discountAmt = calculateDiscountAmount();
      const tax = calculateTax();
      const total = calculateTotal();
      
      await axios.put(`${API}/orders/${orderId}`, {
        items: orderItems,
        subtotal: subtotal - discountAmt, // Store subtotal after discount
        tax,
        tax_rate: getEffectiveTaxRate(),
        total,
        discount: discountAmt,
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        discount_amount: discountAmt
      });
      
      // Update local order state
      setOrder(prev => ({
        ...prev,
        items: orderItems,
        subtotal: subtotal - discountAmt,
        tax,
        total
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to update order items:', error);
      toast.error('Failed to update order');
      return false;
    }
  };

  const releaseTable = async () => {
    const kotEnabled = businessSettings?.kot_mode_enabled !== false;
    if (!kotEnabled || !order?.table_id || order.table_id === 'counter') return;
    
    try {
      const tableResponse = await axios.get(`${API}/tables/${order.table_id}`);
      await axios.put(`${API}/tables/${order.table_id}`, {
        table_number: tableResponse.data.table_number,
        capacity: tableResponse.data.capacity || 4,
        status: 'available',
        current_order_id: null
      });
      toast.success(`Table ${order.table_number} released`);
    } catch (error) {
      console.error('Failed to release table:', error);
    }
  };

  const handlePayment = async () => {
    if (!order) return;
    
    // First update order items if changed
    const updated = await updateOrderItems();
    if (!updated) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/payments/create-order`, {
        order_id: orderId,
        amount: calculateTotal(),
        payment_method: paymentMethod
      });
      
      await axios.put(`${API}/orders/${orderId}`, { 
        status: 'completed',
        payment_method: paymentMethod,
        discount: calculateDiscountAmount(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        discount_amount: calculateDiscountAmount(),
        total: calculateTotal()
      });
      
      toast.success('Payment completed!');
      setPaymentCompleted(true);
      await releaseTable();
      
      // Use updated order for printing - include discount
      const discountAmt = calculateDiscountAmount();
      const updatedOrder = { 
        ...order, 
        items: orderItems, 
        subtotal: calculateSubtotal(), 
        tax: calculateTax(), 
        total: calculateTotal(),
        discount: discountAmt,
        discount_amount: discountAmt,
        tax_rate: getEffectiveTaxRate()
      };
      printReceipt(updatedOrder, businessSettings);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsappShare = async () => {
    if (!whatsappPhone.trim()) {
      toast.error('Enter phone number');
      return;
    }
    try {
      const response = await axios.post(`${API}/whatsapp/send-receipt/${orderId}`, {
        phone_number: whatsappPhone,
        customer_name: order?.customer_name
      });
      window.open(response.data.whatsapp_link, '_blank');
      setShowWhatsappModal(false);
    } catch (error) {
      toast.error('Failed to share');
    }
  };

  const downloadBillPDF = async () => {
    if (!order) return;
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const currency = getCurrencySymbol();
      const restaurantName = businessSettings?.restaurant_name || 'Restaurant';
      
      // Header
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text(restaurantName, 15, 20);
      doc.setFontSize(10);
      doc.text('INVOICE', 195, 15, { align: 'right' });
      doc.text(`#${order.invoice_number || order.id.slice(0, 8).toUpperCase()}`, 195, 25, { align: 'right' });
      
      // Info
      let y = 55;
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 15, y);
      doc.text(`Time: ${new Date(order.created_at).toLocaleTimeString()}`, 100, y);
      if (order.table_number) doc.text(`Table: ${order.table_number}`, 160, y);
      y += 8;
      if (order.customer_name) { doc.text(`Customer: ${order.customer_name}`, 15, y); y += 6; }
      if (businessSettings?.address) { doc.text(businessSettings.address, 15, y); y += 6; }
      if (businessSettings?.gstin) { doc.text(`GSTIN: ${businessSettings.gstin}`, 15, y); y += 6; }
      
      // Items header
      y += 5;
      doc.setFillColor(245, 245, 250);
      doc.rect(15, y - 5, 180, 10, 'F');
      doc.setFont(undefined, 'bold');
      doc.text('Item', 20, y);
      doc.text('Qty', 120, y, { align: 'center' });
      doc.text('Price', 150, y, { align: 'right' });
      doc.text('Total', 190, y, { align: 'right' });
      y += 8;
      
      // Items
      doc.setFont(undefined, 'normal');
      orderItems.forEach(item => {
        doc.text(item.name.substring(0, 30), 20, y);
        doc.text(item.quantity.toString(), 120, y, { align: 'center' });
        doc.text(`${currency}${item.price}`, 150, y, { align: 'right' });
        doc.text(`${currency}${(item.quantity * item.price).toFixed(2)}`, 190, y, { align: 'right' });
        y += 7;
      });
      
      // Totals
      y += 5;
      doc.line(15, y, 195, y);
      y += 8;
      doc.text('Subtotal:', 140, y);
      doc.text(`${currency}${calculateSubtotal().toFixed(2)}`, 190, y, { align: 'right' });
      y += 6;
      doc.text(`Tax (${getEffectiveTaxRate()}%):`, 140, y);
      doc.text(`${currency}${calculateTax().toFixed(2)}`, 190, y, { align: 'right' });
      if (discount > 0) {
        y += 6;
        doc.setTextColor(34, 197, 94);
        doc.text('Discount:', 140, y);
        doc.text(`-${currency}${discount.toFixed(2)}`, 190, y, { align: 'right' });
        doc.setTextColor(50, 50, 50);
      }
      y += 8;
      doc.setFillColor(124, 58, 237);
      doc.rect(130, y - 5, 65, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL:', 135, y + 2);
      doc.text(`${currency}${calculateTotal().toFixed(2)}`, 190, y + 2, { align: 'right' });
      
      // Footer
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Thank you for your visit!', 105, 270, { align: 'center' });
      doc.setFontSize(7);
      doc.text('Generated by BillByteKOT • billbytekot.in', 105, 280, { align: 'center' });
      
      doc.save(`Invoice-${order.invoice_number || order.id.slice(0, 8)}.pdf`);
      toast.success('Invoice downloaded!');
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  if (!order) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  const currency = getCurrencySymbol();


  return (
    <Layout user={user}>
      <div className="max-w-6xl mx-auto pb-2 px-2 lg:px-4">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          {/* Left Column - Items */}
          <div>
            {/* Order Items */}
            <Card className="border-0 shadow-lg h-fit">
          <CardContent className="p-3 lg:p-4">
            {/* Add Item Section - Compact */}
            <div className="mb-2 pb-2 border-b border-dashed">
              {/* Menu Item Search/Dropdown */}
              <div className="relative mb-1.5" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search menu..."
                    value={menuSearch}
                    onChange={(e) => {
                      setMenuSearch(e.target.value);
                      setShowMenuDropdown(true);
                    }}
                    onFocus={() => setShowMenuDropdown(true)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                
                {/* Menu Dropdown */}
                {showMenuDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {menuItems
                      .filter(item => item.name.toLowerCase().includes(menuSearch.toLowerCase()))
                      .slice(0, 10)
                      .map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleAddMenuItem(item)}
                          className="w-full px-2 py-2 text-left hover:bg-violet-50 flex justify-between items-center text-sm border-b last:border-b-0"
                        >
                          <span className="font-medium truncate">{item.name}</span>
                          <span className="text-violet-600 font-bold ml-2">{currency}{item.price}</span>
                        </button>
                      ))}
                    {menuItems.filter(item => item.name.toLowerCase().includes(menuSearch.toLowerCase())).length === 0 && (
                      <div className="px-2 py-2 text-gray-500 text-sm">No items found</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Manual Item Entry */}
              <div className="flex gap-1.5">
                <Input
                  placeholder="Custom item"
                  value={manualItemName}
                  onChange={(e) => setManualItemName(e.target.value)}
                  className="flex-1 h-9 text-sm"
                />
                <Input
                  type="number"
                  placeholder="₹"
                  value={manualItemPrice}
                  onChange={(e) => setManualItemPrice(e.target.value)}
                  className="w-16 h-9 text-sm"
                  min="0"
                />
                <Button 
                  size="sm" 
                  onClick={handleAddManualItem}
                  className="h-9 px-3 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Items List - Compact & Scrollable */}
            <div className="space-y-1.5 max-h-[28vh] lg:max-h-[45vh] overflow-y-auto pr-1">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-0.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button 
                        onClick={() => handleItemQuantityChange(idx, -1)}
                        className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleItemQuantityChange(idx, 1)}
                        className="w-6 h-6 bg-violet-600 hover:bg-violet-700 text-white rounded flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-medium text-sm truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-semibold text-sm">{currency}{(item.price * item.quantity).toFixed(0)}</span>
                    <button 
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-400 hover:text-red-600 p-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals - Compact */}
            <div className="mt-2 pt-2 border-t border-dashed space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{currency}{calculateSubtotal().toFixed(0)}</span>
              </div>
              {calculateDiscountAmount() > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                  <span>-{currency}{calculateDiscountAmount().toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-gray-600">
                <div className="flex items-center gap-1">
                  <span>Tax</span>
                  <select
                    value={customTaxRate !== null ? customTaxRate : getEffectiveTaxRate()}
                    onChange={(e) => setCustomTaxRate(Number(e.target.value))}
                    className="text-xs px-1.5 py-0.5 border rounded bg-gray-50"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <span>{currency}{calculateTax().toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-1 border-t">
                <span>Total</span>
                <span className="text-violet-600">{currency}{calculateTotal().toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Right Column - Payment & Actions */}
          <div className="space-y-2 lg:space-y-4">
            {/* Discount + Payment Combined on Mobile */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-3 lg:p-4">
                {/* Discount Row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700 shrink-0">Discount:</span>
                  <select
                    value={discountType}
                    onChange={(e) => {
                      setDiscountType(e.target.value);
                      setDiscountValue('');
                    }}
                    className="h-8 px-2 border rounded bg-white text-sm"
                  >
                    <option value="amount">₹</option>
                    <option value="percent">%</option>
                  </select>
                  <Input
                    type="number"
                    placeholder={discountType === 'percent' ? '%' : '₹'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="flex-1 h-8 text-sm"
                    min="0"
                    max={discountType === 'percent' ? 100 : undefined}
                  />
                  {/* Quick Discount Buttons - Inline */}
                  <div className="hidden sm:flex gap-1">
                    {[5, 10, 15].map(pct => (
                      <button
                        key={pct}
                        onClick={() => {
                          setDiscountType('percent');
                          setDiscountValue(pct.toString());
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          discountType === 'percent' && discountValue === pct.toString()
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Methods - Horizontal */}
                <div className="flex gap-2 mb-2">
                  {[
                    { id: 'cash', icon: Wallet, label: 'Cash', color: '#22c55e' },
                    { id: 'card', icon: CreditCard, label: 'Card', color: '#3b82f6' },
                    { id: 'upi', icon: Smartphone, label: 'UPI', color: '#8b5cf6' }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        paymentMethod === method.id
                          ? 'text-white shadow-md'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      style={paymentMethod === method.id ? { backgroundColor: method.color } : {}}
                    >
                      <method.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>

                {/* Pay Button */}
                {!paymentCompleted ? (
                  <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-lg shadow-lg"
                  >
                    {loading ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>Pay {currency}{calculateTotal().toFixed(0)}</>
                    )}
                  </Button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-green-800 text-sm">Payment Done!</p>
                        <p className="text-xs text-green-600">{currency}{calculateTotal().toFixed(0)} via {paymentMethod}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons - Compact */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const discountAmt = calculateDiscountAmount();
                  const updatedOrder = { 
                    ...order, 
                    items: orderItems, 
                    subtotal: calculateSubtotal(), 
                    tax: calculateTax(), 
                    total: calculateTotal(),
                    discount: discountAmt,
                    discount_amount: discountAmt,
                    tax_rate: getEffectiveTaxRate()
                  };
                  printReceipt(updatedOrder, businessSettings);
                }}
                className="flex-1 h-10"
              >
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={downloadBillPDF}
                className="flex-1 h-10"
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWhatsappModal(true)}
                className="flex-1 h-10 border-green-500 text-green-600 hover:bg-green-50"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>

            {/* Back to Orders */}
            {paymentCompleted && (
              <Button
                variant="ghost"
                onClick={() => navigate('/orders')}
                className="w-full h-9"
              >
                ← Back to Orders
              </Button>
            )}
          </div>
        </div>

        {/* WhatsApp Modal */}
        {showWhatsappModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Share via WhatsApp</h3>
                  <button onClick={() => setShowWhatsappModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <Input
                  placeholder="+91 9876543210"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="mb-4"
                />
                <Button
                  onClick={handleWhatsappShare}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Receipt
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BillingPage;
