import { useState } from 'react';
import { SignUp } from "@clerk/clerk-react";
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role');
    const [selectedRole, setSelectedRole] = useState(roleParam === 'designer' ? 'designer' : 'customer');

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        localStorage.setItem('user_role', role);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden py-12 px-4">
            {/* Background glowing blobs */}
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
                        Create your account to get started
                    </p>
                </div>

                {/* Account Type Selection */}
                <div className="mb-6">
                    <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2 text-center">
                        Select Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button
                            type="button"
                            onClick={() => handleRoleSelect('customer')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${selectedRole === 'customer'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                }`}
                        >
                            <ShoppingBag size={18} className="mb-1" />
                            <span className="text-xs">Customer</span>
                            <span className="text-[10px] opacity-75 font-normal">Shop & Purchase</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleRoleSelect('designer')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${selectedRole === 'designer'
                                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-lg shadow-amber-500/30 font-bold'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                }`}
                        >
                            <Sparkles size={18} className="mb-1" />
                            <span className="text-xs">Designer / Seller</span>
                            <span className="text-[10px] opacity-80 font-normal">3D Studio & Sell</span>
                        </button>
                    </div>
                </div>

                {/* Signup Form Container */}
                <div className="flex justify-center">
                    <SignUp
                        key={selectedRole}
                        path="/signup"
                        signInUrl="/login"
                        fallbackRedirectUrl={selectedRole === 'designer' ? '/customizer' : '/catalog'}
                        appearance={{
                            layout: {
                                socialButtonsPlacement: "bottom",
                                socialButtonsVariant: "blockButton",
                            },
                            variables: {
                                colorPrimary: selectedRole === 'designer' ? "#D4AF37" : "#2563eb",
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
                                footerActionLink: `font-medium ${selectedRole === 'designer' ? 'text-[#D4AF37] hover:text-amber-300' : 'text-blue-400 hover:text-blue-300'}`
                            }
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
}
