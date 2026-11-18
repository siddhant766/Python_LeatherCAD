import { useState, useEffect } from 'react';
import { SignIn } from "@clerk/clerk-react";
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, User, Sparkles, ShoppingBag, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role'); // 'customer' | 'designer' | 'admin'
    const initialRole = (roleParam === 'designer' || roleParam === 'admin') ? roleParam : 'customer';

    // 3 Distinct Login Types: 'customer' | 'designer' | 'admin' | 'dev'
    const [loginType, setLoginType] = useState(initialRole);

    useEffect(() => {
        if (loginType !== 'dev') {
            localStorage.setItem('user_role', loginType);
        }
    }, [loginType]);

    const isCustomer = loginType === 'customer';
    const isDesigner = loginType === 'designer';
    const isAdmin = loginType === 'admin';

    // Dynamic destination based on active role
    const getRedirectUrl = () => {
        if (isAdmin) return "/admin";
        if (isDesigner) return "/customizer";
        return "/catalog";
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden py-12 px-4">
            {/* Background glowing ambient blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/15 rounded-full blur-[120px] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg p-8 bg-black/50 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 relative z-10"
            >
                {/* Header / Logo */}
                <div className="text-center mb-6">
                    <Link to="/" className="inline-block">
                        <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-[#D4AF37] to-amber-200">
                            LeatherCAD
                        </span>
                    </Link>
                    <p className="text-gray-400 mt-2 text-sm">
                        {isCustomer && "Sign in as Customer to browse catalog & purchase items"}
                        {isDesigner && "Sign in as Designer / Seller to customize in 3D & sell creations"}
                        {isAdmin && "Administrative access for live statistics & store control"}
                        {loginType === 'dev' && "Developer Quick Access with pre-configured sessions"}
                    </p>
                </div>

                {/* 3-Role Login Selector Tabs */}
                <div className="bg-white/5 p-1.5 rounded-2xl mb-8 grid grid-cols-3 gap-1 relative border border-white/10">
                    {/* 1. Customer */}
                    <button
                        type="button"
                        onClick={() => setLoginType('customer')}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${isCustomer
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                    >
                        <ShoppingBag size={16} className="mb-1" />
                        <span>Customer</span>
                        <span className="text-[10px] opacity-75 font-normal">Shop & Order</span>
                    </button>

                    {/* 2. Designer / Seller */}
                    <button
                        type="button"
                        onClick={() => setLoginType('designer')}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${isDesigner
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-lg shadow-amber-500/30 font-bold'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                    >
                        <Sparkles size={16} className="mb-1 text-inherit" />
                        <span>Designer / Seller</span>
                        <span className="text-[10px] opacity-80 font-normal">3D Studio & Sell</span>
                    </button>

                    {/* 3. Admin */}
                    <button
                        type="button"
                        onClick={() => setLoginType('admin')}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${isAdmin
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                    >
                        <ShieldCheck size={16} className="mb-1" />
                        <span>Admin</span>
                        <span className="text-[10px] opacity-75 font-normal">Management</span>
                    </button>
                </div>

                {/* Dev Mode Shortcut Badge */}
                <div className="absolute top-5 right-5">
                    <button
                        type="button"
                        onClick={() => setLoginType(loginType === 'dev' ? 'customer' : 'dev')}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-yellow-300 font-semibold border border-yellow-500/30 transition-all"
                    >
                        {loginType === 'dev' ? 'Exit Dev' : 'Dev Mode'}
                    </button>
                </div>

                {/* Login Form Container */}
                <div className="flex justify-center">
                    {loginType === 'dev' ? (
                        <div className="w-full space-y-4">
                            <div className="bg-yellow-500/10 border border-yellow-500/40 p-3 rounded-xl text-yellow-200 text-xs mb-3">
                                <strong>Developer One-Click Login:</strong> Instantly test each of the 3 user roles:
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {/* Customer Demo Login */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const email = 'customer@leathercad.com';
                                        localStorage.setItem('user_email', email);
                                        localStorage.setItem('user_role', 'customer');
                                        localStorage.setItem('devToken', `DEV_TOKEN_${email}`);
                                        localStorage.setItem('user', JSON.stringify({ email, name: 'Ananya Sharma', role: 'customer' }));
                                        window.location.href = '/catalog';
                                    }}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                                >
                                    <ShoppingBag size={14} />
                                    Customer Login
                                </button>

                                {/* Designer Demo Login */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const email = 'designer@leathercad.com';
                                        localStorage.setItem('user_email', email);
                                        localStorage.setItem('user_role', 'designer');
                                        localStorage.setItem('devToken', `DEV_TOKEN_${email}`);
                                        localStorage.setItem('user', JSON.stringify({ email, name: 'Rajesh Artisan', role: 'designer' }));
                                        window.location.href = '/customizer';
                                    }}
                                    className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:brightness-110 text-black text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                                >
                                    <Sparkles size={14} />
                                    Designer / Seller
                                </button>

                                {/* Admin Siddhant Login */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const email = 'siddhantpatel09090@gmail.com';
                                        localStorage.setItem('user_email', email);
                                        localStorage.setItem('user_role', 'admin');
                                        localStorage.setItem('devToken', `DEV_TOKEN_${email}`);
                                        localStorage.setItem('user', JSON.stringify({ email, name: 'Siddhant Patel', role: 'admin' }));
                                        window.location.href = '/admin';
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
                                >
                                    <ShieldCheck size={14} />
                                    Admin (Siddhant)
                                </button>

                                {/* Admin Kailash Login */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const email = 'kc3737381@gmail.com';
                                        localStorage.setItem('user_email', email);
                                        localStorage.setItem('user_role', 'admin');
                                        localStorage.setItem('devToken', `DEV_TOKEN_${email}`);
                                        localStorage.setItem('user', JSON.stringify({ email, name: 'Kailash', role: 'admin' }));
                                        window.location.href = '/admin';
                                    }}
                                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20"
                                >
                                    <ShieldCheck size={14} />
                                    Admin (Kailash)
                                </button>
                            </div>

                            {/* Custom Email Dev Login */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const email = e.target.email.value.trim().toLowerCase();
                                    const chosenRole = e.target.role.value;
                                    const adminEmails = ['kc3737381@gmail.com', 'siddhantpatel09090@gmail.com', 'kailash@example.com'];
                                    
                                    const finalRole = adminEmails.includes(email) ? 'admin' : chosenRole;
                                    localStorage.setItem('user_email', email);
                                    localStorage.setItem('user_role', finalRole);
                                    localStorage.setItem('devToken', `DEV_TOKEN_${email}`);
                                    localStorage.setItem('user', JSON.stringify({
                                        email,
                                        name: email.split('@')[0],
                                        role: finalRole
                                    }));

                                    if (finalRole === 'admin') window.location.href = '/admin';
                                    else if (finalRole === 'designer') window.location.href = '/customizer';
                                    else window.location.href = '/catalog';
                                }}
                                className="space-y-3 pt-2 border-t border-white/10"
                            >
                                <div>
                                    <label className="block text-gray-300 text-xs font-semibold mb-1">Custom Dev Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        defaultValue="designer@leathercad.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-sm outline-none focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-xs font-semibold mb-1">Assigned Role</label>
                                    <select
                                        name="role"
                                        defaultValue="designer"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-white text-sm outline-none focus:border-[#D4AF37]"
                                    >
                                        <option value="customer">Customer (Purchase Items & Browse)</option>
                                        <option value="designer">Designer / Seller (3D Studio & Sell)</option>
                                        <option value="admin">Admin (Full Control)</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition shadow-lg text-sm"
                                >
                                    Sign In with Custom Dev Account
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="w-full">
                            <SignIn
                                key={loginType}
                                fallbackRedirectUrl={getRedirectUrl()}
                                signUpUrl={`/signup?role=${loginType}`}
                                appearance={{
                                    layout: {
                                        socialButtonsPlacement: "bottom",
                                        socialButtonsVariant: "blockButton",
                                    },
                                    variables: {
                                        colorPrimary: isCustomer ? "#2563eb" : isDesigner ? "#D4AF37" : "#dc2626",
                                        colorText: "#ffffff",
                                        colorBackground: "transparent",
                                        colorInputBackground: "#171717",
                                        colorInputText: "#ffffff",
                                        colorTextSecondary: "#9ca3af",
                                        borderRadius: "0.75rem",
                                        colorAlphaShade: "white"
                                    },
                                    elements: {
                                        rootBox: "w-full",
                                        card: "shadow-none border-none w-full p-0 bg-transparent",
                                        headerTitle: "hidden",
                                        headerSubtitle: "hidden",
                                        formButtonPrimary: "font-bold shadow-lg hover:shadow-xl transition-all",
                                        socialButtonsBlockButton: "border-white/10 text-gray-200 hover:bg-white/5",
                                        dividerLine: "bg-white/10",
                                        dividerText: "text-gray-500",
                                        formFieldLabel: "text-gray-300 font-medium mb-1",
                                        formFieldInput: "border-white/10 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white/5",
                                        footerActionText: "text-gray-400",
                                        footerActionLink: `font-medium ${isCustomer ? 'text-blue-400 hover:text-blue-300' : isDesigner ? 'text-[#D4AF37] hover:text-amber-300' : 'text-red-400 hover:text-red-300'}`
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
