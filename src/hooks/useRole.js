import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

export const ADMIN_EMAILS = [
    'kc3737381@gmail.com',
    'siddhantpatel09090@gmail.com',
    'kailash@example.com'
];

/**
 * Custom hook to manage and detect the 3 types of roles:
 * 1. 'customer'       - Can create account, browse catalog & purchase items
 * 2. 'designer'       - Designer / Seller: Can customize in 3D, set prices & sell
 * 3. 'admin'          - Admin: Manage platform, stats, review queue & orders
 */
export function useRole() {
    const { user, isLoaded, isSignedIn } = useUser();
    const [storedRole, setStoredRoleState] = useState(() => localStorage.getItem('user_role'));

    useEffect(() => {
        const handleStorageChange = () => {
            setStoredRoleState(localStorage.getItem('user_role'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Check localStorage fallbacks
    const localUser = (() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    })();

    const devToken = localStorage.getItem('devToken');
    const localEmail = localStorage.getItem('user_email') || localUser?.email;
    const email = (user?.primaryEmailAddress?.emailAddress || localEmail || '').trim().toLowerCase();

    // Authenticated if Clerk is signed in, or devToken / local session is present
    const isLoggedIn = Boolean(isSignedIn || devToken || localUser?.email || email);

    let role = null;

    if (isLoggedIn) {
        if (
            ADMIN_EMAILS.includes(email) ||
            localUser?.role === 'admin' ||
            storedRole === 'admin'
        ) {
            role = 'admin';
        } else if (
            storedRole === 'designer' ||
            localUser?.role === 'designer' ||
            user?.unsafeMetadata?.role === 'designer' ||
            user?.publicMetadata?.role === 'designer'
        ) {
            role = 'designer';
        } else {
            role = 'customer';
        }
    }

    const isCustomer = role === 'customer';
    const isDesigner = role === 'designer';
    const isAdmin = role === 'admin';

    // 3D Customizer feature is strictly reserved for Designer/Seller (and Admin)
    const canCustomize = isLoggedIn && (isDesigner || isAdmin);

    const setRole = (newRole) => {
        if (!newRole) {
            localStorage.removeItem('user_role');
        } else {
            localStorage.setItem('user_role', newRole);
            const curr = localUser || {};
            localStorage.setItem('user', JSON.stringify({ ...curr, role: newRole }));
        }
        setStoredRoleState(newRole);
    };

    return {
        isLoaded,
        isLoggedIn,
        role,
        isCustomer,
        isDesigner,
        isAdmin,
        canCustomize,
        email,
        name: user?.fullName || localUser?.name || (email ? email.split('@')[0] : 'User'),
        setRole
    };
}
