import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available (in addition to cookies)
api.interceptors.request.use(
  (config) => {
    try {
      const authStorageStr = localStorage.getItem('auth-storage');
      if (authStorageStr) {
        const authStorage = JSON.parse(authStorageStr);
        const token = authStorage?.state?.token;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Failed to parse auth token', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { useAuthStore } = await import('@/store/useAuthStore');
        useAuthStore.getState().logout();
      } catch (err) {
        console.error('Failed to logout on 401', err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
