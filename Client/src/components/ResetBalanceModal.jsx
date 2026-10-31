import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';

export default function ResetBalanceModal({ onClose }) {
  const { currentYear, availableBalance, resetBalance, isSyncing } = useLeave();
  const [newVal, setNewVal] = useState(String(availableBalance));
  const [reason, setReason] = useState('Manual balance adjustment');
  const [error, setError] = useState('');

  const numericNewVal = parseFloat(newVal);
  const diff = !isNaN(numericNewVal) ? parseFloat((numericNewVal - availableBalance).toFixed(1)) : 0;

  const handleAdjustDelta = (delta) => {
    const cur = !isNaN(numericNewVal) ? numericNewVal : availableBalance;
    const next = Math.max(0, parseFloat((cur + delta).toFixed(1)));
    setNewVal(String(next));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(numericNewVal) || numericNewVal < 0) {
      setError('Enter a valid leave balance');
      return;
    }

    const ok = await resetBalance(currentYear, numericNewVal, reason.trim() || 'Manual balance adjustment');
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Compact Clean Small Modal */}
      <div
        className="w-full max-w-[360px] bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container p-5 relative overflow-hidden transition-all scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">restart_alt</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                Adjust Balance
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Year <span className="font-semibold text-primary">{currentYear}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="pt-4 space-y-3.5">
          {/* Current & Net Delta preview */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-surface-container/60 text-xs">
            <div>
              <span className="text-on-surface-variant text-[11px] block">Current</span>
              <strong className="text-sm font-bold text-on-surface">{availableBalance.toFixed(1)}d</strong>
            </div>

            <div className="text-right">
              <span className="text-on-surface-variant text-[11px] block">Adjustment</span>
              <span
                className={`text-sm font-bold ${
                  diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-amber-600' : 'text-on-surface'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff}d
              </span>
            </div>
          </div>

          {/* Number Input + Quick Steppers (+1 and -1 ONLY) */}
          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant mb-1.5">
              Available Days
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={newVal}
                onChange={(e) => {
                  setNewVal(e.target.value);
                  if (error) setError('');
                }}
                required
                className="w-full h-10 px-3 text-base font-bold bg-surface-container-low focus:bg-surface-container-lowest text-on-surface rounded-xl outline-none border border-surface-container focus:border-primary transition-all text-center"
              />

              {/* ONLY +1 and -1 quick buttons */}
              <button
                type="button"
                onClick={() => handleAdjustDelta(1.0)}
                className="h-10 px-3 text-xs font-bold rounded-xl bg-surface-container-low hover:bg-emerald-500/10 hover:text-emerald-600 text-on-surface transition-all border border-surface-container shrink-0"
                title="Add 1 Day"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => handleAdjustDelta(-1.0)}
                className="h-10 px-3 text-xs font-bold rounded-xl bg-surface-container-low hover:bg-amber-500/10 hover:text-amber-600 text-on-surface transition-all border border-surface-container shrink-0"
                title="Subtract 1 Day"
              >
                -1
              </button>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
              Reason / Note
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Quota calibration"
              required
              className="w-full h-9 px-3 bg-surface-container-low text-on-surface text-xs rounded-xl outline-none border border-transparent focus:border-primary"
            />
            {error && (
              <p className="text-error text-[11px] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-[#4834c9] shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-70"
            >
              {isSyncing ? (
                <>
                  <span className="material-symbols-outlined text-[15px] animate-spin">refresh</span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Balance</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
