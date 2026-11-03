import React, { useState, useRef } from 'react';
import { useLeave, MONTH_NAMES } from '../context/LeaveContext';
import CalendarModal from './CalendarModal';
import ResetBalanceModal from './ResetBalanceModal';
import HistoryModal from './HistoryModal';

export default function BalanceCard() {
  const {
    monthBalance,
    isMonthDeficit,
    monthDeficitDays,
    monthOpeningBalance,
    MONTHLY_BASE_QUOTA,
    monthLeavesTaken,
    monthLateDeductions,
    attendanceRecords,
    selectedMonthName,
    prevMonth,
    nextMonth,
    userJoinMonth,
    userJoinYear,
    showToast,
  } = useLeave();

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const pressTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const HOLD_DURATION = 600; // ms

  const isPreJoining = MONTHLY_BASE_QUOTA === 0;

  const startPress = () => {
    if (isPreJoining) {
      showToast(
        'Pre-Joining Month',
        `Employment started in ${MONTH_NAMES[userJoinMonth - 1]} ${userJoinYear}. Quota accrues starting from your joining month.`,
        'info'
      );
      return;
    }

    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setHoldProgress(progress);
    }, 20);

    pressTimerRef.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(0);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setShowResetModal(true);
    }, HOLD_DURATION);
  };

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

  const formattedMetric = (() => {
    if (isPreJoining) {
      return '00';
    }
    if (monthBalance < 0) {
      return `-${Math.abs(monthBalance).toFixed(1)}`;
    }
    return Number.isInteger(monthBalance)
      ? String(monthBalance).padStart(2, '0')
      : monthBalance.toFixed(1);
  })();

  const hasCarry = monthOpeningBalance !== 0;

  return (
    <>
      <div
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
        className={`relative w-full rounded-[22px] p-6 sm:p-8 text-on-primary shadow-hero-dark transition-all select-none cursor-pointer overflow-hidden ${
          isPreJoining
            ? 'bg-[#14121a] border border-white/10 opacity-90'
            : isMonthDeficit
            ? 'bg-[#1a0f16] border border-rose-500/30'
            : 'bg-inverse-surface border border-white/10'
        } ${isHolding ? 'scale-[0.98] ring-2 ring-primary ring-offset-2 ring-offset-inverse-surface' : ''}`}
        title={isPreJoining ? `Pre-joining (Joined ${MONTH_NAMES[userJoinMonth - 1]} ${userJoinYear})` : 'Hold to adjust balance'}
      >
        {/* Hold Progress Bar Overlay */}
        {isHolding && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 overflow-hidden z-20">
            <div
              className="h-full bg-primary transition-all ease-linear"
              style={{ width: `${holdProgress}%` }}
            ></div>
          </div>
        )}

        {/* Top: Month Switcher & Small Calendar Icon */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
          <div
            className="flex items-center gap-2"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button
              onClick={prevMonth}
              type="button"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-secondary-fixed transition-colors"
              title="Previous Month"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>

            <span className="font-headline-sm text-sm sm:text-base font-bold text-white tracking-tight">
              {selectedMonthName}
            </span>

            <button
              onClick={nextMonth}
              type="button"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-secondary-fixed transition-colors"
              title="Next Month"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <div
            className="flex items-center gap-2"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {isPreJoining && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-semibold">
                Pre-joining
              </span>
            )}

            <button
              onClick={() => setShowCalendarModal(true)}
              type="button"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-secondary-fixed transition-colors"
              title="Open Calendar"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              type="button"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-secondary-fixed transition-colors"
              title="Leave History & Statements"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
            </button>
          </div>
        </div>

        {/* Center: Big Monumental Number */}
        <div className="relative z-10 py-6 flex flex-col items-center justify-center text-center">
          <span
            className={`font-semibold text-[80px] sm:text-[96px] leading-none select-none tabular-nums ${
              isPreJoining
                ? 'text-white/40'
                : isMonthDeficit
                ? 'text-rose-400'
                : 'text-white'
            }`}
          >
            {formattedMetric}
          </span>

          <p
            className={`text-sm mt-1 font-medium ${
              isPreJoining
                ? 'text-white/50'
                : isMonthDeficit
                ? 'text-rose-300 font-bold'
                : 'text-secondary-fixed'
            }`}
          >
            {isPreJoining
              ? `Joined in ${MONTH_NAMES[userJoinMonth - 1]} ${userJoinYear}`
              : isMonthDeficit
              ? `Deficit: -${monthDeficitDays.toFixed(1)} Days`
              : 'Days available'}
          </p>
        </div>

        {/* Bottom: Clean Micro-Stats with Carry Forward */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col gap-2">
          <div className={`grid ${hasCarry ? 'grid-cols-4' : 'grid-cols-3'} text-center text-xs`}>
            {hasCarry && (
              <div>
                <span className="text-white/50 block text-[11px]">Carry</span>
                <span
                  className={`font-bold font-mono text-sm sm:text-base ${
                    monthOpeningBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {monthOpeningBalance > 0 ? `+${monthOpeningBalance}` : monthOpeningBalance}
                </span>
              </div>
            )}

            <div>
              <span className="text-white/50 block text-[11px]">Quota</span>
              <span className="font-bold text-white font-mono text-sm sm:text-base">
                +{MONTHLY_BASE_QUOTA.toFixed(1)}
              </span>
            </div>

            <div>
              <span className="text-white/50 block text-[11px]">Leaves</span>
              <span className="font-bold text-amber-300 font-mono text-sm sm:text-base">
                -{monthLeavesTaken.toFixed(1)}
              </span>
            </div>

            <div>
              <span className="text-white/50 block text-[11px]">Late</span>
              <span className="font-bold text-rose-400 font-mono text-sm sm:text-base">
                -{monthLateDeductions.toFixed(1)}
                <span className="text-[10px] text-white/50 ml-1">
                  ({attendanceRecords.length})
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end text-[10px] text-white/40 pt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">
                {isPreJoining ? 'lock' : 'touch_app'}
              </span>
              {isPreJoining ? 'Pre-joining period' : 'Hold to adjust'}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendarModal && (
        <CalendarModal onClose={() => setShowCalendarModal(false)} />
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <HistoryModal onClose={() => setShowHistoryModal(false)} />
      )}

      {/* Reset Balance Modal */}
      {showResetModal && (
        <ResetBalanceModal onClose={() => setShowResetModal(false)} />
      )}
    </>
  );
}
