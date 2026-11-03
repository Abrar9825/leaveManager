import React, { useState, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';

export default function CalendarModal({ onClose }) {
  const { selectedYear, selectedMonth, leaveRequests, holidays, attendanceRecords } = useLeave();
  const [calendarDate, setCalendarDate] = useState(() => new Date(selectedYear, selectedMonth - 1, 1));
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth(); // 0 - 11

  const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const { daysInMonth, leadingEmptyDays, daysArray } = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const leading = (firstDay + 6) % 7;
    const arr = Array.from({ length: totalDays }, (_, i) => i + 1);
    return { daysInMonth: totalDays, leadingEmptyDays: leading, daysArray: arr };
  }, [currentYear, currentMonth]);

  const getLeaveForDay = (day) => {
    return leaveRequests.find((r) => {
      if (!r.date) return false;
      const targetDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const s = r.date;
      const e = r.endDate || r.date;
      return targetDate >= s && targetDate <= e;
    });
  };

  const getHolidayForDay = (day) => {
    if (!holidays) return null;
    const targetDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find((h) => h.date === targetDate);
  };

  const getLateForDay = (day) => {
    if (!attendanceRecords) return null;
    const targetDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceRecords.find((a) => a.date === targetDate);
  };

  const selectedLeave = getLeaveForDay(selectedDay);
  const selectedHoliday = getHolidayForDay(selectedDay);
  const selectedLate = getLateForDay(selectedDay);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-sm rounded-[22px] shadow-2xl border border-surface-container overflow-hidden p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))}
              className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="font-bold text-sm text-on-surface">{monthName}</span>
            <button
              onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))}
              className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-on-surface-variant/70">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="py-1">{d}</span>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 text-center items-center text-xs">
          {Array.from({ length: leadingEmptyDays }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8"></div>
          ))}

          {daysArray.map((d) => {
            const leave = getLeaveForDay(d);
            const holiday = getHolidayForDay(d);
            const late = getLateForDay(d);
            const isSelected = d === selectedDay;

            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                type="button"
                className={`h-8 rounded-lg flex flex-col items-center justify-center relative font-medium transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary font-bold'
                    : ''
                } ${
                  leave
                    ? 'bg-primary/20 text-primary font-bold'
                    : holiday
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : late
                    ? 'bg-rose-100 text-rose-700 font-bold'
                    : 'hover:bg-surface-container text-on-surface'
                }`}
              >
                <span>{d}</span>
                <div className="flex items-center gap-0.5 -mt-0.5">
                  {late && <span className="w-1 h-1 rounded-full bg-rose-500" />}
                  {holiday && <span className="w-1 h-1 rounded-full bg-blue-600" />}
                  {leave && <span className="w-1 h-1 rounded-full bg-primary" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Info */}
        <div className="mt-1 pt-2 border-t border-surface-container text-xs text-on-surface-variant">
          <span className="font-bold text-on-surface block mb-1">
            {selectedDay} {monthName}
          </span>
          {selectedLate && (
            <p className="text-rose-600 font-semibold text-[11px]">
              • Late entry: {selectedLate.punchTime}
            </p>
          )}
          {selectedHoliday && (
            <p className="text-blue-700 font-semibold text-[11px]">
              • Holiday: {selectedHoliday.name}
            </p>
          )}
          {selectedLeave && (
            <p className="text-primary font-semibold text-[11px]">
              • Leave: {selectedLeave.reason} ({selectedLeave.days}d)
            </p>
          )}
          {!selectedLate && !selectedHoliday && !selectedLeave && (
            <p className="text-[11px] text-on-surface-variant/70">No entries on this date.</p>
          )}
        </div>
      </div>
    </div>
  );
}

