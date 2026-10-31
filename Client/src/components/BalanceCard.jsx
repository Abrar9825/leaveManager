import React, { useState, useEffect, useRef } from 'react';
import { useLeave } from '../context/LeaveContext';
import ResetBalanceModal from './ResetBalanceModal';

export default function BalanceCard() {
  const { availableBalance, currentYear } = useLeave();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);

  const pressTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const HOLD_DURATION = 600; // ms

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 200);
    return () => clearTimeout(timer);
  }, [availableBalance, currentYear]);

  // Start long press handler
  const startPress = () => {
    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setHoldProgress(progress);
    }, 20);

    pressTimerRef.current = setTimeout(() => {
      // Completed long press
      clearInterval(progressIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(0);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setShowResetModal(true);
    }, HOLD_DURATION);
  };

  // Cancel long press handler
  const cancelPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  };

  // Format with integer when whole number or .5
  const formattedMetric = Number.isInteger(availableBalance)
    ? String(availableBalance).padStart(2, '0')
    : availableBalance.toFixed(1);

  return (
    <>
      <div
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
        className={`relative w-full rounded-[22px] bg-inverse-surface text-on-primary p-6 sm:p-9 md:p-10 overflow-hidden shadow-hero-dark border border-white/10 transition-all duration-300 cursor-pointer select-none group ${
          isHolding ? 'scale-[0.98] ring-2 ring-primary ring-offset-2 ring-offset-inverse-surface' : ''
        }`}
        title="Long-press (hold) to adjust or reset available days"
      >
        {/* Ambient Violet Luminous Glows */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-primary/30 blur-3xl pointer-events-none ambient-glow"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-primary/15 blur-2xl pointer-events-none"></div>

        {/* Hold Progress Bar Overlay */}
        {isHolding && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 overflow-hidden z-20">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary-fixed transition-all ease-linear"
              style={{ width: `${holdProgress}%` }}
            ></div>
          </div>
        )}

        {/* Card Upper Architecture */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Monumental Metric */}
          <div className="flex items-baseline justify-center tracking-tighter my-1 sm:my-2">
            <span
              className={`font-semibold text-[76px] sm:text-[104px] md:text-[120px] leading-none text-white select-none drop-shadow-sm tabular-nums transition-transform duration-200 ${
                isAnimating ? 'scale-105 text-secondary-fixed-dim' : 'scale-100'
              }`}
            >
              {formattedMetric}
            </span>
          </div>

          {/* Subtitle */}
          <p className="font-headline-sm text-sm sm:text-base text-secondary-fixed font-normal -mt-1 sm:-mt-2">
            Days available
          </p>
        </div>

        {/* Translucent Divider & Cycle Metadata */}
        <div className="relative z-10 mt-6 sm:mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs sm:text-[13px] text-secondary-fixed/90 font-body-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-secondary-fixed">
              event_repeat
            </span>
            <span>
              Balance for <strong className="text-white font-semibold">{currentYear}</strong>
            </span>
          </div>

          <span className="text-[11px] text-white/60 group-hover:text-white transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">touch_app</span>
            Hold to adjust
          </span>
        </div>
      </div>

      {/* Clean Compact Reset Modal */}
      {showResetModal && (
        <ResetBalanceModal onClose={() => setShowResetModal(false)} />
      )}
    </>
  );
}
