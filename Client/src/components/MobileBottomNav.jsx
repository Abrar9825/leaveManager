import React from 'react';
import { useLeave } from '../context/LeaveContext';

export default function MobileBottomNav() {
  const { activeTab, setActiveTab } = useLeave();

  return (
    <nav aria-label="Main navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg">
      {/* 1. Balance */}
      <button
        type="button"
        onClick={() => setActiveTab('overview')}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
          activeTab === 'overview' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <div
          className={`w-8 h-6 rounded-lg flex items-center justify-center transition-all ${
            activeTab === 'overview' ? 'bg-primary-fixed text-primary' : ''
          }`}
        >
          <span className="material-symbols-outlined text-[19px]">account_balance_wallet</span>
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Balance</span>
      </button>

      {/* 2. Add Leave (Add Balance) */}
      <button
        type="button"
        onClick={() => setActiveTab('add-leave')}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
          activeTab === 'add-leave' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <div
          className={`w-8 h-6 rounded-lg flex items-center justify-center transition-all ${
            activeTab === 'add-leave' ? 'bg-primary-fixed text-primary' : ''
          }`}
        >
          <span className="material-symbols-outlined text-[19px]">add_circle</span>
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Add Leave</span>
      </button>

      {/* Center action: Add Attendance */}
      <button
        type="button"
        onClick={() => setActiveTab('attendance')}
        aria-current={activeTab === 'attendance' ? 'page' : undefined}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
          activeTab === 'attendance' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <div className={`w-8 h-6 rounded-lg flex items-center justify-center transition-all ${
          activeTab === 'attendance' ? 'bg-primary-fixed text-primary' : ''
        }`}>
          <span aria-hidden="true" className="material-symbols-outlined text-[19px]">more_time</span>
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Attendance</span>
      </button>

      {/* 4. Add Task */}
      <button
        type="button"
        onClick={() => setActiveTab('add-task')}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
          activeTab === 'add-task' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <div
          className={`w-8 h-6 rounded-lg flex items-center justify-center transition-all ${
            activeTab === 'add-task' ? 'bg-primary-fixed text-primary' : ''
          }`}
        >
          <span className="material-symbols-outlined text-[19px]">post_add</span>
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Add Task</span>
      </button>

      {/* 5. Tasks (Daily Work List) */}
      <button
        type="button"
        onClick={() => setActiveTab('daily-work')}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
          activeTab === 'daily-work' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <div
          className={`w-8 h-6 rounded-lg flex items-center justify-center transition-all ${
            activeTab === 'daily-work' ? 'bg-primary-fixed text-primary' : ''
          }`}
        >
          <span className="material-symbols-outlined text-[19px]">assignment</span>
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Tasks</span>
      </button>
    </nav>
  );
}
