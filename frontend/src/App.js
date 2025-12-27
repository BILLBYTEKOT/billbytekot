import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import Dashboard from './pages/Dashboard';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import TablesPage from './pages/TablesPage';
import KitchenPage from './pages/KitchenPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import BillingPage from './pages/BillingPage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import BusinessSetupPage from './pages/BusinessSetupPage';
import StaffManagementPage from './pages/StaffManagementPage';
import LandingPage from './pages/LandingPage';
import SEOPage from './pages/SEOPage';
import TrackOrderPage from './pages/TrackOrderPage';
import CustomerOrderPage from './pages/CustomerOrderPage';
import DownloadPage from './pages/DownloadPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ContactPage from './pages/ContactPage';
import OrderDisplayPage from './pages/OrderDisplayPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import HelpPage from './pages/HelpPage';
import SuperAdminPage from './pages/SuperAdminPage';
import RestaurantBillingSoftwarePage from './pages/RestaurantBillingSoftwarePage';
import KOTSoftwarePage from './pages/KOTSoftwarePage';
import POSSoftwarePage from './pages/POSSoftwarePage';
import NotFound from './pages/NotFound';
import DesktopInfo from './components/DesktopInfo';
import { Toaster } from './components/ui/sonner';

// Electron navigation handler component
const ElectronNavigator = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (window.electronAPI?.onNavigate) {
      window.electronAPI.onNavigate((path) => {
        navigate(path);
      });
    }
  }, [navigate]);
  
  return null;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://restro-ai.onrender.com';
export const API = `${BACKEND_URL}/api`;

// Robust storage helper that uses multiple storage mechanisms
const AUTH_STORAGE_KEY = 'billbytekot_auth';

// Set a cookie with long expiry
const setCookie = (name, value, days = 30) => {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.log('Cookie storage not available');
  }
};

// Get cookie value
const getCookie = (name) => {
  try {
    const value = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return value ? decodeURIComponent(value.split('=')[1]) : null;
  } catch (e) {
    return null;
  }
};

// Delete cookie
const deleteCookie = (name) => {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  } catch (e) {
    // Ignore
  }
};

// Store auth data in multiple places for redundancy
const storeAuthData = (token, userData) => {
  const authData = JSON.stringify({ token, user: userData, timestamp: Date.now() });
  
  // Primary: localStorage
  try {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem(AUTH_STORAGE_KEY, authData);
  } catch (e) {
    console.log('localStorage not available');
  }
  
  // Backup 1: sessionStorage
  try {
    sessionStorage.setItem('token_backup', token);
    sessionStorage.setItem('user_backup', JSON.stringify(userData));
  } catch (e) {
    console.log('sessionStorage not available');
  }
  
  // Backup 2: Cookie (for mobile apps that clear localStorage)
  setCookie('auth_token', token, 30);
  setCookie('auth_user', JSON.stringify(userData), 30);
};

// Retrieve auth data from any available source
const getAuthData = () => {
  let token = null;
  let userData = null;
  
  // Try localStorage first
  try {
    token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (userStr) userData = JSON.parse(userStr);
  } catch (e) {
    console.log('localStorage read failed');
  }
  
  // Try sessionStorage backup
  if (!token) {
    try {
      token = sessionStorage.getItem('token_backup');
      const userStr = sessionStorage.getItem('user_backup');
      if (userStr) userData = JSON.parse(userStr);
      
      // Restore to localStorage if found
      if (token) {
        localStorage.setItem('token', token);
        if (userData) localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (e) {
      console.log('sessionStorage read failed');
    }
  }
  
  // Try cookie backup (most reliable for mobile)
  if (!token) {
    token = getCookie('auth_token');
    const userCookie = getCookie('auth_user');
    if (userCookie) {
      try {
        userData = JSON.parse(userCookie);
      } catch (e) {
        // Invalid cookie data
      }
    }
    
    // Restore to localStorage if found in cookie
    if (token) {
      try {
        localStorage.setItem('token', token);
        if (userData) localStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {
        // localStorage might not be available
      }
    }
  }
  
  return { token, user: userData };
};

// Clear all auth data
const clearAuthData = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {}
  
  try {
    sessionStorage.removeItem('token_backup');
    sessionStorage.removeItem('user_backup');
  } catch (e) {}
  
  deleteCookie('auth_token');
  deleteCookie('auth_user');
};

// Helper to get token from any available storage
const getStoredToken = () => {
  const { token } = getAuthData();
  return token;
};

// Helper to get stored user
const getStoredUser = () => {
  const { user } = getAuthData();
  return user;
};

// Configure axios with performance optimizations
axios.defaults.timeout = 60000; // 60 second timeout (increased for Render free tier)
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for retry logic and auth
axios.interceptors.request.use(
  (config) => {
    // Ensure auth token is always included
    const token = getStoredToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching issues
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for automatic retry on failure
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Don't auto-logout on 401 for /auth/me endpoint - let the app handle it gracefully
    const isAuthMeRequest = config?.url?.includes('/auth/me');
    
    // Handle 401/403 errors carefully
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // NEVER auto-clear auth data from interceptor
      // Let the app components handle auth state
      // This prevents logout loops on mobile
      console.log('Auth error:', error.response.status, 'for', config?.url);
      return Promise.reject(error);
    }
    
    // Retry logic for network errors or 5xx errors
    if (!config || !config.retry) {
      config.retry = 0;
    }
    
    const shouldRetry = 
      config.retry < 2 && // Max 2 retries
      (!error.response || error.response.status >= 500 || error.code === 'ECONNABORTED');
    
    if (shouldRetry) {
      config.retry += 1;
      console.log(`Retrying request (${config.retry}/2)...`);
      
      // Ensure auth token is included in retry
      const token = getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * config.retry));
      
      return axios(config);
    }
    
    return Promise.reject(error);
  }
);

