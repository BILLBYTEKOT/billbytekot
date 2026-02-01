import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Sparkles, 
  Calendar,
  ShoppingBag,
  Users as UsersIcon,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';

const ReportsPage = ({ user }) => {
  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [bestSelling, setBestSelling] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    await Promise.all([
      fetchDailyReport(),
      fetchWeeklyReport(),
      fetchMonthlyReport(),
      fetchBestSelling(),
      fetchStaffPerformance(),
      fetchPeakHours(),
      fetchCategoryAnalysis(),
      fetchForecast()
    ]);
  };

  const fetchDailyReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/daily`);
      setDailyReport(response.data);
    } catch (error) {
      console.error('Failed to fetch daily report', error);
    }
  };

  const fetchWeeklyReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/weekly`);
      setWeeklyReport(response.data);
    } catch (error) {
      console.error('Failed to fetch weekly report', error);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/monthly`);
      setMonthlyReport(response.data);
    } catch (error) {
      console.error('Failed to fetch monthly report', error);
    }
  };

  const fetchBestSelling = async () => {
    try {
      const response = await axios.get(`${API}/reports/best-selling`);
      setBestSelling(response.data);
    } catch (error) {
      console.error('Failed to fetch best selling items', error);
    }
  };

  const fetchStaffPerformance = async () => {
    try {
      const response = await axios.get(`${API}/reports/staff-performance`);
      setStaffPerformance(response.data);
    } catch (error) {
      console.error('Failed to fetch staff performance', error);
    }
  };

  const fetchPeakHours = async () => {
    try {
      const response = await axios.get(`${API}/reports/peak-hours`);
      setPeakHours(response.data);
    } catch (error) {
      console.error('Failed to fetch peak hours', error);
    }
  };

  const fetchCategoryAnalysis = async () => {
    try {
      const response = await axios.get(`${API}/reports/category-analysis`);
      setCategoryAnalysis(response.data);
    } catch (error) {
      console.error('Failed to fetch category analysis', error);
    }
  };

  const fetchForecast = async () => {
    try {
      const response = await axios.post(`${API}/ai/sales-forecast`);
      setForecast(response.data);
    } catch (error) {
      console.error('Failed to fetch forecast', error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/export`, {
        params: dateRange
      });

      // Convert to CSV
      const orders = response.data.orders;
      if (orders.length === 0) {
        toast.error('No data found for selected date range');
        return;
      }

      const csvContent = [
        ['Order ID', 'Table', 'Waiter', 'Customer', 'Items', 'Subtotal', 'Tax', 'Total', 'Status', 'Date'],
        ...orders.map(order => [
          order.id,
          order.table_number,
          order.waiter_name,
          order.customer_name || 'N/A',
          order.items.map(i => `${i.quantity}x ${i.name}`).join('; '),
          order.subtotal.toFixed(2),
          order.tax.toFixed(2),
          order.total.toFixed(2),
          order.status,
          new Date(order.created_at).toLocaleString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `restaurant-report-${dateRange.start_date}-to-${dateRange.end_date}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  // PDF Export with Desktop Support
  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/export`, {
        params: dateRange,
      });

      const orders = response.data.orders;
      if (!orders || orders.length === 0) {
        toast.error("No data found for selected date range");
        return;
      }

      // Calculate totals
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalTax = orders.reduce((sum, order) => sum + order.tax, 0);
      const totalSubtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);

      // Check if running in Electron desktop app
      const isElectron = window.electronAPI?.isElectron || window.__ELECTRON__;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sales Report - ${dateRange.start_date} to ${dateRange.end_date}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              color: #1f2937;
              margin: 0;
              padding: 15px;
            }
            .header {
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
              color: white;
              border-radius: 12px;
              margin-bottom: 20px;
            }
            .header h1 { margin: 0 0 5px 0; font-size: 24px; }
            .header p { margin: 3px 0; opacity: 0.9; }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            .summary-card h3 {
              margin: 0 0 5px 0;
              font-size: 14px;
              color: #666;
            }
            .summary-card p {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
              color: #7c3aed;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #7c3aed;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .total-row {
              background-color: #e5e7eb;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${user?.business_settings?.restaurant_name || 'Restaurant'}</h1>
            <p>Sales Report</p>
            <p>${new Date(dateRange.start_date).toLocaleDateString()} - ${new Date(dateRange.end_date).toLocaleDateString()}</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h3>Total Orders</h3>
              <p>${totalOrders}</p>
            </div>
            <div class="summary-card">
              <h3>Total Sales</h3>
              <p>₹${totalSales.toFixed(2)}</p>
            </div>
            <div class="summary-card">
              <h3>Total Tax</h3>
              <p>₹${totalTax.toFixed(2)}</p>
            </div>
            <div class="summary-card">
              <h3>Avg Order</h3>
              <p>₹${(totalSales / totalOrders).toFixed(2)}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Table</th>
                <th>Waiter</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td>${order.id.slice(0, 8)}</td>
                  <td>${new Date(order.created_at).toLocaleDateString()}</td>
                  <td>${order.table_number}</td>
                  <td>${order.waiter_name}</td>
                  <td>${order.customer_name || 'N/A'}</td>
                  <td>${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                  <td>₹${order.subtotal.toFixed(2)}</td>
                  <td>₹${order.tax.toFixed(2)}</td>
                  <td>₹${order.total.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="6">TOTALS</td>
                <td>₹${totalSubtotal.toFixed(2)}</td>
                <td>₹${totalTax.toFixed(2)}</td>
                <td>₹${totalSales.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by BillByteKOT - Restaurant Management System</p>
            <p>${user?.business_settings?.address || ''} | ${user?.business_settings?.phone || ''}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print(); setTimeout(() => window.close(), 100);" 
              style="padding: 12px 24px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
              Save as PDF
            </button>
            <button onclick="window.close()" 
              style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-left: 10px;">
              Close
            </button>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Click "Save as PDF" and choose "Save as PDF" in the print dialog
            </p>
          </div>
        </body>
        </html>
      `;

      if (isElectron) {
        // DESKTOP FIX: Use blob URL instead of window.open for Electron
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Open with proper blob:// protocol that Windows can handle
        const printWindow = window.open(url, '_blank');
        
        // Cleanup blob URL after window opens
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else {
        // WEB VERSION: Use traditional window.open approach
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
      
      toast.success("PDF preview opened! Use Print dialog to save as PDF");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF report");
    } finally {
      setLoading(false);
    }
  };

  // Detailed Report with Desktop Support
  const handleDetailedReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/export`, {
        params: dateRange,
      });

      const orders = response.data.orders || [];
      
      if (!orders || orders.length === 0) {
        toast.error("No data found for selected date range");
        return;
      }
      
      // Calculate comprehensive analytics
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalTax = orders.reduce((sum, order) => sum + order.tax, 0);
      const totalSubtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      
      // Payment method breakdown
      const paymentMethods = {};
      orders.forEach(order => {
        const method = order.payment_method || 'cash';
        paymentMethods[method] = (paymentMethods[method] || 0) + order.total;
      });
      
      // Top items analysis
      const itemStats = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (!itemStats[item.name]) {
            itemStats[item.name] = { quantity: 0, revenue: 0 };
          }
          itemStats[item.name].quantity += item.quantity;
          itemStats[item.name].revenue += item.quantity * item.price;
        });
      });
      
      const topItems = Object.entries(itemStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10);

      // Check if running in Electron desktop app
      const isElectron = window.electronAPI?.isElectron || window.__ELECTRON__;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Detailed Business Report - ${dateRange.start_date} to ${dateRange.end_date}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              color: #1f2937;
              margin: 0;
              padding: 15px;
            }
            .header {
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
              color: white;
              border-radius: 12px;
              margin-bottom: 20px;
            }
            .header h1 { margin: 0 0 5px 0; font-size: 24px; }
            .header p { margin: 3px 0; opacity: 0.9; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            .summary-card {
              padding: 15px;
              border-radius: 10px;
              text-align: center;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
            }
            .summary-card h4 { margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; color: #666; }
            .summary-card p { margin: 0; font-size: 18px; font-weight: bold; color: #7c3aed; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 14px; font-weight: bold; color: #7c3aed; margin-bottom: 10px; border-bottom: 2px solid #7c3aed; padding-bottom: 5px; }
            .breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .breakdown-item { display: flex; justify-content: space-between; padding: 8px 12px; border-radius: 6px; margin-bottom: 5px; background: #f1f5f9; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 10px; }
            th { background: #7c3aed; color: white; font-weight: 600; }
            tr:nth-child(even) { background: #f9fafb; }
            .total-row { background: #e5e7eb; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #666; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Detailed Business Report</h1>
            <p>${user?.business_settings?.restaurant_name || 'Restaurant'}</p>
            <p>Period: ${new Date(dateRange.start_date).toLocaleDateString()} - ${new Date(dateRange.end_date).toLocaleDateString()}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <h4>Total Orders</h4>
              <p>${totalOrders}</p>
            </div>
            <div class="summary-card">
              <h4>Total Revenue</h4>
              <p>₹${totalSales.toFixed(2)}</p>
            </div>
            <div class="summary-card">
              <h4>Total Tax</h4>
              <p>₹${totalTax.toFixed(2)}</p>
            </div>
            <div class="summary-card">
              <h4>Avg Order Value</h4>
              <p>₹${(totalSales / totalOrders).toFixed(2)}</p>
            </div>
          </div>

          <div class="breakdown-grid">
            <div class="section">
              <div class="section-title">📈 Order Status Breakdown</div>
              <div class="breakdown-item">
                <span>Completed Orders</span>
                <span>${completedOrders} (${((completedOrders/totalOrders)*100).toFixed(1)}%)</span>
              </div>
              <div class="breakdown-item">
                <span>Pending Orders</span>
                <span>${pendingOrders} (${((pendingOrders/totalOrders)*100).toFixed(1)}%)</span>
              </div>
              <div class="breakdown-item">
                <span>Cancelled Orders</span>
                <span>${cancelledOrders} (${((cancelledOrders/totalOrders)*100).toFixed(1)}%)</span>
              </div>
            </div>
            <div class="section">
              <div class="section-title">💳 Payment Methods</div>
              ${Object.entries(paymentMethods).map(([method, amount]) => `
                <div class="breakdown-item">
                  <span style="text-transform: capitalize;">${method}</span>
                  <span>₹${amount.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">🏆 Top 10 Items by Revenue</div>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Item Name</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                ${topItems.map(([name, stats], index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${name}</td>
                    <td>${stats.quantity}</td>
                    <td>₹${stats.revenue.toFixed(2)}</td>
                    <td>${((stats.revenue/totalSales)*100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Generated by BillByteKOT - Restaurant Management System</p>
            <p>${user?.business_settings?.address || ''} | ${user?.business_settings?.phone || ''}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print(); setTimeout(() => window.close(), 100);" 
              style="padding: 12px 24px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
              Save as PDF
            </button>
            <button onclick="window.close()" 
              style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-left: 10px;">
              Close
            </button>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Click "Save as PDF" and choose "Save as PDF" in the print dialog
            </p>
          </div>
        </body>
        </html>
      `;

      if (isElectron) {
        // DESKTOP FIX: Use blob URL instead of window.open for Electron
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Open with proper blob:// protocol that Windows can handle
        const printWindow = window.open(url, '_blank');
        
        // Cleanup blob URL after window opens
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } else {
        // WEB VERSION: Use traditional window.open approach
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
      
      toast.success("Detailed report ready! Click 'Save as PDF' to download");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate detailed report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="reports-page">
        <div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive business insights and analytics</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Trends</TabsTrigger>
            <TabsTrigger value="items">Best Sellers</TabsTrigger>
            <TabsTrigger value="staff">Staff Performance</TabsTrigger>
            <TabsTrigger value="hours">Peak Hours</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div>
              {dailyReport && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-hover border-0 shadow-lg" data-testid="daily-orders-card">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Today's Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-violet-600">{dailyReport.total_orders}</p>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-lg" data-testid="daily-sales-card">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Today's Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">₹{dailyReport.total_sales.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-lg" data-testid="avg-order-card">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Avg Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">
                  ₹{dailyReport.total_orders > 0 ? (dailyReport.total_sales / dailyReport.total_orders).toFixed(2) : '0.00'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {forecast && (
          <Card className="border-0 shadow-lg" data-testid="forecast-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                AI Sales Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 p-4 bg-violet-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-violet-600">{forecast.current_stats.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-green-600">₹{forecast.current_stats.total_sales.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Order</p>
                    <p className="text-2xl font-bold text-blue-600">₹{forecast.current_stats.avg_order.toFixed(2)}</p>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{forecast.forecast}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-lg" data-testid="export-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              Export Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                    data-testid="start-date-input"
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                    data-testid="end-date-input"
                  />
                </div>
              </div>
              <Button
                onClick={handleExport}
                disabled={loading}
                className="bg-gradient-to-r from-violet-600 to-purple-600"
                data-testid="export-button"
              >
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Exporting...' : 'Export to CSV'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {dailyReport?.orders && dailyReport.orders.length > 0 && (
          <Card className="border-0 shadow-lg" data-testid="today-orders-list">
            <CardHeader>
              <CardTitle>Today's Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dailyReport.orders.map((order) => (
                  <div key={order.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">Table {order.table_number} • {order.items.length} items</p>
                    </div>
                    <p className="font-bold text-violet-600">₹{order.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
            </div>
          </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-600" />
                Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  onClick={handleExportPDF}
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export Sales Report PDF
                </Button>
                
                <Button 
                  onClick={handleDetailedReport}
                  disabled={loading}
                  variant="outline"
                  className="border-violet-200 text-violet-600 hover:bg-violet-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Detailed Report PDF
                </Button>
              </div>
              
              <div className="text-sm text-gray-600 mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="font-medium mb-2">📋 Export Instructions:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Sales Report PDF:</strong> Basic sales summary with order details</li>
                  <li>• <strong>Detailed Report PDF:</strong> Comprehensive analytics with top items and payment breakdowns</li>
                  <li>• <strong>Desktop App:</strong> PDF generation optimized for Windows desktop version</li>
                  <li>• <strong>Print Dialog:</strong> Choose "Save as PDF" to download the report</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      </div>
    </Layout>
  );
};

export default ReportsPage;
