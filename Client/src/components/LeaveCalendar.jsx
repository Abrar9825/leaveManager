import React, { useState, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';
import LeaveDetailModal from './LeaveDetailModal';

export default function LeaveCalendar() {
  const { setActiveTab, leaveRequests, holidays } = useLeave();

  // Dynamic calendar date state
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [modalItem, setModalItem] = useState(null);

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth(); // 0 - 11

  const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth =
    new Date().getFullYear() === currentYear && new Date().getMonth() === currentMonth;

  // Navigate months
  const handlePrevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(1);
  };

  const handleGoToday = () => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedDay(now.getDate());
  };

  // Compute days in month and starting weekday (Monday-first: Mon=0, Sun=6)
  const { daysInMonth, leadingEmptyDays, daysArray } = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const leading = (firstDay + 6) % 7;
    const arr = Array.from({ length: totalDays }, (_, i) => i + 1);
    return { daysInMonth: totalDays, leadingEmptyDays: leading, daysArray: arr };
  }, [currentYear, currentMonth]);

  // Check if a day has a leave from real MongoDB leaveRequests
  const getLeaveForDay = (day) => {
    const matched = leaveRequests.find((r) => {
      if (!r.date) return false;
      const s = new Date(r.date + 'T00:00:00');
      const e = r.endDate ? new Date(r.endDate + 'T00:00:00') : s;

      const targetDate = new Date(currentYear, currentMonth, day, 0, 0, 0);
      const sNormalized = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const eNormalized = new Date(e.getFullYear(), e.getMonth(), e.getDate());

      return targetDate >= sNormalized && targetDate <= eNormalized;
    });

    if (matched) {
      return {
        id: matched.id || matched._id,
        _id: matched._id || matched.id,
        displayDate: matched.displayDate,
        reason: matched.reason,
        dayLabel: matched.dayLabel,
        type: matched.type,
        session: matched.session,
        days: matched.days,
        status: matched.status,
        saturdayRule: matched.saturdayRule,
        duration: matched.dayLabel,
      };
    }
    return null;
  };

  // Check if a day is an Official Government / Public Holiday
  const getHolidayForDay = (day) => {
    if (!holidays || !Array.isArray(holidays)) return null;
    return holidays.find((h) => {
      if (!h.date) return false;
      const [y, m, d] = h.date.split('-').map(Number);
      return y === currentYear && m === currentMonth + 1 && d === day;
    });
  };

  // Holidays in the current month for the preview card
  const monthHolidays = useMemo(() => {
    if (!holidays || !Array.isArray(holidays)) return [];
    return holidays.filter((h) => {
      if (!h.date) return false;
      const [y, m] = h.date.split('-').map(Number);
      return y === currentYear && m === currentMonth + 1;
    });
  }, [holidays, currentYear, currentMonth]);

  const handleDayClick = (day) => {
    setSelectedDay(day);
    const leave = getLeaveForDay(day);
    if (leave) {
      setModalItem(leave);
    }
  };

  const selectedLeaveInfo = getLeaveForDay(selectedDay);
  const selectedHolidayInfo = getHolidayForDay(selectedDay);

  return (
    <div className="w-full max-w-[760px] mx-auto flex flex-col gap-6 pb-12 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col gap-0.5 text-left">
        <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Leave Calendar
        </h1>
      </div>

      {/* Month Navigation Pill Bar */}
      <div className="w-full bg-surface-container-lowest p-2 rounded-2xl shadow-sm border border-surface-container/70 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous month"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <div className="flex items-center gap-2 px-2 py-1">
            <span className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
              {monthName}
            </span>
            {isCurrentMonth && (
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-caps text-[10px] font-bold uppercase">
                Current
              </span>
            )}
          </div>

          <button
            aria-label="Next month"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>

        <button
          onClick={handleGoToday}
          className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs transition-colors"
          type="button"
        >
          Today
        </button>
      </div>

      {/* 7-Column Calendar Card */}
      <div className="w-full bg-surface-container-lowest rounded-[22px] p-4 sm:p-6 shadow-sm border border-surface-container/70 flex flex-col gap-3">
        {/* Weekday Labels (Monday First) */}
        <div className="grid grid-cols-7 text-center">
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
            <span
              key={day}
              className="font-label-caps text-[11px] font-semibold text-on-surface-variant/70 py-1"
            >
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center items-center">
          {/* Leading empty days */}
          {Array.from({ length: leadingEmptyDays }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10"></div>
          ))}

          {/* Real Month Days */}
          {daysArray.map((d) => {
            const leave = getLeaveForDay(d);
            const holiday = getHolidayForDay(d);
            const isToday = isCurrentMonth && d === new Date().getDate();
            const isSelected = d === selectedDay;

            return (
              <button
                key={d}
                type="button"
                onClick={() => handleDayClick(d)}
                className={`h-11 sm:h-12 flex flex-col items-center justify-center font-body-md text-xs sm:text-sm rounded-xl transition-all cursor-pointer relative ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest font-bold'
                    : ''
                } ${
                  leave
                    ? 'bg-primary-fixed/30 text-primary font-bold hover:bg-primary-fixed/50'
                    : holiday
                    ? 'bg-amber-500/10 text-amber-900 font-bold hover:bg-amber-500/20'
                    : isToday
                    ? 'bg-surface-container text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>{d}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {holiday && (
                    <span
                      title={`Govt Holiday: ${holiday.name}`}
                      className="w-1.5 h-1.5 rounded-full bg-amber-600"
                    ></span>
                  )}
                  {leave && (
                    <span
                      title={`Leave: ${leave.reason}`}
                      className={`w-1.5 h-1.5 rounded-full ${
                        leave.type === 'half' ? 'bg-purple-600' : 'bg-primary'
                      }`}
                    ></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-surface-container/60 text-[11px] text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Booked Leave
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            Government Public Holiday
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-surface-container border border-surface-container-high"></span>
            Today
          </span>
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="w-full bg-surface-container-lowest rounded-[22px] p-5 sm:p-6 shadow-sm border border-surface-container/70 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px]">event</span>
            <span className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
              {selectedDay} {monthName}
            </span>
          </div>

          {selectedLeaveInfo && (
            <button
              type="button"
              onClick={() => setModalItem(selectedLeaveInfo)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View Details</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          )}
        </div>

        {/* Show Government Holiday if on this day */}
        {selectedHolidayInfo && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-800 text-[20px]">
                account_balance
              </span>
              <div>
                <span className="text-xs sm:text-sm font-bold text-amber-950 block">
                  {selectedHolidayInfo.name}
                </span>
                <span className="text-[11px] text-amber-800 font-medium">
                  {selectedHolidayInfo.type || 'Government Gazetted Holiday'}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 border border-amber-500/30 shrink-0">
              Govt Holiday
            </span>
          </div>
        )}

        {/* Show Booked Leave if on this day */}
        {selectedLeaveInfo && (
          <div className="flex items-center justify-between py-1.5">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-on-surface block">
                {selectedLeaveInfo.reason}
              </span>
              <span className="text-xs text-on-surface-variant">
                {selectedLeaveInfo.dayLabel} • {selectedLeaveInfo.status}
              </span>
            </div>

            <span className="px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-bold">
              Booked
            </span>
          </div>
        )}

        {/* If neither leave nor holiday */}
        {!selectedLeaveInfo && !selectedHolidayInfo && (
          <div className="flex items-center justify-between py-1 text-xs text-on-surface-variant">
            <span>No leaves or government holidays on this date.</span>
            <button
              type="button"
              onClick={() => setActiveTab('add-leave')}
              className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Apply Leave</span>
            </button>
          </div>
        )}

        {/* Upcoming Month Holidays List */}
        {monthHolidays.length > 0 && (
          <div className="mt-2 pt-3 border-t border-surface-container space-y-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Government Holidays in {calendarDate.toLocaleDateString('en-US', { month: 'long' })}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {monthHolidays.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface"
                >
                  <span className="font-bold text-amber-800">{new Date(h.date).getDate()}</span>
                  <span>{h.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {modalItem && (
        <LeaveDetailModal item={modalItem} onClose={() => setModalItem(null)} />
      )}
    </div>
  );
}
