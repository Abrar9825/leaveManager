import React from 'react';
import { useLeave } from '../context/LeaveContext';

export default function Header() {
  const { activeTab, setActiveTab } = useLeave();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'add-leave', label: 'Add Leave', icon: 'event_available' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
    { id: 'history', label: 'History', icon: 'history' },
    { id: 'rules', label: 'Rules', icon: 'menu_book' },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 w-full z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(23,26,53,0.04)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-xs transition-transform duration-200 group-hover:scale-105">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </div>
            <span className="font-headline-sm text-base sm:text-[17px] font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">
              Leave Manager
            </span>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-surface-container-low border border-surface-container/60">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Clean Profile Icon Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            title="My Profile"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'profile'
                ? 'bg-primary text-white shadow-primary-btn ring-2 ring-primary-fixed'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary border border-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
}
