import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';

export default function LeaveRulesModal({ isOpen, onClose, isMandatory = false }) {
  const { acknowledgeLeaveRules, user } = useLeave();
  const [hasAgreed, setHasAgreed] = useState(user?.rulesAcknowledged || false);

  if (!isOpen) return null;

  const handleContinue = async () => {
    if (!hasAgreed) return;
    await acknowledgeLeaveRules();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-inverse-surface/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Dialog */}
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface-container-lowest rounded-[24px] shadow-2xl border border-surface-container relative overflow-hidden transition-all scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Optical Violet Glow */}
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-primary/15 blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-[24px]">menu_book</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface">
                Leave Logic & Policy Rules
              </h3>
              <p className="text-xs text-on-surface-variant">
                Complete guide to company rules, calculations, and weekend terms
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Scrollable Rules Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-on-surface">
          {/* Welcome Banner */}
          <div className="p-3.5 rounded-2xl bg-primary-fixed/20 border border-primary/25 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[22px] shrink-0">info</span>
            <p className="text-xs text-on-surface leading-relaxed">
              Please review how leave allocations, recalculations, and Saturday policies work before applying.
            </p>
          </div>

          {/* RULE 1: AUTO RECALCULATION ON EDIT & DELETE */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-surface-container space-y-3">
            <div className="flex items-center gap-2.5 text-primary font-bold text-sm sm:text-base">
              <span className="material-symbols-outlined text-[20px]">calculate</span>
              <h4>Rule 1: Automatic Balance Recalculation (Edit & Delete)</h4>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Whenever any leave is deleted or modified, your available days balance and monthly quota recalculate instantly without manual HR intervention.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container">
                <span className="font-bold text-emerald-600 block mb-1">Example A (Delete Leave):</span>
                <p className="text-on-surface-variant">
                  Agar aapne <strong>1.0 day</strong> ki leave delete ki, to turant system aapke available days me <strong>+1.0 Day restore</strong> kar dega.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container">
                <span className="font-bold text-purple-600 block mb-1">Example B (Edit Leave):</span>
                <p className="text-on-surface-variant">
                  Agar aapne Full Day (1.0) leave ko edit karke Half Day (0.5) kiya, to difference ka <strong>0.5 Day</strong> wapas available balance me add ho jayega.
                </p>
              </div>
            </div>
          </div>

          {/* RULE 2: FRIDAY / MONDAY & SATURDAY POLICY */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[22px]">event_busy</span>
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-amber-950">
                  Rule 2: Weekend Policy (Friday / Monday Rule)
                </h4>
                <p className="text-xs text-amber-900/90 mt-0.5">
                  Your leave includes Friday or Monday. Company rules require Saturday attendance verification.
                </p>
              </div>
            </div>

            {/* Exact Clean Structure requested by user */}
            <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-amber-500/20 space-y-3 text-xs">
              <div>
                <span className="font-bold text-on-surface block mb-1.5">
                  1. Is Saturday an official holiday / off day?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-900 font-semibold border border-amber-500/30 text-center">
                    Yes, Saturday is OFF / Holiday
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant font-medium border border-surface-container text-center">
                    No, Saturday is Regular Working Day
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-on-surface block mb-1.5">
                  2. Because you are taking Friday off & Saturday is a holiday: Will you come to work on Saturday? (Saturday aaoge?)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 flex items-center justify-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                    <span>Yes, I will work on Saturday</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-on-surface-variant flex items-center justify-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>No, Saturday also off</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-emerald-600">verified</span>
                <span>
                  <strong>Compliant:</strong> Compensatory attendance confirmed for Saturday.
                </span>
              </div>
            </div>

            <p className="text-[11px] text-amber-900/80 leading-relaxed italic">
              * Note: If you take Friday or Monday off and do not attend Saturday, it is classified as an extended weekend sandwich leave.
            </p>
          </div>

          {/* RULE 3: DASHBOARD BALANCE CALIBRATION */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-surface-container space-y-2.5">
            <div className="flex items-center gap-2.5 text-primary font-bold text-sm sm:text-base">
              <span className="material-symbols-outlined text-[20px]">touch_app</span>
              <h4>Rule 3: Dashboard Balance Calibration (+1 / -1 Steppers)</h4>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Dashboard par available days card par <strong>long-press (hold)</strong> karke aap balance ko adjust kar sakte hain (quick <strong>+1</strong> aur <strong>-1</strong> buttons ke sath).
            </p>

            <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface-variant">
              <span className="font-bold text-on-surface block mb-0.5">Audit Trail:</span>
              Koi bhi calibration ya adjustment History tab me <strong>Balance Tracking History</strong> ke andar date, time, reason aur net change ke sath permanently record hota hai.
            </div>
          </div>
        </div>

        {/* Modal Footer & Acknowledgment Checkbox */}
        <div className="p-5 sm:p-6 pt-4 bg-surface-container-low/70 border-t border-surface-container flex flex-col gap-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-primary rounded accent-primary cursor-pointer shrink-0"
            />
            <span className="text-xs font-semibold text-on-surface leading-tight">
              Maine sabhi leave rules aur company policies achhe se samajh liye hain (I have read and agree to all leave policy rules).
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-1">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Close
              </button>
            )}

            <button
              type="button"
              disabled={!hasAgreed}
              onClick={handleContinue}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-primary hover:bg-[#4834c9] shadow-primary-btn transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Continue to Dashboard</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

