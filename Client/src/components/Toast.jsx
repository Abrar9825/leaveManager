import React from 'react';
import { useLeave } from '../context/LeaveContext';

export default function Toast() {
  const { toast, closeToast } = useLeave();

  if (!toast.open) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-inverse-surface text-inverse-on-surface shadow-2xl border border-white/10 max-w-[90vw] sm:max-w-md animate-bounce-subtle">
      <span className="material-symbols-outlined text-[22px] text-secondary-fixed shrink-0">
        check_circle
      </span>

      <div className="flex-1 min-w-0 pr-1">
        <p className="font-label-md text-xs sm:text-sm font-bold text-white tracking-tight truncate">
          {toast.title}
        </p>
        <p className="font-body-sm text-[11px] sm:text-xs text-inverse-on-surface/85 line-clamp-2">
          {toast.message}
        </p>
      </div>

      <button
        onClick={closeToast}
        className="p-1 rounded-lg hover:bg-white/10 text-inverse-on-surface/70 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}

