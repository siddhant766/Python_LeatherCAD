import { create } from 'zustand';
import api from '../utils/api';
import { getAccessToken } from '../utils/api';

const API_URL = '/cart';

export const useCartStore = create((set, get) => ({
    items: [],
    isOpen: false,

    toggleCart: () => set({ isOpen: !get().isOpen }),

    // Fetch cart from server (call this on login)
    fetchCart: async () => {
        if (!getAccessToken()) return;

        try {
            const res = await api.get(API_URL);
            // Map server items to frontend format if needed
            const serverItems = res.data.map(item => ({
                id: item.productId || item._id, // Handle different ID formats
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                config: item.config,
                _id: item._id // Store real mongo ID for removal
            }));
            set({ items: serverItems });
        } catch (error) {
            console.error("Failed to fetch cart", error);
        }
    },

    addItem: async (product) => {
        // Optimistic UI Update
        const hasToken = !!getAccessToken();
        set((state) => {
            const existing = state.items.find(item => item.id === product.id);
            if (existing) {
                return {
                    items: state.items.map(item =>
                        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                    )
                };
            }
            return { items: [...state.items, { ...product, quantity: 1 }] };
        });

        if (hasToken) {
            try {
                await api.post(`${API_URL}/add`, { item: product });
                get().fetchCart(); // Re-sync to get proper IDs
            } catch (error) {
                console.error("Failed to add to server cart", error);
            }
        }
    },

    removeItem: async (id) => {
        const hasToken = !!getAccessToken();
        set((state) => ({
            items: state.items.filter(item => item.id !== id && item._id !== id)
        }));

        if (hasToken) {
            try {
                await api.post(`${API_URL}/remove`, { itemId: id });
            } catch (error) {
                console.error("Failed to remove from server cart", error);
            }
        }
    },

    updateQuantity: (id, amount) => set((state) => ({
        items: state.items.map(item =>
            item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item
        )
    })),

    clearCart: async () => {
        const hasToken = !!getAccessToken();
        set({ items: [] });
        if (hasToken) {
            try {
                await api.post(`${API_URL}/clear`, {});
            } catch (error) {
                console.error("Failed to clear server cart", error);
            }
        }
    },

    getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
}));
