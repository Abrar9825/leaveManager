import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Leave } from '../models/Leave.js';
import { Balance } from '../models/Balance.js';
import { BalanceHistory } from '../models/BalanceHistory.js';

const clean = async () => {
  await connectDB();
  console.log('[Clean] Connected to MongoDB');

  const leaves = await Leave.deleteMany({});
  console.log('[Clean] Deleted leaves:', leaves.deletedCount);

  const histories = await BalanceHistory.deleteMany({});
  console.log('[Clean] Deleted balance histories:', histories.deletedCount);

  const balances = await Balance.deleteMany({});
  console.log('[Clean] Deleted balances:', balances.deletedCount);

  const now = new Date();
  const joinMonth = now.getMonth() + 1; // 10 for October
  const joinYear = now.getFullYear();   // 2026
  const joinedDate = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Update existing users with joining details
  const users = await User.updateMany({}, {
    $set: {
      joinMonth,
      joinYear,
      joinedDate,
    }
  });
  console.log('[Clean] Updated users with joinMonth/joinYear:', users.modifiedCount);

  // Initialize fresh clean balance for 2026 calculated from joinMonth
  const remainingMonths = 12 - joinMonth + 1;
  const initialQuota = parseFloat((remainingMonths * 2.0).toFixed(1));

  await Balance.create({
    year: joinYear,
    totalQuota: initialQuota,
    availableDays: initialQuota,
    usedDays: 0,
    monthlyBreakdown: [],
  });
  console.log(`[Clean] Initialized clean balance for ${joinYear} with prorated quota: ${initialQuota} days`);

  process.exit(0);
};

clean().catch((err) => {
  console.error('[Clean Error]', err);
  process.exit(1);
});

