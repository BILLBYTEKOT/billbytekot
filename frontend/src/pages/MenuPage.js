import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, Upload, X } from 'lucide-react';
import BulkUpload from '../components/BulkUpload';
import TrialBanner from '../components/TrialBanner';
import ValidationAlert from '../components/ValidationAlert';
import { MenuItemValidator } from '../utils/validation';

const MenuPage = ({ user }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image_url: '',
    available: true,
    preparation_time: 15
  });

  // ✅ Initialize menu validator for duplicate prevention
  const menuValidator = useRef(new MenuItemValidator());

  // Update validator when menu items change
  useEffect(() => {
    if (menuItems.length > 0) {
      menuValidator.current.loadExistingItems(menuItems);
    }
  }, [menuItems]);

  // Memoized filtered items for better performance
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return menuItems;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  }, [debouncedSearchTerm, menuItems]);

  // Memoized categories for better performance
  const categories = useMemo(() => {
    return [...new Set(filteredItems.map(item => item.category))].sort();
  }, [filteredItems]);

  // Memoized category items to avoid recalculation
  const categoryItemsMap = useMemo(() => {
    const map = {};
    categories.forEach(category => {
      map[category] = filteredItems.filter(item => item.category === category);
    });
    return map;
  }, [categories, filteredItems]);

  // Debounced search for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Optimized fetch function with better error handling and caching
  const fetchMenuItems = useCallback(async () => {
    // Don't show loading spinner for subsequent fetches
    if (initialLoad) {
      setLoading(true);
    }
    
    try {
      console.log('🔄 Fetching menu items...');
      
      // Use lightweight endpoint for faster loading
      const response = await axios.get(`${API}/menu/lightweight`, {
        headers: {
          'Cache-Control': 'max-age=300', // Cache for 5 minutes
        }
      });
      
      const items = Array.isArray(response.data) ? response.data : [];
      
      setMenuItems(items);
      
      if (items.length === 0 && initialLoad) {
        toast.info('No menu items found. Add your first menu item below!');
      } else {
        console.log('✅ Menu items loaded:', items.length);
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch menu items:', error);
      
      // Fallback to full menu endpoint if lightweight fails
      if (error.response?.status !== 404) {
        try {
          console.log('🔄 Falling back to full menu endpoint...');
          const fallbackResponse = await axios.get(`${API}/menu`);
          const items = Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
          setMenuItems(items);
          console.log('✅ Fallback menu items loaded:', items.length);
          return;
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
      }
      
      let errorMessage = 'Failed to fetch menu items';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication expired. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to view menu items.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => fetchMenuItems()
        }
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [initialLoad]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await axios.post(`${API}/upload/image`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ ...formData, image_url: response.data.image_url });
      setImagePreview(response.data.image_url);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ ENHANCED FRONTEND VALIDATION - No server changes needed
    const menuItemData = {
      id: formData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: parseFloat(formData.price) || 0,
      description: formData.description?.trim() || '',
      image_url: formData.image_url?.trim() || '',
      available: formData.available,
      preparation_time: parseInt(formData.preparation_time) || 15
    };

    // Validate menu item
    const validation = menuValidator.current.validateMenuItem(
      menuItemData, 
      !!editingItem, 
      editingItem?.id
    );
    
    if (!validation.valid) {
      // Show validation errors
      setValidationErrors(validation.errors);
      validation.errors.forEach(error => {
        toast.error(`Validation Error: ${error}`);
      });
      setTimeout(() => setValidationErrors([]), 5000);
      return;
    }

    // Show warnings if any
    validation.warnings.forEach(warning => {
      toast.warning(`Warning: ${warning}`);
    });

    // Legacy validation (keeping existing logic)
    const errors = [];
    if (!formData.name || formData.name.trim() === '') {
      errors.push('Item Name is required');
    }
    if (!formData.category || formData.category.trim() === '') {
      errors.push('Category is required');
    }
    if (!formData.price || formData.price <= 0) {
      errors.push('Price must be greater than 0');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setTimeout(() => setValidationErrors([]), 5000);
      return;
    }
    
    try {
      if (editingItem) {
        await axios.put(`${API}/menu/${editingItem.id}`, formData);
        // Update validator
        menuValidator.current.updateMenuItem(editingItem.id, menuItemData);
        toast.success('Menu item updated!');
      } else {
        await axios.post(`${API}/menu`, formData);
        // Add to validator
        menuValidator.current.addMenuItem(menuItemData);
        toast.success('Menu item created!');
      }
      setDialogOpen(false);
      fetchMenuItems();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save menu item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API}/menu/${id}`);
      toast.success('Menu item deleted!');
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      description: '',
      image_url: '',
      available: true,
      preparation_time: 15
    });
    setEditingItem(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description || '',
      image_url: item.image_url || '',
      available: item.available,
      preparation_time: item.preparation_time || 15
    });
    setImagePreview(item.image_url || '');
    setDialogOpen(true);
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
      </div>
      
      {/* Search skeleton */}
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-6"></div>
      </div>
      
      {/* Menu items skeleton */}
      {[1, 2, 3].map(category => (
        <div key={category} className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(item => (
              <div key={item} className="bg-white rounded-lg border p-4">
                <div className="h-40 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Memoized menu item component for better performance
  const MenuItemCard = useCallback(({ item }) => (
    <Card key={item.id} className={`card-hover border-0 shadow-lg transition-all duration-200 ${!item.available ? 'opacity-60' : ''}`} data-testid={`menu-item-${item.id}`}>
      {item.image_url && (
        <div className="h-40 overflow-hidden rounded-t-lg">
          <img 
            src={item.image_url} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105" 
            onError={(e) => e.target.style.display = 'none'}
            loading="lazy" // Lazy load images for better performance
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <p className="text-sm text-gray-500 capitalize">{item.category}</p>
          </div>
          <span className="text-lg font-bold text-violet-600">₹{item.price}</span>
        </div>
      </CardHeader>
      <CardContent>
        {item.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>}
        <div className="flex justify-between items-center">
          <span className={`text-xs px-2 py-1 rounded-full ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {item.available ? 'Available' : 'Unavailable'}
          </span>
          {['admin', 'cashier'].includes(user?.role) && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(item)} data-testid={`edit-menu-${item.id}`}>
                <Edit className="w-4 h-4" />
              </Button>
              {user?.role === 'admin' && (
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(item.id)} data-testid={`delete-menu-${item.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ), [user?.role]);

  return (
    <Layout user={user}>
      <ValidationAlert errors={validationErrors} onClose={() => setValidationErrors([])} />
      <div className="space-y-6" data-testid="menu-page">
        <TrialBanner user={user} />
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Menu Management</h1>
            <p className="text-gray-600 mt-2">Manage your restaurant menu items</p>
          </div>
          {['admin', 'cashier'].includes(user?.role) && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" data-testid="add-menu-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="menu-dialog">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        data-testid="menu-name-input"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        data-testid="menu-category-input"
                      />
                    </div>
                    <div>
                      <Label>Price (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        data-testid="menu-price-input"
                      />
                    </div>
                    <div>
                      <Label>Prep Time (mins)</Label>
                      <Input
                        type="number"
                        value={formData.preparation_time}
                        onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      data-testid="menu-description-input"
                    />
                  </div>
                  <div>
                    <Label>Menu Image</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex-1"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload Image'}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                      {imagePreview && (
                        <div className="relative">
                          <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview('');
                              setFormData({ ...formData, image_url: '' });
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">Or enter image URL below (optional)</p>
                      <Input
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="available"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="available" className="cursor-pointer">Available</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="save-menu-button">
                      {editingItem ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="menu-search-input"
            />
          </div>
        </div>

        {/* Bulk Upload Component */}
        {['admin', 'manager'].includes(user?.role) && (
          <BulkUpload 
            type="menu" 
            onSuccess={fetchMenuItems}
          />
        )}

        {/* Show loading skeleton only on initial load */}
        {loading && initialLoad ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Show loading indicator for subsequent loads */}
            {loading && !initialLoad && (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm text-gray-600">Refreshing...</span>
              </div>
            )}
            
            {/* Render categories and items */}
            {categories.map((category) => {
              const categoryItems = categoryItemsMap[category];
              if (!categoryItems || categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <h2 className="text-2xl font-bold capitalize text-gray-800">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryItems.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {!loading && filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">
                  {searchTerm ? 'No menu items match your search' : 'No menu items found'}
                </p>
                {!searchTerm && (
                  <p className="text-gray-400 text-sm">Add your first menu item to get started</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default MenuPage;
