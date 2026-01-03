import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { 
  Utensils, ChefHat, Receipt, BarChart3,
  CheckCircle, ArrowRight, Star, Sparkles,
  Zap, Shield, Clock, Flame, Play
} from 'lucide-react';

const PWAHomePage = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pricing, setPricing] = useState({
    basePrice: 1999,
    salePrice: null,
    discount: null,
    badge: null
  });

  useEffect(() => {
    // Check if running as PWA/TWA (standalone mode) or mobile app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = window.navigator.standalone === true;
    const isTWA = document.referrer.includes('android-app://');
    const ua = navigator.userAgent;
    const isAndroidWebView = /wv/.test(ua) || (/Android/.test(ua) && /Version\/[\d.]+/.test(ua));
    const isMobileApp = isStandalone || isInWebAppiOS || isTWA || isAndroidWebView;
    
    if (!isMobileApp) {
      navigate('/', { replace: true });
      return;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    fetchPricing();
    setIsChecking(false);
  }, [navigate]);

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchPricing = async () => {
    try {
      const saleRes = await axios.get(`${API}/sale-offer`).catch(() => null);
      if (saleRes?.data?.enabled) {
        const sale = saleRes.data;
        const endDate = sale.end_date ? new Date(sale.end_date) : null;
        if (!endDate || endDate > new Date()) {
          setPricing({
            basePrice: sale.original_price || 1999,
            salePrice: sale.sale_price,
            discount: sale.discount_percent,
            badge: sale.badge
          });
          return;
        }
      }
      const pricingRes = await axios.get(`${API}/pricing`).catch(() => null);
      if (pricingRes?.data?.campaign_enabled) {
        const p = pricingRes.data;
        setPricing({
          basePrice: p.base_price || 1999,
          salePrice: p.campaign_price,
          discount: Math.round(((p.base_price - p.campaign_price) / p.base_price) * 100),
          badge: p.campaign_badge
        });
      }
    } catch (e) {}
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const slides = [
    { icon: Receipt, title: 'Smart Billing', desc: 'Generate bills in seconds with thermal printing', color: 'from-violet-500 to-purple-600' },
    { icon: ChefHat, title: 'KOT System', desc: 'Send orders directly to kitchen display', color: 'from-orange-500 to-red-500' },
    { icon: BarChart3, title: 'Live Reports', desc: 'Track sales, inventory & staff performance', color: 'from-emerald-500 to-green-600' },
  ];

  const hasDiscount = pricing.salePrice && pricing.salePrice < pricing.basePrice;
  const displayPrice = pricing.salePrice || pricing.basePrice;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Section - Purple Gradient */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 px-6 pt-12 pb-16 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 relative z-10">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl">
            <Utensils className="w-7 h-7 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">BillByteKOT</h1>
            <p className="text-violet-200 text-sm">Restaurant Management</p>
          </div>
        </div>

        {/* Feature Carousel */}
        <div className="relative z-10">
          <div className="bg-white/15 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${slides[currentSlide].color} rounded-2xl flex items-center justify-center shadow-lg`}>
                {(() => {
                  const Icon = slides[currentSlide].icon;
                  return <Icon className="w-8 h-8 text-white" />;
                })()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{slides[currentSlide].title}</h3>
                <p className="text-violet-200 text-sm">{slides[currentSlide].desc}</p>
              </div>
            </div>
            
            {/* Slide indicators */}
            <div className="flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-center gap-2 mt-6 relative z-10">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <span className="text-white/90 text-sm font-medium">Trusted by 500+ restaurants</span>
        </div>
      </div>

      {/* Bottom Section - White */}
      <div className="flex-1 px-6 -mt-6 relative z-20">
        <div className="bg-white rounded-t-3xl shadow-2xl pt-6 pb-8 px-1">
          
          {/* Sale Banner */}
          {hasDiscount && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 mb-6 mx-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
                  <div>
                    <p className="text-white font-bold text-lg">{pricing.badge || `${pricing.discount}% OFF`}</p>
                    <p className="text-orange-100 text-xs">Limited time offer</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-orange-200 line-through text-sm">₹{pricing.basePrice}</p>
                  <p className="text-white font-bold text-2xl">₹{displayPrice}<span className="text-sm font-normal">/yr</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="space-y-3 mb-6 px-1">
            {[
              { icon: Zap, text: 'Setup in 2 minutes' },
              { icon: Shield, text: 'Secure cloud backup' },
              { icon: Clock, text: '14-day free trial' },
              { icon: Sparkles, text: 'No credit card needed' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-gray-700 font-medium">{item.text}</span>
                <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 px-1">
            <button
              onClick={() => navigate('/login?signup=true')}
              className={`w-full ${hasDiscount ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-violet-600 to-purple-600'} text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform`}
            >
              <Play className="w-5 h-5 fill-white" />
              Start Free Trial
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              I have an account
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-6 px-4">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default PWAHomePage;
