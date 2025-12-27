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

// Helper to get token from any available storage
const getStoredToken = () => {
  let token = localStorage.getItem('token');
  if (!token) {
    try {
      token = sessionStorage.getItem('token_backup');
      if (token) {
        // Restore to localStorage
        localStorage.setItem('token', token);
      }
    } catch (e) {
      // sessionStorage might not be available
    }
  }
  return token;
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
    
    // Don't retry 401/403 errors (authentication issues)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Only clear token and redirect for non-auth/me requests
      // This prevents logout loop on app startup when token might be temporarily invalid
      if (error.response.status === 401 && !isAuthMeRequest) {
        // Check if we have a valid cached user before clearing
        const cachedUser = localStorage.getItem('user');
        if (!cachedUser) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
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
      const token = localStorage.getItem('token');
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

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
    // Also store in sessionStorage as backup
    try {
      sessionStorage.setItem('token_backup', token);
    } catch (e) {
      // sessionStorage might not be available
    }
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    try {
      sessionStorage.removeItem('token_backup');
    } catch (e) {
      // sessionStorage might not be available
    }
  }
};

const PrivateRoute = ({ children, requireSetup = true }) => {
  const token = getStoredToken();
  const cachedUser = localStorage.getItem('user');
  
  // If no token at all, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Parse user data safely
  let user = {};
  if (cachedUser) {
    try {
      user = JSON.parse(cachedUser);
    } catch {
      // Invalid cached data, but we have a token so let them through
      user = {};
    }
  }
  
  // If user data exists and setup is required but not completed
  if (requireSetup && user.role === 'admin' && user.setup_completed === false) {
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
    // Initialize user from localStorage immediately to prevent logout flash
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      const cachedUser = localStorage.getItem('user');
      
      if (token) {
        // Set the token in axios headers
        setAuthToken(token);
        
        // If we have cached user data, use it immediately
        if (cachedUser && !user) {
          try {
            const parsed = JSON.parse(cachedUser);
            setUser(parsed);
          } catch {
            // Invalid cached data
          }
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
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return true;
    } catch (e) {
      console.error('Failed to fetch user', e);
      
      // Only clear auth on explicit 401 AND if it's not a network error
      if (e.response?.status === 401) {
        // Check if token is actually invalid vs just a temporary issue
        const token = localStorage.getItem('token');
        if (token) {
          // Try to decode token to check expiry (basic check)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp && (payload.exp * 1000) < Date.now();
            
            if (isExpired) {
              // Token is actually expired, clear it
              console.log('Token expired, clearing auth');
              setAuthToken(null);
              localStorage.removeItem('user');
              setUser(null);
              return false;
            }
          } catch (decodeError) {
            // Can't decode token, but don't clear - might be valid
            console.log('Could not decode token, keeping cached user');
          }
        }
      }
      
      // For network errors or other issues, keep using cached user
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser);
          setUser(parsed);
          console.log('Using cached user data due to network error');
          return true;
        } catch {
          // Invalid cached data
        }
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
