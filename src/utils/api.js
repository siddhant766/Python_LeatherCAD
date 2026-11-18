import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: API_BASE,
});

api.interceptors.request.use(async (config) => {
    let token = localStorage.getItem('devToken') || localStorage.getItem('token');
    let email = localStorage.getItem('user_email');

    // 1. Try to get token & email from Clerk session if loaded on window
    try {
        if (window.Clerk?.session) {
            const clerkToken = await window.Clerk.session.getToken();
            if (clerkToken) {
                token = clerkToken;
            }
        }
        if (window.Clerk?.user?.primaryEmailAddress?.emailAddress) {
            email = window.Clerk.user.primaryEmailAddress.emailAddress.toLowerCase();
        }
    } catch (e) {
        // Clerk session token retrieval fallback
    }

    // 2. Fallback to localStorage user object
    if (!email) {
        try {
            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (localUser.email) email = localUser.email.toLowerCase();
        } catch (e) {}
    }

    // 3. Fallback token for admin
    const ADMIN_EMAILS = ['kc3737381@gmail.com', 'siddhantpatel09090@gmail.com'];
    if (!token && email) {
        token = `DEV_TOKEN_${email}`;
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (email) {
        config.headers['X-User-Email'] = email;
        if (!config.params) config.params = {};
        if (ADMIN_EMAILS.includes(email) && !config.params.admin_email) {
            config.params.admin_email = email;
        }
    }

    return config;
});

export default api;
