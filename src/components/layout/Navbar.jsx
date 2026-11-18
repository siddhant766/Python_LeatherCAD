import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Shield, Sparkles, LogOut } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, useClerk } from '@clerk/clerk-react';
import { useCartStore } from '../../store/CartStore';
import { useRole } from '../../hooks/useRole';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useClerk();
    const items = useCartStore((state) => state.items);
    const toggleCart = useCartStore((state) => state.toggleCart);
    const cartCount = items.length;

    const { isLoggedIn, role, isCustomer, isDesigner, isAdmin, canCustomize, name } = useRole();

    const handleFeaturesClick = (e) => {
        e.preventDefault();
        const scrollToSection = () => {
            const el = document.getElementById('features');
            if (el) {
                const navHeight = 70;
                const top = el.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        };

        if (location.pathname === '/') {
            scrollToSection();
        } else {
            navigate('/#features');
            setTimeout(scrollToSection, 150);
        }
    };

    const handleSignOut = async () => {
        if (window.confirm("Are you sure you want to sign out?")) {
            localStorage.removeItem('devToken');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user');
            localStorage.removeItem('user_role');
            localStorage.removeItem('token');
            try {
                await signOut();
            } catch (err) {
                console.log("Clerk signOut non-fatal:", err);
            }
            window.location.href = '/login';
        }
    };

    return (
        <nav className="border-b border-white/5 bg-black/70 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <img src="/assets/logo.png" alt="LeatherCAD Logo" className="w-8 h-8 object-contain" />
                    LeatherCAD
                </Link>

                {/* Central Links */}
                <div className="flex items-center gap-6">
                    <a
                        href="/#features"
                        onClick={handleFeaturesClick}
                        className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                    >
                        Features
                    </a>
                    <Link to="/catalog" className="text-gray-400 hover:text-white transition-colors">Catalog</Link>
                    <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    {/* 3D Customize button - STRICTLY visible ONLY if logged in as a Designer / Seller (or Admin) */}
                    {canCustomize && (
                        <Link
                            to="/customizer"
                            className="bg-gradient-to-r from-[#D4AF37]/20 to-amber-500/20 text-[#D4AF37] hover:text-white hover:from-[#D4AF37] hover:to-amber-500 border border-[#D4AF37]/40 px-3.5 py-1.5 rounded-full font-semibold text-sm transition-all flex items-center gap-1.5 shadow-sm shadow-[#D4AF37]/10"
                        >
                            <Sparkles size={15} />
                            <span>3D Customize</span>
                        </Link>
                    )}

                    <div className="h-6 w-px bg-white/10"></div>

                    {/* Shopping Cart */}
                    <button onClick={toggleCart} className="relative text-gray-400 hover:text-white transition-colors">
                        <ShoppingBag className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {/* Authentication state */}
                    {!isLoggedIn ? (
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="text-sm font-medium hover:text-white transition-colors">
                                Sign In
                            </Link>
                            <Link to="/signup" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                                Get Started
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {/* Role Badge */}
                            {isDesigner && (
                                <Link
                                    to="/designer"
                                    className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                                    title="Designer Studio"
                                >
                                    Designer / Seller
                                </Link>
                            )}
                            {isCustomer && (
                                <Link
                                    to="/dashboard"
                                    className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                                    title="Customer Portal"
                                >
                                    Customer
                                </Link>
                            )}
                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                                    title="Admin Workspace"
                                >
                                    Admin
                                </Link>
                            )}

                            {/* Destination link based on role */}
                            {isAdmin ? (
                                <Link to="/admin" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                    Admin
                                </Link>
                            ) : isDesigner ? (
                                <Link to="/designer" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                    Studio
                                </Link>
                            ) : (
                                <Link to="/orders" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                    My Orders
                                </Link>
                            )}

                            <UserButton afterSignOutUrl="/" />

                            {/* Fallback Signout button for dev/manual sessions */}
                            <button
                                onClick={handleSignOut}
                                className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
