import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';

export default function ResetBalanceModal({ onClose }) {
  const { currentYear, selectedMonth, selectedMonthName, availableBalance, resetBalance, isSyncing } = useLeave();
  const [newVal, setNewVal] = useState(String(availableBalance));
  const [reason, setReason] = useState('Manual balance adjustment');
  const [error, setError] = useState('');

  const numericNewVal = parseFloat(newVal);
  const diff = !isNaN(numericNewVal) ? parseFloat((numericNewVal - availableBalance).toFixed(1)) : 0;

  const handleAdjustDelta = (delta) => {
    const cur = !isNaN(numericNewVal) ? numericNewVal : availableBalance;
    const next = parseFloat((cur + delta).toFixed(1));
    setNewVal(String(next));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(numericNewVal)) {
      setError('Enter a valid numeric balance');
      return;
    }

    const ok = await resetBalance(
      currentYear,
      numericNewVal,
      reason.trim() || `Manual balance adjustment for ${selectedMonthName}`,
      selectedMonth
    );
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] max-h-[92vh] flex flex-col bg-surface-container-lowest rounded-[22px] shadow-2xl border border-surface-container p-4 sm:p-6 relative overflow-hidden transition-all scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">restart_alt</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface truncate">
                Adjust Balance
              </h3>
              <p className="text-[11px] text-on-surface-variant truncate">
                <span className="font-semibold text-primary">{selectedMonthName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body - Scrollable on small screens */}
        <form onSubmit={handleSubmit} className="pt-4 space-y-4 overflow-y-auto pr-0.5">
          {/* Stepper Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-on-surface">
                New Available Balance
              </label>
              {diff !== 0 && (
                <span
                  className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full ${
                    diff > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff} days
                </span>
              )}
            </div>

            {/* Fully Responsive 5-column grid */}
            <div className="grid grid-cols-5 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleAdjustDelta(-1)}
                className="h-10 sm:h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs sm:text-sm flex items-center justify-center transition-all active:scale-95"
                title="Decrease by 1"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleAdjustDelta(-0.5)}
                className="h-10 sm:h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs sm:text-sm flex items-center justify-center transition-all active:scale-95"
                title="Decrease by 0.5"
              >
                -0.5
              </button>

              <input
                type="number"
                step="0.5"
                value={newVal}
                onChange={(e) => {
                  setNewVal(e.target.value);
                  setError('');
                }}
                className="h-10 sm:h-11 w-full min-w-0 bg-surface-container-low text-on-surface text-center font-bold text-base sm:text-lg rounded-xl outline-none border border-surface-container focus:border-primary transition-all font-mono"
                required
              />

              <button
                type="button"
                onClick={() => handleAdjustDelta(0.5)}
                className="h-10 sm:h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs sm:text-sm flex items-center justify-center transition-all active:scale-95"
                title="Increase by 0.5"
              >
                +0.5
              </button>
              <button
                type="button"
                onClick={() => handleAdjustDelta(1)}
                className="h-10 sm:h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs sm:text-sm flex items-center justify-center transition-all active:scale-95"
                title="Increase by 1"
              >
                +1
              </button>
            </div>
            {error && <p className="text-[11px] text-error mt-1">{error}</p>}
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[10px] text-on-surface-variant font-medium block mb-1.5">
              Quick presets:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[0, 1.0, 2.0, 3.0, 4.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setNewVal(String(preset));
                    setError('');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold border transition-all active:scale-95 ${
                    numericNewVal === preset
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container text-primary border-surface-container/60'
                  }`}
                >
                  {preset.toFixed(1)}d
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Reason for Adjustment
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Monthly reset, Compensatory leave, HR calibration"
              required
              className="w-full h-10 px-3 bg-surface-container-low text-on-surface text-xs rounded-xl outline-none border border-surface-container focus:border-primary transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSyncing}
              className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-[#4834c9] shadow-sm rounded-xl transition-all disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSyncing ? (
                <>
                  <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  <span>Save Adjustment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
