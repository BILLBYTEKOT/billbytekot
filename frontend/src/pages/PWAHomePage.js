import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { 
  Utensils, ChefHat, Receipt, BarChart3,
  CheckCircle, ArrowRight, Star,
  Flame, Play, Timer, MessageCircle
} from 'lucide-react';

const PWAHomePage = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [saleOffer, setSaleOffer] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const SUPPORT_WHATSAPP = '918310832669';

  useEffect(() => {
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
    
    fetchSaleOffer();
    setIsChecking(false);
  }, [navigate]);

  useEffect(() => {
    if (!saleOffer?.enabled) return;
    let endDateStr = saleOffer.valid_until || saleOffer.end_date;
    if (!endDateStr) return;
    if (endDateStr.length === 10) endDateStr = endDateStr + 'T23:59:59';
    
    const calculateTimeLeft = () => {
      const diff = new Date(endDateStr) - new Date();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return false;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
      return true;
    };
    calculateTimeLeft();
    const timer = setInterval(() => { if (!calculateTimeLeft()) clearInterval(timer); }, 1000);
    return () => clearInterval(timer);
  }, [saleOffer]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % 3), 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchSaleOffer = async () => {
    try {
      const res = await axios.get(`${API}/sale-offer`).catch(() => ({ data: { enabled: false } }));
      if (res?.data?.enabled) setSaleOffer(res.data);
    } catch (e) {}
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const slides = [
    { icon: Receipt, title: 'Smart Billing', desc: 'Generate bills instantly', color: 'from-violet-500 to-purple-600' },
    { icon: ChefHat, title: 'KOT System', desc: 'Direct kitchen orders', color: 'from-orange-500 to-red-500' },
    { icon: BarChart3, title: 'Live Reports', desc: 'Track sales & inventory', color: 'from-emerald-500 to-green-600' },
  ];

  const hasDiscount = saleOffer?.enabled && saleOffer?.sale_price && saleOffer?.original_price && saleOffer.sale_price < saleOffer.original_price;
  const displayPrice = saleOffer?.sale_price || saleOffer?.original_price || 1999;
  const originalPrice = saleOffer?.original_price || 1999;
  const discountPercent = saleOffer?.discount_percent || (hasDiscount ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0);
  const hasTimer = timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Utensils className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">BillByteKOT</h1>
            <p className="text-violet-200 text-[10px]">Restaurant Management</p>
          </div>
        </div>
        <button
          onClick={() => window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=Hi, I'm interested in BillByteKOT!`, '_blank')}
          className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-lg active:scale-95"
        >
          <MessageCircle className="w-4 h-4 text-white fill-white" />
        </button>
      </div>

      {/* Feature Carousel - Compact */}
      <div className="px-4 pb-2">
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 bg-gradient-to-br ${slides[currentSlide].color} rounded-xl flex items-center justify-center`}>
              {(() => { const Icon = slides[currentSlide].icon; return <Icon className="w-5 h-5 text-white" />; })()}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">{slides[currentSlide].title}</h3>
              <p className="text-violet-200 text-xs">{slides[currentSlide].desc}</p>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1 rounded-full transition-all ${i === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        </div>
        {/* Rating */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />)}</div>
          <span className="text-white/80 text-xs">500+ restaurants</span>
        </div>
      </div>

      {/* Bottom Card */}
      <div className="flex-1 px-4 mt-1">
        <div className="bg-white rounded-t-3xl h-full pt-4 pb-6 px-4 shadow-2xl">
          
          {/* Compact Sale Banner */}
          {hasDiscount ? (
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-yellow-300" />
                  <span className="text-white font-bold text-sm">{saleOffer?.title || `${discountPercent}% OFF`}</span>
                </div>
                <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[10px] font-bold">
                  SAVE ₹{originalPrice - displayPrice}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-200 line-through text-sm">₹{originalPrice}</span>
                <span className="text-white font-black text-2xl">₹{displayPrice}</span>
                <span className="text-orange-100 text-xs">/year</span>
              </div>
              {hasTimer && (
                <div className="flex items-center gap-1.5 mt-2 bg-black/20 rounded-lg px-2 py-1.5">
                  <Timer className="w-3 h-3 text-yellow-300" />
                  <span className="text-white/80 text-[10px]">Ends:</span>
                  <div className="flex gap-1">
                    {[{ v: timeLeft.days, l: 'd' }, { v: timeLeft.hours, l: 'h' }, { v: timeLeft.minutes, l: 'm' }, { v: timeLeft.seconds, l: 's' }].map((t, i) => (
                      <span key={i} className="bg-white/20 px-1.5 py-0.5 rounded text-white text-xs font-bold">{String(t.v).padStart(2, '0')}{t.l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-3 mb-3 flex items-center justify-between">
              <div>
                <p className="text-violet-200 text-xs">Starting at</p>
                <p className="text-white font-black text-xl">₹{originalPrice}<span className="text-sm font-normal">/yr</span></p>
              </div>
              <div className="bg-white/20 rounded-lg px-2 py-1 text-center">
                <p className="text-white font-bold text-sm">₹{Math.round(originalPrice/365)}/day</p>
              </div>
            </div>
          )}

          {/* Compact Features - 2 columns */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['Setup in 2 min', 'Cloud backup', '14-day trial', 'No card needed'].map((text, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 text-xs font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <button
            onClick={() => navigate('/login?signup=true')}
            className={`w-full ${hasDiscount ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-violet-600 to-purple-600'} text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform`}
          >
            <Play className="w-4 h-4 fill-white" />
            Start Free Trial
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full mt-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            I have an account
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=Hi, I'm interested in BillByteKOT!`, '_blank')}
            className="w-full mt-2 border border-green-200 text-green-700 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 text-green-600" />
            Chat on WhatsApp
          </button>

          <p className="text-center text-gray-400 text-[10px] mt-3">
            By continuing, you agree to our Terms & Privacy
          </p>
        </div>
      </div>
    </div>
  );
};

export default PWAHomePage;
