import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const reason = err.response?.data?.error || 'Session expired';
      console.warn('[API] 401 —', reason);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use sessionStorage flag so Login page can show the message
      // without polluting the URL with query params
      sessionStorage.setItem('auth_redirect_reason', reason);
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
