import { Balance } from '../models/Balance.js';
import { BalanceHistory } from '../models/BalanceHistory.js';
import { User } from '../models/User.js';

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
      });
    }

    const balances = await Balance.find().sort({ year: 1 });
    
    // Build quick lookup dictionary { 2024: 0.0, 2025: 0.0, 2026: 6.0, ... }
    const yearlyMap = {};
    balances.forEach((b) => {
      yearlyMap[b.year] = b.availableDays;
    });

    res.json({
      success: true,
      data: balances,
      yearlyMap,
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
      });
    }
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/balance/adjust - Reset / Adjust available leave days (Triggered by Long Press)
export const adjustBalance = async (req, res) => {
  try {
    const { year = 2026, newBalance, reason, changedBy = 'User', changeType = 'manual_reset' } = req.body;

    if (newBalance === undefined || isNaN(newBalance)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid numeric newBalance',
      });
    }

    const targetYear = Number(year);
    const parsedNewBalance = parseFloat(Number(newBalance).toFixed(1));

    let balance = await Balance.findOne({ year: targetYear });
    if (!balance) {
      const quota = await getProratedQuotaForYear(targetYear);
      balance = new Balance({
        year: targetYear,
        totalQuota: quota,
        availableDays: parsedNewBalance,
        usedDays: 0,
      });
    }

    const oldBalance = balance.availableDays;
    const change = parseFloat((parsedNewBalance - oldBalance).toFixed(1));

    balance.availableDays = parsedNewBalance;
    if (balance.monthlyBreakdown && balance.monthlyBreakdown.length > 0) {
      balance.monthlyBreakdown[0].days = parsedNewBalance;
    }
    await balance.save();

    // Create tracking history entry
    const historyEntry = await BalanceHistory.create({
      year: targetYear,
      oldBalance,
      newBalance: parsedNewBalance,
      change,
      changeType,
      reason: reason ? reason.trim() : 'Manual balance reset via dashboard long-press',
      changedBy: changedBy || 'User',
    });

    res.json({
      success: true,
      message: `Available days for ${targetYear} successfully updated to ${parsedNewBalance}`,
      data: {
        year: targetYear,
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
    const { year } = req.query;
    const filter = {};
    if (year) {
      filter.year = Number(year);
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

