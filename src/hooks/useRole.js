import { useUser } from '@clerk/clerk-react';
import useAuthStore from '../store/AuthStore';

export const ADMIN_EMAILS = [
    'kc3737381@gmail.com',
    'siddhantpatel09090@gmail.com',
    'siddhantpatel6395@gmail.com',
    'kailash@example.com'
];

export function useRole() {
    const { user: clerkUser, isLoaded, isSignedIn } = useUser();
    const authUser = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const isLoggedIn = Boolean(isSignedIn || isAuthenticated);

    const email = (authUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '').trim().toLowerCase();

    // Determine role from server auth store or Clerk session metadata / admin whitelist
    let role = authUser?.role || null;
    if (!role && isLoggedIn) {
        if (
            ADMIN_EMAILS.includes(email) ||
            clerkUser?.id === 'user_37BzDMk1J9Kvqq9tc1GbrbneMuN' ||
            clerkUser?.publicMetadata?.role === 'admin' ||
            clerkUser?.unsafeMetadata?.role === 'admin'
        ) {
            role = 'admin';
        } else if (
            clerkUser?.publicMetadata?.role === 'designer' ||
            clerkUser?.unsafeMetadata?.role === 'designer'
        ) {
            role = 'designer';
        } else {
            role = 'customer';
        }
    }

    const isCustomer = role === 'customer' || role === 'user';
    const isDesigner = role === 'designer';
    const isAdmin = role === 'admin' || ADMIN_EMAILS.includes(email);
    const canCustomize = isLoggedIn && (isDesigner || isAdmin);

    const name = authUser?.name || clerkUser?.fullName || (email ? email.split('@')[0] : 'User');

    return {
        isLoaded,
        isLoggedIn,
        role: isAdmin ? 'admin' : (isDesigner ? 'designer' : (isCustomer ? 'customer' : role)),
        isCustomer,
        isDesigner,
        isAdmin,
        canCustomize,
        email,
        name,
    };
}
