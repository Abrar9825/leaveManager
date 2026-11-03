import { DailyTask } from '../models/DailyTask.js';

// Helper to format date string YYYY-MM-DD
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// GET /api/tasks - Get tasks by date or date range (fromDate -> toDate)
export const getTasks = async (req, res) => {
  try {
    const { date, fromDate, toDate, startDate, endDate, month, year } = req.query;
    const filter = {};

    const from = fromDate || startDate;
    const to = toDate || endDate;

    if (from && to) {
      filter.date = { $gte: from, $lte: to };
    } else if (from) {
      filter.date = { $gte: from };
    } else if (to) {
      filter.date = { $lte: to };
    } else if (date) {
      filter.date = date;
    } else if (year && month) {
      filter.year = Number(year);
      filter.month = Number(month);
    } else if (year) {
      filter.year = Number(year);
    }

    const tasks = await DailyTask.find(filter).sort({ date: -1, srNo: 1, createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      from,
      to,
      date: filter.date || undefined,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/tasks - Add new task with automatic sequential srNo
export const createTask = async (req, res) => {
  try {
    const { date, branch = '', description, status = 'in_progress', userId } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task description is required',
      });
    }

    const targetDate = date ? date.trim() : getTodayStr();
    const [yStr, mStr] = targetDate.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);

    // Auto-calculate next srNo for this date
    const lastTask = await DailyTask.findOne({ date: targetDate }).sort({ srNo: -1 });
    const nextSrNo = (lastTask?.srNo || 0) + 1;

    const newTask = await DailyTask.create({
      userId,
      date: targetDate,
      srNo: nextSrNo,
      branch: branch ? branch.trim() : '',
      description: description.trim(),
      status: status === 'completed' ? 'completed' : 'in_progress',
      year,
      month,
    });

    res.status(201).json({
      success: true,
      message: `Task #${nextSrNo} recorded for ${targetDate}`,
      data: newTask,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/tasks/:id - Update task details
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, branch, status, date } = req.body;

    const task = await DailyTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (description !== undefined && description.trim()) {
      task.description = description.trim();
    }

    if (branch !== undefined) {
      task.branch = branch.trim();
    }

    if (status !== undefined) {
      task.status = status === 'completed' ? 'completed' : 'in_progress';
    }

    if (date !== undefined && date !== task.date) {
      task.date = date;
      const [yStr, mStr] = date.split('-');
      task.year = parseInt(yStr, 10);
      task.month = parseInt(mStr, 10);

      // Recalculate srNo on new date
      const lastOnNewDate = await DailyTask.findOne({ date }).sort({ srNo: -1 });
      task.srNo = (lastOnNewDate?.srNo || 0) + 1;
    }

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/tasks/:id/toggle - Quick toggle between 'in_progress' and 'completed'
export const toggleTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await DailyTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    task.status = task.status === 'completed' ? 'in_progress' : 'completed';
    await task.save();

    res.json({
      success: true,
      message: `Task marked as ${task.status === 'completed' ? 'Completed' : 'In Progress'}`,
      data: task,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/tasks/:id - Delete task and neatly re-index srNo for that day
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await DailyTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const taskDate = task.date;
    await task.deleteOne();

    // Re-index remaining tasks for that date to keep srNo sequential (1, 2, 3...)
    const remaining = await DailyTask.find({ date: taskDate }).sort({ srNo: 1 });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].srNo !== i + 1) {
        remaining[i].srNo = i + 1;
        await remaining[i].save();
      }
    }

    res.json({
      success: true,
      message: 'Task removed and serial numbers re-indexed',
      date: taskDate,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
