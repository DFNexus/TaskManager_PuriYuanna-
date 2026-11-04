import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined' && window.location.hostname) {
      if (config.baseURL && config.baseURL.includes('localhost') && window.location.hostname !== 'localhost') {
        config.baseURL = config.baseURL.replace('localhost', window.location.hostname);
      }
    }
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token', { path: '/' });
      // Let the application or middleware handle redirect
    }
    return Promise.reject(error);
  }
);

export function getStorageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  // If in browser, adapt to current host if user accesses via non-localhost IP/domain or 127.0.0.1
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
    apiUrl = apiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
  }

  const backendBase = apiUrl.replace(/\/api\/?$/, '');
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!cleanPath.startsWith('/storage/')) {
    cleanPath = `/storage${cleanPath}`;
  }
  return `${backendBase}${cleanPath}`;
}

export default api;

