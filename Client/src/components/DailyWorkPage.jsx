import React, { useState, useMemo } from 'react';
import { useLeave, formatDateKey } from '../context/LeaveContext';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function DailyWorkPage() {
  const {
    tasks,
    taskFromDate,
    setTaskFromDate,
    taskToDate,
    setTaskToDate,
    fetchTasks,
    toggleTask,
    updateTaskItem,
    deleteTaskItem,
    showToast,
    isSyncing,
  } = useLeave();

  // Status Filter: 'all' | 'in_progress' | 'completed'
  const [statusFilter, setStatusFilter] = useState('all');

  // Active Date Preset
  const [activePreset, setActivePreset] = useState('month'); // 'today' | 'week' | 'month' | 'custom'

  // Task Detail Modal State (For full scrollable description without scrollbar)
  const [viewingTask, setViewingTask] = useState(null);

  // Delete Confirmation Modal State
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Edit Modal State
  const [editingTask, setEditingTask] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editStatus, setEditStatus] = useState('in_progress');
  const [editDate, setEditDate] = useState('');

  // Quick Preset Handlers
  const handleSetPreset = (preset) => {
    setActivePreset(preset);
    const today = new Date();
    const todayStr = formatDateKey(today);

    if (preset === 'today') {
      setTaskFromDate(todayStr);
      setTaskToDate(todayStr);
    } else if (preset === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 6);
      setTaskFromDate(formatDateKey(startOfWeek));
      setTaskToDate(todayStr);
    } else if (preset === 'month') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      setTaskFromDate(`${year}-${month}-01`);
      setTaskToDate(todayStr);
    } else if (preset === 'all') {
      setTaskFromDate('2025-01-01');
      setTaskToDate('2027-12-31');
    }
  };

  // Filter tasks within the date range & status
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (!t.date) return false;
        if (taskFromDate && t.date < taskFromDate) return false;
        if (taskToDate && t.date > taskToDate) return false;
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (a.srNo || 0) - (b.srNo || 0));
  }, [tasks, taskFromDate, taskToDate, statusFilter]);

  // Counts
  const totalTasks = filteredTasks.length;
  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = totalTasks - completedCount;

  // Open Edit Modal
  const openEditModal = (task, e) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setEditDesc(task.description);
    setEditBranch(task.branch || '');
    setEditStatus(task.status);
    setEditDate(task.date);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTask || !editDesc.trim()) return;

    const ok = await updateTaskItem(editingTask.id || editingTask._id, {
      description: editDesc.trim(),
      branch: editBranch.trim(),
      status: editStatus,
      date: editDate,
    });

    if (ok) {
      if (viewingTask && (viewingTask.id || viewingTask._id) === (editingTask.id || editingTask._id)) {
        setViewingTask((prev) => ({
          ...prev,
          description: editDesc.trim(),
          branch: editBranch.trim(),
          status: editStatus,
          date: editDate,
        }));
      }
      setEditingTask(null);
    }
  };

  // Export tasks as CSV
  const handleExportCSV = () => {
    if (filteredTasks.length === 0) {
      showToast('No Tasks', 'No work items in this date range to export.', 'info');
      return;
    }

    const header = 'Date,Branch,Status,Task Description\n';
    const rows = filteredTasks
      .map(
        (t) =>
          `"${t.date}","${t.branch || 'N/A'}","${
            t.status === 'completed' ? 'Completed' : 'In Progress'
          }","${t.description.replace(/"/g, '""')}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daily_Work_Report_${taskFromDate}_to_${taskToDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported', 'Daily work report downloaded.');
  };

  // Format date helper for card
  const formatCardDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const todayStr = formatDateKey();
      if (dateStr === todayStr) return 'Today';
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-[680px] mx-auto flex flex-col gap-4 pb-20 animate-fade-in px-1">
      {/* Top Header Card */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-surface-container shadow-xs flex flex-col gap-3">
        {/* Title & Clean CSV Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
            </div>
            <div>
              <h1 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
                My Daily Work
              </h1>
              <p className="text-[11px] text-on-surface-variant">
                Daily task log, branch tracking, and progress.
              </p>
            </div>
          </div>

          {/* Clean CSV Button in top-right */}
          <button
            onClick={handleExportCSV}
            type="button"
            className="h-8 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs flex items-center gap-1.5 border border-surface-container transition-all shrink-0"
            title="Download CSV Statement"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>CSV</span>
          </button>
        </div>

        {/* Clean, Fully Responsive Date Range & Filter Controls */}
        <div className="pt-3 border-t border-surface-container/60 space-y-2.5">
          {/* Row 1: Side-by-side From & To inputs (Clean 2-col grid that never wraps awkwardly) */}
          <div className="grid grid-cols-2 gap-2">
            {/* From Date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-xl border border-surface-container min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase text-on-surface-variant shrink-0">
                From:
              </span>
              <input
                type="date"
                value={taskFromDate}
                onChange={(e) => {
                  setTaskFromDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer min-w-0"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-xl border border-surface-container min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase text-on-surface-variant shrink-0">
                To:
              </span>
              <input
                type="date"
                value={taskToDate}
                onChange={(e) => {
                  setTaskToDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer min-w-0"
              />
            </div>
          </div>

          {/* Row 2: Date Presets (4 equal columns) */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSetPreset(p.id)}
                className={`h-7 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center ${
                  activePreset === p.id
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Row 3: Status Segmented Pill (3 equal columns) */}
          <div className="grid grid-cols-3 p-1 bg-surface-container-low rounded-xl border border-surface-container/60 gap-1 text-center">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                statusFilter === 'all'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>All</span>
              <span className="text-[10px] opacity-80">({totalTasks})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                statusFilter === 'in_progress'
                  ? 'bg-surface-container-lowest text-amber-700 shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="truncate">In Progress</span>
              <span className="text-[10px] opacity-80 shrink-0">({inProgressCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                statusFilter === 'completed'
                  ? 'bg-surface-container-lowest text-emerald-700 shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Done</span>
              <span className="text-[10px] opacity-80">({completedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List Container */}
      <div className="w-full rounded-[22px] bg-surface-container-lowest p-4 sm:p-5 border border-surface-container shadow-xs">
        {filteredTasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant/50 mb-2.5 border border-surface-container">
              <span className="material-symbols-outlined text-[28px]">checklist</span>
            </div>
            <h3 className="font-bold text-sm text-on-surface">No tasks found</h3>
            <p className="text-xs text-on-surface-variant max-w-xs mt-1">
              No tasks logged between {taskFromDate} and {taskToDate}.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const taskId = task.id || task._id;

              return (
                <div
                  key={taskId}
                  onClick={() => setViewingTask(task)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer select-none ${
                    isCompleted
                      ? 'bg-emerald-500/5 border-emerald-500/25 hover:bg-emerald-500/10'
                      : 'bg-surface-container-low/50 border-surface-container hover:bg-surface-container-low'
                  }`}
                  title="Click to view full description"
                >
                  {/* Card Header: Status, Branch, Date, Edit/Delete */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Interactive 1-click Status Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(taskId);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer border ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isCompleted ? 'check_circle' : 'pending'}
                        </span>
                        <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
                      </button>

                      {/* Branch tag if present */}
                      {task.branch && (
                        <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-mono text-[10px] font-semibold flex items-center gap-1 border border-surface-container-high/60">
                          <span className="material-symbols-outlined text-[12px] text-primary">fork_right</span>
                          <span>{task.branch}</span>
                        </span>
                      )}

                      {/* Date Pill */}
                      <span className="text-[10px] text-on-surface-variant font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                        <span>{formatCardDate(task.date)}</span>
                      </span>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => openEditModal(task, e)}
                        className="w-7 h-7 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                        title="Edit task"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskToDelete(task);
                        }}
                        className="w-7 h-7 rounded-lg hover:bg-rose-50 text-on-surface-variant hover:text-rose-600 flex items-center justify-center transition-colors"
                        title="Delete task"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Task Description: Truncated with ellipsis (...) */}
                  <p
                    className={`text-xs sm:text-sm leading-relaxed line-clamp-2 pl-0.5 ${
                      isCompleted ? 'text-on-surface line-through opacity-80' : 'text-on-surface font-medium'
                    }`}
                  >
                    {task.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TASK DETAIL POPUP MODAL (Hidden Scrollbar) */}
      {viewingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setViewingTask(null)}
        >
          <div
            className="w-full max-w-[460px] max-h-[88vh] flex flex-col bg-surface-container-lowest rounded-[22px] shadow-2xl border border-surface-container p-5 relative overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-container shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">calendar_today</span>
                  {viewingTask.date}
                </span>

                {viewingTask.branch && (
                  <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface font-mono text-[11px] font-semibold flex items-center gap-1 border border-surface-container-high/60">
                    <span className="material-symbols-outlined text-[12px] text-primary">fork_right</span>
                    {viewingTask.branch}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Scrollable Description Container with NO visible scrollbar */}
            <div className="py-4 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <span className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                Task Description
              </span>
              <p className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-line font-medium p-3 rounded-xl bg-surface-container-low/60 border border-surface-container/60">
                {viewingTask.description}
              </p>
            </div>

            {/* Modal Bottom: Quick Status Toggle & Actions */}
            <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  const id = viewingTask.id || viewingTask._id;
                  await toggleTask(id);
                  setViewingTask((prev) => ({
                    ...prev,
                    status: prev.status === 'completed' ? 'in_progress' : 'completed',
                  }));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border ${
                  viewingTask.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {viewingTask.status === 'completed' ? 'check_circle' : 'pending'}
                </span>
                <span>{viewingTask.status === 'completed' ? 'Completed' : 'In Progress'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const task = viewingTask;
                    setViewingTask(null);
                    setTaskToDelete(task);
                  }}
                  className="w-8 h-8 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center justify-center"
                  title="Delete task"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const task = viewingTask;
                    setViewingTask(null);
                    openEditModal(task);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingTask(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-[#4834c9] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-[420px] bg-surface-container-lowest rounded-[22px] shadow-2xl border border-surface-container p-5 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <h3 className="font-bold text-sm sm:text-base text-on-surface">Edit Task</h3>

              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="pt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-on-surface block mb-1">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl outline-none border border-surface-container focus:border-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface block mb-1">Branch (Optional)</label>
                <input
                  type="text"
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  placeholder="e.g. main, feat/login"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface rounded-xl outline-none border border-surface-container focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface block mb-1">Task Description</label>
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  required
                  className="w-full p-3 bg-surface-container-low text-on-surface rounded-xl outline-none border border-surface-container focus:border-primary resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface block mb-1.5">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('in_progress')}
                    className={`h-10 rounded-xl border flex items-center justify-center gap-1.5 font-bold ${
                      editStatus === 'in_progress'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 ring-1 ring-amber-500/30'
                        : 'bg-surface-container-low border-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">pending</span>
                    <span>In Progress</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatus('completed')}
                    className={`h-10 rounded-xl border flex items-center justify-center gap-1.5 font-bold ${
                      editStatus === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 ring-1 ring-emerald-500/30'
                        : 'bg-surface-container-low border-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Completed</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3.5 py-1.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncing || !editDesc.trim()}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-primary hover:bg-[#4834c9] shadow-sm disabled:opacity-60"
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
        isOpen={!!taskToDelete}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        itemDetails={
          taskToDelete ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant">
                <span>{taskToDelete.date}</span>
                {taskToDelete.branch && (
                  <span className="font-mono bg-surface-container px-1.5 py-0.5 rounded text-[10px]">
                    {taskToDelete.branch}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface font-medium line-clamp-2">
                {taskToDelete.description}
              </p>
            </div>
          ) : null
        }
        confirmText="Delete Task"
        isDeleting={isSyncing}
        onConfirm={async () => {
          if (taskToDelete) {
            const id = taskToDelete.id || taskToDelete._id;
            await deleteTaskItem(id);
            if (viewingTask && (viewingTask.id || viewingTask._id) === id) {
              setViewingTask(null);
            }
            setTaskToDelete(null);
          }
        }}
        onClose={() => setTaskToDelete(null)}
      />
    </div>
  );
}
