/**
 * Instant POS Component
 * One-click POS functionality with zero loading delays
 * Superior to Petpooja with instant data access and ultra-fast performance
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Plus, Minus, Clock, Users, CreditCard, Zap, Package, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import posDataManager from '../utils/posDataManager';
import wsManager from '../utils/websocket';

const InstantPOS = ({ user, onOrderComplete }) => {
  // State management
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  
  // Refs for performance optimization
  const searchTimeoutRef = useRef(null);
  const cartUpdateTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  
  // Initialize component with instant data loading
  useEffect(() => {
    initializePOS();
    setupRealtimeListeners();
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (cartUpdateTimeoutRef.current) {
        clearTimeout(cartUpdateTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Initialize POS with instant data loading
   */
  const initializePOS = async () => {
    const startTime = performance.now();
    
    try {
      // Load all critical data in parallel for maximum speed
      const [menuData, tablesData, settingsData] = await Promise.all([
        posDataManager.getMenu(),
        posDataManager.getTables(),
        posDataManager.getSettings()
      ]);
      
      setMenuItems(menuData || []);
      setTables(tablesData || []);
      
      // Extract categories from menu
      const uniqueCategories = [...new Set(menuData?.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      // Load recent items from localStorage
      const savedRecentItems = localStorage.getItem('pos-recent-items');
      if (savedRecentItems) {
        setRecentItems(JSON.parse(savedRecentItems));
      }
      
      const loadTime = performance.now() - startTime;
      console.log(`🚀 POS initialized in ${loadTime.toFixed(2)}ms`);
      
      // Show performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        setPerformanceMetrics(posDataManager.getMetrics());
      }
      
    } catch (error) {
      console.error('❌ POS initialization failed:', error);
      toast.error('Failed to initialize POS system');
    }
  };

  /**
   * Setup real-time listeners for instant updates
   */
  const setupRealtimeListeners = () => {
    // Listen for menu updates
    posDataManager.addListener('menu', (data) => {
      setMenuItems(data);
      console.log('🍽️ Menu updated in real-time');
    });

    // Listen for table updates
    posDataManager.addListener('tables', (data) => {
      setTables(data);
      console.log('🪑 Tables updated in real-time');
    });

    // Listen for order updates
    posDataManager.addListener('orders', (data) => {
      // Update cart if current order is affected
      if (cart.length > 0 && data.id === cart[0]?.orderId) {
        // Update cart status or remove if completed
        if (data.status === 'completed') {
          setCart([]);
          toast.success('Order completed successfully!');
          if (onOrderComplete) onOrderComplete(data);
        }
      }
    });
  };

  /**
   * Ultra-fast search with debouncing
   */
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    lastActivityRef.current = Date.now();
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounced search for performance
    searchTimeoutRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      
      try {
        const results = await posDataManager.searchMenuItems(query);
        setSearchResults(results);
      } catch (error) {
        console.error('❌ Search failed:', error);
        setSearchResults([]);
      }
    }, 150); // 150ms debounce for instant feel
  }, []);

  /**
   * Add item to cart instantly
   */
  const addToCart = useCallback((item) => {
    const startTime = performance.now();
    
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // Update quantity
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Add new item
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    
    // Add to recent items
    setRecentItems(prev => {
      const filtered = prev.filter(recentItem => recentItem.id !== item.id);
      return [item, ...filtered].slice(0, 10); // Keep last 10 items
    });
    
    // Save recent items to localStorage
    const updatedRecent = [item, ...recentItems.filter(r => r.id !== item.id)].slice(0, 10);
    localStorage.setItem('pos-recent-items', JSON.stringify(updatedRecent));
    
    const addTime = performance.now() - startTime;
    console.log(`⚡ Item added to cart in ${addTime.toFixed(2)}ms`);
    
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [recentItems]);

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback((itemId) => {
    setCart(prevCart => {
      return prevCart
        .map(item => 
          item.id === itemId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0);
    });
  }, []);

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  /**
   * Calculate cart totals instantly
   */
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cart]);

  /**
   * Filter menu items by category
   */
  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'all') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  /**
   * Get display items (search results or filtered menu)
   */
  const displayItems = useMemo(() => {
    if (searchQuery.length >= 2) return searchResults;
    return filteredMenuItems;
  }, [searchResults, filteredMenuItems, searchQuery]);

  /**
   * Place order instantly
   */
  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    if (!selectedTable) {
      toast.error('Please select a table');
      return;
    }
    
    setLoading(true);
    
    try {
      const orderData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        table_id: selectedTable,
        subtotal: cartTotals.subtotal,
        tax: cartTotals.tax,
        total: cartTotals.total,
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      // Send order via WebSocket for instant processing
      wsManager.send('create_order', orderData);
      
      // Also send via HTTP for persistence
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        const order = await response.json();
        
        // Clear cart
        setCart([]);
        setSelectedTable(null);
        
        // Update table status
        wsManager.sendTableUpdate(selectedTable, 'occupied');
        
        toast.success('Order placed successfully!');
        
        if (onOrderComplete) {
          onOrderComplete(order);
        }
      } else {
        throw new Error('Failed to place order');
      }
      
    } catch (error) {
      console.error('❌ Order placement failed:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick add buttons for popular items
   */
  const QuickAddButtons = () => {
    const popularItems = recentItems.slice(0, 5);
    
    if (popularItems.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Quick Add</h3>
        <div className="flex gap-2 flex-wrap">
          {popularItems.map(item => (
            <Button
              key={item.id}
              variant="outline"
              size="sm"
              onClick={() => addToCart(item)}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              {item.name}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Performance indicator
   */
  const PerformanceIndicator = () => {
    if (!performanceMetrics || process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
        <div>Cache Hits: {performanceMetrics.cacheHits}</div>
        <div>Avg Response: {performanceMetrics.avgResponseTime.toFixed(2)}ms</div>
        <div>Memory Cache: {performanceMetrics.memoryCacheSize} items</div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-500" />
            Instant POS
          </h1>
          <p className="text-gray-600">Ultra-fast Point of Sale with zero delays</p>
        </div>
        <Badge variant="secondary" className="text-green-600">
          <Clock className="w-4 h-4 mr-1" />
          Instant Access
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Menu Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search menu items... (instant results)"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Items
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Add Buttons */}
          <QuickAddButtons />

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {displayItems.map(item => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <Badge variant="secondary">₹{item.price}</Badge>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart and Order Panel */}
        <div className="space-y-4">
          {/* Table Selection */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Select Table
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {tables.map(table => (
                  <Button
                    key={table.id}
                    variant={selectedTable === table.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTable(table.id)}
                    className={table.status === 'occupied' ? 'opacity-50' : ''}
                    disabled={table.status === 'occupied'}
                  >
                    {table.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Cart ({cartTotals.itemCount} items)
              </h3>
              
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-600">₹{item.price} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{cartTotals.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (18%):</span>
                      <span>₹{cartTotals.tax}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₹{cartTotals.total}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={placeOrder}
                    disabled={loading || !selectedTable}
                    className="w-full"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Indicator (Development only) */}
      <PerformanceIndicator />
    </div>
  );
};

export default InstantPOS;
