import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
axiosInstance.interceptors.request.use(
    (config) => {
        const url = config.url || '';
        const isAuthEndpoint =
            url.includes('/auth/api/login/') ||
            url.includes('/auth/api/register/') ||
            url.includes('/api/token/refresh/');

        if (!isAuthEndpoint) {
            const token = localStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;