import React from 'react';
import BalanceCard from '../components/BalanceCard';
import LeaveActivity from '../components/LeaveActivity';

export default function OverviewPage() {
  return (
    <div className="w-full max-w-[620px] mx-auto flex flex-col gap-5 pb-16 animate-fade-in px-1">
      {/* Super-clean Minimal Balance Card with Calendar Icon */}
      <BalanceCard />

      {/* Clean Leave Activity */}
      <LeaveActivity />
    </div>
  );
}
