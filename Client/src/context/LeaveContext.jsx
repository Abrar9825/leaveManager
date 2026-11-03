import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';

const LeaveContext = createContext(null);

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const formatDateKey = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function LeaveProvider({ children }) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(() => today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => today.getMonth() + 1); // 1-12

  const [balances, setBalances] = useState({});
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'add-leave' | 'attendance' | 'history' | 'daily-work' | 'add-task' | 'profile' | 'rules'
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', message: '', type: 'success' });

  // Attendance records (late records)
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);

  // Daily Work & Tasks State
  const [tasks, setTasks] = useState([]);
  const [taskDate, setTaskDate] = useState(() => formatDateKey());
  const [taskFromDate, setTaskFromDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [taskToDate, setTaskToDate] = useState(() => formatDateKey());

  // Auth state
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

  // User join month and year (defaults to October 2026 if not specified)
  const userJoinYear = user?.joinYear || 2026;
  const userJoinMonth = user?.joinMonth || 10;

  const showToast = (title, message, type = 'success') => {
    setToast({ open: true, title, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 3500);
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  // Month navigation helpers
  const prevMonth = useCallback(() => {
    setSelectedMonth((prevM) => {
      if (prevM === 1) {
        setSelectedYear((prevY) => prevY - 1);
        return 12;
      }
      return prevM - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setSelectedMonth((prevM) => {
      if (prevM === 12) {
        setSelectedYear((prevY) => prevY + 1);
        return 1;
      }
      return prevM + 1;
    });
  }, []);

  const jumpToCurrentMonth = useCallback(() => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  }, []);

  const handleYearChange = (delta) => {
    setSelectedYear((prev) => prev + delta);
  };

  // Fetch Attendance for selected year (all late records)
  const fetchAttendance = useCallback(async (year) => {
    try {
      const res = await api.getAttendance(year || selectedYear);
      if (res?.data) {
        setAttendanceRecords(res.data.filter((r) => r.isLate !== false));
      }
    } catch (err) {
      console.warn('[LeaveProvider] Failed to fetch attendance:', err.message);
    }
  }, [selectedYear]);

  // Fetch Today's Attendance check
  const fetchTodayAttendance = useCallback(async () => {
    try {
      const res = await api.getTodayAttendance();
      if (res?.data && res.data.isLate) {
        setTodayAttendance(res.data);
      } else {
        setTodayAttendance(null);
      }
    } catch (err) {
      console.warn('[LeaveProvider] Failed to fetch today attendance:', err.message);
    }
  }, []);

  // Fetch Balance History
  const fetchBalanceHistory = useCallback(async (year) => {
    try {
      const res = await api.getBalanceHistory(year || selectedYear);
      if (res?.data) {
        setBalanceHistory(res.data);
      }
      return res?.data || [];
    } catch (err) {
      console.warn('[LeaveProvider] Failed to fetch balance history:', err.message);
      return [];
    }
  }, [selectedYear]);

  // Punch in / Add late entry (1 entry per day rule)
  const punchIn = async ({ time, method = 'manual', notes = '', date } = {}) => {
    setIsSyncing(true);
    try {
      const res = await api.punchIn({
        time,
        method,
        notes,
        date,
      });

      if (res?.success) {
        await fetchAttendance(selectedYear);
        await fetchTodayAttendance();

        if (res.onTime) {
          showToast('On Time! 🎯', res.message, 'success');
          return { success: true, onTime: true };
        }

        const item = res.data;
        const currentMonthLateCount = attendanceRecords.filter((a) => {
          const [y, m] = (a.date || '').split('-');
          return parseInt(y, 10) === selectedYear && parseInt(m, 10) === selectedMonth;
        }).length + 1;

        const isThird = currentMonthLateCount % 3 === 0;

        showToast(
          isThird ? '3rd Late — 0.5 Day Deducted' : 'Late Entry Added',
          `Arrival logged at ${item.punchTime} on ${item.date}. ${
            isThird
              ? 'Penalty applied! 0.5 Day deducted from balance.'
              : `Late count this month: ${currentMonthLateCount}.`
          }`,
          isThird ? 'error' : 'success'
        );
        return { success: true, data: item };
      }
      return { success: false, error: 'Could not record late entry' };
    } catch (error) {
      showToast('Error', error.message || 'Unable to add late entry', 'error');
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  };

  // Edit attendance record
  const updateAttendanceRecord = async (id, { date, time, notes }) => {
    setIsSyncing(true);
    try {
      const res = await api.updateAttendance(id, { date, time, notes });
      if (res?.success) {
        await fetchAttendance(selectedYear);
        await fetchTodayAttendance();

        if (res.removed) {
          showToast(
            'Time On-Time (≤ 10:00 AM)',
            'Arrival is before 10:00 AM. Removed from late log & balance restored!',
            'success'
          );
        } else {
          showToast('Updated', 'Late entry updated & balance recalculated.', 'success');
        }
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      showToast('Update Failed', err.message || 'Could not update entry', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete attendance entry
  const deleteAttendanceRecord = async (id) => {
    setIsSyncing(true);
    try {
      await api.deleteAttendance(id);
      await fetchAttendance(selectedYear);
      await fetchTodayAttendance();
      showToast('Deleted', 'Late entry removed & balance recalculated.');
      return true;
    } catch (err) {
      showToast('Delete Failed', err.message, 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset / Calibrate balance via Long Press
  const resetBalance = async (year, newBalance, reason, month) => {
    setIsSyncing(true);
    try {
      const targetYear = year || selectedYear;
      const targetMonth = month || selectedMonth;

      const res = await api.adjustBalance({
        year: targetYear,
        month: targetMonth,
        newBalance,
        reason: reason || `Manual calibration for ${MONTH_NAMES[targetMonth - 1]} ${targetYear}`,
        changedBy: user?.name || 'User',
      });

      const updatedVal = res.data.newBalance;

      // Update both yearly and monthly calibrated keys
      setBalances((prev) => ({
        ...prev,
        [targetYear]: updatedVal,
        [`${targetYear}_${targetMonth}`]: updatedVal,
      }));

      // Immediately refresh audit trail
      await fetchBalanceHistory(targetYear);

      showToast(
        'Balance Calibrated',
        `Adjusted balance for ${MONTH_NAMES[targetMonth - 1]} to ${updatedVal.toFixed(1)} days. Recorded in Audit Trail.`
      );
      return true;
    } catch (error) {
      showToast('Reset Failed', error.message || 'Could not reset balance', 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // DAILY WORK & TASKS ENGINE
  // Fetch tasks for given date range (fromDate -> toDate) or specific query
  const fetchTasks = useCallback(async (filterObj) => {
    try {
      const q = filterObj || { fromDate: taskFromDate, toDate: taskToDate };
      const res = await api.getTasks(q);
      if (res?.data) {
        setTasks(res.data);
      }
      return res?.data || [];
    } catch (err) {
      console.warn('[LeaveProvider] Failed to fetch tasks:', err.message);
      return [];
    }
  }, [taskFromDate, taskToDate]);

  // Add new daily task (auto-sequential srNo handled by server)
  const addTask = async ({ date, branch = '', description, status = 'in_progress' } = {}) => {
    setIsSyncing(true);
    try {
      const targetDate = date || taskDate;
      const res = await api.createTask({
        date: targetDate,
        branch,
        description,
        status,
        userId: user?.id || user?._id,
      });

      if (res?.success) {
        const newTask = res.data;
        await fetchTasks({ fromDate: taskFromDate, toDate: taskToDate });
        showToast(
          'Task Added 🎯',
          `Task recorded (${newTask.status === 'completed' ? 'Completed' : 'In Progress'}).`,
          'success'
        );
        return { success: true, data: newTask };
      }
      return { success: false, error: 'Could not create task' };
    } catch (err) {
      showToast('Task Error', err.message || 'Could not add task', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsSyncing(false);
    }
  };

  // Quick 1-click status toggle between 'in_progress' and 'completed'
  const toggleTask = async (id) => {
    try {
      const res = await api.toggleTaskStatus(id);
      if (res?.success) {
        setTasks((prev) =>
          prev.map((t) => ((t.id || t._id) === id ? res.data : t))
        );
        const st = res.data.status === 'completed' ? 'Completed' : 'In Progress';
        showToast('Status Updated', `Task #${res.data.srNo} is now ${st}.`, 'success');
        return true;
      }
      return false;
    } catch (err) {
      showToast('Toggle Failed', err.message, 'error');
      return false;
    }
  };

  // Update task details
  const updateTaskItem = async (id, updateData) => {
    setIsSyncing(true);
    try {
      const res = await api.updateTask(id, updateData);
      if (res?.success) {
        setTasks((prev) =>
          prev.map((t) => ((t.id || t._id) === id ? res.data : t))
        );
        showToast('Task Updated', 'Changes saved successfully.');
        return true;
      }
      return false;
    } catch (err) {
      showToast('Update Failed', err.message, 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete task & automatically re-index srNo
  const deleteTaskItem = async (id) => {
    setIsSyncing(true);
    try {
      const res = await api.deleteTask(id);
      if (res?.success) {
        await fetchTasks({ fromDate: taskFromDate, toDate: taskToDate });
        showToast('Task Deleted', 'Removed from daily work log.');
        return true;
      }
      return false;
    } catch (err) {
      showToast('Delete Failed', err.message, 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch initial data
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const balanceRes = await api.getBalances().catch(() => null);
      if (balanceRes?.yearlyMap) {
        setBalances((prev) => ({
          ...prev,
          ...balanceRes.yearlyMap,
          ...(balanceRes.monthlyMap || {}),
        }));
      }

      const leavesRes = await api.getLeaves(selectedYear).catch(() => null);
      if (leavesRes?.data) {
        setLeaveRequests(leavesRes.data);
      }

      await fetchBalanceHistory(selectedYear);

      const holidayRes = await api.getHolidays(selectedYear).catch(() => null);
      if (holidayRes?.data) {
        setHolidays(holidayRes.data);
      }

      await fetchAttendance(selectedYear);
      await fetchTodayAttendance();
      await fetchTasks({ fromDate: taskFromDate, toDate: taskToDate });

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
      console.warn('[LeaveProvider] Failed to load initial data:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, isAuthenticated, fetchAttendance, fetchTodayAttendance, fetchBalanceHistory, fetchTasks, taskFromDate, taskToDate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated, loadInitialData]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAttendance(selectedYear);
    }
  }, [selectedYear, isAuthenticated, fetchAttendance]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks({ fromDate: taskFromDate, toDate: taskToDate });
    }
  }, [taskFromDate, taskToDate, isAuthenticated, fetchTasks]);

  // MONTHLY CARRY-FORWARD & JOINING-MONTH ENGINE
  // Accurately credits 2.0 only from userJoinMonth onwards!
  const monthlyBreakdown = useMemo(() => {
    let rollingBalance = 0.0;

    return MONTH_NAMES.map((name, index) => {
      const monthNum = index + 1;
      const isCurrent =
        today.getFullYear() === selectedYear && today.getMonth() + 1 === monthNum;

      // Check pre-joining: Before user's joining month, quota is 0!
      const isPreJoining =
        selectedYear < userJoinYear ||
        (selectedYear === userJoinYear && monthNum < userJoinMonth);

      const isJoiningMonth =
        selectedYear === userJoinYear && monthNum === userJoinMonth;

      // Leaves in this month
      const monthLeaves = leaveRequests.filter((l) => {
        if (!l.date) return false;
        const [y, m] = l.date.split('-');
        return parseInt(y, 10) === selectedYear && parseInt(m, 10) === monthNum;
      });
      const leavesTaken = monthLeaves.reduce((sum, l) => sum + (Number(l.days) || 0), 0);

      // Late records in this month
      const monthLates = attendanceRecords.filter((a) => {
        if (a.month && a.year) {
          return a.year === selectedYear && a.month === monthNum && a.isLate !== false;
        }
        if (a.date) {
          const [y, m] = a.date.split('-');
          return parseInt(y, 10) === selectedYear && parseInt(m, 10) === monthNum && a.isLate !== false;
        }
        return false;
      });

      const lateCount = monthLates.length;
      const lateDeductions = Math.floor(lateCount / 3) * 0.5;

      const opening = isPreJoining ? 0.0 : parseFloat(rollingBalance.toFixed(1));
      const credit = isPreJoining ? 0.0 : 2.0;
      const totalUsed = isPreJoining ? 0.0 : parseFloat((leavesTaken + lateDeductions).toFixed(1));

      // Check for manual calibration on this month
      const calibratedMonth = balances[`${selectedYear}_${monthNum}`];

      let closing;
      if (isPreJoining) {
        closing = 0.0;
      } else if (calibratedMonth !== undefined) {
        // User explicitly set this month's balance via long-press
        closing = parseFloat(Number(calibratedMonth).toFixed(1));
      } else {
        closing = parseFloat((opening + credit - totalUsed).toFixed(1));
      }

      if (!isPreJoining) {
        rollingBalance = closing;
      }

      let tag = undefined;
      if (isPreJoining) {
        tag = 'Pre-joining';
      } else if (isJoiningMonth) {
        tag = 'Joined';
      }

      return {
        month: `${name} ${selectedYear}`,
        monthName: name,
        monthNum,
        year: selectedYear,
        current: isCurrent,
        opening,
        credit,
        leavesTaken,
        leaves: monthLeaves,
        lateCount,
        lateRecords: monthLates,
        lateDeductions,
        totalUsed,
        days: closing,
        status: closing < 0 ? 'deficit' : 'normal',
        tag,
        isPreJoining,
      };
    });
  }, [selectedYear, leaveRequests, attendanceRecords, userJoinYear, userJoinMonth, balances, today]);

  // Current selected month breakdown info
  const selectedMonthInfo = useMemo(() => {
    return (
      monthlyBreakdown.find((m) => m.monthNum === selectedMonth) || {
        opening: 0.0,
        credit: 2.0,
        leavesTaken: 0.0,
        leaves: [],
        lateCount: 0,
        lateRecords: [],
        lateDeductions: 0.0,
        totalUsed: 0.0,
        days: 2.0,
        status: 'normal',
        isPreJoining: false,
      }
    );
  }, [monthlyBreakdown, selectedMonth]);

  // Selected Month Net Balance with Carry Forward & Calibration
  const monthOpeningBalance = selectedMonthInfo.opening;
  const MONTHLY_BASE_QUOTA = selectedMonthInfo.credit;
  const monthLeaves = selectedMonthInfo.leaves;
  const monthLeavesTaken = selectedMonthInfo.leavesTaken;
  const monthLateCount = selectedMonthInfo.lateCount;
  const monthLateRecords = selectedMonthInfo.lateRecords;
  const monthLateDeductions = selectedMonthInfo.lateDeductions;
  const monthTotalDeductions = selectedMonthInfo.totalUsed;
  const monthBalance = selectedMonthInfo.days;

  const isMonthDeficit = monthBalance < 0;
  const monthDeficitDays = isMonthDeficit ? Math.abs(monthBalance) : 0;

  const lateStrikesInCycle = monthLateCount % 3;
  const lateStrikesRemaining = lateStrikesInCycle === 0 ? 3 : 3 - lateStrikesInCycle;

  // Yearly stats for backward compatibility & accurate prorated total
  const yearlyStats = useMemo(() => {
    let totalCredits = 24.0;
    if (selectedYear < userJoinYear) {
      totalCredits = 0.0;
    } else if (selectedYear === userJoinYear) {
      totalCredits = Math.max(0, (12 - userJoinMonth + 1) * 2.0);
    }

    const leavesUsed = leaveRequests
      .filter((r) => {
        if (r.year) return r.year === selectedYear;
        if (!r.date) return false;
        return new Date(r.date + 'T00:00:00').getFullYear() === selectedYear;
      })
      .reduce((acc, r) => acc + (Number(r.days) || 0), 0);

    const balance = selectedMonthInfo?.days ?? 0.0;

    return {
      totalCredits,
      leavesUsed,
      balance,
    };
  }, [leaveRequests, selectedYear, userJoinYear, userJoinMonth, selectedMonthInfo]);

  // Add leave
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
        year: selectedYear,
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
      }

      showToast(
        'Leave Approved',
        `Allocated ${requestedDays.toFixed(1)} day(s) for ${newLeave.displayDate}.`
      );
      return true;
    } catch (error) {
      showToast('Error', error.message || 'Could not save leave', 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete leave
  const deleteLeave = async (id) => {
    setIsSyncing(true);
    try {
      const res = await api.deleteLeave(id);
      const restored = res.restoredDays || 1.0;

      setLeaveRequests((prev) => prev.filter((r) => (r.id || r._id) !== id));

      if (res.updatedBalance) {
        setBalances((prev) => ({
          ...prev,
          [res.updatedBalance.year]: res.updatedBalance.availableDays,
        }));
      }

      showToast('Deleted', `Restored +${restored} day(s).`);
      return true;
    } catch (error) {
      showToast('Delete Failed', error.message, 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Update leave
  const updateLeave = async (id, updateData) => {
    setIsSyncing(true);
    try {
      const res = await api.updateLeave(id, updateData);
      const updatedItem = res.data;

      setLeaveRequests((prev) =>
        prev.map((r) => ((r.id || r._id) === id ? { ...r, ...updatedItem } : r))
      );

      showToast('Updated', 'Leave updated.');
      return true;
    } catch (error) {
      showToast('Update Failed', error.message, 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.data) {
        const userData = res.data;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('auth_logged_in', 'true');
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setActiveTab('overview');
        showToast('Welcome', 'Signed in successfully.');
        return { success: true };
      }
      return { success: false, error: 'Sign in failed' };
    } catch (error) {
      showToast('Sign In Error', error.message || 'Invalid email or password', 'error');
      return { success: false, error: error.message };
    }
  };

  const registerUser = async (name, email, password) => {
    try {
      const res = await api.register(name, email, password);
      if (res.data) {
        const userData = res.data;
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('auth_logged_in', 'true');
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setActiveTab('overview');
        showToast('Account Created', 'Welcome to Leave Manager!');
        return { success: true };
      }
      return { success: false, error: 'Could not create account' };
    } catch (error) {
      showToast('Registration Error', error.message || 'Could not create account', 'error');
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth_logged_in');
    localStorage.removeItem('auth_user');
    showToast('Signed Out', 'You have been signed out.');
  };

  const updateUserProfile = async (profileData) => {
    setIsSyncing(true);
    try {
      const res = await api.updateProfile({ email: user?.email, ...profileData });
      if (res.data) {
        const updated = { ...user, ...res.data };
        setUser(updated);
        localStorage.setItem('auth_user', JSON.stringify(updated));
        showToast('Profile Updated', 'Profile details updated successfully.');
        return { success: true, data: updated };
      }
      return { success: false, error: 'Failed to update' };
    } catch (error) {
      showToast('Profile Error', error.message || 'Could not update profile', 'error');
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
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

  const selectedMonthName = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  const isCurrentMonth = today.getFullYear() === selectedYear && today.getMonth() + 1 === selectedMonth;

  const value = {
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedMonthName,
    isCurrentMonth,
    prevMonth,
    nextMonth,
    jumpToCurrentMonth,
    currentYear: selectedYear,
    handleYearChange,

    // Carry-forward Month Quota & Balance
    MONTHLY_BASE_QUOTA,
    monthOpeningBalance,
    monthLeaves,
    monthLeavesTaken,
    monthLateCount,
    monthLateRecords,
    monthLateDeductions,
    monthTotalDeductions,
    monthBalance,
    isMonthDeficit,
    monthDeficitDays,
    availableBalance: monthBalance,

    // History & Yearly stats
    monthlyBreakdown,
    yearlyStats,
    defaultAnnualQuota: 24.0,
    userJoinYear,
    userJoinMonth,
    balanceHistory,
    fetchBalanceHistory,
    resetBalance,

    // Attendance
    attendanceRecords: monthLateRecords,
    allAttendanceRecords: attendanceRecords,
    todayAttendance,
    lateStrikesInCycle,
    lateStrikesRemaining,
    punchIn,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    fetchAttendance,

    // Daily Work & Tasks
    tasks,
    taskDate,
    setTaskDate,
    taskFromDate,
    setTaskFromDate,
    taskToDate,
    setTaskToDate,
    fetchTasks,
    addTask,
    toggleTask,
    updateTaskItem,
    deleteTaskItem,

    // Leaves & Holidays
    leaveRequests,
    holidays,
    balances,
    addLeave,
    deleteLeave,
    updateLeave,

    // Auth & Navigation
    activeTab,
    setActiveTab,
    isAuthenticated,
    user,
    login,
    registerUser,
    logout,
    updateUserProfile,
    updatePassword,

    // Feedback
    toast,
    showToast,
    closeToast,
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
