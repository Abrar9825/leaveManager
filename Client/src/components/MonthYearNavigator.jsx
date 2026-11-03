import React, { useState } from 'react';
import { useLeave, MONTH_NAMES } from '../context/LeaveContext';

export default function MonthYearNavigator() {
  const {
    selectedYear,
    selectedMonth,
    selectedMonthName,
    isCurrentMonth,
    prevMonth,
    nextMonth,
    jumpToCurrentMonth,
    setSelectedMonth,
    setSelectedYear,
  } = useLeave();

  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-2 w-full max-w-[820px] mx-auto">
      {/* Center Nav Pill */}
      <div className="inline-flex items-center p-1.5 rounded-full bg-surface-container shadow-xs border border-surface-container-high/60">
        <button
          aria-label="Previous Month"
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition-all active:scale-90"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        <button
          onClick={() => setShowPicker(!showPicker)}
          type="button"
          className="px-4 py-1 rounded-full hover:bg-surface-container-lowest transition-colors flex items-center gap-1.5 font-headline-sm text-sm sm:text-base text-on-surface tracking-tight font-bold select-none min-w-[140px] justify-center"
        >
          <span>{selectedMonthName}</span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            expand_more
          </span>
        </button>

        <button
          aria-label="Next Month"
          onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition-all active:scale-90"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

      {/* Quick Jump to Current Month Button */}
      {!isCurrentMonth ? (
        <button
          onClick={jumpToCurrentMonth}
          type="button"
          className="px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1 transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">today</span>
          <span>Jump to Current Month</span>
        </button>
      ) : (
        <span className="text-xs text-on-surface-variant font-medium hidden sm:inline-block">
          Monthly Quota Cycle (2.0 Days / Mo)
        </span>
      )}

      {/* Month Dropdown Picker */}
      {showPicker && (
        <div className="absolute z-30 mt-20 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container p-3 w-64 animate-fade-in">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container">
            <span className="text-xs font-bold text-on-surface">Select Month ({selectedYear})</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container text-xs"
              >
                ◀
              </button>
              <span className="text-xs font-semibold">{selectedYear}</span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container text-xs"
              >
                ▶
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_NAMES.map((name, idx) => {
              const monthNum = idx + 1;
              const isSelected = monthNum === selectedMonth;
              return (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedMonth(monthNum);
                    setShowPicker(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center transition-colors ${
                    isSelected
                      ? 'bg-primary text-white font-bold'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

