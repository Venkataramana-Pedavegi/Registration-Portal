import axios from 'axios';

// Get environment variable or fallback for development
const envApiUrl = import.meta.env.VITE_API_URL;

let normalizedApiUrl = '';
if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim()) {
  let cleanUrl = envApiUrl.trim().replace(/\/+$/, '');
  // Guarantee that URL ends with /api without duplicating it
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl += '/api';
  }
  normalizedApiUrl = cleanUrl;
} else if (import.meta.env.PROD) {
  // In production, NEVER fall back to localhost
  console.warn('[API] Warning: VITE_API_URL is not set in production. Please configure VITE_API_URL in Vercel project settings.');
  normalizedApiUrl = '';
} else {
  // Local development fallback only
  normalizedApiUrl = 'http://localhost:5000/api';
}

export const API_URL = normalizedApiUrl;

// Base server origin without '/api' (for uploads, static assets, socket connection)
export const BACKEND_URL = normalizedApiUrl
  ? normalizedApiUrl.replace(/\/api\/?$/, '')
  : (import.meta.env.PROD ? '' : 'http://localhost:5000');

/**
 * Normalizes relative or absolute media URLs to point to the correct backend host.
 */
export const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_URL}${cleanPath}`;
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle silent token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/student/login') &&
      !originalRequest.url?.includes('/admin/login')
    ) {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        processQueue(null, data.token);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

