import React from 'react';
import { LeaveProvider, useLeave } from './context/LeaveContext';
import Header from './components/Header';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import Toast from './components/Toast';
import OverviewPage from './pages/OverviewPage';
import AttendancePage from './components/AttendancePage';
import AddLeaveForm from './components/AddLeaveForm';
import LeaveHistory from './components/LeaveHistory';
import DailyWorkPage from './components/DailyWorkPage';
import AddTaskView from './components/AddTaskView';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import LeaveRulesPage from './pages/LeaveRulesPage';

function AppContent() {
  const { activeTab, isAuthenticated, setActiveTab } = useLeave();

  // If user is not authenticated, show Login & Registration Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased font-sans">
      <Header />

      <main className="flex-1 w-full flex flex-col items-center justify-start py-6 sm:py-8 px-4 sm:px-6">
        <div className="w-full max-w-[820px] flex justify-center">
          {activeTab === 'overview' && <OverviewPage />}
          {activeTab === 'add-leave' && <AddLeaveForm />}
          {activeTab === 'daily-work' && <DailyWorkPage />}
          {activeTab === 'add-task' && <AddTaskView />}
          {activeTab === 'attendance' && <AttendancePage />}
          {activeTab === 'history' && <LeaveHistory />}
          {activeTab === 'profile' && <ProfilePage />}
          {activeTab === 'rules' && (
            <LeaveRulesPage onBackToProfile={() => setActiveTab('profile')} />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {activeTab !== 'rules' && <MobileBottomNav />}

      {/* Footer */}
      <Footer />

      {/* Dynamic Toast Feedback */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <LeaveProvider>
      <AppContent />
    </LeaveProvider>
  );
}
