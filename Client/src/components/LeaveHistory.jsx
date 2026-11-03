import React, { useState, useEffect } from 'react';
import { useLeave, MONTH_NAMES } from '../context/LeaveContext';
import YearNavigator from './YearNavigator';

export default function LeaveHistory({ isModal = false }) {
  const {
    monthlyBreakdown,
    currentYear,
    balanceHistory,
    fetchBalanceHistory,
    userJoinMonth,
    userJoinYear,
    showToast,
  } = useLeave();

  // Active view: 'monthly' | 'tracking'
  const [activeView, setActiveView] = useState('monthly');
  const [trackingYearFilter, setTrackingYearFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAuditItem, setSelectedAuditItem] = useState(null);

  // Month breakdown detail modal state
  const [selectedMonthModal, setSelectedMonthModal] = useState(null);

  useEffect(() => {
    fetchBalanceHistory();
  }, [fetchBalanceHistory]);

  const handleRefreshHistory = async () => {
    setIsRefreshing(true);
    await fetchBalanceHistory();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleExportStatement = () => {
    if (activeView === 'monthly') {
      const header = 'Month,Status,Carry From Last Month,Quota,Leaves Taken,Late Deductions,Closing Balance\n';
      const rows = monthlyBreakdown
        .map(
          (m) =>
            `"${m.month}","${m.isPreJoining ? 'Pre-joining' : m.status}","${m.opening > 0 ? '+' : ''}${m.opening.toFixed(1)}","+${m.credit.toFixed(1)}","-${m.leavesTaken.toFixed(1)}","-${m.lateDeductions.toFixed(1)}","${m.isPreJoining ? '0.0' : m.days.toFixed(1)}"`
        )
        .join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Leave_Statement_${currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Statement Exported', `Official leave ledger for ${currentYear} downloaded.`);
    } else {
      const header = 'Date,Month/Year,Action,Change,Old Balance,New Balance,Reason,Changed By\n';
      const rows = balanceHistory
        .map(
          (h) =>
            `"${new Date(h.createdAt || h.timestamp).toLocaleString()}","${h.monthName || h.year}","${h.changeType}","${h.change > 0 ? '+' : ''}${h.change}","${h.oldBalance}","${h.newBalance}","${h.reason}","${h.changedBy || 'User'}"`
        )
        .join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Balance_Tracking_History_${currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Audit Log Exported', 'Balance tracking history exported successfully.');
    }
  };

  const filteredTrackingHistory = balanceHistory.filter((item) => {
    if (trackingYearFilter === 'all') return true;
    return item.year === Number(trackingYearFilter);
  });

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const getActionBadge = (type) => {
    switch (type) {
      case 'manual_reset':
        return {
          label: 'Manual Calibration',
          bg: 'bg-primary-fixed text-primary',
          icon: 'restart_alt',
        };
      case 'leave_deletion':
        return {
          label: 'Leave Restored',
          bg: 'bg-emerald-100 text-emerald-800',
          icon: 'add_circle',
        };
      case 'leave_deduction':
        return {
          label: 'Leave Deduction',
          bg: 'bg-amber-100 text-amber-800',
          icon: 'remove_circle',
        };
      case 'leave_edit':
        return {
          label: 'Leave Edit',
          bg: 'bg-purple-100 text-purple-800',
          icon: 'edit_calendar',
        };
      default:
        return {
          label: 'Adjustment',
          bg: 'bg-surface-container text-on-surface-variant',
          icon: 'history',
        };
    }
  };

  return (
    <div className={`w-full max-w-[680px] mx-auto flex flex-col gap-4 animate-fade-in px-1 ${isModal ? 'pb-4' : 'pb-16'}`}>
      {/* Header Card */}
      <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-2xl border border-surface-container shadow-xs flex flex-col gap-3">
        {/* Top Row: Title on Left (if not modal), CSV & Year Navigator */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {!isModal && (
            <div>
              <h1 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
                History & Statements
              </h1>
              <p className="text-xs text-on-surface-variant">
                Monthly balance ledger and audit tracking.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end ml-auto">
            <YearNavigator />

            <button
              onClick={handleExportStatement}
              type="button"
              className="h-8 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs flex items-center gap-1.5 border border-surface-container transition-all shrink-0"
              title="Download CSV Statement"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual-Tab Container */}
      <div className="w-full rounded-[22px] bg-surface-container-lowest p-4 sm:p-5 border border-surface-container shadow-xs space-y-4">
        {/* Navigation Tabs Switcher */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-surface-container flex-wrap">
          <div className="flex items-center p-1 bg-surface-container-low rounded-xl border border-surface-container/60 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveView('monthly')}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeView === 'monthly'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_view_month</span>
              <span>Monthly Breakdown</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('tracking')}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeView === 'tracking'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Audit Trail</span>
              {balanceHistory.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                  {balanceHistory.length}
                </span>
              )}
            </button>
          </div>

          {activeView === 'tracking' && (
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <select
                value={trackingYearFilter}
                onChange={(e) => setTrackingYearFilter(e.target.value)}
                className="bg-surface-container-low border border-surface-container text-on-surface font-semibold rounded-lg px-2 py-1 text-xs outline-none"
              >
                <option value="all">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>

              <button
                type="button"
                onClick={handleRefreshHistory}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                title="Refresh history"
              >
                <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>
                  refresh
                </span>
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: Monthly Breakdown (Clicking any month opens details popup with Carry-Forward!) */}
        {activeView === 'monthly' && (
          <div className="space-y-2">
            <p className="text-[11px] text-on-surface-variant font-medium px-1">
              Tap any month to see detailed carry-forward and deduction calculations.
            </p>

            {monthlyBreakdown.map((item) => {
              const isDeficit = item.status === 'deficit' || item.days < 0;
              const hasCarry = item.opening !== 0 && !item.isPreJoining;

              return (
                <div
                  key={item.month}
                  onClick={() => setSelectedMonthModal(item)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                    item.isPreJoining
                      ? 'bg-surface-container-low/20 border-surface-container/40 opacity-70 hover:opacity-100 hover:bg-surface-container-low/40'
                      : item.current
                      ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                      : isDeficit
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-surface-container-low/50 border-surface-container/60 hover:bg-surface-container-low'
                  }`}
                  title="Click to view breakdown details"
                >
                  {/* Left: Month Name & Tags */}
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span
                      className={`text-xs sm:text-sm font-bold truncate ${
                        item.isPreJoining
                          ? 'text-on-surface-variant/70'
                          : item.current
                          ? 'text-primary'
                          : 'text-on-surface'
                      }`}
                    >
                      {item.month}
                    </span>

                    {item.isPreJoining && (
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant text-[9px] font-semibold shrink-0">
                        Pre-joining
                      </span>
                    )}

                    {item.tag === 'Joined' && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold shrink-0">
                        Joined
                      </span>
                    )}

                    {item.current && (
                      <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[9px] font-bold uppercase tracking-wider shrink-0">
                        Current
                      </span>
                    )}

                    {hasCarry && (
                      <span
                        className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold shrink-0 ${
                          item.opening < 0
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.opening > 0 ? `+${item.opening}c` : `${item.opening}c`}
                      </span>
                    )}
                  </div>

                  {/* Right: Net Balance Badge & Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono shadow-2xs ${
                        item.isPreJoining
                          ? 'bg-surface-container-low text-on-surface-variant/60 border border-surface-container'
                          : isDeficit
                          ? 'bg-rose-500 text-white'
                          : item.current
                          ? 'bg-primary text-white'
                          : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      {item.isPreJoining
                        ? '0.0d'
                        : isDeficit
                        ? `-${Math.abs(item.days).toFixed(1)}d`
                        : `${item.days.toFixed(1)}d`}
                    </span>

                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      chevron_right
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Clean Audit Trail */}
        {activeView === 'tracking' && (
          <div className="space-y-2">
            {filteredTrackingHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant font-medium">
                No balance adjustments recorded yet.
              </div>
            ) : (
              filteredTrackingHistory.map((item, idx) => {
                const badge = getActionBadge(item.changeType);
                const isPos = item.change > 0;

                return (
                  <div
                    key={item.id || item._id || idx}
                    onClick={() => setSelectedAuditItem(item)}
                    className="p-3 rounded-xl border border-surface-container/70 bg-surface-container-low/50 hover:bg-surface-container-low transition-colors flex items-center justify-between gap-2.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${badge.bg}`}>
                        <span className="material-symbols-outlined text-[16px]">{badge.icon}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-on-surface">{badge.label}</span>
                          {item.monthName && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                              {item.monthName}
                            </span>
                          )}
                          <span className="text-[10px] text-on-surface-variant truncate">
                            {formatTimestamp(item.createdAt || item.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                          {item.reason || 'Balance change'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isPos ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPos ? `+${item.change}` : item.change}d
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MONTH BREAKDOWN DETAILS MODAL (WITH CARRY-FORWARD) */}
      {selectedMonthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-[22px] shadow-2xl border border-surface-container p-5 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <h3 className="font-bold text-base text-on-surface">
                  {selectedMonthModal.month}
                </h3>
                <span className="text-[11px] text-on-surface-variant">
                  {selectedMonthModal.isPreJoining
                    ? 'Pre-joining Period (0 Quota)'
                    : 'Monthly Leave & Balance Ledger'}
                </span>
              </div>

              <button
                onClick={() => setSelectedMonthModal(null)}
                className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Pre-joining banner if applicable */}
            {selectedMonthModal.isPreJoining ? (
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface-variant space-y-1.5">
                <p className="font-semibold text-on-surface">Pre-joining Month</p>
                <p className="text-[11px]">
                  You joined the organization in {MONTH_NAMES[userJoinMonth - 1]} {userJoinYear}.
                  Paid leave quota accrues at 2.0 days/month starting from your joining date.
                </p>
              </div>
            ) : (
              /* Calculations Breakdown Stack */
              <div className="space-y-2.5 text-xs">
                {/* Carry forward from previous month */}
                <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-on-surface block">
                      Carry from Previous Month
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {selectedMonthModal.opening > 0
                        ? 'Surplus carried forward'
                        : selectedMonthModal.opening < 0
                        ? 'Deficit carried forward'
                        : 'No previous carry balance'}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold ${
                      selectedMonthModal.opening > 0
                        ? 'text-emerald-600'
                        : selectedMonthModal.opening < 0
                        ? 'text-rose-600'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {selectedMonthModal.opening > 0
                      ? `+${selectedMonthModal.opening.toFixed(1)}`
                      : selectedMonthModal.opening.toFixed(1)}{' '}
                    Days
                  </span>
                </div>

                {/* Base Quota */}
                <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-on-surface block">
                      Month Base Quota
                    </span>
                    <span className="text-[10px] text-on-surface-variant">Standard paid quota</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary">
                    +{selectedMonthModal.credit.toFixed(1)} Days
                  </span>
                </div>

                {/* Leaves Taken */}
                <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-on-surface block">
                      Leaves Taken
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {selectedMonthModal.leaves.length} approved request(s)
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-amber-600">
                    -{selectedMonthModal.leavesTaken.toFixed(1)} Days
                  </span>
                </div>

                {/* Late Deductions */}
                <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-on-surface block">
                      Late Deductions
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {selectedMonthModal.lateCount} late arrival(s) (3 lates = -0.5d)
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-rose-600">
                    -{selectedMonthModal.lateDeductions.toFixed(1)} Days
                  </span>
                </div>

                {/* Net Closing Balance Card */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    selectedMonthModal.days < 0
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-primary/5 border-primary/20 text-on-surface'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs uppercase block tracking-wider font-label-caps">
                      {selectedMonthModal.days < 0 ? 'Deficit Balance' : 'Net Closing Balance'}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      Carries forward to next month
                    </span>
                  </div>
                  <span
                    className={`font-mono text-lg font-bold ${
                      selectedMonthModal.days < 0 ? 'text-rose-600' : 'text-primary'
                    }`}
                  >
                    {selectedMonthModal.days.toFixed(1)} Days
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedMonthModal(null)}
              type="button"
              className="w-full h-10 rounded-xl bg-surface-container-high hover:bg-surface-container text-xs font-bold text-on-surface transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedAuditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-[22px] shadow-2xl border border-surface-container p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <h4 className="font-bold text-sm text-on-surface">Audit Details</h4>
              <button
                onClick={() => setSelectedAuditItem(null)}
                className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-surface-container/60">
                <span className="text-on-surface-variant">Month / Year</span>
                <span className="font-bold text-primary">
                  {selectedAuditItem.monthName || selectedAuditItem.year}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container/60">
                <span className="text-on-surface-variant">Action</span>
                <span className="font-bold text-on-surface">{selectedAuditItem.changeType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container/60">
                <span className="text-on-surface-variant">Adjustment</span>
                <span className="font-bold text-primary">{selectedAuditItem.change} days</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container/60">
                <span className="text-on-surface-variant">Old Balance</span>
                <span className="font-semibold text-on-surface">{selectedAuditItem.oldBalance}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container/60">
                <span className="text-on-surface-variant">New Balance</span>
                <span className="font-semibold text-on-surface">{selectedAuditItem.newBalance}</span>
              </div>
              <div className="py-1">
                <span className="text-on-surface-variant block mb-1">Reason</span>
                <p className="p-2 rounded-lg bg-surface-container-low text-on-surface text-[11px]">
                  {selectedAuditItem.reason || 'None provided'}
                </p>
              </div>
              <div className="flex justify-between py-1 border-t border-surface-container/60 text-[10px] text-on-surface-variant">
                <span>By: {selectedAuditItem.changedBy || 'User'}</span>
                <span>{formatTimestamp(selectedAuditItem.createdAt || selectedAuditItem.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