export const setAuthToken = (token, userData = null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Get existing user data if not provided
    if (!userData) {
      userData = getStoredUser();
    }
    
    // Store in all available storage mechanisms
    storeAuthData(token, userData);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    clearAuthData();
  }
};

const PrivateRoute = ({ children, requireSetup = true }) => {
  const { token, user } = getAuthData();
  
  // If no token at all, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // If user data exists and setup is required but not completed
  if (requireSetup && user?.role === 'admin' && user?.setup_completed === false) {
    return <Navigate to="/setup" replace />;
  }
  
  return children;
};

const SetupRoute = ({ children }) => {
  const token = getStoredToken();
  return token ? children : <Navigate to="/login" replace />;
};

// Loading component for auth check
const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState(() => {
    // Initialize user from any available storage immediately
    const storedUser = getStoredUser();
    return storedUser;
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { token, user: storedUser } = getAuthData();
      
      if (token) {
        // Set the token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // If we have cached user data, use it immediately
        if (storedUser && !user) {
          setUser(storedUser);
        }
        
        // Try to fetch fresh user data in background (don't block on this)
        fetchUser().catch(err => {
          console.log('Background user fetch failed, using cached data:', err.message);
        });
      }
      
      setIsAuthChecking(false);
    };
    
    initAuth();

    // Setup axios interceptor for trial expiration
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 402) {
          // Trial expired or subscription required
          const message = error.response.data?.detail || 'Your trial has expired. Please subscribe to continue.';
          
          // Show error toast
          import('./components/ui/sonner').then(({ toast }) => {
            toast.error(message, {
              duration: 5000,
              action: {
                label: 'Subscribe',
                onClick: () => window.location.href = '/subscription'
              }
            });
          });

          // Redirect to subscription page after delay
          setTimeout(() => {
            if (window.location.pathname !== '/subscription') {
              window.location.href = '/subscription';
            }
          }, 3000);
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      const userData = response.data;
      setUser(userData);
      
      // Store user data in all storage mechanisms
      const token = getStoredToken();
      if (token) {
        storeAuthData(token, userData);
      }
      
      return true;
    } catch (e) {
      console.error('Failed to fetch user', e);
      
      // Only clear auth on explicit 401 AND if token is actually expired
      if (e.response?.status === 401) {
        const token = getStoredToken();
        if (token) {
          try {
            // Try to decode token to check expiry
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp && (payload.exp * 1000) < Date.now();
            
            if (isExpired) {
              console.log('Token expired, clearing auth');
              setAuthToken(null);
              setUser(null);
              return false;
            }
          } catch (decodeError) {
            // Can't decode token, keep cached user
            console.log('Could not decode token, keeping cached user');
          }
        }
      }
      
      // For network errors or other issues, keep using cached user
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        console.log('Using cached user data');
        return true;
      }
      
      return false;
    }
  };

  return (
    <div className="App">
      <BrowserRouter>
        <ElectronNavigator />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage setUser={setUser} />} />
          <Route
            path="/setup"
            element={
              <SetupRoute>
                <BusinessSetupPage user={user} />
              </SetupRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <PrivateRoute>
                <MenuPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <OrdersPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders/display"
            element={
              <PrivateRoute>
                <OrderDisplayPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/billing/:orderId"
            element={
              <PrivateRoute>
                <BillingPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/tables"
            element={
              <PrivateRoute>
                <TablesPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/kitchen"
            element={
              <PrivateRoute>
                <KitchenPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute>
                <InventoryPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <ReportsPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <PrivateRoute>
                <SubscriptionPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <PrivateRoute>
                <StaffManagementPage user={user} />
              </PrivateRoute>
            }
          />
          {/* Public Routes - No Auth Required */}
          <Route path="/seo" element={<SEOPage />} />
          <Route path="/restaurant-billing-software-india" element={<SEOPage />} />
          <Route path="/restaurant-billing-software" element={<RestaurantBillingSoftwarePage />} />
          <Route path="/kot-software" element={<KOTSoftwarePage />} />
          <Route path="/pos-software-for-restaurants" element={<POSSoftwarePage />} />
          <Route path="/track/:trackingToken" element={<TrackOrderPage />} />
          <Route path="/order/:orgId" element={<CustomerOrderPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/help" element={<PrivateRoute><HelpPage user={user} /></PrivateRoute>} />
          <Route path="/super-admin-panel-secret" element={<SuperAdminPage />} />
          {/* 404 Not Found Route - Must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <DesktopInfo />
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
