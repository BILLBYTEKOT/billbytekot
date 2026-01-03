import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { 
  Utensils, ChefHat, BarChart3,
  CheckCircle, ArrowRight, Star, Users,
  Zap, Shield, Clock, Flame
} from 'lucide-react';

const PWAHomePage = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [pricing, setPricing] = useState({
    basePrice: 1999,
    salePrice: null,
    discount: null,
    badge: null,
    endDate: null
  });

  useEffect(() => {
    // Check if running as PWA/TWA (standalone mode) or mobile app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = window.navigator.standalone === true;
    const isTWA = document.referrer.includes('android-app://');
    
    // Check user agent for Android WebView (TWA runs in this)
    const ua = navigator.userAgent;
    const isAndroidWebView = /wv/.test(ua) || (/Android/.test(ua) && /Version\/[\d.]+/.test(ua));
    
    const isMobileApp = isStandalone || isInWebAppiOS || isTWA || isAndroidWebView;
    
    // If NOT in mobile app/PWA mode, redirect to landing page
    if (!isMobileApp) {
      navigate('/', { replace: true });
      return;
    }
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Fetch pricing
    fetchPricing();
    setIsChecking(false);
  }, [navigate]);

  const fetchPricing = async () => {
    try {
      // First try sale offer (from Promotions tab)
      const saleRes = await axios.get(`${API}/sale-offer`).catch(() => null);
      if (saleRes?.data?.enabled) {
        const sale = saleRes.data;
        // Check if sale is still valid
        const endDate = sale.end_date ? new Date(sale.end_date) : null;
        if (!endDate || endDate > new Date()) {
          setPricing({
            basePrice: sale.original_price || 1999,
            salePrice: sale.sale_price,
            discount: sale.discount_percent,
            badge: sale.badge || `${sale.discount_percent}% OFF`,
            endDate: endDate
          });
          return;
        }
      }

      // Fallback to pricing settings
      const pricingRes = await axios.get(`${API}/pricing`).catch(() => null);
      if (pricingRes?.data) {
        const p = pricingRes.data;
        if (p.campaign_enabled && p.campaign_price) {
          setPricing({
            basePrice: p.base_price || 1999,
            salePrice: p.campaign_price,
            discount: Math.round(((p.base_price - p.campaign_price) / p.base_price) * 100),
            badge: p.campaign_badge || 'SALE',
            endDate: p.campaign_end_date ? new Date(p.campaign_end_date) : null
          });
        } else {
          setPricing({
            basePrice: p.base_price || 1999,
            salePrice: null,
            discount: null,
            badge: null,
            endDate: null
          });
        }
      }
    } catch (e) {
      console.log('Pricing fetch error:', e);
    }
  };

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const features = [
    { icon: ChefHat, title: 'Smart KOT', desc: 'Kitchen order tickets' },
    { icon: BarChart3, title: 'Reports', desc: 'Sales analytics' },
    { icon: Clock, title: 'Fast Billing', desc: 'Quick checkout' },
    { icon: Shield, title: 'Secure', desc: 'Data protection' },
  ];

  const benefits = [
    'Free 14-day trial',
    'No credit card required',
    'Cancel anytime',
    'WhatsApp support',
  ];

  const displayPrice = pricing.salePrice || pricing.basePrice;
  const hasDiscount = pricing.salePrice && pricing.salePrice < pricing.basePrice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700">
      {/* Sale Banner */}
      {hasDiscount && pricing.badge && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-bold">
            <Flame className="w-4 h-4 animate-pulse" />
            <span>{pricing.badge} - Limited Time Offer!</span>
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-10 pb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Utensils className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">BillByteKOT</h1>
            <p className="text-white/70 text-sm">Restaurant Billing & KOT</p>
          </div>
        </div>

        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Manage Your Restaurant
            <span className="block text-yellow-300">Like a Pro</span>
          </h2>
          <p className="text-white/80 text-base">
            Complete billing, KOT system, inventory & reports in one app
          </p>
        </div>

        {/* Rating Badge */}
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full mb-6">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <span className="text-white text-sm font-medium">500+ Restaurants</span>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-semibold text-sm">{f.title}</p>
              <p className="text-white/60 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {/* Price Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {hasDiscount ? (
              <>
                <span className="text-gray-400 line-through text-lg">₹{pricing.basePrice}</span>
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  ₹{displayPrice}/year
                </span>
                {pricing.discount && (
                  <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    {pricing.discount}% OFF
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  ₹{displayPrice}/year
                </span>
              </>
            )}
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600 text-xs">{b}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <button
            onClick={() => navigate('/login?signup=true')}
            className={`w-full ${hasDiscount ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-violet-600 to-purple-600'} text-white py-4 rounded-xl font-bold text-lg mb-3 flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform`}
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-98 transition-transform"
          >
            Already have an account? Login
          </button>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Zap className="w-4 h-4" />
              <span>Fast Setup</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Users className="w-4 h-4" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="px-6 pb-8 text-center">
        <p className="text-white/60 text-xs">
          By continuing, you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default PWAHomePage;
