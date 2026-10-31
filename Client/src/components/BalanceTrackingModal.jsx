import React, { useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';

export default function BalanceTrackingModal({ onClose }) {
  const { currentYear, balanceHistory, fetchBalanceHistory } = useLeave();
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchBalanceHistory();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBalanceHistory();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const filteredHistory = balanceHistory.filter((item) => {
    if (selectedYearFilter === 'all') return true;
    return item.year === Number(selectedYearFilter);
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

  const getBadgeForType = (type) => {
    switch (type) {
      case 'manual_reset':
        return {
          label: 'Manual Reset',
          icon: 'restart_alt',
          bg: 'bg-primary-fixed/40 text-primary border-primary/20',
        };
      case 'leave_deletion':
        return {
          label: 'Leave Restored',
          icon: 'add_circle',
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        };
      case 'leave_deduction':
        return {
          label: 'Leave Used',
          icon: 'remove_circle',
          bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        };
      case 'leave_edit':
        return {
          label: 'Leave Edit',
          icon: 'edit_calendar',
          bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        };
      default:
        return {
          label: 'Balance Change',
          icon: 'history',
          bg: 'bg-surface-variant text-on-surface-variant border-surface-container',
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-inverse-surface/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-surface-container-lowest rounded-[24px] shadow-2xl border border-surface-container relative overflow-hidden transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-surface-container/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-[24px]">history</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                Balance Tracking History
              </h3>
              <p className="text-xs text-on-surface-variant">
                Live audit trail of all resets, edits, and leave deductions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              title="Refresh tracking data from MongoDB"
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            >
              <span className={`material-symbols-outlined text-[20px] ${isRefreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-3 bg-surface-container-low/50 border-b border-surface-container flex items-center justify-between text-xs">
          <span className="text-on-surface-variant font-medium">
            Showing <strong className="text-on-surface">{filteredHistory.length}</strong> logged action(s)
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-on-surface-variant">Year:</span>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="bg-surface-container-lowest border border-surface-container text-on-surface font-semibold rounded-lg px-2 py-1 outline-none focus:border-primary text-xs"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        {/* Scrollable Timeline List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
                <span className="material-symbols-outlined text-[24px]">history_toggle_off</span>
              </div>
              <p className="font-semibold text-sm text-on-surface">No tracking history logged yet</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Any balance resets, leave applications, edits or deletions will appear here.
              </p>
            </div>
          ) : (
            filteredHistory.map((item, idx) => {
              const badge = getBadgeForType(item.changeType);
              const changeVal = Number(item.change);
              const isPositive = changeVal > 0;
              const isNegative = changeVal < 0;

              return (
                <div
                  key={item._id || item.id || idx}
                  className="p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high/40 transition-all border border-surface-container/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary border border-surface-container flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[19px]">{badge.icon}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[11px] font-semibold text-on-surface-variant">
                          Year {item.year}
                        </span>
                        <span className="text-[11px] text-on-surface-variant/70">
                          • {formatTimestamp(item.createdAt || item.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-on-surface mt-1 truncate">
                        {item.reason}
                      </p>

                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        By <span className="font-medium text-on-surface">{item.changedBy || 'User'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Net Change and Transition */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-surface-container/60 flex-shrink-0">
                    <span
                      className={`text-sm sm:text-base font-bold tabular-nums ${
                        isPositive ? 'text-emerald-600' : isNegative ? 'text-amber-600' : 'text-on-surface'
                      }`}
                    >
                      {isPositive ? `+${changeVal.toFixed(1)}` : `${changeVal.toFixed(1)}`} d
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {item.oldBalance?.toFixed(1)} →{' '}
                      <strong className="text-on-surface font-bold">{item.newBalance?.toFixed(1)}</strong> days
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low/40 border-t border-surface-container flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant">
            Data synced in real time with MongoDB
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

