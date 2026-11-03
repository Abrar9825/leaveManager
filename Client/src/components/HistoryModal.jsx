import React from 'react';
import LeaveHistory from './LeaveHistory';

export default function HistoryModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-surface-container-lowest rounded-[24px] shadow-2xl border border-surface-container relative overflow-hidden transition-all scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-surface-container bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-[18px]">history</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                Leave History & Ledger
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Monthly breakdown, audit logs & official statements
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <LeaveHistory isModal={true} />
        </div>
      </div>
    </div>
  );
}

