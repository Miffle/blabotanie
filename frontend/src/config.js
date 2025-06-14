// Базовый URL для API и WebSocket
 export const API_BASE_URL = 'http://193.233.113.180:8087';
//export const API_BASE_URL = 'http://localhost:8087';
// API URL
export const API_URL = `${API_BASE_URL}/api`;

// WebSocket URL
export const WS_URL = `${API_BASE_URL}/ws`;

// Пути для API
export const API_PATHS = {
    AUTH: '/auth',
    REFRESH: '/auth/refresh',
    CALLS: '/call',
    FRIENDS: '/friends',
    // Добавьте другие пути API по мере необходимости
}; 