import { User } from '../models/User.js';
import { Leave } from '../models/Leave.js';
import { Balance } from '../models/Balance.js';

export const seedDatabase = async () => {
  try {
    const currentYear = new Date().getFullYear();

    // Ensure current year balance document exists
    const balance = await Balance.findOne({ year: currentYear });
    if (!balance) {
      const user = await User.findOne();
      await Balance.create({
        userId: user?._id,
        year: currentYear,
        totalQuota: 24.0,
        availableDays: 24.0,
        usedDays: 0,
        monthlyBreakdown: [],
      });
      console.log(`[Seed] Initialized clean balance quota for ${currentYear}`);
    }
  } catch (error) {
    console.error(`[Seed] Error during seeding: ${error.message}`);
  }
};
