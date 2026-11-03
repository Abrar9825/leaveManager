import React, { useState } from 'react';
import { useLeave, formatDateKey } from '../context/LeaveContext';

export default function AddTaskView({ onTaskAdded }) {
  const { taskDate, setTaskDate, addTask, setActiveTab, isSyncing } = useLeave();

  const [date, setDate] = useState(taskDate || formatDateKey());
  const [branch, setBranch] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('in_progress'); // 'in_progress' | 'completed'
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Please enter a task description');
      return;
    }

    const res = await addTask({
      date,
      branch: branch.trim(),
      description: description.trim(),
      status,
    });

    if (res?.success) {
      setDescription('');
      setBranch('');
      if (typeof onTaskAdded === 'function') {
        onTaskAdded(res.data);
      } else {
        // Switch to view tasks
        setActiveTab('daily-work');
      }
    }
  };

  const setQuickDate = (deltaDays) => {
    const d = new Date();
    d.setDate(d.getDate() + deltaDays);
    const dateStr = formatDateKey(d);
    setDate(dateStr);
    setTaskDate(dateStr);
  };

  return (
    <div className="w-full max-w-[620px] mx-auto pb-16 animate-fade-in px-1">
      {/* Container Card */}
      <div className="w-full rounded-[22px] bg-surface-container-lowest p-5 sm:p-7 shadow-hero-dark border border-surface-container/80 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

        {/* Section Header */}
        <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[22px]">post_add</span>
            </div>
            <div>
              <h1 className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                Add Daily Task
              </h1>
              <p className="text-xs text-on-surface-variant">
                Record your work details, branch, and status.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('daily-work')}
            className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs flex items-center gap-1 border border-surface-container transition-colors shrink-0"
            title="View Daily Work List"
          >
            <span>View Tasks</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="pt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error-container/40 text-on-error-container text-xs flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Date Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">calendar_today</span>
                Date
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="text-[10px] font-semibold text-primary hover:underline px-1 py-0.5"
                >
                  Today
                </button>
                <span className="text-[10px] text-on-surface-variant/40">•</span>
                <button
                  type="button"
                  onClick={() => setQuickDate(-1)}
                  className="text-[10px] font-semibold text-on-surface-variant hover:text-on-surface px-1 py-0.5"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTaskDate(e.target.value);
              }}
              required
              className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm font-semibold rounded-xl outline-none border border-surface-container focus:border-primary transition-all cursor-pointer"
            />
          </div>

          {/* Branch (Optional) */}
          <div>
            <label className="text-xs font-semibold text-on-surface mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">fork_right</span>
                Branch
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">Optional</span>
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. main, feat/leave-calc, dev (optional)"
              className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-surface-container focus:border-primary transition-all font-mono placeholder:font-sans placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="text-xs font-semibold text-on-surface block mb-1.5">
              Task Description <span className="text-error">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError('');
              }}
              required
              placeholder="What did you work on? Describe the bug fixed, feature implemented, or progress made..."
              className="w-full p-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl outline-none border border-surface-container focus:border-primary transition-all resize-none placeholder:text-on-surface-variant/50 leading-relaxed"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="text-xs font-semibold text-on-surface block mb-2">
              Current Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('in_progress')}
                className={`h-12 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-98 ${
                  status === 'in_progress'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 shadow-xs ring-1 ring-amber-500/30'
                    : 'bg-surface-container-low border-surface-container text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">pending</span>
                <span>In Progress</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`h-12 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-98 ${
                  status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-surface-container-low border-surface-container text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Completed</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('daily-work')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSyncing || !description.trim()}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-primary hover:bg-[#4834c9] shadow-primary-btn transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {isSyncing ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Saving Task...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Save Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
