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

// Leaves API
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

  // Balances
  getBalances: () => request('/balance'),

  getBalanceByYear: (year) => request(`/balance/${year}`),

  adjustBalance: ({ year, newBalance, reason, changedBy }) =>
    request('/balance/adjust', {
      method: 'POST',
      body: JSON.stringify({ year, newBalance, reason, changedBy }),
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
