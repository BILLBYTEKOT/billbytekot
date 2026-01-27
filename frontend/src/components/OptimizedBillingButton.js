/**
 * Optimized Billing Button with Instant Navigation
 * Provides instant feedback and navigation with background data loading
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { billingCache } from '../utils/billingCache';
import { toast } from 'sonner';

const OptimizedBillingButton = ({ order, user, className = "" }) => {
  const navigate = useNavigate();
  const [isPreloaded, setIsPreloaded] = useState(false);

  // Check if user has billing permissions
  const canBill = ['admin', 'cashier'].includes(user?.role);
  const canShowButton = canBill && ['ready', 'preparing', 'pending'].includes(order.status);

  useEffect(() => {
    // Pre-load billing data when component mounts (order is visible)
    if (canShowButton && order?.id) {
      const preloadData = async () => {
        try {
          // Check if already cached
          const cached = billingCache.getCachedBillingData(order.id);
          if (cached) {
            setIsPreloaded(true);
            return;
          }

          // Pre-load in background silently
          await billingCache.preloadBillingData(order.id);
          setIsPreloaded(true);
        } catch (error) {
          console.warn('Failed to preload billing data:', error);
        }
      };

      // Delay preload slightly to avoid blocking initial render
      const timer = setTimeout(preloadData, 100);
      return () => clearTimeout(timer);
    }
  }, [order?.id, canShowButton]);

  const handleBillAndPay = async () => {
    if (!order?.id) return;

    // Instant feedback - always navigate immediately
    console.log('⚡ Navigating to billing page instantly');
    navigate(`/billing/${order.id}`);
    
    // Play success sound for instant feedback
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Quick success beep
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (e) {
      // Silently fail if audio not supported
    }

    // Background data preparation (if not already cached)
    try {
      const cached = billingCache.getCachedBillingData(order.id);
      if (!cached) {
        // Pre-load data in background for smooth billing page experience
        billingCache.preloadBillingData(order.id).catch(error => {
          console.warn('Background preload failed:', error);
        });
      }
    } catch (error) {
      console.error('Background billing preparation error:', error);
    }
  };

  if (!canShowButton) {
    return null;
  }

  return (
    <button 
      onClick={handleBillAndPay}
      className={`flex-1 h-10 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 shadow-lg hover:shadow-xl ${className}`}
    >
      <CreditCard className="w-4 h-4" />
      Bill & Pay
      {isPreloaded && (
        <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Ready for instant billing!" />
      )}
    </button>
  );
};

export default OptimizedBillingButton;