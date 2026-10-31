import React, { useState, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';

const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getFutureStr = (daysAhead = 2) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export default function AddLeaveForm() {
  const { availableBalance, addLeave, setActiveTab, isSyncing } = useLeave();

  const [mode, setMode] = useState('single'); // 'single' | 'multiple'
  const [singleDate, setSingleDate] = useState(getTodayStr());
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getFutureStr(2));
  const [dayType, setDayType] = useState('full'); // 'full' | 'half'
  const [session, setSession] = useState('morning'); // 'morning' | 'afternoon'
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Weekend Policy State (Simple Yes / No for Saturday Attendance)
  const [satAttendance, setSatAttendance] = useState('yes'); // 'yes' | 'no'

  // Analyze weekend touch (Friday, Monday, Sunday)
  const weekendAnalysis = useMemo(() => {
    if (mode === 'single') {
      const d = new Date(singleDate + 'T00:00:00');
      if (isNaN(d)) return { isFriday: false, isMonday: false, showWeekendQuestion: false };
      const day = d.getDay();
      const isFriday = day === 5;
      const isMonday = day === 1;
      return {
        isFriday,
        isMonday,
        showWeekendQuestion: isFriday || isMonday,
        hasSunday: day === 0,
        dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
      };
    } else {
      const s = new Date(startDate + 'T00:00:00');
      const e = new Date(endDate + 'T00:00:00');
      if (isNaN(s) || isNaN(e) || s > e) {
        return { isFriday: false, isMonday: false, showWeekendQuestion: false, hasSunday: false };
      }
      let touchesFriday = false;
      let touchesMonday = false;
      let hasSaturday = false;
      let hasSunday = false;
      const cur = new Date(s);
      while (cur <= e) {
        const d = cur.getDay();
        if (d === 5) touchesFriday = true;
        if (d === 1) touchesMonday = true;
        if (d === 6) hasSaturday = true;
        if (d === 0) hasSunday = true;
        cur.setDate(cur.getDate() + 1);
      }
      return {
        isFriday: touchesFriday,
        isMonday: touchesMonday && !touchesFriday,
        showWeekendQuestion: touchesFriday || touchesMonday || hasSaturday,
        hasSunday,
        hasSaturday,
      };
    }
  }, [mode, singleDate, startDate, endDate]);

  const { isFriday, isMonday, showWeekendQuestion, hasSunday } = weekendAnalysis;

  const singleDateDescription = useMemo(() => {
    try {
      const d = new Date(singleDate + 'T00:00:00');
      if (isNaN(d)) return '';
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      return `${dayName}, ${monthName} • ${isWeekend ? 'Weekend day' : 'Standard working day'}`;
    } catch {
      return '';
    }
  }, [singleDate]);

  // Dynamic Requested Days Calculation with Strict Sunday & Saturday Sandwich Rule
  const requestedDays = useMemo(() => {
    if (mode === 'single') {
      const base = dayType === 'full' ? 1.0 : 0.5;
      if (isFriday || isMonday) {
        // If employee will NOT work on Saturday: +1 Day deducted for Saturday
        if (satAttendance === 'no') {
          return base + 1.0;
        }
        return base;
      }
      return base;
    } else {
      const s = new Date(startDate + 'T00:00:00');
      const e = new Date(endDate + 'T00:00:00');
      if (isNaN(s) || isNaN(e) || s > e) return 1.0;

      let regularWorkingDays = 0;
      let sundayCount = 0;
      let saturdayCount = 0;
      const cur = new Date(s);

      while (cur <= e) {
        const d = cur.getDay();
        if (d >= 1 && d <= 5) {
          regularWorkingDays++;
        } else if (d === 0) {
          // Sunday between leave span is counted
          sundayCount++;
        } else if (d === 6) {
          saturdayCount++;
        }
        cur.setDate(cur.getDate() + 1);
      }

      // If user confirms they will work on Saturday ('yes'):
      // Individual working days are cut; Saturday & Sunday are NOT cut!
      if (satAttendance === 'yes') {
        return Math.max(1.0, regularWorkingDays);
      } else {
        // If user does NOT work on Saturday ('no'):
        // Strict sandwich rule: Saturday AND Sunday are added as leave days!
        const satDays = Math.max(saturdayCount, 1);
        return Math.max(1.0, regularWorkingDays + sundayCount + satDays);
      }
    }
  }, [mode, dayType, isFriday, isMonday, satAttendance, startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a brief reason for your leave.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const saturdayRulePayload = {
      touchesWeekend: showWeekendQuestion,
      touchesFriday: isFriday,
      touchesMonday: isMonday,
      hasSunday,
      saturdayAttendance: satAttendance === 'yes' ? 'working' : 'not_working',
      saturdayNote: showWeekendQuestion
        ? satAttendance === 'yes'
          ? isFriday
            ? 'Confirmed: Will work on Saturday (Standard deduction).'
            : 'Confirmed: Worked on Saturday (Standard deduction).'
          : isFriday
          ? 'Saturday also off (Sandwich deduction: Saturday deducted).'
          : 'Saturday not worked (Sandwich deduction: Saturday deducted).'
        : '',
      ruleConfirmed: showWeekendQuestion,
    };

    const success = await addLeave({
      mode,
      startDate: mode === 'single' ? singleDate : startDate,
      endDate: mode === 'multiple' ? endDate : undefined,
      dayType,
      session,
      reason: reason.trim(),
      requestedDays,
      saturdayRule: saturdayRulePayload,
    });

    setIsSubmitting(false);
    if (success) {
      setActiveTab('overview');
    }
  };

  const handleCancel = () => {
    setReason('');
    setError('');
    setActiveTab('overview');
  };

  return (
    <div className="w-full max-w-[620px] mx-auto flex flex-col items-center justify-start pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="w-full mb-5 text-left">
        <h1 className="font-headline-xl text-2xl sm:text-3xl text-on-surface tracking-tight font-bold">
          Apply Leave
        </h1>
        <p className="font-body-lg text-xs sm:text-sm text-on-surface-variant mt-0.5">
          Plan your time off. Balance recalculates automatically.
        </p>
      </div>

      {/* Main Card Container */}
      <div className="w-full bg-surface-container-lowest rounded-[22px] shadow-sm p-5 sm:p-7 border border-surface-container/70 relative">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Leave Duration Segmented Switch */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-on-surface">
                Leave Duration
              </label>
              <span className="text-[11px] text-on-surface-variant">
                {mode === 'single' ? 'Single session' : 'Date span'}
              </span>
            </div>

            <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl gap-1 border border-surface-container/50">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'single'
                    ? 'bg-surface-container-lowest text-primary shadow-xs border border-surface-container/80'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">today</span>
                Single Day
              </button>
              <button
                type="button"
                onClick={() => setMode('multiple')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'multiple'
                    ? 'bg-surface-container-lowest text-primary shadow-xs border border-surface-container/80'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">date_range</span>
                Multiple Days
              </button>
            </div>
          </div>

          {/* Date Selection Fields */}
          <div>
            {mode === 'single' ? (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Leave Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    required
                    className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-transparent focus:border-primary transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">info</span>
                  {singleDateDescription}
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Start Date
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full h-9 px-2 bg-surface-container-lowest text-on-surface text-xs font-semibold rounded-lg outline-none border border-surface-container focus:border-primary"
                    />
                  </div>

                  <div className="p-2 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      End Date
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full h-9 px-2 bg-surface-container-lowest text-on-surface text-xs font-semibold rounded-lg outline-none border border-surface-container focus:border-primary"
                    />
                  </div>
                </div>

                <p className="mt-1.5 text-[11px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">date_range</span>
                  Excludes regular weekends (Sunday counted if leave spans across weekend: {requestedDays} {requestedDays === 1 ? 'day' : 'days'})
                </p>
              </div>
            )}
          </div>

          {/* Leave Type Segmented Switch (Single Day) */}
          {mode === 'single' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-on-surface">Leave Type</label>
                <span className="text-[11px] text-on-surface-variant">Select proportion</span>
              </div>

              <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl gap-1 border border-surface-container/50">
                <button
                  type="button"
                  onClick={() => setDayType('full')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    dayType === 'full'
                      ? 'bg-surface-container-lowest text-primary shadow-xs border border-surface-container/80'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dayType === 'full' ? 'bg-primary' : 'bg-outline-variant'}`}></span>
                  <span>Full Day</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">1.0</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDayType('half')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    dayType === 'half'
                      ? 'bg-surface-container-lowest text-primary shadow-xs border border-surface-container/80'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dayType === 'half' ? 'bg-primary' : 'bg-outline-variant'}`}></span>
                  <span>Half Day</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-variant text-on-surface-variant font-bold">0.5</span>
                </button>
              </div>

              {dayType === 'half' && (
                <div className="mt-2.5 p-2.5 bg-surface-container-low rounded-xl flex items-center justify-between gap-2 border border-surface-container">
                  <span className="text-xs font-semibold text-on-surface-variant">Session Segment:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSession('morning')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        session === 'morning'
                          ? 'bg-surface-container-lowest text-primary shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Morning
                    </button>
                    <button
                      type="button"
                      onClick={() => setSession('afternoon')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        session === 'afternoon'
                          ? 'bg-surface-container-lowest text-primary shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Afternoon
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* SIMPLE & CLEAN WEEKEND / SANDWICH POLICY QUESTION              */}
          {/* ============================================================== */}
          {showWeekendQuestion && (
            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-2.5 animate-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-on-surface">
                  {mode === 'single'
                    ? isFriday
                      ? 'Will you come tomorrow? (Saturday)'
                      : 'Did you work on Saturday?'
                    : 'Will you work on Saturday?'}
                </label>
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  Weekend Policy
                </span>
              </div>

              {/* Simple Yes / No Buttons matching other form segmented switches */}
              <div className="grid grid-cols-2 p-1 bg-surface-container-lowest rounded-lg gap-1 border border-surface-container/60">
                <button
                  type="button"
                  onClick={() => setSatAttendance('yes')}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    satAttendance === 'yes'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  <span>Yes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSatAttendance('no')}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    satAttendance === 'no'
                      ? 'bg-surface-container-high text-on-surface font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  <span>No</span>
                </button>
              </div>

              {/* Clean Subtle Notice / Warning */}
              <div className="pt-0.5">
                {satAttendance === 'no' ? (
                  <p className="text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[15px] text-amber-700">warning</span>
                    <span>
                      {requestedDays.toFixed(1)} Days will be deducted from your balance (Saturday sandwich rule applied).
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                    <span>
                      {requestedDays.toFixed(1)} {requestedDays === 1 ? 'Day' : 'Days'} will be deducted (Individual working days; Saturday attendance confirmed).
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reason for Leave */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-on-surface">Reason for Leave</label>
              <span className="text-[11px] text-on-surface-variant font-medium">Required</span>
            </div>

            <textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Tell us briefly why you're taking leave..."
              className="w-full p-3 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl outline-none resize-none border border-transparent focus:border-primary transition-all"
            ></textarea>

            {error && (
              <p className="text-error text-[11px] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-container">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isSyncing}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-primary hover:bg-[#4834c9] shadow-primary-btn transition-all flex items-center gap-1.5 disabled:opacity-70"
            >
              {isSubmitting || isSyncing ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Confirm & Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
