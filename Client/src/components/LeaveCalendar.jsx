import React, { useState, useMemo } from 'react';
import { useLeave } from '../context/LeaveContext';
import LeaveDetailModal from './LeaveDetailModal';

export default function LeaveCalendar() {
  const { setActiveTab, leaveRequests, holidays, attendanceRecords } = useLeave();

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

  // Check if a day has attendance recorded
  const getAttendanceForDay = (day) => {
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) return null;
    const targetDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceRecords.find((a) => a.date === targetDateStr);
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
  const selectedAttendanceInfo = getAttendanceForDay(selectedDay);

  return (
    <div className="w-full max-w-[760px] mx-auto flex flex-col gap-6 pb-12 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col gap-0.5 text-left">
        <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Monthly Calendar
        </h1>
        <p className="text-xs text-on-surface-variant">
          Track check-ins, late marks, leaves, and official company holidays.
        </p>
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
            const attendance = getAttendanceForDay(d);
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
                    ? 'bg-blue-500/10 text-blue-900 font-bold hover:bg-blue-500/20'
                    : attendance?.isLate
                    ? 'bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100'
                    : attendance
                    ? 'bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100'
                    : isToday
                    ? 'bg-surface-container text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>{d}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {attendance && (
                    <span
                      title={`Checked in: ${attendance.punchTime} ${attendance.isLate ? '(Late)' : '(On Time)'}`}
                      className={`w-1.5 h-1.5 rounded-full ${
                        attendance.isLate ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    ></span>
                  )}
                  {holiday && (
                    <span
                      title={`Holiday: ${holiday.name}`}
                      className="w-1.5 h-1.5 rounded-full bg-blue-600"
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
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-surface-container/60 text-[11px] text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Check-In On Time
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Late Arrival (&gt;10:00)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Approved Leave
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Company Holiday
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
              <span>View Leave Details</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          )}
        </div>

        {/* Attendance info for selected day */}
        {selectedAttendanceInfo && (
          <div className="p-3 rounded-xl bg-surface-container-low/70 border border-surface-container flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-[18px] ${
                  selectedAttendanceInfo.isLate ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {selectedAttendanceInfo.isLate ? 'schedule' : 'check_circle'}
              </span>
              <div>
                <span className="text-xs font-bold text-on-surface block">
                  Punch-in Time: {selectedAttendanceInfo.punchTime}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {selectedAttendanceInfo.method === 'manual' ? 'Manual Entry' : 'Long-Press Check-In'}
                </span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                selectedAttendanceInfo.isLate
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {selectedAttendanceInfo.isLate
                ? `Late (+${selectedAttendanceInfo.minutesLate}m)`
                : 'On Time'}
            </span>
          </div>
        )}

        {/* Holiday info for selected day */}
        {selectedHolidayInfo && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">
                celebration
              </span>
              <div>
                <span className="text-xs font-bold text-blue-900 block">
                  {selectedHolidayInfo.name}
                </span>
                <span className="text-[11px] text-blue-700">{selectedHolidayInfo.type}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
              Official Holiday
            </span>
          </div>
        )}

        {/* Leave info for selected day */}
        {selectedLeaveInfo && (
          <div className="p-3 rounded-xl bg-primary-fixed/20 border border-primary-fixed/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-primary block">
                {selectedLeaveInfo.reason}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {selectedLeaveInfo.dayLabel} • {selectedLeaveInfo.status}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase">
              {selectedLeaveInfo.days} Day(s)
            </span>
          </div>
        )}

        {!selectedAttendanceInfo && !selectedHolidayInfo && !selectedLeaveInfo && (
          <div className="py-4 text-center text-xs text-on-surface-variant">
            No events or check-ins recorded on this day.
          </div>
        )}
      </div>

      {/* Modal for Leave Details */}
      {modalItem && (
        <LeaveDetailModal item={modalItem} onClose={() => setModalItem(null)} />
      )}
    </div>
  );
}
