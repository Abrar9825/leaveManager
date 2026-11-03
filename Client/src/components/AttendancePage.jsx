import React, { useState, useRef } from 'react';
import { useLeave, formatDateKey } from '../context/LeaveContext';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function AttendancePage() {
  const {
    selectedMonthName,
    prevMonth,
    nextMonth,
    attendanceRecords,
    punchIn,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    isSyncing,
    showToast,
  } = useLeave();

  // Mode: 'quick' (3-sec hold) or 'manual' (custom date/time)
  const [entryMode, setEntryMode] = useState('quick');

  // Manual input state
  const [manualDate, setManualDate] = useState(() => formatDateKey());
  const [manualTime, setManualTime] = useState(() => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  // Long press 3 sec state
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const pressTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const HOLD_DURATION = 3000;

  // Editing modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // Delete confirmation modal state
  const [recordToDelete, setRecordToDelete] = useState(null);

  // 3-sec hold handlers
  const startPress = () => {
    if (isSyncing) return;
    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setHoldProgress(progress);
    }, 30);

    pressTimerRef.current = setTimeout(async () => {
      clearInterval(progressIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(0);
      if (navigator.vibrate) {
        navigator.vibrate(80);
      }
      await punchIn({ method: 'long_press' });
    }, HOLD_DURATION);
  };

  const cancelPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  };

  // Submit manual late entry (1 entry per day)
  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualTime || !manualDate) return;

    // Check if entry already exists for this date
    const alreadyExists = attendanceRecords.some((a) => a.date === manualDate);
    if (alreadyExists) {
      showToast('1 Entry Per Day', `Updating existing late record for ${manualDate}.`, 'info');
    }

    await punchIn({
      date: manualDate,
      time: manualTime,
      method: 'manual',
    });
  };

  // Open edit modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditDate(item.date);
    setEditTime(item.rawTime || '10:15');
  };

  // Save edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    await updateAttendanceRecord(editingItem.id || editingItem._id, {
      date: editDate,
      time: editTime,
    });
    setEditingItem(null);
  };

  return (
    <div className="w-full max-w-[560px] mx-auto flex flex-col gap-4 pb-16 animate-fade-in px-1">
      {/* Month Switcher Header */}
      <div className="flex items-center justify-between gap-2 bg-surface-container-lowest p-3 rounded-2xl border border-surface-container shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={prevMonth}
            type="button"
            className="w-8 h-8 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors"
            title="Previous Month"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <span className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
            {selectedMonthName}
          </span>

          <button
            onClick={nextMonth}
            type="button"
            className="w-8 h-8 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors"
            title="Next Month"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
          {attendanceRecords.length} Late{attendanceRecords.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Action Card: Segmented Mode Selector */}
      <div className="w-full rounded-[22px] bg-surface-container-lowest p-4 sm:p-5 border border-surface-container shadow-xs space-y-4">
        {/* Mode Toggle: Quick Hold vs Manual Time */}
        <div className="flex items-center p-1 bg-surface-container-low rounded-xl border border-surface-container/60">
          <button
            type="button"
            onClick={() => setEntryMode('quick')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              entryMode === 'quick'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">touch_app</span>
            <span>Hold 3s to Mark</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryMode('manual')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              entryMode === 'manual'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
            <span>Manual Entry</span>
          </button>
        </div>

        {/* View A: 3-Second Hold Mode */}
        {entryMode === 'quick' && (
          <div className="py-3 flex flex-col items-center justify-center text-center">
            <div className="relative flex items-center justify-center my-2">
              <svg className="w-28 h-28 transform -rotate-90 pointer-events-none absolute">
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-surface-container"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-rose-500 transition-all ease-linear"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - holdProgress / 100)}
                  strokeLinecap="round"
                />
              </svg>

              <button
                onMouseDown={startPress}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onTouchStart={startPress}
                onTouchEnd={cancelPress}
                onTouchCancel={cancelPress}
                type="button"
                disabled={isSyncing}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center select-none shadow-sm transition-all ${
                  isHolding
                    ? 'scale-95 bg-rose-600 text-white shadow-lg ring-4 ring-rose-200'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined text-[28px]">timer</span>
                <span className="text-[11px] font-bold uppercase tracking-wider mt-0.5">
                  {isHolding ? 'Hold...' : 'Hold 3s'}
                </span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mt-2 font-medium">
              Hold for 3 seconds to log late attendance for today.
            </p>
          </div>
        )}

        {/* View B: Manual Time Entry Form */}
        {entryMode === 'manual' && (
          <form onSubmit={handleManualAdd} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">
                  Arrival Time (Late after 10:00 AM)
                </label>
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs font-mono font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <p className="text-[10px] text-on-surface-variant">
              Notice: Only 1 entry per day. If time is ≤ 10:00 AM, it is on-time and won't be marked as late.
            </p>

            <button
              type="submit"
              disabled={isSyncing}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Save Late Entry</span>
            </button>
          </form>
        )}
      </div>

      {/* Late Entries List (Strictly late entries only!) */}
      <div className="w-full rounded-[22px] bg-surface-container-lowest p-4 sm:p-5 border border-surface-container shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <h3 className="font-bold text-sm text-on-surface">
            Late Log ({attendanceRecords.length})
          </h3>
          <span className="text-[11px] text-on-surface-variant font-medium">
            Every 3 Lates = -0.5 Day
          </span>
        </div>

        {attendanceRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-on-surface-variant font-medium">
            No late entries recorded for {selectedMonthName}.
          </div>
        ) : (
          <div className="space-y-2">
            {attendanceRecords.map((item, index) => {
              const itemId = item.id || item._id;
              const isThird = (index + 1) % 3 === 0;

              return (
                <div
                  key={itemId}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-2.5 ${
                    isThird
                      ? 'bg-rose-500/10 border-rose-500/30 ring-1 ring-rose-500/20'
                      : 'bg-surface-container-low/60 border-surface-container/70 hover:bg-surface-container-low'
                  }`}
                >
                  {/* Left: Number + Date & Time */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                        isThird
                          ? 'bg-rose-500 text-white'
                          : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-on-surface">
                          {item.date}
                        </span>
                        <span className="font-mono text-xs font-bold text-on-surface">
                          {item.punchTime}
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant block truncate">
                        {item.method === 'long_press' ? '3s hold' : 'Manual entry'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Badge for 3rd + Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isThird && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold tracking-tight whitespace-nowrap shadow-2xs">
                        -0.5d
                      </span>
                    )}

                    <button
                      onClick={() => openEditModal(item)}
                      type="button"
                      className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                      title="Edit entry"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                    </button>

                    <button
                      onClick={() => setRecordToDelete(item)}
                      type="button"
                      className="w-7 h-7 rounded-lg bg-surface-container hover:bg-rose-100 flex items-center justify-center text-on-surface-variant hover:text-rose-600 transition-colors"
                      title="Delete entry"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clean Edit Modal (Mobile Safe) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-[22px] shadow-2xl border border-surface-container p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div>
                <h4 className="font-bold text-sm text-on-surface">Edit Late Entry</h4>
                <p className="text-[11px] text-on-surface-variant">
                  If time is changed to ≤ 10:00 AM, it will be removed from late log.
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-container bg-surface-container-low text-xs font-semibold text-on-surface"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">
                  Arrival Time
                </label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-container bg-surface-container-low text-xs font-mono font-bold text-on-surface"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-container shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!recordToDelete}
        title="Delete Late Entry?"
        message="Are you sure you want to delete this late arrival record? Balance and penalty strikes will be recalculated immediately."
        itemDetails={
          recordToDelete ? (
            <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-rose-500">event_busy</span>
                <span>{recordToDelete.date}</span>
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-container">
                {recordToDelete.punchTime}
              </span>
            </div>
          ) : null
        }
        confirmText="Delete Entry"
        isDeleting={isSyncing}
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
