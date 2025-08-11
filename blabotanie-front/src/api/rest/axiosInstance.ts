import axios from 'axios';
import {API_URL} from "../../constants/serverUrl"
import {AuthService} from "../../services/AuthService";

const axiosInstance = axios.create({
    baseURL: API_URL,
});


axiosInstance.interceptors.request.use((config) => {
    if (config.url?.endsWith('/auth/refresh')) {
        return config;
    }
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Перехват 401 и попытка обновления токена
axiosInstance.interceptors.response.use(
    res => res,
    async err => {
        console.warn('[AXIOS INTERCEPTOR]', err); // 🧩 Лог ошибки
        const originalRequest = err.config;

        const isTokenExpired = err.response?.status === 401 &&
            (err.response?.data?.error === 'Токен истёк' || err.response?.data?.error === 'Невалидный токен');
        console.log('Ошибка:', err.response?.data?.error);
        console.log('isTokenExpired:', isTokenExpired);
        if (!isTokenExpired || originalRequest._retry) {
            return Promise.reject(err);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({resolve, reject});
            })
                .then((token: string) => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axiosInstance(originalRequest);
                });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw err;

            const res = await AuthService.refreshToken({refreshToken});

            // Обновим токены
            localStorage.setItem('token', res.token);
            localStorage.setItem('refreshToken', res.refreshToken);
            localStorage.setItem('uuid', res.uuid);
            localStorage.setItem('username', res.username);

            processQueue(null, res.token);
            originalRequest.headers['Authorization'] = 'Bearer ' + res.token;
            return axiosInstance(originalRequest);
        } catch (error) {
            processQueue(error, null);
            localStorage.clear(); // не удалось обновить токен
            window.location.href = '/login';
            throw error;
        } finally {
            isRefreshing = false;
        }
    }
);
export default axiosInstance;
