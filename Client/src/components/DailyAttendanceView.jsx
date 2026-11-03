import React, { useState, useMemo } from 'react';
import { useLeave, formatDateKey } from '../context/LeaveContext';
import PunchInCard from './PunchInCard';
import MonthYearNavigator from './MonthYearNavigator';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function DailyAttendanceView() {
  const {
    selectedYear,
    selectedMonth,
    selectedMonthName,
    attendanceRecords,
    attendanceStats,
    lateStrikesInCycle,
    lateStrikesRemaining,
    leaveRequests,
    holidays,
    punchIn,
    deleteAttendanceRecord,
    showToast,
  } = useLeave();

  const [filter, setFilter] = useState('all'); // 'all' | 'late' | 'ontime' | 'holidays' | 'leaves'
  const [editingDay, setEditingDay] = useState(null); // day number for manual punch popup
  const [manualTimeInput, setManualTimeInput] = useState('10:00');
  const [recordToDelete, setRecordToDelete] = useState(null);

  const todayStr = formatDateKey();

  // Compute all days in the selected month
  const monthDays = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
    const days = [];

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(selectedYear, selectedMonth - 1, day);
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = dateObj.getDay(); // 0 is Sun, 6 is Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dateStr === todayStr;

      // Find attendance record for this day
      const attendance = attendanceRecords.find((a) => a.date === dateStr);

      // Find holiday
      const holiday = holidays.find((h) => h.date === dateStr);

      // Find leave
      const leave = leaveRequests.find((l) => {
        if (!l.date) return false;
        const s = l.date;
        const e = l.endDate || l.date;
        return dateStr >= s && dateStr <= e;
      });

      days.push({
        day,
        dateStr,
        dateObj,
        weekday: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDateFormatted: dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        isWeekend,
        isSunday: dayOfWeek === 0,
        isSaturday: dayOfWeek === 6,
        isToday,
        isPast: dateStr < todayStr,
        attendance,
        holiday,
        leave,
      });
    }

    return days;
  }, [selectedYear, selectedMonth, attendanceRecords, holidays, leaveRequests, todayStr]);

  // Filtered days
  const filteredDays = useMemo(() => {
    if (filter === 'late') {
      return monthDays.filter((d) => d.attendance?.isLate);
    }
    if (filter === 'ontime') {
      return monthDays.filter((d) => d.attendance && !d.attendance.isLate);
    }
    if (filter === 'holidays') {
      return monthDays.filter((d) => d.holiday);
    }
    if (filter === 'leaves') {
      return monthDays.filter((d) => d.leave);
    }
    return monthDays;
  }, [monthDays, filter]);

  // Handle quick manual punch for a specific day
  const handleQuickManualPunch = async (dateStr) => {
    if (!manualTimeInput) return;
    const res = await punchIn({
      date: dateStr,
      time: manualTimeInput,
      method: 'manual',
      notes: 'Logged via daily attendance feed',
    });
    if (res?.success) {
      setEditingDay(null);
    }
  };

  return (
    <div className="w-full max-w-[820px] mx-auto flex flex-col gap-6 pb-12 animate-fade-in">
      {/* Month Navigator */}
      <MonthYearNavigator />

      {/* Hero Interactive Punch-In Card */}
      <PunchInCard />

      {/* Daily Attendance Ledger Card */}
      <div className="w-full rounded-[22px] bg-surface-container-lowest shadow-sm border border-surface-container overflow-hidden p-6 sm:p-7">
        {/* Header & Stats Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-container">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-headline-md text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                Daily Attendance & Holidays
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs font-label-caps uppercase">
                {selectedMonthName}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Complete daily log of arrival times, late arrivals, approved leaves, and company holidays.
            </p>
          </div>

          {/* Late Penalty Strike Meter Pill */}
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-on-surface-variant font-medium">Late Strike:</span>
              <span className="font-bold text-rose-600 font-mono">
                {lateStrikesInCycle} / 3
              </span>
              <div className="flex items-center gap-1 ml-1">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all ${
                      lateStrikesInCycle >= step ? 'bg-rose-500 scale-110' : 'bg-surface-container-highest'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-on-surface-variant">
              {lateStrikesRemaining === 3
                ? 'Cycle reset. 3 lates until 0.5 day deduction.'
                : `${lateStrikesRemaining} more late = 0.5 Day deduction.`}
            </span>
          </div>
        </div>

        {/* Summary Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          <div className="p-3 rounded-xl bg-surface-container-low/60 border border-surface-container text-center">
            <span className="text-xs text-on-surface-variant block font-medium">Present Days</span>
            <span className="font-mono text-lg font-bold text-on-surface">
              {attendanceStats.totalPresent}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low/60 border border-surface-container text-center">
            <span className="text-xs text-on-surface-variant block font-medium">On-Time (≤10:00)</span>
            <span className="font-mono text-lg font-bold text-emerald-600">
              {attendanceStats.onTimeCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low/60 border border-surface-container text-center">
            <span className="text-xs text-on-surface-variant block font-medium">Late Arrivals (&gt;10:00)</span>
            <span className="font-mono text-lg font-bold text-rose-600">
              {attendanceStats.lateCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low/60 border border-surface-container text-center">
            <span className="text-xs text-on-surface-variant block font-medium">Half-Days Deducted</span>
            <span className="font-mono text-lg font-bold text-amber-600">
              {attendanceStats.lateDeductionDays.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 pt-1 border-b border-surface-container/60">
          {[
            { id: 'all', label: 'All Days' },
            { id: 'ontime', label: 'On Time' },
            { id: 'late', label: 'Late Only' },
            { id: 'holidays', label: 'Holidays' },
            { id: 'leaves', label: 'Leaves' },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                type="button"
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Daily Rows Feed */}
        <div className="divide-y divide-surface-container/60 mt-1">
          {filteredDays.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-xs font-medium">
              No entries found for this filter in {selectedMonthName}.
            </div>
          ) : (
            filteredDays.map((item) => {
              const { day, fullDateFormatted, isWeekend, isToday, isSunday, isSaturday, attendance, holiday, leave } = item;

              return (
                <div
                  key={item.dateStr}
                  className={`py-3 px-2 sm:px-3 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                    isToday
                      ? 'bg-primary/5 ring-1 ring-primary/20'
                      : 'hover:bg-surface-container-low/50'
                  }`}
                >
                  {/* Left: Date Lockup */}
                  <div className="flex items-center gap-3 min-w-[120px] sm:min-w-[160px]">
                    <div
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-mono select-none ${
                        isToday
                          ? 'bg-primary text-white font-bold shadow-xs'
                          : isWeekend
                          ? 'bg-surface-container text-on-surface-variant/70'
                          : 'bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold leading-none">
                        {item.weekday}
                      </span>
                      <span className="text-sm font-bold leading-tight mt-0.5">
                        {String(day).padStart(2, '0')}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold text-on-surface">
                          {fullDateFormatted}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[9px] font-bold uppercase tracking-wider">
                            TODAY
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant block">
                        {holiday
                          ? holiday.type || 'Official Holiday'
                          : leave
                          ? `Leave: ${leave.reason || 'Approved'}`
                          : isSunday
                          ? 'Sunday (Weekly Off)'
                          : isSaturday
                          ? 'Saturday (Weekly Off)'
                          : 'Regular Workday'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Status Pill & Time Logged */}
                  <div className="flex items-center gap-2">
                    {/* Attendance Record */}
                    {attendance ? (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-mono text-xs sm:text-sm font-bold text-on-surface block">
                            {attendance.punchTime}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">
                            {attendance.method === 'manual' ? 'Manual entry' : 'Long-press punch'}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                            attendance.isLate
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {attendance.isLate ? 'schedule' : 'check_circle'}
                          </span>
                          <span>
                            {attendance.isLate
                              ? `Late (+${attendance.minutesLate}m)`
                              : 'On Time'}
                          </span>
                        </span>

                        <button
                          onClick={() => setRecordToDelete(attendance)}
                          className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-rose-600 transition-colors"
                          title="Delete punch entry"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    ) : holiday ? (
                      /* Holiday Pill */
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px]">celebration</span>
                        <span>{holiday.name}</span>
                      </div>
                    ) : leave ? (
                      /* Leave Pill */
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px]">beach_access</span>
                        <span>{leave.dayLabel || 'Leave'} ({leave.days}d)</span>
                      </div>
                    ) : isWeekend ? (
                      /* Weekend */
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant/80 text-xs font-medium">
                        Off Day
                      </span>
                    ) : (
                      /* Workday with no punch */
                      <div className="flex items-center gap-1.5">
                        {editingDay === day ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={manualTimeInput}
                              onChange={(e) => setManualTimeInput(e.target.value)}
                              className="px-2 py-1 rounded-lg border border-surface-container bg-surface-container-low text-xs font-mono"
                            />
                            <button
                              onClick={() => handleQuickManualPunch(item.dateStr)}
                              className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingDay(null)}
                              className="px-2 py-1 text-xs text-on-surface-variant"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingDay(day);
                              setManualTimeInput('10:00');
                            }}
                            type="button"
                            className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary text-xs font-medium border border-surface-container transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[13px]">add</span>
                            <span>{isToday ? 'Punch Now' : 'Log Time'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!recordToDelete}
        title="Delete Punch Record?"
        message="Are you sure you want to delete this punch entry? It will remove attendance for this day and recalculate penalties."
        itemDetails={
          recordToDelete ? (
            <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
              <span>{recordToDelete.date}</span>
              <span className="font-mono px-2 py-0.5 rounded bg-surface-container">
                {recordToDelete.punchTime || recordToDelete.time}
              </span>
            </div>
          ) : null
        }
        confirmText="Delete Record"
        onConfirm={async () => {
          if (recordToDelete) {
            const id = recordToDelete.id || recordToDelete._id;
            await deleteAttendanceRecord(id);
            setRecordToDelete(null);
          }
        }}
        onClose={() => setRecordToDelete(null)}
      />
    </div>
  );
}

