import { Attendance } from '../models/Attendance.js';

// Helper to format Date to 'YYYY-MM-DD'
const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format Date to 12h 'hh:mm A'
const formatTime12h = (d = new Date()) => {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Helper to format Date to 24h 'HH:mm'
const formatTime24h = (d = new Date()) => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Check if a 24h time string 'HH:mm' is after 10:00 AM
const evaluateLate = (rawTime) => {
  const [hStr, mStr] = rawTime.split(':');
  const hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);

  const totalMinutes = hour * 60 + minute;
  const cutoffMinutes = 10 * 60; // 10:00 AM = 600 mins

  if (totalMinutes > cutoffMinutes) {
    return {
      isLate: true,
      minutesLate: totalMinutes - cutoffMinutes,
    };
  }
  return {
    isLate: false,
    minutesLate: 0,
  };
};

// Helper to parse time string into { rawTime, punchTime }
const parseTimeString = (time) => {
  if (!time) {
    const now = new Date();
    return {
      rawTime: formatTime24h(now),
      punchTime: formatTime12h(now),
    };
  }

  if (time.includes('AM') || time.includes('PM')) {
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    let h = parseInt(hours, 10);
    if (modifier === 'PM' && h < 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;
    const rawTime = `${String(h).padStart(2, '0')}:${minutes}`;
    return { rawTime, punchTime: time };
  } else {
    const rawTime = time;
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const dummyDate = new Date();
    dummyDate.setHours(h, m, 0, 0);
    return { rawTime, punchTime: formatTime12h(dummyDate) };
  }
};

/**
 * POST /api/attendance/punch
 * Add or update late attendance entry (Strictly 1 entry per day)
 */
export const punchIn = async (req, res) => {
  try {
    const { userId, date, time, method = 'manual', notes = '' } = req.body;

    const targetDateStr = date || getLocalDateString();
    const [yStr, mStr] = targetDateStr.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);

    const { rawTime, punchTime } = parseTimeString(time);
    const { isLate, minutesLate } = evaluateLate(rawTime);

    const query = { date: targetDateStr };
    if (userId) query.userId = userId;

    let existing = await Attendance.findOne(query);

    // If time is <= 10:00 AM, user is NOT late!
    if (!isLate) {
      if (existing) {
        // If an entry previously existed for this date, remove it since user is on time
        await Attendance.findByIdAndDelete(existing._id);
      }

      // Compute stats
      const monthQuery = { year, month, isLate: true };
      if (userId) monthQuery.userId = userId;
      const lateRecords = await Attendance.find(monthQuery);
      const lateCount = lateRecords.length;
      const lateDeductionDays = Math.floor(lateCount / 3) * 0.5;

      return res.status(200).json({
        success: true,
        onTime: true,
        message: `Arrival at ${punchTime} is on time (≤ 10:00 AM). No late mark logged.`,
        stats: {
          lateCount,
          lateDeductionDays,
          currentStrikes: lateCount % 3,
          nextDeductionIn: 3 - (lateCount % 3),
        },
      });
    }

    // Time is LATE (> 10:00 AM)
    // Strictly 1 entry per day: Update existing or create new
    if (existing) {
      existing.punchTime = punchTime;
      existing.rawTime = rawTime;
      existing.isLate = true;
      existing.minutesLate = minutesLate;
      existing.method = method;
      existing.notes = notes || existing.notes;
      existing.timestamp = new Date();
      await existing.save();
    } else {
      existing = await Attendance.create({
        userId,
        date: targetDateStr,
        punchTime,
        rawTime,
        timestamp: new Date(),
        isLate: true,
        minutesLate,
        method,
        notes,
        year,
        month,
      });
    }

    // Recalculate stats for this month
    const monthQuery = { year, month, isLate: true };
    if (userId) monthQuery.userId = userId;

    const lateRecords = await Attendance.find(monthQuery);
    const lateCount = lateRecords.length;
    const lateDeductionDays = Math.floor(lateCount / 3) * 0.5;
    const currentStrikes = lateCount % 3;

    res.status(200).json({
      success: true,
      data: existing,
      stats: {
        totalPresent: lateRecords.length,
        lateCount,
        lateDeductionDays,
        currentStrikes,
        nextDeductionIn: 3 - currentStrikes,
      },
      message: `Late entry recorded for ${targetDateStr} at ${punchTime}.`,
    });
  } catch (error) {
    console.error('[punchIn Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/attendance/:id
 * Edit date or time of an attendance entry
 * If updated time is <= 10:00 AM, it is no longer late and is removed!
 */
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, notes } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    let targetDate = attendance.date;
    if (date && date !== attendance.date) {
      // Check if target date already has an entry (1 entry per day rule)
      const duplicate = await Attendance.findOne({
        date,
        _id: { $ne: id },
        ...(attendance.userId ? { userId: attendance.userId } : {}),
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: `An attendance entry already exists for ${date}. Only 1 entry per day allowed.`,
        });
      }

      targetDate = date;
      attendance.date = date;
      const [yStr, mStr] = date.split('-');
      attendance.year = parseInt(yStr, 10);
      attendance.month = parseInt(mStr, 10);
    }

    let timeToEvaluate = attendance.rawTime;
    if (time) {
      const { rawTime, punchTime } = parseTimeString(time);
      timeToEvaluate = rawTime;
      attendance.rawTime = rawTime;
      attendance.punchTime = punchTime;
    }

    const { isLate, minutesLate } = evaluateLate(timeToEvaluate);

    const year = attendance.year;
    const month = attendance.month;
    const userId = attendance.userId;

    // If updated time is on time (<= 10:00 AM), it's NOT late! Remove from late log
    if (!isLate) {
      await Attendance.findByIdAndDelete(id);

      const monthQuery = { year, month, isLate: true };
      if (userId) monthQuery.userId = userId;

      const lateRecords = await Attendance.find(monthQuery);
      const lateCount = lateRecords.length;
      const lateDeductionDays = Math.floor(lateCount / 3) * 0.5;

      return res.status(200).json({
        success: true,
        removed: true,
        message: 'Time updated to on-time (≤ 10:00 AM). Removed from late log & balance recalculated.',
        stats: {
          lateCount,
          lateDeductionDays,
          currentStrikes: lateCount % 3,
          nextDeductionIn: 3 - (lateCount % 3),
        },
      });
    }

    // Still late
    attendance.isLate = true;
    attendance.minutesLate = minutesLate;
    if (notes !== undefined) {
      attendance.notes = notes;
    }
    await attendance.save();

    // Recalculate monthly stats
    const monthQuery = { year, month, isLate: true };
    if (userId) monthQuery.userId = userId;

    const lateRecords = await Attendance.find(monthQuery);
    const lateCount = lateRecords.length;
    const lateDeductionDays = Math.floor(lateCount / 3) * 0.5;
    const currentStrikes = lateCount % 3;

    res.status(200).json({
      success: true,
      data: attendance,
      stats: {
        totalPresent: lateRecords.length,
        lateCount,
        lateDeductionDays,
        currentStrikes,
        nextDeductionIn: currentStrikes === 0 ? 3 : 3 - currentStrikes,
      },
      message: 'Late entry updated and balance recalculated',
    });
  } catch (error) {
    console.error('[updateAttendance Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/attendance
 * Fetch late attendance records for a specific year and month
 */
export const getAttendance = async (req, res) => {
  try {
    const { year, month, userId } = req.query;

    const query = { isLate: true }; // Strictly late entries!
    if (year) query.year = parseInt(year, 10);
    if (month) query.month = parseInt(month, 10);
    if (userId) query.userId = userId;

    const records = await Attendance.find(query).sort({ date: 1, timestamp: 1 });

    const lateCount = records.length;
    const lateDeductionDays = Math.floor(lateCount / 3) * 0.5;
    const currentStrikes = lateCount % 3;

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
      stats: {
        totalPresent: records.length,
        lateCount,
        lateDeductionDays,
        currentStrikes,
        nextDeductionIn: currentStrikes === 0 ? 3 : 3 - currentStrikes,
      },
    });
  } catch (error) {
    console.error('[getAttendance Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/attendance/today
 */
export const getTodayAttendance = async (req, res) => {
  try {
    const { userId } = req.query;
    const todayStr = getLocalDateString();

    const query = { date: todayStr, isLate: true };
    if (userId) query.userId = userId;

    const record = await Attendance.findOne(query);

    res.status(200).json({
      success: true,
      checkedIn: !!record,
      data: record || null,
    });
  } catch (error) {
    console.error('[getTodayAttendance Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/attendance/:id
 * Remove an attendance entry & trigger recalculation
 */
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Attendance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const monthQuery = { year: deleted.year, month: deleted.month, isLate: true };
    if (deleted.userId) monthQuery.userId = deleted.userId;

    const lateRecords = await Attendance.find(monthQuery);
    const lateCount = lateRecords.length;
    const lateDeductionDays = Math.floor(lateCount / 3) * 0.5;
    const currentStrikes = lateCount % 3;

    res.status(200).json({
      success: true,
      stats: {
        totalPresent: lateRecords.length,
        lateCount,
        lateDeductionDays,
        currentStrikes,
        nextDeductionIn: currentStrikes === 0 ? 3 : 3 - currentStrikes,
      },
      message: 'Late record deleted and balance recalculated',
    });
  } catch (error) {
    console.error('[deleteAttendance Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
