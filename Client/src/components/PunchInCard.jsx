import React, { useState, useEffect, useRef } from 'react';
import { useLeave, formatDateKey } from '../context/LeaveContext';

export default function PunchInCard() {
  const { todayAttendance, punchIn, isSyncing, attendanceStats, lateStrikesInCycle } = useLeave();

  // Current live time
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual time input state
  const [manualTime, setManualTime] = useState(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });
  const [manualDate, setManualDate] = useState(() => formatDateKey());
  const [manualNotes, setManualNotes] = useState('');

  const pressTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const HOLD_DURATION = 600; // ms

  // Ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Long press handler
  const startPress = () => {
    if (isSyncing) return;
    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setHoldProgress(progress);
    }, 20);

    pressTimerRef.current = setTimeout(async () => {
      clearInterval(progressIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(0);
      if (navigator.vibrate) {
        navigator.vibrate(60);
      }
      await punchIn({ method: 'long_press' });
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

  // Submit manual time
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualTime) return;
    const res = await punchIn({
      date: manualDate,
      time: manualTime,
      method: 'manual',
      notes: manualNotes,
    });
    if (res?.success) {
      setShowManualModal(false);
    }
  };

  const formattedLiveTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedLiveDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Check if manual time is late
  const isManualTimeLate = (() => {
    if (!manualTime) return false;
    const [hStr, mStr] = manualTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    return h * 60 + m > 10 * 60;
  })();

  return (
    <>
      <div className="w-full rounded-[22px] bg-surface-container-lowest shadow-sm border border-surface-container p-6 sm:p-7 relative overflow-hidden transition-all">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">timer</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface tracking-tight">
                  Daily Check-In
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps tracking-wider uppercase">
                  Cutoff: 10:00 AM
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {formattedLiveDate}
              </p>
            </div>
          </div>

          {/* Live Clock & Manual Button */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-xs text-on-surface-variant font-medium block">Current Time</span>
              <span className="font-mono text-sm sm:text-base font-bold text-on-surface">
                {formattedLiveTime}
              </span>
            </div>
            <button
              onClick={() => setShowManualModal(true)}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs border border-surface-container transition-all flex items-center gap-1.5"
              title="Enter custom punch-in time manually"
            >
              <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
              <span>Manual Time</span>
            </button>
          </div>
        </div>

        {/* Center Punch-In Interactive Area */}
        <div className="pt-6 pb-2 flex flex-col items-center justify-center text-center">
          {todayAttendance ? (
            /* Checked-In Today State */
            <div className="w-full flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm ${
                  todayAttendance.isLate
                    ? 'bg-rose-50 text-rose-600 ring-4 ring-rose-100'
                    : 'bg-emerald-50 text-emerald-600 ring-4 ring-emerald-100'
                }`}
              >
                <span className="material-symbols-outlined text-[32px]">
                  {todayAttendance.isLate ? 'schedule' : 'verified'}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface">
                  Checked In at {todayAttendance.punchTime}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    todayAttendance.isLate
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {todayAttendance.isLate
                    ? `Late (+${todayAttendance.minutesLate}m)`
                    : 'On Time'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mt-1">
                {todayAttendance.isLate
                  ? `Marked as late (after 10:00 AM cutoff). Late strike: ${lateStrikesInCycle} of 3 this month.`
                  : 'You arrived before 10:00 AM cutoff. No deduction applied.'}
              </p>

              {/* Re-punch button */}
              <button
                onClick={() => setShowManualModal(true)}
                type="button"
                className="mt-4 text-xs text-on-surface-variant hover:text-primary font-medium flex items-center gap-1 transition-colors underline decoration-dotted"
              >
                <span className="material-symbols-outlined text-[14px]">history</span>
                Need to adjust today's check-in time?
              </button>
            </div>
          ) : (
            /* Not Checked-In Today State: Long-Press Button */
            <div className="w-full flex flex-col items-center">
              {/* Tactile Big Long-Press Button */}
              <div className="relative my-3 flex items-center justify-center">
                {/* Outer animated hold progress ring */}
                <svg className="w-40 h-40 transform -rotate-90 pointer-events-none absolute">
                  <circle
                    cx="80"
                    cy="80"
                    r="72"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-surface-container"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="72"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-primary transition-all ease-linear"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 72}
                    strokeDashoffset={2 * Math.PI * 72 * (1 - holdProgress / 100)}
                    strokeLinecap="round"
                  />
                </svg>

                <button
                  onMouseDown={startPress}
                  onMouseUp={cancelPress}
                  onMouseLeave={cancelPress}
                  onTouchStart={startPress}
                  onTouchEnd={cancelPress}
                  onTouchCancel={cancelPress}
                  disabled={isSyncing}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all select-none shadow-md ${
                    isHolding
                      ? 'scale-95 bg-primary-container text-white shadow-xl ring-4 ring-primary/30'
                      : 'bg-primary text-white hover:bg-primary/95 active:scale-95'
                  }`}
                >
                  <span className="material-symbols-outlined text-[36px] mb-1">
                    fingerprint
                  </span>
                  <span className="text-[11px] font-bold tracking-wider uppercase font-label-caps">
                    {isHolding ? 'Hold...' : 'Hold Punch'}
                  </span>
                </button>
              </div>

              <p className="text-xs text-on-surface-variant mt-2 font-medium">
                Hold for 600ms to punch in automatically with current time.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Rule Strip */}
        <div className="mt-5 pt-3.5 border-t border-surface-container/60 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-amber-500">
              gavel
            </span>
            <span>
              <strong>Late Rule:</strong> Every <strong>3 late check-ins</strong> (after 10:00 AM) deducts <strong>0.5 day (Half Day)</strong> from your monthly quota.
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-on-surface">
              Month Lates: <span className="text-primary font-bold">{attendanceStats.lateCount}</span>
            </span>
            <div className="flex items-center gap-1 ml-1" title={`${lateStrikesInCycle}/3 strikes`}>
              {[1, 2, 3].map((step) => {
                const filled = lateStrikesInCycle >= step;
                return (
                  <span
                    key={step}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      filled ? 'bg-rose-500' : 'bg-surface-container-high'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Time Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-[22px] shadow-2xl border border-surface-container overflow-hidden">
            <div className="p-5 border-b border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">access_time</span>
                </div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Enter Check-In Time Manually
                </h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-on-surface-variant">
                    Arrival Time
                  </label>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isManualTimeLate
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isManualTimeLate ? 'Late (After 10:00 AM)' : 'On Time (Before 10:00 AM)'}
                  </span>
                </div>
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono text-base"
                  required
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Standard reporting time is 10:00 AM.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Reason / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Traffic delay, Client meeting"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-container transition-colors shadow-sm"
                >
                  {isSyncing ? 'Saving...' : 'Save Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

