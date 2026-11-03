const BASE_URL = '/api';

/**
 * Generic fetch wrapper with JSON handling and clean error formatting
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const message = data.error || data.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
    throw error;
  }
}

// Leaves, Attendance & Daily Work API
export const api = {
  // Leaves
  getLeaves: (year) => {
    const query = year ? `?year=${year}` : '';
    return request(`/leaves${query}`);
  },

  getLeaveById: (id) => request(`/leaves/${id}`),

  createLeave: (leaveData) =>
    request('/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    }),

  updateLeave: (id, leaveData) =>
    request(`/leaves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leaveData),
    }),

  deleteLeave: (id) =>
    request(`/leaves/${id}`, {
      method: 'DELETE',
    }),

  // Attendance & Late Check-in
  punchIn: ({ userId, date, time, method = 'long_press', notes = '' } = {}) =>
    request('/attendance/punch', {
      method: 'POST',
      body: JSON.stringify({ userId, date, time, method, notes }),
    }),

  updateAttendance: (id, { date, time, notes }) =>
    request(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ date, time, notes }),
    }),

  getAttendance: (year, month, userId) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    if (userId) params.append('userId', userId);
    const queryString = params.toString();
    return request(`/attendance${queryString ? `?${queryString}` : ''}`);
  },

  getTodayAttendance: (userId) => {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return request(`/attendance/today${query}`);
  },

  deleteAttendance: (id) =>
    request(`/attendance/${id}`, {
      method: 'DELETE',
    }),

  // Daily Work & Tasks
  getTasks: (filterObj) => {
    const params = new URLSearchParams();
    if (typeof filterObj === 'string') {
      params.append('date', filterObj);
    } else if (filterObj && typeof filterObj === 'object') {
      if (filterObj.date) params.append('date', filterObj.date);
      if (filterObj.fromDate) params.append('fromDate', filterObj.fromDate);
      if (filterObj.toDate) params.append('toDate', filterObj.toDate);
      if (filterObj.startDate) params.append('startDate', filterObj.startDate);
      if (filterObj.endDate) params.append('endDate', filterObj.endDate);
      if (filterObj.month) params.append('month', filterObj.month);
      if (filterObj.year) params.append('year', filterObj.year);
    }
    const qs = params.toString();
    return request(`/tasks${qs ? `?${qs}` : ''}`);
  },

  createTask: ({ date, branch, description, status, userId }) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ date, branch, description, status, userId }),
    }),

  updateTask: (id, updateData) =>
    request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  toggleTaskStatus: (id) =>
    request(`/tasks/${id}/toggle`, {
      method: 'PATCH',
    }),

  deleteTask: (id) =>
    request(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Balances
  getBalances: () => request('/balance'),

  getBalanceByYear: (year) => request(`/balance/${year}`),

  adjustBalance: ({ year, month, newBalance, reason, changedBy }) =>
    request('/balance/adjust', {
      method: 'POST',
      body: JSON.stringify({ year, month, newBalance, reason, changedBy }),
    }),

  getBalanceHistory: (year) => {
    const query = year ? `?year=${year}` : '';
    return request(`/balance/history${query}`);
  },

  // Official Public & Government Holidays
  getHolidays: (year) => {
    const query = year ? `?year=${year}` : '';
    return request(`/holidays${query}`);
  },

  // Auth / Profile
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  acknowledgeRules: (email) =>
    request('/auth/acknowledge-rules', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getProfile: (email) =>
    request(`/auth/profile${email ? `?email=${encodeURIComponent(email)}` : ''}`),

  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  updatePassword: (email, oldPassword, newPassword) =>
    request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ email, oldPassword, newPassword }),
    }),
};

export default api;
