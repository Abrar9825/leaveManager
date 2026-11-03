import { Balance } from '../models/Balance.js';
import { BalanceHistory } from '../models/BalanceHistory.js';
import { User } from '../models/User.js';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to calculate prorated annual quota based on user's join month & year
export const getProratedQuotaForYear = async (targetYear) => {
  try {
    const user = await User.findOne();
    const joinYear = user?.joinYear || new Date().getFullYear();
    const joinMonth = user?.joinMonth || (new Date().getMonth() + 1);

    if (targetYear < joinYear) return 0.0;
    if (targetYear === joinYear) {
      const remainingMonths = Math.max(1, 12 - joinMonth + 1);
      return parseFloat((remainingMonths * 2.0).toFixed(1));
    }
    return 24.0;
  } catch {
    return 24.0;
  }
};

// GET /api/balance - Get all balances and map of yearly values
export const getBalances = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    let currentBalance = await Balance.findOne({ year: currentYear });
    if (!currentBalance) {
      const quota = await getProratedQuotaForYear(currentYear);
      currentBalance = await Balance.create({
        year: currentYear,
        totalQuota: quota,
        availableDays: quota,
        usedDays: 0,
        monthlyAdjustments: {},
      });
    }

    const balances = await Balance.find().sort({ year: 1 });
    
    const yearlyMap = {};
    const monthlyMap = {};

    balances.forEach((b) => {
      yearlyMap[b.year] = b.availableDays;
      if (b.monthlyAdjustments) {
        const adj = b.monthlyAdjustments instanceof Map
          ? Object.fromEntries(b.monthlyAdjustments)
          : (typeof b.monthlyAdjustments.toJSON === 'function' ? b.monthlyAdjustments.toJSON() : b.monthlyAdjustments);
        
        if (adj && typeof adj === 'object') {
          Object.entries(adj).forEach(([m, val]) => {
            monthlyMap[`${b.year}_${m}`] = val;
          });
        }
      }
    });

    res.json({
      success: true,
      data: balances,
      yearlyMap,
      monthlyMap,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/balance/:year - Get single year balance
export const getBalanceByYear = async (req, res) => {
  try {
    const year = Number(req.params.year);
    let balance = await Balance.findOne({ year });
    if (!balance) {
      const quota = await getProratedQuotaForYear(year);
      balance = await Balance.create({
        year,
        totalQuota: quota,
        availableDays: quota,
        usedDays: 0,
        monthlyAdjustments: {},
      });
    }
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/balance/adjust - Reset / Adjust available leave days
export const adjustBalance = async (req, res) => {
  try {
    const {
      year = 2026,
      month,
      newBalance,
      reason,
      changedBy = 'User',
      changeType = 'manual_reset',
    } = req.body;

    if (newBalance === undefined || isNaN(newBalance)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid numeric newBalance',
      });
    }

    const targetYear = Number(year);
    const targetMonth = month ? Number(month) : (new Date().getMonth() + 1);
    const parsedNewBalance = parseFloat(Number(newBalance).toFixed(1));

    let balance = await Balance.findOne({ year: targetYear });
    if (!balance) {
      const quota = await getProratedQuotaForYear(targetYear);
      balance = new Balance({
        year: targetYear,
        totalQuota: quota,
        availableDays: parsedNewBalance,
        usedDays: 0,
        monthlyAdjustments: {},
      });
    }

    if (!balance.monthlyAdjustments) {
      balance.monthlyAdjustments = new Map();
    }

    const monthKey = String(targetMonth);
    const existingMonthVal = balance.monthlyAdjustments instanceof Map
      ? balance.monthlyAdjustments.get(monthKey)
      : (balance.monthlyAdjustments?.[monthKey]);

    const oldBalance = existingMonthVal !== undefined
      ? existingMonthVal
      : balance.availableDays;

    const change = parseFloat((parsedNewBalance - oldBalance).toFixed(1));

    // Save adjustment in month map
    if (balance.monthlyAdjustments instanceof Map) {
      balance.monthlyAdjustments.set(monthKey, parsedNewBalance);
    } else {
      balance.monthlyAdjustments[monthKey] = parsedNewBalance;
    }

    // Also update general availableDays
    balance.availableDays = parsedNewBalance;
    await balance.save();

    const monthName = `${MONTH_NAMES[targetMonth - 1]} ${targetYear}`;

    // Create tracking history entry with month info
    const historyReason = reason
      ? reason.trim()
      : `Manual balance calibration for ${monthName}`;

    const historyEntry = await BalanceHistory.create({
      year: targetYear,
      month: targetMonth,
      monthName,
      oldBalance,
      newBalance: parsedNewBalance,
      change,
      changeType,
      reason: historyReason,
      changedBy: changedBy || 'User',
    });

    res.json({
      success: true,
      message: `Balance for ${monthName} successfully updated to ${parsedNewBalance}`,
      data: {
        year: targetYear,
        month: targetMonth,
        monthName,
        oldBalance,
        newBalance: parsedNewBalance,
        change,
        balance,
        historyEntry,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/balance/history - Fetch tracking history audit log
export const getBalanceHistory = async (req, res) => {
  try {
    const { year, month } = req.query;
    const filter = {};
    if (year) {
      filter.year = Number(year);
    }
    if (month) {
      filter.month = Number(month);
    }
    const history = await BalanceHistory.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
