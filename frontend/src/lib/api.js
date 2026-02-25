const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Auth
  signup: (data) => request('/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/login', { method: 'POST', body: JSON.stringify(data) }),
  googleAuth: (accessToken) => request('/google', { method: 'POST', body: JSON.stringify({ access_token: accessToken }) }),
  getMe: () => request('/me'),

  // Sessions
  listSessions: () => request('/sessions'),
  getSession: (id) => request(`/sessions/${id}`),
  startSession: (data) => request('/sessions/start', { method: 'POST', body: JSON.stringify(data) }),
  completeOnboarding: () => request('/sessions/complete-onboarding', { method: 'POST' }),

  // Dashboard
  getDashboard: () => request('/dashboard'),
};
