import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';

export default function LeaveRulesPage({ onBackToProfile }) {
  const { user, acknowledgeLeaveRules, setActiveTab } = useLeave();
  const [agreed, setAgreed] = useState(user?.rulesAcknowledged || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!agreed) return;
    setIsSubmitting(true);
    await acknowledgeLeaveRules();
    setIsSubmitting(false);
    setActiveTab('overview');
  };

  return (
    <div className="w-full max-w-[720px] mx-auto flex flex-col gap-5 pb-16 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col gap-1 text-left">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/40 text-primary text-[11px] font-bold tracking-wider uppercase border border-primary/20">
            <span className="material-symbols-outlined text-[15px]">menu_book</span>
            <span>Policy Guidelines</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              <span>Dashboard</span>
            </button>
            {onBackToProfile && (
              <button
                type="button"
                onClick={onBackToProfile}
                className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>Profile</span>
              </button>
            )}
          </div>
        </div>

        <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mt-1">
          Attendance & Leave Policy Rules
        </h1>
        <p className="font-body-md text-xs sm:text-sm text-on-surface-variant">
          Official guide to check-in timings, late attendance deductions, monthly quota, and deficit tracking.
        </p>

        {/* First-time Registration Welcome Banner */}
        {!user?.rulesAcknowledged && (
          <div className="p-4 rounded-2xl bg-primary-fixed/30 border border-primary/25 flex items-start gap-3 shadow-xs mt-1">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">Welcome! Policy Review</h3>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Please review the daily check-in timings and monthly leave balance guidelines below. Check the agreement box at the bottom and click continue to enter your dashboard.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RULE: DAILY ATTENDANCE & 10:00 AM LATE MARK */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container/70 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <span className="material-symbols-outlined text-[18px]">timer</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">
              Daily Check-in & Late Mark (10:00 AM Cutoff)
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Every 3 late arrivals in a month deduct <strong>0.5 day (half day)</strong> from your leave balance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              Arrival at or before 10:00 AM:
            </span>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              Marked as <strong>On Time</strong>. No penalty strikes or deductions applied.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <span className="font-bold text-rose-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              Arrival after 10:00 AM (Late):
            </span>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              Marked as <strong>Late</strong>. On every 3rd late in the month (3rd, 6th, etc.), <strong>0.5 day</strong> is automatically deducted from your monthly leave balance.
            </p>
          </div>
        </div>
      </div>

      {/* RULE: STRICTLY MONTH-WISE 2.0 DAYS QUOTA & DEFICIT (NEGATIVE) */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container/70 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">
              Month-Wise Leave Balance (2.0 Days Allowance / Month)
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Leave balances operate strictly on a monthly cycle, not yearly.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-2 text-xs">
          <p className="text-on-surface font-semibold leading-relaxed">
            Every month provides a fresh quota of <strong className="text-primary font-bold">2.0 Paid Days</strong>.
          </p>

          <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container/70 space-y-1 text-[11px]">
            <span className="font-bold text-on-surface block">
              Negative Balance / Deficit Tracking:
            </span>
            <p className="text-on-surface-variant leading-relaxed">
              If your leaves taken + late deductions exceed 2.0 days in a month, your balance clearly drops into negative (e.g. <strong>-0.5</strong> or <strong>-1.0 days</strong>). The negative deficit is prominently highlighted and accounted for as Loss of Pay / leave deficit.
            </p>
          </div>
        </div>
      </div>

      {/* RULE: FRIDAY / MONDAY & SATURDAY POLICY */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container/70 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[18px]">event_busy</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">
              Weekend Policy (Friday / Monday Leaves)
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Saturday attendance verification and sandwich policy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              Saturday Working (Yes):
            </span>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              Compensatory attendance confirmed. Only <strong>1.0 Day</strong> is deducted.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <span className="font-bold text-amber-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              Saturday Not Working (No):
            </span>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              Saturday is counted under sandwich policy. Total <strong>2.0 Days</strong> deducted.
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM ACCEPTANCE & CONTINUE SECTION */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container/70 flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="flex items-start gap-2.5 cursor-pointer select-none max-w-[480px]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-primary rounded accent-primary cursor-pointer shrink-0"
          />
          <span className="text-xs font-semibold text-on-surface leading-snug">
            I understand that 10:00 AM is the arrival cutoff (3 lates = 0.5 day deduction), and monthly leave quota is 2.0 days.
          </span>
        </label>

        <button
          type="button"
          disabled={!agreed || isSubmitting}
          onClick={handleContinue}
          className="w-full sm:w-auto h-11 px-5 rounded-xl font-label-md text-xs sm:text-sm font-bold text-white bg-primary hover:bg-[#4834c9] shadow-primary-btn transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
        >
          {isSubmitting ? (
            <span>Saving...</span>
          ) : (
            <>
              <span>Accept & Continue to Dashboard</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
