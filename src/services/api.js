import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  getGoogleAuthUrl: () => api.get('/auth/google'),
  getMe: () => api.get('/auth/me'),
  registerWatch: () => api.post('/auth/watch'),
};

// Mail API
export const mailApi = {
  getInbox: (params = {}) => api.get('/mail/inbox', { params }),
  getSent: (params = {}) => api.get('/mail/sent', { params }),
  getEmail: (id) => api.get(`/mail/${id}`),
  getThread: (id) => api.get(`/mail/thread/${id}`),
  getCount: (label = 'INBOX') => api.get('/mail/count', { params: { label } }),
  sendEmail: (data) => api.post('/mail/send', data),
  searchEmails: (query) => api.get('/mail/search', { params: { q: query } }),
  markAsRead: (id) => api.post(`/mail/${id}/read`),
  markAsUnread: (id) => api.post(`/mail/${id}/unread`),
  delete: (id) => api.delete(`/mail/${id}`),
};

// Assistant API
export const assistantApi = {
  chat: (message, context, conversationHistory = []) =>
    api.post('/assistant/chat', {
      message,
      context,
      conversation_history: conversationHistory,
    }),

  // Streaming chat - returns a fetch Response for SSE consumption
  chatStream: async (message, context, conversationHistory = []) => {
    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    return fetch(`${API_URL}/assistant/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        context,
        conversation_history: conversationHistory,
      }),
    });
  },

  getTools: () => api.get('/assistant/tools'),
};

export default api;

