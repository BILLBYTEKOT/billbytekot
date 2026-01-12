import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Zap, Clock, Sparkles, Star, Flame, X, Rocket, Crown, Timer, ArrowRight, Tag } from 'lucide-react';

const TopBanner = () => {
  const navigate = useNavigate();
  const [bannerData, setBannerData] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchBannerData();
  }, []);

  useEffect(() => {
    // Get the end date from either valid_until or end_date
    let endDateStr = bannerData?.valid_until || bannerData?.end_date;
    
    if (endDateStr) {
      // If it's just a date (YYYY-MM-DD), add end of day time
      if (endDateStr.length === 10) {
        endDateStr = endDateStr + 'T23:59:59';
      }
      
      // Calculate time left immediately
      const calculateTimeLeft = () => {
        const end = new Date(endDateStr);
        const now = new Date();
        const diff = end - now;
        
        if (diff <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return false; // Timer expired
        } else {
          setTimeLeft({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000)
          });
          return true; // Timer still running
        }
      };
      
      // Calculate immediately on mount
      calculateTimeLeft();
      
      // Then update every second
      const timer = setInterval(() => {
        const stillRunning = calculateTimeLeft();
        if (!stillRunning) {
          clearInterval(timer);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [bannerData]);

  const fetchBannerData = async () => {
    try {
      const response = await axios.get(`${API}/sale-offer`);
      if (response.data?.enabled) {
        setBannerData(response.data);
      }
    } catch (error) {
      console.log('No active banner');
    }
  };

  if (!bannerData || dismissed) return null;

  const design = bannerData.banner_design || 'gradient-wave';

  // Design 1: Gradient Wave with Floating Elements
  if (design === 'gradient-wave') {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white">
        {/* Animated wave background - pointer-events-none */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute bottom-0 w-full h-8 text-white/10" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="currentColor">
              <animate attributeName="d" dur="10s" repeatCount="indefinite" values="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z;M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z;M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"/>
            </path>
          </svg>
        </div>
        {/* Floating particles - pointer-events-none */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="absolute w-2 h-2 bg-white/30 rounded-full animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${3 + Math.random() * 2}s` }} />
          ))}
        </div>
        <div className="relative z-10 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 animate-bounce">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-lg">{bannerData.badge_text || '🎉 SPECIAL OFFER'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-white/80">{bannerData.title}</span>
              <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-black animate-pulse">{bannerData.discount_percent || 20}% OFF</span>
            </div>
            {timeLeft.days > 0 || timeLeft.hours > 0 ? (
              <div className="flex items-center gap-1 text-xs bg-black/20 px-3 py-1 rounded-full">
                <Timer className="w-3 h-3" />
                <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
              </div>
            ) : null}
            <button onClick={() => navigate('/login')} className="bg-white text-violet-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-yellow-300 hover:text-black transition-all hover:scale-105 shadow-lg">
              {bannerData.cta_text || 'Claim Now'} →
            </button>
            <button onClick={() => setDismissed(true)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Design 11: Early Adopter Special - ₹9/Year 99% OFF - ULTIMATE VERSION
  if (design === 'early-adopter') {
    const salePrice = bannerData.sale_price ? `₹${bannerData.sale_price}` : '₹9';
    const originalPrice = bannerData.original_price ? `₹${bannerData.original_price}` : '₹999';
    const discountPercent = bannerData.discount_percent || 99;
    
    return (
      <div className="relative overflow-hidden text-white" style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 25%, #ff4757 50%, #ff6348 75%, #ff9f43 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradient-x 3s ease infinite'
      }}>
        {/* Animated fire background - pointer-events-none to not block clicks */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="absolute text-2xl animate-float opacity-60" style={{
              left: `${Math.random() * 100}%`,
              bottom: '-20px',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}>🔥</div>
          ))}
        </div>

        {/* Glowing orbs - pointer-events-none */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-400 rounded-full filter blur-3xl opacity-40 animate-pulse" />
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-orange-500 rounded-full filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-0 left-1/2 w-24 h-24 bg-red-500 rounded-full filter blur-2xl opacity-30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* Sparkles - pointer-events-none */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <Sparkles key={i} className="absolute w-5 h-5 text-yellow-200 animate-ping" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: '1.5s'
            }} />
          ))}
        </div>

        <div className="relative z-10 py-4 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            
            {/* Animated Badge */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/50 shadow-lg shadow-orange-500/30">
              <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
              <span className="font-black text-base sm:text-lg tracking-wide text-yellow-100 drop-shadow-lg">
                {bannerData.badge_text || '🔥 EARLY ADOPTER SPECIAL'}
              </span>
              <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>

            {/* MEGA Price Display */}
            <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
              <div className="text-center">
                <span className="text-white/50 line-through text-sm block">{originalPrice}/yr</span>
              </div>
              <ArrowRight className="w-5 h-5 text-yellow-300 animate-pulse" />
              <div className="relative">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-300 drop-shadow-2xl" style={{
                  textShadow: '0 0 30px rgba(255,255,0,0.5), 0 0 60px rgba(255,200,0,0.3)'
                }}>
                  {salePrice}
                </span>
                <span className="text-yellow-200 text-lg font-bold">/year</span>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-yellow-400 filter blur-xl opacity-30 animate-pulse" />
              </div>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1.5 rounded-xl font-black text-sm animate-pulse">
                {discountPercent}% OFF
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="hidden md:flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-red-400/30">
              <Timer className="w-5 h-5 text-red-400 animate-pulse" />
              <div className="flex gap-1">
                {[
                  { val: timeLeft.days, label: 'd' },
                  { val: timeLeft.hours, label: 'h' },
                  { val: timeLeft.minutes, label: 'm' },
                  { val: timeLeft.seconds, label: 's' }
                ].map((item, i) => (
                  <div key={i} className="bg-red-600/80 px-2 py-1 rounded text-center min-w-[32px]">
                    <span className="font-mono font-black text-white">{String(item.val).padStart(2, '0')}</span>
                    <span className="text-[10px] text-red-200">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MEGA CTA Button */}
            <button
              onClick={() => navigate('/login')}
              className="relative bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400 text-black px-6 sm:px-8 py-3 rounded-full font-black text-base sm:text-lg shadow-2xl shadow-yellow-500/50 hover:shadow-yellow-400/70 transform hover:scale-110 transition-all duration-300 group overflow-hidden border-2 border-yellow-200"
              style={{
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Rocket className="w-5 h-5 group-hover:animate-bounce" />
                {bannerData.cta_text || `Grab ${salePrice} Deal NOW!`}
                <Zap className="w-5 h-5 animate-pulse" />
              </span>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>

            {/* Close */}
            <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white hover:scale-125 transition-transform">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrolling urgency text - Enhanced */}
          <div className="mt-2 overflow-hidden border-t border-white/10 pt-2">
            <div className="animate-marquee whitespace-nowrap text-sm font-medium">
              <span className="mx-6 text-yellow-200">🔥 LIMITED TIME ONLY</span>
              <span className="mx-6 text-white">⚡ FIRST 1000 USERS</span>
              <span className="mx-6 text-yellow-200">🎉 99% OFF - JUST {salePrice}/YEAR</span>
              <span className="mx-6 text-white">🚀 UNLIMITED BILLS FOREVER</span>
              <span className="mx-6 text-yellow-200">💎 ALL PREMIUM FEATURES</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback - Simple gradient
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
        <span className="text-sm font-medium">🎉 Special Offer!</span>
        <span className="text-sm">Get started for just {bannerData.sale_price ? `₹${bannerData.sale_price}` : '₹9'}/year</span>
        <button onClick={() => setDismissed(true)} className="text-white/60 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TopBanner;