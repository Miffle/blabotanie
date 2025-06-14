import { refreshTokenIfNeeded } from './auth';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (!options.headers) {
    options.headers = {};
  }
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, options);
    
    if (response.status === 401 || response.status === 403 && !isRefreshing) {
      isRefreshing = true;
      
      try {
        const refreshed = await refreshTokenIfNeeded();
        if (refreshed) {
          const newToken = localStorage.getItem('token');
          options.headers['Authorization'] = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return fetch(url, options);
        } else {
          processQueue(new Error('Не удалось обновить токен'));
          localStorage.clear();
          window.location.href = '/auth';
          return Promise.reject(new Error('Не удалось обновить токен'));
        }
      } catch (error) {
        processQueue(error);
        localStorage.clear();
        window.location.href = '/auth';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    
    return response;
  } catch (error) {
    return Promise.reject(error);
  }
}; 