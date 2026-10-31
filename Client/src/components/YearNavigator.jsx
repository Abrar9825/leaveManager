import React from 'react';
import { useLeave } from '../context/LeaveContext';

export default function YearNavigator() {
  const { currentYear, handleYearChange } = useLeave();

  return (
    <div className="flex items-center justify-center my-1">
      <div className="inline-flex items-center p-1.5 rounded-full bg-surface-container shadow-sm border border-surface-container-high/60">
        <button
          aria-label="Previous Year"
          onClick={() => handleYearChange(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition-all active:scale-90"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        <span className="px-5 font-headline-sm text-base sm:text-lg text-on-surface tracking-tight font-bold select-none min-w-[76px] text-center">
          {currentYear}
        </span>

        <button
          aria-label="Next Year"
          onClick={() => handleYearChange(1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition-all active:scale-90"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

