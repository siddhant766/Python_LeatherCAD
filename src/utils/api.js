import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,  // Send httpOnly cookies automatically
});

// Request interceptor: attach JWT from memory or tab-scoped session (not localStorage)
let accessToken = null;

export const setAccessToken = (token) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken || sessionStorage.getItem('_at');

export const clearAccessToken = () => {
    accessToken = null;
};

api.interceptors.request.use(async (config) => {
    let token = accessToken || sessionStorage.getItem('_at');
    if (!token && window.Clerk?.session) {
        try {
            token = await window.Clerk.session.getToken();
        } catch {}
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const clerkEmail = window.Clerk?.user?.primaryEmailAddress?.emailAddress;
    if (clerkEmail) {
        config.headers['X-User-Email'] = clerkEmail;
    }
    return config;
});

// Response interceptor: handle 401 by clearing auth state
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAccessToken();
            sessionStorage.removeItem('_at');
        }
        return Promise.reject(error);
    }
);

export default api;
