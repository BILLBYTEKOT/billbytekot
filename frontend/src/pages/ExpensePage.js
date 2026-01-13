import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import TrialBanner from '../components/TrialBanner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, DollarSign, Calendar, Download, RefreshCw, Edit, Trash2, Search, TrendingDown, PieChart, CreditCard, Wallet, Smartphone, Building, Receipt } from 'lucide-react';

const EXPENSE_CATEGORIES = ["Rent", "Utilities", "Salaries", "Supplies", "Maintenance", "Marketing", "Insurance", "Taxes", "Equipment", "Transportation", "Food & Ingredients", "Cleaning", "Licenses", "Professional Services", "Other"];

const ExpensePage = ({ user }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('month');
  const [summary, setSummary] = useState({ total: 0, count: 0, by_category: {}, by_payment_method: {} });
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], amount: '', category: '', description: '', payment_method: 'cash', vendor_name: '', notes: '' });

  useEffect(() => { fetchExpenses(); fetchSummary(); }, [filterDateRange, filterCategory]);

  const getDateRange = () => {
    const today = new Date();
    let start, end;
    switch (filterDateRange) {
      case 'today': start = end = today.toISOString().split('T')[0]; break;
      case 'week': const ws = new Date(today); ws.setDate(today.getDate() - 7); start = ws.toISOString().split('T')[0]; end = today.toISOString().split('T')[0]; break;
      case 'month': start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]; end = today.toISOString().split('T')[0]; break;
      case 'year': start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]; end = today.toISOString().split('T')[0]; break;
      default: start = ''; end = '';
    }
    return { start, end };
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const params = new URLSearchParams();
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);
      if (filterCategory && filterCategory !== 'all') params.append('category', filterCategory);
      const response = await axios.get(`${API}/expenses?${params.toString()}`);
      setExpenses(response.data || []);
    } catch (error) { console.error('Failed to fetch expenses:', error); toast.error('Failed to fetch expenses'); }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const { start, end } = getDateRange();
      const params = new URLSearchParams();
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);
      const response = await axios.get(`${API}/expenses/summary?${params.toString()}`);
      setSummary(response.data || { total: 0, count: 0, by_category: {}, by_payment_method: {} });
    } catch (error) { console.error('Failed to fetch summary:', error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) { toast.error('Please enter a valid amount'); return; }
    if (!formData.category) { toast.error('Please select a category'); return; }
    if (!formData.description.trim()) { toast.error('Please enter a description'); return; }
    try {
      const submitData = { ...formData, amount: parseFloat(formData.amount) };
      if (editingExpense) { await axios.put(`${API}/expenses/${editingExpense.id}`, submitData); toast.success('Expense updated!'); }
      else { await axios.post(`${API}/expenses`, submitData); toast.success('Expense added!'); }
      setDialogOpen(false); resetForm(); fetchExpenses(); fetchSummary();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to save expense'); }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({ date: expense.date, amount: expense.amount.toString(), category: expense.category, description: expense.description, payment_method: expense.payment_method || 'cash', vendor_name: expense.vendor_name || '', notes: expense.notes || '' });
    setDialogOpen(true);
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete expense: ${expense.description}?`)) return;
    try { await axios.delete(`${API}/expenses/${expense.id}`); toast.success('Expense deleted!'); fetchExpenses(); fetchSummary(); }
    catch (error) { toast.error('Failed to delete expense'); }
  };

  const resetForm = () => { setFormData({ date: new Date().toISOString().split('T')[0], amount: '', category: '', description: '', payment_method: 'cash', vendor_name: '', notes: '' }); setEditingExpense(null); };

  const filteredExpenses = useMemo(() => expenses.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || (e.vendor_name && e.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()))), [expenses, searchTerm]);

  const handleExportCSV = () => {
    const csvContent = [['Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Vendor'], ...filteredExpenses.map(e => [e.date, e.category, e.description, e.amount, e.payment_method, e.vendor_name || ''])].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    window.URL.revokeObjectURL(url); toast.success('Exported to CSV!');
  };

  const getCategoryColor = (cat) => ({ 'Rent': 'bg-red-100 text-red-700', 'Utilities': 'bg-yellow-100 text-yellow-700', 'Salaries': 'bg-blue-100 text-blue-700', 'Supplies': 'bg-green-100 text-green-700', 'Maintenance': 'bg-orange-100 text-orange-700', 'Marketing': 'bg-purple-100 text-purple-700', 'Food & Ingredients': 'bg-emerald-100 text-emerald-700' }[cat] || 'bg-gray-100 text-gray-700');
  const PaymentIcon = ({ method }) => { const Icon = { cash: Wallet, card: CreditCard, upi: Smartphone, bank_transfer: Building }[method] || Wallet; return <Icon className="w-4 h-4" />; };

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <TrialBanner user={user} />
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3"><TrendingDown className="w-8 h-8" />Expense Management</h1>
                <p className="text-white/80 mt-2">Track and manage your business expenses</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" size="sm" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" />Export</Button>
                <Button variant="secondary" size="sm" onClick={() => { fetchExpenses(); fetchSummary(); }}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4"><DollarSign className="w-6 h-6 mb-2" /><div className="text-2xl font-bold">₹{summary.total.toFixed(0)}</div><div className="text-sm text-white/70">Total Expenses</div></div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4"><Receipt className="w-6 h-6 mb-2" /><div className="text-2xl font-bold">{summary.count}</div><div className="text-sm text-white/70">Transactions</div></div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4"><PieChart className="w-6 h-6 mb-2" /><div className="text-2xl font-bold">{Object.keys(summary.by_category).length}</div><div className="text-sm text-white/70">Categories</div></div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4"><Calendar className="w-6 h-6 mb-2" /><div className="text-2xl font-bold">₹{summary.count > 0 ? (summary.total / summary.count).toFixed(0) : 0}</div><div className="text-sm text-white/70">Avg per Transaction</div></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1 min-w-[200px] relative"><Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
            <Select value={filterDateRange} onValueChange={setFilterDateRange}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">Last 7 Days</SelectItem><SelectItem value="month">This Month</SelectItem><SelectItem value="year">This Year</SelectItem><SelectItem value="all">All Time</SelectItem></SelectContent></Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select>
            {['admin', 'cashier'].includes(user?.role) && <Button className="bg-gradient-to-r from-red-600 to-orange-600" onClick={() => { resetForm(); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Expense</Button>}
          </div>
        </div>
        <Card className="border-0 shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-red-600" />Expenses ({filteredExpenses.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            : filteredExpenses.length === 0 ? <div className="text-center py-12"><TrendingDown className="w-16 h-16 mx-auto text-gray-300 mb-4" /><h3 className="text-lg font-medium mb-2">No expenses found</h3><p className="text-gray-500 mb-4">Add your first expense to start tracking</p>{['admin', 'cashier'].includes(user?.role) && <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-gradient-to-r from-red-600 to-orange-600"><Plus className="w-4 h-4 mr-2" />Add First Expense</Button>}</div>
            : <div className="space-y-3">{filteredExpenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white"><PaymentIcon method={expense.payment_method} /></div>
                    <div><p className="font-semibold">{expense.description}</p><div className="flex items-center gap-2 text-sm text-gray-500"><span>{expense.date}</span>{expense.vendor_name && <span> {expense.vendor_name}</span>}</div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getCategoryColor(expense.category)}>{expense.category}</Badge>
                    <span className="text-lg font-bold text-red-600">₹{expense.amount.toFixed(2)}</span>
                    {['admin', 'cashier'].includes(user?.role) && <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => handleEdit(expense)}><Edit className="w-4 h-4" /></Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(expense)}><Trash2 className="w-4 h-4" /></Button></div>}
                  </div>
                </div>
              ))}</div>}
          </CardContent>
        </Card>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingDown className="w-5 h-5" />{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date *</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
                <div><Label>Amount (₹) *</Label><Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required placeholder="0.00" /></div>
              </div>
              <div><Label>Category *</Label><Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Description *</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required placeholder="What was this expense for?" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Payment Method</Label><Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem></SelectContent></Select></div>
                <div><Label>Vendor Name</Label><Input value={formData.vendor_name} onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} placeholder="Optional" /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Additional notes..." /></div>
              <div className="flex gap-3"><Button type="submit" className="flex-1 bg-gradient-to-r from-red-600 to-orange-600">{editingExpense ? 'Update' : 'Add'} Expense</Button><Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ExpensePage;
