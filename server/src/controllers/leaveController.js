import { Leave } from '../models/Leave.js';
import { Balance } from '../models/Balance.js';
import { BalanceHistory } from '../models/BalanceHistory.js';
import { User } from '../models/User.js';
import { getProratedQuotaForYear } from './balanceController.js';

// Helper to check if dates touch Friday or Monday
const checkWeekendTouch = (startDateStr, endDateStr) => {
  const s = new Date(startDateStr);
  const e = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
  let touchesFriday = false;
  let touchesMonday = false;

  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day === 5) touchesFriday = true;
    if (day === 1) touchesMonday = true;
    cur.setDate(cur.getDate() + 1);
  }

  return {
    touchesWeekend: touchesFriday || touchesMonday,
    touchesFriday,
    touchesMonday,
  };
};

// GET /api/leaves - Fetch all leaves (optional ?year=2026)
export const getLeaves = async (req, res) => {
  try {
    const { year } = req.query;
    const filter = {};
    if (year) {
      filter.year = Number(year);
    }
    const leaves = await Leave.find(filter).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/leaves/:id - Fetch single leave
export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }
    res.json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/leaves - Create new leave & Recalculate balance
export const createLeave = async (req, res) => {
  try {
    const {
      mode = 'single',
      startDate,
      endDate,
      displayDate,
      reason,
      requestedDays,
      dayType = 'full',
      session,
      year = 2026,
      saturdayRule = {},
    } = req.body;

    if (!startDate || !reason || requestedDays === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please provide startDate, reason, and requestedDays',
      });
    }

    const weekendCheck = checkWeekendTouch(startDate, mode === 'multiple' ? endDate : startDate);

    // Compute dayLabel
    const daysNum = Number(requestedDays);
    const dayLabel =
      daysNum === 1.0
        ? '1 Day'
        : daysNum === 0.5
        ? 'Half Day'
        : `${daysNum.toFixed(1).replace('.0', '')} Days`;

    // Format displayDate if not provided
    let finalDisplayDate = displayDate;
    if (!finalDisplayDate) {
      const formatDateObj = (dStr) => {
        const d = new Date(dStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
      };
      if (mode === 'single') {
        finalDisplayDate = formatDateObj(startDate);
      } else {
        const s = new Date(startDate);
        const e = new Date(endDate);
        if (s.getMonth() === e.getMonth()) {
          finalDisplayDate = `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString('en-GB', { month: 'long' })}`;
        } else {
          finalDisplayDate = `${formatDateObj(startDate)} – ${formatDateObj(endDate)}`;
        }
      }
    }

    // Compose Saturday rule object
    let saturdayNote = saturdayRule.saturdayNote || '';
    if (weekendCheck.touchesWeekend) {
      if (saturdayRule.isSaturdayHoliday) {
        if (saturdayRule.saturdayAttendance === 'working') {
          saturdayNote =
            weekendCheck.touchesFriday && weekendCheck.touchesMonday
              ? 'Working on Saturday to compensate for Friday & Monday leave.'
              : weekendCheck.touchesFriday
              ? 'Working on Saturday to compensate for Friday leave.'
              : 'Worked on preceding Saturday to compensate for Monday leave.';
        } else if (saturdayRule.saturdayAttendance === 'not_working') {
          saturdayNote = 'Saturday holiday observed without compensatory attendance (Weekend extension).';
        }
      } else if (saturdayRule.isSaturdayHoliday === false) {
        saturdayNote = 'Saturday is regular working day.';
      }
    }

    const leave = new Leave({
      mode,
      date: startDate,
      endDate: mode === 'multiple' ? endDate : undefined,
      displayDate: finalDisplayDate,
      reason: reason.trim(),
      days: daysNum,
      dayLabel,
      type: mode === 'single' ? dayType : 'multiple',
      session: dayType === 'half' ? session : undefined,
      status: 'Approved',
      year: Number(year),
      saturdayRule: {
        touchesWeekend: weekendCheck.touchesWeekend,
        touchesFriday: weekendCheck.touchesFriday,
        touchesMonday: weekendCheck.touchesMonday,
        isSaturdayHoliday: saturdayRule.isSaturdayHoliday ?? null,
        saturdayAttendance: saturdayRule.saturdayAttendance || 'not_applicable',
        saturdayNote,
        ruleConfirmed: !!saturdayRule.ruleConfirmed,
      },
    });

    const savedLeave = await leave.save();

    // Recalculate Balance for the year
    let balance = await Balance.findOne({ year: Number(year) });
    if (!balance) {
      const quota = await getProratedQuotaForYear(Number(year));
      balance = await Balance.create({
        year: Number(year),
        totalQuota: quota,
        availableDays: quota,
        usedDays: 0,
      });
    }

    const oldBal = balance.availableDays;
    const newBal = Math.max(0, parseFloat((oldBal - daysNum).toFixed(1)));
    balance.availableDays = newBal;
    balance.usedDays = parseFloat(((balance.usedDays || 0) + daysNum).toFixed(1));

    // Update monthly breakdown if present
    if (balance.monthlyBreakdown && balance.monthlyBreakdown.length > 0) {
      balance.monthlyBreakdown[0].days = Math.max(0, balance.monthlyBreakdown[0].days - daysNum);
      balance.monthlyBreakdown[0].used = parseFloat((balance.monthlyBreakdown[0].used + daysNum).toFixed(1));
    }
    await balance.save();

    // Record in BalanceHistory
    await BalanceHistory.create({
      year: Number(year),
      oldBalance: oldBal,
      newBalance: newBal,
      change: -daysNum,
      changeType: 'leave_deduction',
      reason: `Leave applied: ${finalDisplayDate} (${reason.trim()})`,
      changedBy: 'User (Leave Request)',
    });

    res.status(201).json({
      success: true,
      message: 'Leave submitted and balance recalculated successfully',
      data: savedLeave,
      updatedBalance: {
        availableDays: balance.availableDays,
        year: balance.year,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/leaves/:id - Edit / Update Leave & Recalculate balance
export const updateLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }

    const {
      reason,
      days,
      dayType,
      session,
      displayDate,
      startDate,
      endDate,
      saturdayRule,
    } = req.body;

    const oldDays = Number(leave.days || 1.0);
    const newDays = days !== undefined ? Number(days) : oldDays;
    const dayDiff = parseFloat((newDays - oldDays).toFixed(1));

    // Update fields
    if (reason) leave.reason = reason.trim();
    if (days !== undefined) {
      leave.days = newDays;
      leave.dayLabel =
        newDays === 1.0
          ? '1 Day'
          : newDays === 0.5
          ? 'Half Day'
          : `${newDays.toFixed(1).replace('.0', '')} Days`;
    }
    if (dayType) leave.type = dayType;
    if (session !== undefined) leave.session = session;
    if (displayDate) leave.displayDate = displayDate;
    if (startDate) leave.date = startDate;
    if (endDate !== undefined) leave.endDate = endDate;

    // Check weekend touch if date changed
    if (startDate) {
      const weekendCheck = checkWeekendTouch(startDate, leave.mode === 'multiple' ? leave.endDate : startDate);
      leave.saturdayRule.touchesWeekend = weekendCheck.touchesWeekend;
      leave.saturdayRule.touchesFriday = weekendCheck.touchesFriday;
      leave.saturdayRule.touchesMonday = weekendCheck.touchesMonday;
    }

    if (saturdayRule) {
      if (saturdayRule.isSaturdayHoliday !== undefined) {
        leave.saturdayRule.isSaturdayHoliday = saturdayRule.isSaturdayHoliday;
      }
      if (saturdayRule.saturdayAttendance !== undefined) {
        leave.saturdayRule.saturdayAttendance = saturdayRule.saturdayAttendance;
      }
      if (saturdayRule.saturdayNote !== undefined) {
        leave.saturdayRule.saturdayNote = saturdayRule.saturdayNote;
      }
      if (saturdayRule.ruleConfirmed !== undefined) {
        leave.saturdayRule.ruleConfirmed = saturdayRule.ruleConfirmed;
      }
    }

    const updatedLeave = await leave.save();

    // Recalculate Balance if days changed
    let balance = await Balance.findOne({ year: leave.year });
    if (balance && dayDiff !== 0) {
      const oldBal = balance.availableDays;
      const newBal = Math.max(0, parseFloat((oldBal - dayDiff).toFixed(1)));
      balance.availableDays = newBal;
      balance.usedDays = parseFloat(((balance.usedDays || 0) + dayDiff).toFixed(1));

      if (balance.monthlyBreakdown && balance.monthlyBreakdown.length > 0) {
        balance.monthlyBreakdown[0].days = Math.max(0, balance.monthlyBreakdown[0].days - dayDiff);
        balance.monthlyBreakdown[0].used = parseFloat((balance.monthlyBreakdown[0].used + dayDiff).toFixed(1));
      }
      await balance.save();

      // Record in BalanceHistory
      await BalanceHistory.create({
        year: leave.year,
        oldBalance: oldBal,
        newBalance: newBal,
        change: -dayDiff,
        changeType: 'leave_edit',
        reason: `Updated leave for ${leave.displayDate}: Days changed from ${oldDays}d to ${newDays}d`,
        changedBy: 'User (Leave Edit)',
      });
    }

    res.json({
      success: true,
      message: 'Leave updated and balance recalculated successfully',
      data: updatedLeave,
      updatedBalance: balance ? { availableDays: balance.availableDays, year: balance.year } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/leaves/:id - Delete leave & Recalculate/Restore balance
export const deleteLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }

    const daysToRestore = Number(leave.days || 1.0);
    const leaveYear = leave.year || 2026;
    const leaveDesc = `${leave.displayDate} (${leave.reason})`;

    // Remove document
    await Leave.findByIdAndDelete(leaveId);

    // Recalculate Balance
    let balance = await Balance.findOne({ year: leaveYear });
    let oldBal = 0;
    let newBal = 0;

    if (balance) {
      oldBal = balance.availableDays;
      newBal = parseFloat((oldBal + daysToRestore).toFixed(1));
      balance.availableDays = newBal;
      balance.usedDays = Math.max(0, parseFloat(((balance.usedDays || 0) - daysToRestore).toFixed(1)));

      // Restore to monthly breakdown
      if (balance.monthlyBreakdown && balance.monthlyBreakdown.length > 0) {
        balance.monthlyBreakdown[0].days = balance.monthlyBreakdown[0].days + daysToRestore;
        balance.monthlyBreakdown[0].used = Math.max(0, balance.monthlyBreakdown[0].used - daysToRestore);
      }
      await balance.save();

      // Record in BalanceHistory
      await BalanceHistory.create({
        year: leaveYear,
        oldBalance: oldBal,
        newBalance: newBal,
        change: daysToRestore,
        changeType: 'leave_deletion',
        reason: `Deleted leave for ${leaveDesc} - Restored ${daysToRestore} day(s)`,
        changedBy: 'User (Leave Delete)',
      });
    }

    res.json({
      success: true,
      message: `Leave deleted. Restored ${daysToRestore} day(s) back to balance.`,
      restoredDays: daysToRestore,
      updatedBalance: balance ? { availableDays: balance.availableDays, year: balance.year } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

