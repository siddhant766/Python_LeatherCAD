import { useState } from 'react';
import { SignIn } from "@clerk/clerk-react";
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRole } from '../../hooks/useRole';

const LoginPage = () => {
    const { isLoaded, isLoggedIn, isAdmin: userIsAdmin, isDesigner: userIsDesigner } = useRole();
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role'); // 'customer' | 'designer' | 'admin'
    const initialRole = (roleParam === 'designer' || roleParam === 'admin') ? roleParam : 'customer';

    // 3 Distinct Login Types: 'customer' | 'designer' | 'admin'
    const [loginType, setLoginType] = useState(initialRole);

    const isCustomer = loginType === 'customer';
    const isDesigner = loginType === 'designer';
    const isAdmin = loginType === 'admin';

    // If user is already authenticated, redirect straight to their dashboard
    if (isLoaded && isLoggedIn) {
        if (userIsAdmin) return <Navigate to="/admin" replace />;
        if (userIsDesigner) return <Navigate to="/customizer" replace />;
        return <Navigate to="/catalog" replace />;
    }

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

                {/* Login Form Container */}
                <div className="flex justify-center">
                    <div className="w-full">
                        <SignIn
                            path="/login"
                            routing="path"
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
                                    headerTitle: "text-white text-lg font-bold text-center",
                                    headerSubtitle: "text-gray-400 text-xs text-center mt-1",
                                    otpCodeFieldInput: "!text-white !bg-[#171717] !border-white/30 focus:!border-[#D4AF37] rounded-xl text-center text-xl font-bold",
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
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
