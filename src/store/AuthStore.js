import { create } from 'zustand';
import api, { setAccessToken, clearAccessToken } from '../utils/api';

const API_URL = '/auth';

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start true for initial rehydration
    error: null,

    // Called on app mount to check if user has valid session
    rehydrate: async () => {
        try {
            // Try to get a stored token from sessionStorage (survives refresh within tab)
            const storedToken = sessionStorage.getItem('_at');
            if (storedToken) {
                setAccessToken(storedToken);
                const response = await api.get(`${API_URL}/profile`);
                set({
                    user: response.data,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch {
            clearAccessToken();
            sessionStorage.removeItem('_at');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    login: async (email, password, role) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`${API_URL}/login`, { email, password });
            const { token, ...userData } = response.data;

            if (role && userData.role !== role && userData.role !== 'admin') {
                throw new Error(`Access denied. This portal is for ${role}s only.`);
            }

            setAccessToken(token);
            sessionStorage.setItem('_at', token); // survives refresh, cleared on tab close

            set({
                user: userData,
                isAuthenticated: true,
                isLoading: false
            });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || err.message || 'Login failed',
                isLoading: false
            });
            return false;
        }
    },

    signup: async (name, email, password, company, role = 'designer') => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`${API_URL}/register`, { name, email, password, company, role });
            const { token, ...userData } = response.data;

            setAccessToken(token);
            sessionStorage.setItem('_at', token);

            set({
                user: userData,
                isAuthenticated: true,
                isLoading: false
            });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || 'Signup failed',
                isLoading: false
            });
            return false;
        }
    },

    googleLogin: async (email, name, googleId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`${API_URL}/google`, { email, name, googleId });
            const { token, ...userData } = response.data;

            setAccessToken(token);
            sessionStorage.setItem('_at', token);

            set({
                user: userData,
                isAuthenticated: true,
                isLoading: false
            });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || 'Google Login failed',
                isLoading: false
            });
            return false;
        }
    },

    forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
            await api.post(`${API_URL}/forgotpassword`, { email });
            set({ isLoading: false });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || 'Request failed',
                isLoading: false
            });
            return false;
        }
    },

    resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
            await api.put(`${API_URL}/resetpassword/${token}`, { password });
            set({ isLoading: false });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || 'Reset failed',
                isLoading: false
            });
            return false;
        }
    },

    logout: () => {
        clearAccessToken();
        sessionStorage.removeItem('_at');
        set({ user: null, isAuthenticated: false });
    },

    updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),

    clearError: () => set({ error: null })
}));

export default useAuthStore;
