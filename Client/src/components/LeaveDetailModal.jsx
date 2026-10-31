import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';

export default function LeaveDetailModal({ item, onClose }) {
  const { deleteLeave, updateLeave, isSyncing } = useLeave();

  const [isEditing, setIsEditing] = useState(false);
  const [editReason, setEditReason] = useState(item?.reason || '');
  const [editDayType, setEditDayType] = useState(item?.type === 'half' ? 'half' : 'full');
  const [editSession, setEditSession] = useState(item?.session || 'Morning');
  const [editCustomDays, setEditCustomDays] = useState(item?.days ? String(item.days) : '1.0');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Weekend Policy Edit State
  const [editSaturdayAttendance, setEditSaturdayAttendance] = useState(
    item?.saturdayRule?.saturdayAttendance || 'working'
  );

  if (!item) return null;
  const leaveId = item.id || item._id;
  
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editReason.trim()) return;

    let computedDays = 1.0;
    if (item.type === 'multiple') {
      const isFriMon = item.saturdayRule?.touchesFriday && item.saturdayRule?.touchesMonday;
      if (item.saturdayRule?.touchesWeekend) {
        if (editSaturdayAttendance === 'working') {
          // Individual working days cut only (e.g. 2.0 days for Fri + Mon)
          computedDays = isFriMon ? 2.0 : Math.max(0.5, parseFloat(editCustomDays) || 2.0);
        } else {
          // Sandwich rule: Saturday + Sunday counted (e.g. 4.0 days for Fri + Mon)
          computedDays = isFriMon ? 4.0 : Math.max(1.0, (parseFloat(editCustomDays) || 2.0) + 2.0);
        }
      } else {
        computedDays = Math.max(0.5, parseFloat(editCustomDays) || 1.0);
      }
    } else {
      const base = editDayType === 'full' ? 1.0 : 0.5;
      if (item.saturdayRule?.touchesWeekend) {
        computedDays = editSaturdayAttendance === 'working' ? base : base + 1.0;
      } else {
        computedDays = base;
      }
    }

    const payload = {
      reason: editReason.trim(),
      days: computedDays,
      dayType: item.type === 'multiple' ? 'multiple' : editDayType,
      session: editDayType === 'half' ? editSession : undefined,
    };

    if (item.saturdayRule?.touchesWeekend) {
      payload.saturdayRule = {
        ...item.saturdayRule,
        saturdayAttendance: editSaturdayAttendance,
        saturdayNote:
          editSaturdayAttendance === 'working'
            ? 'Confirmed: Will work on Saturday (Standard individual deduction).'
            : 'Saturday off (Weekend sandwich leave: Saturday deducted).',
      };
    }

    await updateLeave(leaveId, payload);
    setIsEditing(false);
    onClose();
  };

  const handleDelete = async () => {
    await deleteLeave(leaveId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm transition-all animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-[24px] shadow-2xl border border-surface-container p-6 sm:p-7 relative overflow-hidden transition-all transform scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Violet Corner Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-[22px]">
                {isEditing ? 'edit_note' : 'event_available'}
              </span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
                {isEditing ? 'Edit Leave' : 'Leave Details'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {isEditing ? 'Recalculates balance on save' : 'Synced with MongoDB'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isEditing && (
              <>
                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  title="Edit leave"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete leave"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors ml-1"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Overlay inside modal */}
        {showDeleteConfirm ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-error-container/40 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <div>
              <h4 className="font-bold text-base text-on-surface">Delete Leave Request?</h4>
              <p className="text-xs text-on-surface-variant mt-1 px-4">
                This will delete the leave entry for <strong>{item.displayDate}</strong> and restore{' '}
                <strong>{item.days || 1.0} day(s)</strong> back to your leave balance.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSyncing}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-error hover:bg-[#a01616] transition-colors shadow-sm disabled:opacity-70 flex items-center gap-1.5"
              >
                {isSyncing ? (
                  <>
                    <span className="material-symbols-outlined text-[15px] animate-spin">refresh</span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete & Restore</span>
                )}
              </button>
            </div>
          </div>
        ) : isEditing ? (
          /* Inline Edit Form */
          <form onSubmit={handleSaveEdit} className="py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Leave Reason
              </label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                required
                className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-transparent focus:border-primary focus:shadow-[0_0_0_2px_rgba(85,66,213,0.2)]"
              />
            </div>

            {item.type === 'multiple' ? (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Allocated Days (Span)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={editCustomDays}
                  onChange={(e) => setEditCustomDays(e.target.value)}
                  required
                  className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-transparent focus:border-primary"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Leave Type
                </label>
                <div className="grid grid-cols-2 p-1.5 bg-surface-container-low rounded-xl gap-1 border border-surface-container/50">
                  <button
                    type="button"
                    onClick={() => setEditDayType('full')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      editDayType === 'full'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Full Day (1.0)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDayType('half')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      editDayType === 'half'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Half Day (0.5)
                  </button>
                </div>
              </div>
            )}

            {editDayType === 'half' && item.type !== 'multiple' && (
              <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between border border-surface-container">
                <span className="text-xs font-semibold text-on-surface-variant">Session:</span>
                <div className="flex items-center gap-2">
                  <label
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      editSession === 'Morning'
                        ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editSessionRadio"
                      value="Morning"
                      checked={editSession === 'Morning'}
                      onChange={() => setEditSession('Morning')}
                      className="hidden"
                    />
                    Morning
                  </label>
                  <label
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      editSession === 'Afternoon'
                        ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editSessionRadio"
                      value="Afternoon"
                      checked={editSession === 'Afternoon'}
                      onChange={() => setEditSession('Afternoon')}
                      className="hidden"
                    />
                    Afternoon
                  </label>
                </div>
              </div>
            )}

            {/* If touches weekend, allow modifying Saturday Attendance */}
            {item.saturdayRule?.touchesWeekend && (
              <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface block">
                    Will you work on Saturday?
                  </span>
                  <span className="text-[11px] font-semibold text-on-surface-variant">
                    Weekend Policy
                  </span>
                </div>
                <div className="grid grid-cols-2 p-1 bg-surface-container-lowest rounded-lg gap-1 border border-surface-container/60">
                  <button
                    type="button"
                    onClick={() => setEditSaturdayAttendance('working')}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                      editSaturdayAttendance === 'working'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Yes, will work
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSaturdayAttendance('not_working')}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                      editSaturdayAttendance === 'not_working'
                        ? 'bg-surface-container-high text-on-surface font-bold shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    No, Saturday off
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSyncing}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-[#4834c9] shadow-primary-btn transition-all disabled:opacity-70 flex items-center gap-1.5"
              >
                {isSyncing ? (
                  <>
                    <span className="material-symbols-outlined text-[15px] animate-spin">refresh</span>
                    <span>Recalculating...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* View Details Info */
          <>
            <div className="py-5 space-y-4">
              {/* Highlight Banner */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                    Scheduled Date
                  </span>
                  <p className="text-base sm:text-lg font-bold text-on-surface mt-0.5">
                    {item.displayDate}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                    Duration
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary text-xs font-bold mt-0.5">
                    {item.dayLabel}
                  </span>
                </div>
              </div>

              {/* FRIDAY / MONDAY SATURDAY RULE STATUS BANNER */}
              {item.saturdayRule?.touchesWeekend && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-amber-700">
                        event_repeat
                      </span>
                      Weekend Policy (Friday/Monday Rule)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.saturdayRule.saturdayAttendance === 'working'
                          ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30'
                          : 'bg-amber-600/20 text-amber-800 border border-amber-600/30'
                      }`}
                    >
                      {item.saturdayRule.saturdayAttendance === 'working'
                        ? 'Saturday Working Confirmed'
                        : 'Saturday Off / Extended'}
                    </span>
                  </div>

                  <p className="text-xs text-amber-950 font-medium">
                    {item.saturdayRule.saturdayNote ||
                      (item.saturdayRule.saturdayAttendance === 'working'
                        ? 'Saturday compensatory attendance recorded.'
                        : 'Saturday holiday observed without compensation.')}
                  </p>
                </div>
              )}

              {/* Key-Value Details Grid */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-surface-container/60">
                  <span className="text-on-surface-variant font-medium">Reason</span>
                  <span className="text-on-surface font-semibold text-right max-w-[65%] truncate">
                    {item.reason}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-surface-container/60">
                  <span className="text-on-surface-variant font-medium">Leave Type</span>
                  <span className="text-on-surface font-semibold capitalize">
                    {item.type === 'half'
                      ? `Half Day (${item.session || 'Afternoon'})`
                      : item.type === 'multiple'
                      ? 'Multiple Days Span'
                      : 'Full Day'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-surface-container/60">
                  <span className="text-on-surface-variant font-medium">Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    {item.status || 'Approved'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-on-surface-variant font-medium">Deduction</span>
                  <span className="text-primary font-bold">
                    -{item.days ? item.days.toFixed(1) : '1.0'} Day
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 px-6 rounded-xl font-label-md text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-[#4834c9] shadow-primary-btn hover:shadow-primary-btn-hover transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <span>Done</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
