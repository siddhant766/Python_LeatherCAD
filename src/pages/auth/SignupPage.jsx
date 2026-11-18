import { useState } from 'react';
import { SignUp } from "@clerk/clerk-react";
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { ShoppingBag, Sparkles, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const roleParam = searchParams.get('role');
    const [selectedRole, setSelectedRole] = useState(roleParam === 'designer' ? 'designer' : 'customer');

    // Check if Clerk is currently displaying the verification / OTP step
    const isVerifying = location.pathname.includes('/verify');

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
                className="w-full max-w-lg p-8 bg-black/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 relative z-10"
            >
                {/* Header / Logo */}
                <div className="text-center mb-6">
                    <Link to="/" className="inline-block">
                        <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-[#D4AF37] to-amber-200">
                            LeatherCAD
                        </span>
                    </Link>
                    <p className="text-gray-400 mt-2 text-sm">
                        {isVerifying
                            ? "Verify your email address with the OTP code"
                            : "Create your account to get started"}
                    </p>
                </div>

                {/* Account Type Selection (Only shown before verification) */}
                {!isVerifying && (
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
                )}

                {/* Verification Notice Banner */}
                {isVerifying && (
                    <div className="mb-6 p-3.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center gap-3 text-amber-200 text-xs">
                        <KeyRound size={20} className="text-[#D4AF37] shrink-0" />
                        <div>
                            <span className="font-bold block text-white text-sm">Check your inbox</span>
                            We've sent a 6-digit verification code to your email. Enter it below to activate your {selectedRole === 'designer' ? 'Designer / Seller' : 'Customer'} account.
                        </div>
                    </div>
                )}

                {/* Signup Form Container */}
                <div className="flex justify-center">
                    <SignUp
                        path="/signup"
                        routing="path"
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
                                headerTitle: "text-white text-lg font-bold text-center",
                                headerSubtitle: "text-gray-400 text-xs text-center mt-1",
                                formButtonPrimary: "font-bold shadow-lg hover:shadow-xl transition-all py-3 rounded-xl",
                                socialButtonsBlockButton: "border-white/10 text-gray-200 hover:bg-white/5",
                                dividerLine: "bg-white/10",
                                dividerText: "text-gray-500",
                                formFieldLabel: "text-gray-300 font-medium mb-1 text-xs",
                                formFieldInput: "!text-white !bg-[#171717] !border-white/20 focus:!border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-xl",
                                otpCodeFieldInput: "!text-white !bg-[#171717] !border-white/30 focus:!border-[#D4AF37] rounded-xl text-center text-xl font-bold",
                                footerActionText: "text-gray-400 text-xs",
                                footerActionLink: `font-medium ${selectedRole === 'designer' ? 'text-[#D4AF37] hover:text-amber-300' : 'text-blue-400 hover:text-blue-300'}`
                            }
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
}
