import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import LeaveDetailModal from './LeaveDetailModal';

export default function LeaveActivity() {
  const { leaveRequests, showToast } = useLeave();
  const [filter, setFilter] = useState('All time');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const filterOptions = ['All time', 'This Month', 'Last 30 Days', 'Approved'];

  const filteredRequests = leaveRequests.filter((req) => {
    if (filter === 'Approved') return req.status === 'Approved';
    return true;
  });

  const selectedItem =
    leaveRequests.find((r) => (r.id || r._id) === selectedId) || null;

  const handleDownloadAudit = (e) => {
    e.stopPropagation();
    const header = 'Date,Reason,Duration,Weekend Policy,Status,Recorded At\n';
    const rows = leaveRequests
      .map((r) => {
        const weekendPolicy = r.saturdayRule?.touchesWeekend
          ? r.saturdayRule.saturdayAttendance === 'working'
            ? 'Saturday Working'
            : 'Saturday Off'
          : 'N/A';
        return `"${r.displayDate}","${r.reason}","${r.dayLabel}","${weekendPolicy}","${
          r.status
        }","${r.timestamp || new Date().toISOString()}"`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Leave_Audit_Report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Audit Report Downloaded', 'Audit trail exported as CSV successfully.');
  };

  return (
    <div className="w-full rounded-[22px] bg-surface-container-lowest shadow-sm overflow-hidden p-6 sm:p-8 border border-surface-container/80 transition-all duration-200">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-surface-container">
        <div className="flex items-center gap-2.5">
          <h2 className="font-headline-md text-lg sm:text-xl font-bold text-on-surface tracking-tight">
            Leave activity
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-[11px] font-semibold tracking-wider uppercase">
            {filteredRequests.length} REQUESTS
          </span>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-md text-xs sm:text-sm font-medium py-1 px-2 rounded-lg hover:bg-surface-container"
            type="button"
          >
            <span>{filter}</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container p-1 z-20">
              {filterOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setFilter(opt);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === opt
                      ? 'bg-primary-fixed text-primary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline Stack */}
      <div className="flex flex-col">
        {filteredRequests.map((item, index) => {
          const itemId = item.id || item._id;
          return (
            <React.Fragment key={itemId}>
              <div
                onClick={() => setSelectedId(itemId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(itemId);
                  }
                }}
                className="group flex items-center justify-between py-3.5 sm:py-4 hover:bg-surface-container-low -mx-6 sm:-mx-8 px-6 sm:px-8 transition-all duration-150 cursor-pointer select-none active:scale-[0.99]"
                title="Click to view, edit, or delete leave"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Pulsing Dot */}
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary-fixed/50"></span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-sm sm:text-[15px] font-semibold text-on-surface tracking-tight group-hover:text-primary transition-colors truncate">
                        {item.displayDate}
                      </span>

                      {/* Weekend Rule Badge */}
                      {item.saturdayRule?.touchesWeekend && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            item.saturdayRule.saturdayAttendance === 'working'
                              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
                          }`}
                        >
                          {item.saturdayRule.saturdayAttendance === 'working'
                            ? 'Sat Working'
                            : 'Sat Off'}
                        </span>
                      )}
                    </div>
                    <span className="font-body-md text-xs sm:text-sm text-on-surface-variant truncate">
                      {item.reason}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-md text-xs font-semibold border border-surface-container-high/40 group-hover:bg-primary-fixed group-hover:text-primary transition-colors">
                    {item.dayLabel}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40 group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </div>
              </div>

              {index < filteredRequests.length - 1 && (
                <div className="w-full h-[1px] bg-surface-container/70"></div>
              )}
            </React.Fragment>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-11 h-11 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant mb-2.5">
              <span className="material-symbols-outlined text-[24px]">event_note</span>
            </div>
            <p className="font-semibold text-sm text-on-surface">No leave requests recorded</p>
            <p className="text-xs text-on-surface-variant mt-0.5 max-w-[280px]">
              Apply for time off and your approved leaves will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Subtle Discrete Footnote */}
      <div className="mt-4 sm:mt-6 pt-4 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant font-body-sm text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#27C383]"></span>
          Synced live with MongoDB backend
        </span>
        <button
          onClick={handleDownloadAudit}
          className="text-primary hover:text-primary-container hover:underline font-label-md text-xs font-semibold inline-flex items-center gap-1"
          type="button"
        >
          <span className="material-symbols-outlined text-[15px]">download</span>
          Download audit report
        </button>
      </div>

      {/* Detail Popup Modal (Supports View, Edit, and Delete) */}
      {selectedItem && (
        <LeaveDetailModal item={selectedItem} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
