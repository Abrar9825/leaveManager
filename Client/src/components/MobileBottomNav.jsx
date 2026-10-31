import React from 'react';
import { useLeave } from '../context/LeaveContext';

export default function MobileBottomNav() {
  const { activeTab, setActiveTab } = useLeave();

  const navItems = [
    { id: 'overview', label: 'Balance', icon: 'account_balance_wallet' },
    { id: 'add-leave', label: 'Add', icon: 'add_circle' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
    { id: 'history', label: 'History', icon: 'history' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-surface-container px-3 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(23,26,53,0.04)]">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div
              className={`w-9 h-6 rounded-lg flex items-center justify-center transition-all ${
                isActive ? 'bg-primary-fixed text-primary' : ''
              }`}
            >
              <span className={`material-symbols-outlined text-[19px] ${isActive ? 'fill' : ''}`}>
                {item.icon}
              </span>
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
