import React, { useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';
import YearNavigator from './YearNavigator';

export default function LeaveHistory() {
  const {
    monthlyBreakdown,
    yearlyStats,
    currentYear,
    balanceHistory,
    fetchBalanceHistory,
    showToast,
    userJoinYear,
    userJoinMonth,
  } = useLeave();

  const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const startMonthName =
    currentYear === userJoinYear && userJoinMonth && userJoinMonth > 1
      ? monthShortNames[userJoinMonth - 1]
      : 'Jan';

  // Active view: 'monthly' | 'tracking'
  const [activeView, setActiveView] = useState('monthly');
  const [trackingYearFilter, setTrackingYearFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAuditItem, setSelectedAuditItem] = useState(null);

  useEffect(() => {
    fetchBalanceHistory();
  }, []);

  const handleRefreshHistory = async () => {
    setIsRefreshing(true);
    await fetchBalanceHistory();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleExportStatement = () => {
    if (activeView === 'monthly') {
      const header = 'Month,Status,Balance (Days),Opening,Credit,Used\n';
      const rows = monthlyBreakdown
        .map(
          (m) =>
            `"${m.month}","${m.current ? 'Current' : m.tag || 'Standard'}","${m.days.toFixed(1)}","${m.opening.toFixed(1)}","+${m.credit.toFixed(1)}","-${m.used.toFixed(1)}"`
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
      const header = 'Date,Year,Action,Change,Old Balance,New Balance,Reason,Changed By\n';
      const rows = balanceHistory
        .map(
          (h) =>
            `"${new Date(h.createdAt || h.timestamp).toLocaleString()}","${h.year}","${h.changeType}","${h.change > 0 ? '+' : ''}${h.change}","${h.oldBalance}","${h.newBalance}","${h.reason}","${h.changedBy || user?.name || 'User'}"`
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
          bg: 'bg-primary-fixed text-primary border-primary/20',
          icon: 'restart_alt',
        };
      case 'leave_deletion':
        return {
          label: 'Leave Restored',
          bg: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
          icon: 'add_circle',
        };
      case 'leave_deduction':
        return {
          label: 'Leave Deduction',
          bg: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
          icon: 'remove_circle',
        };
      case 'leave_edit':
        return {
          label: 'Leave Edit',
          bg: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
          icon: 'edit_calendar',
        };
      default:
        return {
          label: 'Adjustment',
          bg: 'bg-surface-container text-on-surface-variant border-surface-container',
          icon: 'history',
        };
    }
  };

  return (
    <div className="w-full max-w-[840px] mx-auto flex flex-col gap-6 pb-12 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col items-center text-center">
        <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          History & Audit Trail
        </h1>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">
          Monthly breakdown and live tracking of all balance resets and changes.
        </p>
      </div>

      {/* Hero Yearly Summary Card (Obsidian Midnight) */}
      <div className="relative w-full rounded-[22px] bg-inverse-surface text-on-primary p-5 sm:p-7 md:p-8 overflow-hidden shadow-hero-dark border border-white/10">
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-primary/30 blur-3xl pointer-events-none ambient-glow"></div>
        <div className="absolute top-1/2 -left-20 w-48 h-48 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[11px] tracking-widest text-secondary-fixed uppercase font-semibold">
              YEARLY LEAVE SUMMARY
            </span>
            <span className="text-xs text-secondary-fixed/80">Cycle: {startMonthName} – Dec {currentYear}</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/10 text-center">
            {/* Total Credits */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                {yearlyStats.totalCredits.toFixed(0)}
              </span>
              <p className="font-label-caps text-[10px] sm:text-[11px] text-secondary-fixed/90 uppercase mt-1 font-semibold">
                Total Credits
              </p>
            </div>

            {/* Leaves Used */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                {yearlyStats.leavesUsed.toFixed(0)}
              </span>
              <p className="font-label-caps text-[10px] sm:text-[11px] text-secondary-fixed/90 uppercase mt-1 font-semibold">
                Leaves Used
              </p>
            </div>

            {/* Balance */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/10 border border-white/10">
              <span className="text-2xl sm:text-4xl font-bold tracking-tight text-secondary-fixed-dim">
                {yearlyStats.balance.toFixed(0)}
              </span>
              <p className="font-label-caps text-[10px] sm:text-[11px] text-secondary-fixed uppercase mt-1 font-semibold">
                Balance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Year Pill Selector */}
      <YearNavigator />

      {/* Main Dual-Tab Segmented Container */}
      <div className="w-full rounded-[22px] bg-surface-container-lowest shadow-sm overflow-hidden p-5 sm:p-7 border border-surface-container/80">
        {/* Navigation Tabs Switcher */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-surface-container-low rounded-xl gap-1 border border-surface-container/60 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveView('monthly')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeView === 'monthly'
                  ? 'bg-surface-container-lowest text-primary shadow-xs border border-surface-container/80'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[17px]">calendar_view_month</span>
              <span>Monthly Breakdown</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('tracking')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeView === 'tracking'
                  ? 'bg-surface-container-lowest text-primary shadow-xs border border-surface-container/80'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[17px]">history</span>
              <span className="hidden xs:inline">Balance Tracking History</span>
              <span className="xs:hidden">History</span>
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
                className="bg-surface-container-low border border-surface-container text-on-surface font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-primary text-xs"
              >
                <option value="all">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>

              <button
                type="button"
                onClick={handleRefreshHistory}
                title="Refresh audit history from MongoDB"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              >
                <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>
                  refresh
                </span>
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: Monthly Breakdown */}
        {activeView === 'monthly' && (
          <div className="pt-3">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Monthly Leave Accrual
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Monthly credit of 2 days is credited on the 1st of each month.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-low text-primary font-label-caps text-xs font-semibold border border-surface-container/70">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                +2 / mo
              </span>
            </div>

            {/* List of Months */}
            <div className="flex flex-col divide-y divide-surface-container">
              {monthlyBreakdown.map((item) => {
                const isDeficit = item.status === 'deficit';
                return (
                  <div
                    key={item.month}
                    className={`py-3 sm:py-3.5 flex flex-col gap-1 transition-colors ${
                      isDeficit ? 'bg-error-container/15 -mx-3 px-3 rounded-xl' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold text-on-surface ${item.current ? 'text-primary' : ''}`}>
                          {item.month}
                        </span>
                        {item.current && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-white font-label-caps text-[9px] uppercase font-bold">
                            Current
                          </span>
                        )}
                        {item.tag && (
                          <span
                            className={`px-1.5 py-0.5 rounded font-label-caps text-[9px] uppercase font-bold ${
                              item.tag === 'Joined'
                                ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                                : item.tag === 'Pre-joining'
                                ? 'bg-surface-container text-on-surface-variant'
                                : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            {item.tag}
                          </span>
                        )}
                      </div>

                      {/* Badge */}
                      {item.current ? (
                        <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary text-on-primary shadow-xs">
                          {item.days.toFixed(1)} Days
                        </span>
                      ) : isDeficit ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-error-container text-on-error-container">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          {item.days.toFixed(1)} Day
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            item.days > 0
                              ? 'bg-primary-fixed text-primary'
                              : 'bg-surface-container-high text-on-surface-variant font-medium'
                          }`}
                        >
                          {item.days.toFixed(1)} Days
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        <span>
                          Opening:{' '}
                          <strong className={item.opening < 0 ? 'text-error' : 'text-on-surface'}>
                            {item.opening.toFixed(1)}
                          </strong>
                        </span>
                        <span>
                          Credit: <strong className="text-primary">+{item.credit.toFixed(1)}</strong>
                        </span>
                        <span>
                          Used: <strong className="text-on-surface">-{item.used.toFixed(1)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Balance Tracking History (Audit Trail) */}
        {activeView === 'tracking' && (
          <div className="pt-3 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Balance Audit History
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Detailed ledger of all balance calibrations, deductions, and restorations.
                </p>
              </div>
            </div>

            {filteredTrackingHistory.length === 0 ? (
              <div className="py-10 text-center text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40 mb-1 block">
                  history_toggle_off
                </span>
                No balance adjustments logged yet.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-surface-container">
                {filteredTrackingHistory.map((item, idx) => {
                  const badge = getActionBadge(item.changeType);
                  const changeVal = Number(item.change);
                  const isPositive = changeVal > 0;
                  const isNegative = changeVal < 0;

                  return (
                    <div
                      key={item._id || item.id || idx}
                      onClick={() => setSelectedAuditItem(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedAuditItem(item);
                        }
                      }}
                      className="group flex items-center justify-between py-2.5 sm:py-3 hover:bg-surface-container-low -mx-2 sm:-mx-3 px-2 sm:px-3 rounded-xl transition-all duration-150 cursor-pointer select-none active:scale-[0.99] gap-2"
                      title="Click to view full audit details"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary border border-surface-container shrink-0">
                          <span className="material-symbols-outlined text-[17px]">{badge.icon}</span>
                        </div>

                        <div className="flex flex-col min-w-0 pr-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                              {item.reason}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>
                          <span className="text-[10px] sm:text-[11px] text-on-surface-variant truncate mt-0.5">
                            {formatTimestamp(item.createdAt || item.timestamp)} • Year {item.year}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1 sm:ml-2">
                        <span
                          className={`text-[11px] sm:text-xs font-bold tabular-nums px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : isNegative
                              ? 'bg-amber-500/10 text-amber-800'
                              : 'bg-surface-container text-on-surface'
                          }`}
                        >
                          {isPositive ? `+${changeVal.toFixed(1)}` : `${changeVal.toFixed(1)}`}d
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 group-hover:text-on-surface transition-colors hidden xs:inline-block">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer info & Export */}
        <div className="mt-5 pt-4 border-t border-surface-container flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#27C383]"></span>
              All data persisted live in MongoDB
            </span>
          </div>

          <button
            onClick={handleExportStatement}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-all font-label-md text-xs sm:text-sm font-semibold border border-surface-container"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              download
            </span>
            {activeView === 'monthly' ? 'Export Monthly Statement' : 'Export Tracking History'}
          </button>
        </div>
      </div>

      {/* POPUP MODAL: BALANCE AUDIT DETAIL (Opens when user clicks any history row) */}
      {selectedAuditItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-inverse-surface/60 backdrop-blur-sm transition-all animate-in fade-in duration-150"
          onClick={() => setSelectedAuditItem(null)}
        >
          <div
            className="w-full max-w-sm sm:max-w-md max-h-[88vh] flex flex-col bg-surface-container-lowest rounded-[20px] sm:rounded-[24px] shadow-2xl border border-surface-container relative overflow-hidden transition-all transform scale-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3 sm:pb-4 border-b border-surface-container shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-xs shrink-0">
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                    {getActionBadge(selectedAuditItem.changeType).icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface truncate">
                    Audit Log Details
                  </h3>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">
                    Permanent audit record
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAuditItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0 ml-2"
                title="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 sm:space-y-3.5">
              {/* Type Badge & Net Change */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      getActionBadge(selectedAuditItem.changeType).bg
                    }`}
                  >
                    {getActionBadge(selectedAuditItem.changeType).label}
                  </span>
                  <span className="text-[11px] sm:text-xs text-on-surface-variant font-medium truncate">
                    Cycle Year {selectedAuditItem.year}
                  </span>
                </div>

                <span
                  className={`text-sm sm:text-base font-bold tabular-nums shrink-0 ${
                    Number(selectedAuditItem.change) > 0
                      ? 'text-emerald-600'
                      : Number(selectedAuditItem.change) < 0
                      ? 'text-amber-600'
                      : 'text-on-surface'
                  }`}
                >
                  {Number(selectedAuditItem.change) > 0 ? '+' : ''}
                  {Number(selectedAuditItem.change).toFixed(1)} Days
                </span>
              </div>

              {/* Balance Transition Metric */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                <div className="p-2.5 sm:p-3 rounded-xl bg-surface-container-low border border-surface-container text-center">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-0.5">
                    Previous Balance
                  </span>
                  <span className="text-sm sm:text-base font-bold text-on-surface tabular-nums">
                    {selectedAuditItem.oldBalance !== undefined
                      ? Number(selectedAuditItem.oldBalance).toFixed(1)
                      : '—'}{' '}
                    <span className="text-[11px] font-normal text-on-surface-variant">d</span>
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-primary-fixed/20 border border-primary/20 text-center">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-primary tracking-wider block mb-0.5">
                    New Balance
                  </span>
                  <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
                    {selectedAuditItem.newBalance !== undefined
                      ? Number(selectedAuditItem.newBalance).toFixed(1)
                      : '—'}{' '}
                    <span className="text-[11px] font-normal text-primary/80">d</span>
                  </span>
                </div>
              </div>

              {/* Reason / Note */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                  Adjustment Reason
                </span>
                <p className="text-xs sm:text-sm font-semibold text-on-surface leading-snug break-words">
                  {selectedAuditItem.reason || 'No description provided'}
                </p>
              </div>

              {/* Metadata: Recorded by & Timestamp */}
              <div className="text-[11px] sm:text-xs text-on-surface-variant space-y-1.5 pt-1 border-t border-surface-container/60">
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0">Recorded By:</span>
                  <strong className="text-on-surface truncate text-right">
                    {selectedAuditItem.changedBy || user?.name || 'Authorized User'}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0">Timestamp:</span>
                  <span className="text-on-surface font-medium truncate text-right">
                    {formatTimestamp(selectedAuditItem.createdAt || selectedAuditItem.timestamp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-surface-container shrink-0 bg-surface-container-lowest">
              <button
                type="button"
                onClick={() => setSelectedAuditItem(null)}
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors text-center active:scale-[0.99]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
