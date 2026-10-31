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

          {onBackToProfile && (
            <button
              type="button"
              onClick={onBackToProfile}
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Profile</span>
            </button>
          )}
        </div>

        <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mt-1">
          Leave Policy & System Rules
        </h1>
        <p className="font-body-md text-xs sm:text-sm text-on-surface-variant">
          Official guide to company leave terms, Saturday & Sunday sandwich rules, and balance calculations.
        </p>
      </div>

      {/* RULE 1: FRIDAY LEAVE (SATURDAY ATTENDANCE) */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container/70 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[18px]">event_busy</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">
              Rule 1: Friday Leave (Saturday Attendance Rule)
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              When applying for Friday leave, the system asks: <strong>"Will you come tomorrow? (Saturday)"</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              If You Work on Saturday (Yes):
            </span>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              You will attend office on Saturday. Only <strong>1.0 Day</strong> will be deducted for your Friday leave.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <span className="font-bold text-amber-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              If Saturday Also Off (No):
            </span>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              Under company sandwich policy, Saturday is also counted as leave. Total <strong>2.0 Days</strong> will be deducted (Friday + Saturday).
            </p>
          </div>
        </div>
      </div>

      {/* RULE 2: MONDAY LEAVE (PRECEDING SATURDAY WORK) */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container/70 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">
              Rule 2: Monday Leave (Saturday Verification Rule)
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              When applying for Monday leave, the system asks: <strong>"Did you work on Saturday?"</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              If You Worked on Saturday (Yes):
            </span>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              Saturday compensatory attendance is verified. Only <strong>1.0 Day</strong> will be deducted for your Monday leave.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <span className="font-bold text-amber-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              If You Did Not Work Saturday (No):
            </span>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              Saturday holiday is cancelled and deducted from your paid quota. Total <strong>2.0 Days</strong> will be deducted (Saturday + Monday).
            </p>
          </div>
        </div>
      </div>

      {/* RULE 3: CONTINUOUS LEAVES & SUNDAY SANDWICH RULE */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container/70 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[18px]">date_range</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">
              Rule 3: Continuous Leaves & Sunday Sandwich Rule
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              When taking a leave spanning across Sunday (e.g. Friday to Monday, Thursday to Tuesday, etc.):
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-2 text-xs">
          <p className="text-on-surface font-semibold leading-relaxed">
            If Sunday falls between your leave start date and end date, Sunday is <strong className="text-primary font-bold">NOT exempt</strong> and is counted as a paid leave day.
          </p>

          <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container/70 space-y-1 text-[11px]">
            <span className="font-bold text-on-surface block">
              Example (Friday to Monday Range Leave):
            </span>
            <p className="text-on-surface-variant">
              If an employee takes leave from Friday to Monday and does not attend Saturday:
              <br />
              <strong className="text-primary font-bold">
                Friday (1) + Saturday (1) + Sunday (1) + Monday (1) = 4.0 Days Total Deduction.
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* RULE 4: AUTOMATIC BALANCE RECALCULATION (EDIT & DELETE) */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container/70 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[18px]">calculate</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">
              Rule 4: Automatic Balance Recalculation (Edit & Delete)
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Whenever any approved leave is modified or removed, your leave balance recalculates instantly in real time without HR delay.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">delete</span>
              Delete Leave:
            </span>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              If you delete a <strong>1.0 Day</strong> leave, system immediately adds <strong>+1.0 Day</strong> back to your available balance.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
            <span className="font-bold text-purple-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">edit</span>
              Edit Leave:
            </span>
            <p className="text-on-surface-variant leading-relaxed text-[11px]">
              If you change a Full Day (1.0) to Half Day (0.5), the difference of <strong>0.5 Day</strong> is automatically restored back.
            </p>
          </div>
        </div>
      </div>

      {/* RULE 5: DASHBOARD BALANCE CALIBRATION (LONG-PRESS HOLD) */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container/70 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[18px]">touch_app</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">
              Rule 5: Dashboard Balance Calibration (Long-Press Hold)
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Long-press (hold for ~600ms) on the Available Days card on the Dashboard to adjust your balance.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-2 text-xs">
          <p className="text-on-surface leading-relaxed text-[11px]">
            Use the simple <strong>+1</strong> and <strong>-1</strong> stepper buttons to calibrate days. Every change is permanently recorded in the <strong>Balance Tracking History</strong> audit log with the date, time, reason, and changer name.
          </p>
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
            I have read, understood, and agree to follow all company leave policies and weekend rules.
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
