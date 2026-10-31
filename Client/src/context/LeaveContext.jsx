import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';

const LeaveContext = createContext(null);

// Dynamic Monthly Breakdown Generator based on real year, actual leaves, and user's join month
export const generateDynamicMonthlyBreakdown = (year, leaves = [], joinYear = 2026, joinMonth = 10) => {
  const now = new Date();
  const currYear = now.getFullYear();
  const currMonth = now.getMonth(); // 0 to 11

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let cumulativeBalance = 0;

  return monthNames.map((name, index) => {
    const monthNum = index + 1; // 1 to 12
    const isCurrent = year === currYear && index === currMonth;

    // Check if user was already in company
    const isPreJoining = year < joinYear || (year === joinYear && monthNum < joinMonth);
    const isJoiningMonth = year === joinYear && monthNum === joinMonth;

    // Credit rules:
    // If pre-joining: 0 credit
    // If past or current month (from joining month onwards): 2.0 credits
    const isPastOrCurrent = year < currYear || (year === currYear && index <= currMonth);
    const monthlyCredit = isPreJoining ? 0.0 : isPastOrCurrent ? 2.0 : 0.0;

    // Filter actual leaves in this month from database
    const usedInMonth = leaves
      .filter((l) => {
        if (!l.date) return false;
        const d = new Date(l.date + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() === index;
      })
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

    const opening = isPreJoining ? 0 : cumulativeBalance;
    const days = isPreJoining ? 0 : (isPastOrCurrent ? opening + monthlyCredit - usedInMonth : opening);
    
    if (!isPreJoining && isPastOrCurrent) {
      cumulativeBalance = days;
    }

    let tag = undefined;
    if (isPreJoining) {
      tag = 'Pre-joining';
    } else if (isJoiningMonth) {
      tag = 'Joined';
    }

    return {
      month: `${name} ${year}`,
      current: isCurrent,
      days: parseFloat(days.toFixed(1)),
      opening: parseFloat(opening.toFixed(1)),
      credit: monthlyCredit,
      used: parseFloat(usedInMonth.toFixed(1)),
      status: days < 0 ? 'deficit' : 'normal',
      tag,
      isPreJoining,
    };
  });
};

export function LeaveProvider({ children }) {
  // Dynamically set to current calendar year
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [balances, setBalances] = useState({});
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'add-leave' | 'calendar' | 'history' | 'profile' | 'rules'
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', message: '', type: 'success' });

  // Auth state: Initially unauthenticated
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('auth_logged_in') === 'true';
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const userJoinYear = user?.joinYear || new Date().getFullYear();
  const userJoinMonth = user?.joinMonth || (new Date().getMonth() + 1);

  // Dynamic monthly breakdown calculated from real leaves and user's join month
  const monthlyBreakdown = useMemo(() => {
    return generateDynamicMonthlyBreakdown(currentYear, leaveRequests, userJoinYear, userJoinMonth);
  }, [currentYear, leaveRequests, userJoinYear, userJoinMonth]);

  // Default prorated annual quota based on user's join month
  const defaultAnnualQuota = useMemo(() => {
    if (currentYear < userJoinYear) return 0.0;
    if (currentYear === userJoinYear) {
      const remainingMonths = Math.max(1, 12 - userJoinMonth + 1);
      return parseFloat((remainingMonths * 2.0).toFixed(1));
    }
    return 24.0;
  }, [currentYear, userJoinYear, userJoinMonth]);

  const availableBalance = balances[currentYear] ?? defaultAnnualQuota;

  const showToast = (title, message, type = 'success') => {
    setToast({ open: true, title, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 4000);
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  // Fetch initial data from MongoDB Backend
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      // 1. Fetch Balances
      const balanceRes = await api.getBalances();
      if (balanceRes?.yearlyMap) {
        setBalances((prev) => ({ ...prev, ...balanceRes.yearlyMap }));
      }

      // 2. Fetch Leaves
      const leavesRes = await api.getLeaves(currentYear);
      if (leavesRes?.data) {
        setLeaveRequests(leavesRes.data);
      }

      // 3. Fetch Balance Tracking History
      const historyRes = await api.getBalanceHistory(currentYear);
      if (historyRes?.data) {
        setBalanceHistory(historyRes.data);
      }

      // 4. Fetch Official Public Holidays
      const holidayRes = await api.getHolidays(currentYear).catch(() => null);
      if (holidayRes?.data) {
        setHolidays(holidayRes.data);
      }

      // 5. Fetch Profile (only for authenticated user)
      if (user?.email) {
        const profileRes = await api.getProfile(user.email).catch(() => null);
        if (profileRes?.data) {
          setUser((prev) => {
            const merged = { ...prev, ...profileRes.data };
            localStorage.setItem('auth_user', JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (error) {
      console.warn('[LeaveProvider] Failed to load data from backend:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated, loadInitialData]);

  // Refresh balance history
  const fetchBalanceHistory = async (year) => {
    try {
      const res = await api.getBalanceHistory(year || currentYear);
      if (res?.data) {
        setBalanceHistory(res.data);
      }
      return res?.data || [];
    } catch (err) {
      console.error('Failed to fetch balance history:', err);
      return [];
    }
  };

  const handleYearChange = (delta) => {
    setCurrentYear((prev) => prev + delta);
  };

  // ADD LEAVE (Dynamic, auto-recalculates balance)
  const addLeave = async ({
    mode,
    startDate,
    endDate,
    dayType,
    session,
    reason,
    requestedDays,
    saturdayRule,
  }) => {
    setIsSyncing(true);
    try {
      const payload = {
        mode,
        startDate,
        endDate: mode === 'multiple' ? endDate : undefined,
        dayType,
        session,
        reason,
        requestedDays,
        year: currentYear,
        saturdayRule,
      };

      const res = await api.createLeave(payload);
      const newLeave = res.data;

      setLeaveRequests((prev) => [newLeave, ...prev]);

      if (res.updatedBalance) {
        setBalances((prev) => ({
          ...prev,
          [res.updatedBalance.year]: res.updatedBalance.availableDays,
        }));
      } else {
        const newBal = Math.max(0, availableBalance - requestedDays);
        setBalances((prev) => ({
          ...prev,
          [currentYear]: parseFloat(newBal.toFixed(1)),
        }));
      }

      fetchBalanceHistory(currentYear);

      const balAfter = res.updatedBalance?.availableDays ?? (availableBalance - requestedDays);
      showToast(
        'Leave Request Approved & Saved',
        `Allocated ${requestedDays.toFixed(1)} day(s). New balance: ${balAfter.toFixed(1)} days.`
      );
      return true;
    } catch (error) {
      showToast('Submission Failed', error.message || 'Could not save leave', 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // DELETE LEAVE (Restores balance in MongoDB)
  const deleteLeave = async (id) => {
    setIsSyncing(true);
    try {
      const res = await api.deleteLeave(id);
      const restored = res.restoredDays || 1.0;

      // Remove from list
      setLeaveRequests((prev) => prev.filter((r) => (r.id || r._id) !== id));

      if (res.updatedBalance) {
        setBalances((prev) => ({
          ...prev,
          [res.updatedBalance.year]: res.updatedBalance.availableDays,
        }));
      } else {
        const restoredBal = availableBalance + restored;
        setBalances((prev) => ({
          ...prev,
          [currentYear]: parseFloat(restoredBal.toFixed(1)),
        }));
      }

      fetchBalanceHistory(currentYear);

      showToast(
        'Leave Deleted & Balance Restored',
        `Recalculated: +${restored} day(s) restored back to balance.`
      );
      return true;
    } catch (error) {
      showToast('Delete Failed', error.message || 'Could not delete leave', 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // UPDATE / EDIT LEAVE (Recalculates delta in MongoDB)
  const updateLeave = async (id, updateData) => {
    setIsSyncing(true);
    try {
      const res = await api.updateLeave(id, updateData);
      const updatedItem = res.data;

      setLeaveRequests((prev) =>
        prev.map((r) => ((r.id || r._id) === id ? { ...r, ...updatedItem } : r))
      );

      if (res.updatedBalance) {
        setBalances((prev) => ({
          ...prev,
          [res.updatedBalance.year]: res.updatedBalance.availableDays,
        }));
      }

      fetchBalanceHistory(currentYear);

      showToast(
        'Leave Updated & Recalculated',
        `Changes saved successfully. Current balance: ${(
          res.updatedBalance?.availableDays ?? availableBalance
        ).toFixed(1)} days.`
      );
      return true;
    } catch (error) {
      showToast('Update Failed', error.message || 'Could not update leave', 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // RESET / CALIBRATE BALANCE
  const resetBalance = async (year, newBalance, reason) => {
    setIsSyncing(true);
    try {
      const res = await api.adjustBalance({
        year: year || currentYear,
        newBalance,
        reason: reason || 'Manual calibration via dashboard long-press',
        changedBy: user?.name || 'User',
      });

      const updatedVal = res.data.newBalance;
      setBalances((prev) => ({
        ...prev,
        [year || currentYear]: updatedVal,
      }));

      await fetchBalanceHistory(year || currentYear);

      showToast(
        'Balance Calibrated Successfully',
        `Available days set to ${updatedVal.toFixed(1)} days. Recorded in History.`
      );
      return true;
    } catch (error) {
      showToast('Reset Failed', error.message || 'Could not reset balance', 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth: Login
  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.data) {
        const userData = res.data;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('auth_logged_in', 'true');
        localStorage.setItem('auth_user', JSON.stringify(userData));

        // Always navigate directly to dashboard overview on login
        setActiveTab('overview');

        showToast('Welcome Back', 'Signed in successfully.');
        return { success: true };
      }
      return { success: false, error: 'Sign in failed' };
    } catch (error) {
      showToast('Sign In Error', error.message || 'Invalid email or password', 'error');
      return { success: false, error: error.message || 'Invalid email or password' };
    }
  };

  // Auth: Register User
  const registerUser = async (name, email, password) => {
    try {
      const res = await api.register(name, email, password);
      if (res.data) {
        const userData = res.data;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('auth_logged_in', 'true');
        localStorage.setItem('auth_user', JSON.stringify(userData));

        // Direct to dashboard overview
        setActiveTab('overview');
        showToast('Account Created', 'Welcome to Leave Manager!');
        return { success: true };
      }
      return { success: false, error: 'Could not create account' };
    } catch (error) {
      showToast('Registration Error', error.message || 'Could not create account', 'error');
      return { success: false, error: error.message || 'Could not create account' };
    }
  };

  // Auth: Update User Profile Dynamically
  const updateUserProfile = async (profileData) => {
    setIsSyncing(true);
    try {
      const res = await api.updateProfile({ email: user?.email, ...profileData });
      if (res.data) {
        const updated = { ...user, ...res.data };
        setUser(updated);
        localStorage.setItem('auth_user', JSON.stringify(updated));
        showToast('Profile Updated', 'Profile details have been updated successfully.');
        return { success: true, data: updated };
      }
      return { success: false, error: 'Failed to update' };
    } catch (error) {
      showToast('Profile Update Error', error.message || 'Could not update profile', 'error');
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth: Acknowledge Rules
  const acknowledgeLeaveRules = async () => {
    try {
      if (user?.email) {
        await api.acknowledgeRules(user.email);
      }
      const updatedUser = { ...user, rulesAcknowledged: true };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      showToast('Rules Acknowledged', 'You are ready to manage your leaves!');
    } catch (err) {
      console.warn('Rules ack failed:', err);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth_logged_in');
    localStorage.removeItem('auth_user');
    showToast('Signed Out', 'You have been signed out.');
  };

  const updatePassword = async (oldPassword, newPassword) => {
    try {
      await api.updatePassword(user?.email, oldPassword, newPassword);
      showToast('Password Updated', 'Your password has been changed successfully.');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const yearlyStats = useMemo(() => {
    const totalCredits = defaultAnnualQuota;
    const leavesUsed = leaveRequests
      .filter((r) => {
        if (r.year) return r.year === currentYear;
        if (!r.date) return false;
        return new Date(r.date + 'T00:00:00').getFullYear() === currentYear;
      })
      .reduce((acc, r) => acc + (Number(r.days) || 0), 0);
    const balance = balances[currentYear] !== undefined
      ? balances[currentYear]
      : Math.max(0, totalCredits - leavesUsed);

    return {
      totalCredits,
      leavesUsed,
      balance: Math.max(0, balance),
    };
  }, [defaultAnnualQuota, leaveRequests, currentYear, balances]);

  const value = {
    currentYear,
    setCurrentYear,
    handleYearChange,
    availableBalance,
    defaultAnnualQuota,
    userJoinMonth,
    userJoinYear,
    balances,
    activeTab,
    setActiveTab,
    leaveRequests,
    holidays,
    monthlyBreakdown,
    balanceHistory,
    fetchBalanceHistory,
    toast,
    showToast,
    closeToast,
    addLeave,
    deleteLeave,
    updateLeave,
    resetBalance,
    yearlyStats,
    isAuthenticated,
    user,
    login,
    registerUser,
    logout,
    updatePassword,
    updateUserProfile,
    acknowledgeLeaveRules,
    isLoading,
    isSyncing,
    refreshData: loadInitialData,
  };

  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>;
}

export function useLeave() {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
}
