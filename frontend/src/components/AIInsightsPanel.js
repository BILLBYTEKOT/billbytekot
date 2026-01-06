import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Sparkles, TrendingUp, TrendingDown, Minus, Package, Users, Clock,
  RefreshCw, Lightbulb, ShoppingCart, AlertTriangle, CheckCircle,
  BarChart3, Zap, Target, Gift
} from 'lucide-react';
import { toast } from 'sonner';

const AIInsightsPanel = ({ compact = false }) => {
  const [insights, setInsights] = useState(null);
  const [menuOptimization, setMenuOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const [insightsRes, menuRes] = await Promise.allSettled([
        axios.post(`${API}/ai/smart-insights`),
        axios.post(`${API}/ai/menu-optimizer`)
      ]);

      if (insightsRes.status === 'fulfilled') {
        setInsights(insightsRes.value.data.insights);
      }
      if (menuRes.status === 'fulfilled') {
        setMenuOptimization(menuRes.value.data.optimization);
      }
    } catch (error) {
      console.error('Failed to fetch AI insights', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'growing': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'growing': return 'text-green-600 bg-green-50';
      case 'declining': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
          <span className="ml-3 text-gray-600">Analyzing your data...</span>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI Insights
            <span className="text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full">POWERED BY GPT-4</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights?.summary && (
            <p className="text-sm text-gray-700 leading-relaxed">{insights.summary}</p>
          )}
          {insights?.suggestions?.slice(0, 3).map((suggestion, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">{suggestion}</span>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={fetchInsights}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Insights
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'insights', label: 'Smart Insights', icon: Sparkles },
          { id: 'menu', label: 'Menu Optimizer', icon: ShoppingCart },
          { id: 'trends', label: 'Trends', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-violet-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={fetchInsights} className="ml-auto">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Smart Insights Tab */}
      {activeTab === 'insights' && insights && (
        <div className="grid gap-6">
          {/* AI Summary Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-600 to-purple-700 text-white overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6" />
                  <span className="font-bold text-lg">AI Analysis</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">GPT-4</span>
                </div>
                <p className="text-white/90 leading-relaxed">{insights.summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{insights.stats?.total_orders || 0}</div>
                <div className="text-xs text-gray-500">Total Orders</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">₹{(insights.stats?.total_revenue || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500">Total Revenue</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <div className="text-2xl font-bold">₹{Math.round(insights.stats?.avg_order_value || 0)}</div>
                <div className="text-xs text-gray-500">Avg Order</div>
              </CardContent>
            </Card>
            <Card className={`border-0 shadow-md ${getTrendColor(insights.revenue_trend)}`}>
              <CardContent className="p-4 text-center">
                {getTrendIcon(insights.revenue_trend)}
                <div className="text-lg font-bold capitalize mt-1">{insights.revenue_trend}</div>
                <div className="text-xs opacity-70">Revenue Trend</div>
              </CardContent>
            </Card>
          </div>

          {/* Top & Slow Items */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Top Selling Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.top_items?.length > 0 ? (
                  insights.top_items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">{item.count} sold</div>
                        <div className="text-xs text-gray-500">₹{item.revenue?.toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.slow_items?.length > 0 ? (
                  insights.slow_items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-amber-600">{item.count} sold</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">All items performing well!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours */}
          {insights.peak_hours?.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Peak Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {insights.peak_hours.map((peak, i) => (
                    <div key={i} className={`flex-shrink-0 p-4 rounded-xl text-center ${
                      i === 0 ? 'bg-blue-500 text-white' : 'bg-blue-50'
                    }`}>
                      <div className="text-2xl font-bold">{peak.hour}</div>
                      <div className={`text-sm ${i === 0 ? 'text-blue-100' : 'text-gray-500'}`}>
                        {peak.orders} orders
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Suggestions */}
          {insights.suggestions?.length > 0 && (
            <Card className="border-0 shadow-lg border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Menu Optimizer Tab */}
      {activeTab === 'menu' && menuOptimization && (
        <div className="grid gap-6">
          {/* Summary */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="w-6 h-6" />
                <span className="font-bold text-lg">Menu Optimization</span>
              </div>
              <p className="text-white/90">{menuOptimization.summary}</p>
            </CardContent>
          </Card>

          {/* Combo Suggestions */}
          {menuOptimization.combo_suggestions?.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gift className="w-5 h-5 text-purple-500" />
                  Combo Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {menuOptimization.combo_suggestions.map((combo, i) => (
                  <div key={i} className="p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-purple-700">{combo.items.join(' + ')}</span>
                      <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                        {combo.times_together}x together
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500 line-through">₹{combo.individual_total}</span>
                      <span className="text-lg font-bold text-green-600">₹{combo.combo_price}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Save ₹{combo.individual_total - combo.combo_price}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Price Suggestions */}
          {menuOptimization.price_suggestions?.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Price Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {menuOptimization.price_suggestions.map((item, i) => (
                  <div key={i} className="p-4 bg-green-50 rounded-xl">
                    <div className="font-bold text-gray-800 mb-1">{item.item}</div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">Current: ₹{item.current}</span>
                      <span className="text-green-600 font-bold">→ ₹{item.suggested}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && insights && (
        <div className="grid gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Order Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.order_types && Object.keys(insights.order_types).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(insights.order_types).map(([type, count]) => {
                    const total = Object.values(insights.order_types).reduce((a, b) => a + b, 0);
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <span className="font-medium">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No order data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
