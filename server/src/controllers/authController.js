import { User } from '../models/User.js';
import { Balance } from '../models/Balance.js';

// Helper to get prorated quota based on join month and year
export const calculateProratedQuota = (joinYear, joinMonth, targetYear) => {
  if (targetYear < joinYear) return 0.0;
  if (targetYear === joinYear) {
    const remainingMonths = Math.max(1, 12 - joinMonth + 1);
    return parseFloat((remainingMonths * 2.0).toFixed(1));
  }
  return 24.0;
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists. Please sign in instead.',
      });
    }

    const now = new Date();
    const joinMonth = now.getMonth() + 1; // 1 to 12
    const joinYear = now.getFullYear();

    const user = await User.create({
      name: name?.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      password,
      joinMonth,
      joinYear,
      rulesAcknowledged: false,
    });

    const initialQuota = calculateProratedQuota(joinYear, joinMonth, joinYear);

    let balance = await Balance.findOne({ year: joinYear });
    if (!balance) {
      balance = await Balance.create({
        year: joinYear,
        totalQuota: initialQuota,
        availableDays: initialQuota,
        usedDays: 0,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        joinMonth: user.joinMonth,
        joinYear: user.joinYear,
        rulesAcknowledged: false,
      },
    });
  } catch (error) {
    console.error('[Auth Register Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email. Please check your email or click Create Account.',
      });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    let balance = await Balance.findOne({ year: currentYear });
    if (!balance) {
      const quota = calculateProratedQuota(user.joinYear || currentYear, user.joinMonth || 10, currentYear);
      balance = await Balance.create({
        year: currentYear,
        totalQuota: quota,
        availableDays: quota,
        usedDays: 0,
      });
    }

    res.json({
      success: true,
      message: 'Signed in successfully',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        joinMonth: user.joinMonth || 10,
        joinYear: user.joinYear || 2026,
        rulesAcknowledged: !!user.rulesAcknowledged,
      },
    });
  } catch (error) {
    console.error('[Auth Login Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/auth/acknowledge-rules
export const acknowledgeRules = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      user.rulesAcknowledged = true;
      await user.save();
    }
    res.json({ success: true, message: 'Leave rules acknowledged successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/auth/profile
export const getProfile = async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase().trim();
    let user;
    if (email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        joinMonth: user.joinMonth || 10,
        joinYear: user.joinYear || 2026,
        rulesAcknowledged: !!user.rulesAcknowledged,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/auth/profile - Update user name and joining date
export const updateProfile = async (req, res) => {
  try {
    const { email, name, joinMonth, joinYear } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required to identify account' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (name !== undefined && name.trim()) {
      user.name = name.trim();
    }
    if (joinMonth !== undefined && Number(joinMonth) >= 1 && Number(joinMonth) <= 12) {
      user.joinMonth = Number(joinMonth);
    }
    if (joinYear !== undefined && Number(joinYear) > 2000) {
      user.joinYear = Number(joinYear);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        joinMonth: user.joinMonth || 10,
        joinYear: user.joinYear || 2026,
        rulesAcknowledged: !!user.rulesAcknowledged,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/auth/password
export const updatePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both old and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    let user;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.password !== oldPassword) {
      return res.status(400).json({ success: false, error: 'Current password does not match' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
