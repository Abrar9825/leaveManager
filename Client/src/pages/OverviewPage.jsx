import React from 'react';
import BalanceCard from '../components/BalanceCard';
import YearNavigator from '../components/YearNavigator';
import LeaveActivity from '../components/LeaveActivity';

export default function OverviewPage() {
  return (
    <div className="w-full max-w-[820px] mx-auto flex flex-col gap-6 pb-12">
      {/* Hero Balance Card */}
      <BalanceCard />

      {/* Interactive Year Navigator */}
      <YearNavigator />

      {/* Leave Activity Porcelain Card */}
      <LeaveActivity />
    </div>
  );
}

