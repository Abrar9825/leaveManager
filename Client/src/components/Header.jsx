import React from 'react';
import { useLeave } from '../context/LeaveContext';

export default function Header() {
  const { activeTab, setActiveTab } = useLeave();

  const navItems = [
    { id: 'overview', label: 'Balance', icon: 'account_balance_wallet' },
    { id: 'daily-work', label: 'Daily Work', icon: 'assignment' },
    { id: 'add-leave', label: 'Add Leave', icon: 'add_circle' },
    { id: 'attendance', label: 'Attendance', icon: 'timer' },
    { id: 'history', label: 'History', icon: 'history' },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 w-full z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(23,26,53,0.04)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-xs">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          </div>
          <span className="font-headline-sm text-base font-bold text-on-surface tracking-tight">
            Leave Manager
          </span>
        </button>

        {/* Clean Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-surface-container-low border border-surface-container/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Quick Desktop Add Task CTA */}
          <button
            type="button"
            onClick={() => setActiveTab('add-task')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              activeTab === 'add-task'
                ? 'bg-[#4834c9] text-white shadow-primary-btn'
                : 'bg-primary hover:bg-[#4834c9] text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Task</span>
          </button>

          {/* Profile Button */}
          <button
            onClick={() => setActiveTab('profile')}
            title="My Profile"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'profile'
                ? 'bg-primary text-white shadow-primary-btn ring-2 ring-primary-fixed'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary border border-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
}
