import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import UserDashboard from './pages/UserDashboard';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import EnterprisePage from './pages/EnterprisePage';
import BlogPage from './pages/BlogPage';
import LegalPage from './pages/LegalPage';
import LoginPage from './pages/auth/LoginPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPwPage from './pages/auth/ForgotPwPage';
import ResetPwPage from './pages/auth/ResetPwPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import Customizer from './pages/Customizer';
import AdminDashboard from './pages/AdminDashboard';
import DesignerDashboard from './pages/DesignerDashboard';
import PaymentPortal from './pages/PaymentPortal';

import { CartSidebar } from './components/cart/CartSidebar';
import { useCartStore } from './store/CartStore';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useRole } from './hooks/useRole';
import useAuthStore from './store/AuthStore';

// Protect Admin Workspace: Only accessible to Admin accounts (server-verified)
const RequireAdmin = ({ children }) => {
    const { isLoaded, isLoggedIn, isAdmin } = useRole();

    if (!isLoaded) return null;
    if (!isLoggedIn || !isAdmin) {
        return <Navigate to="/login?role=admin" replace />;
    }
    return children;
};

// Protect 3D Customizer: ONLY accessible to Designer / Seller (and Admin)
const RequireDesigner = ({ children }) => {
    const { isLoaded, isLoggedIn, canCustomize } = useRole();

    if (!isLoaded) return null;

    if (!isLoggedIn) {
        return <Navigate to="/login?role=designer" replace />;
    }

    if (!canCustomize) {
        // Customer tried to access 3D Customizer directly
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function AppContent() {
    const location = useLocation();
    const isOpen = useCartStore((state) => state.isOpen);
    const isStandaloneRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/customizer');
    const shouldShift = isOpen && !isStandaloneRoute;

    // Rehydrate auth state on mount
    useEffect(() => {
        useAuthStore.getState().rehydrate();
    }, []);

    return (
        <div className={`transition-all duration-300 ease-in-out ${shouldShift ? 'md:mr-[400px] lg:mr-[448px]' : ''}`}>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
                <Route path="/catalog" element={<Layout><CatalogPage /></Layout>} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/about" element={<Layout><AboutPage /></Layout>} />
                <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
                <Route path="/enterprise" element={<Layout><EnterprisePage /></Layout>} />
                <Route path="/blog" element={<Layout><BlogPage /></Layout>} />
                <Route path="/legal" element={<Layout><LegalPage /></Layout>} />

                {/* 3-Role Login Routes with wildcard support for Clerk subroutes (e.g. OTP email verification) */}
                <Route path="/login/*" element={<LoginPage />} />
                <Route path="/admin-login" element={<Navigate to="/login?role=admin" replace />} />
                <Route path="/signup/*" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPwPage />} />
                <Route path="/resetpassword/:token" element={<ResetPwPage />} />

                <Route path="/checkout" element={
                    <>
                        <SignedIn>
                            <Layout><CheckoutPage /></Layout>
                        </SignedIn>
                        <SignedOut>
                            <Navigate to="/login" />
                        </SignedOut>
                    </>
                } />

                {/* Redirect legacy role login routes */}
                <Route path="/login/designer" element={<Navigate to="/login?role=designer" replace />} />
                <Route path="/login/admin" element={<Navigate to="/login?role=admin" replace />} />

                {/* 3D Customizer Route: Strictly Protected for Designer/Seller */}
                <Route path="/customizer" element={
                    <RequireDesigner>
                        <Customizer />
                    </RequireDesigner>
                } />

                {/* Protected Admin Route */}
                <Route path="/admin" element={
                    <RequireAdmin>
                        <AdminDashboard />
                    </RequireAdmin>
                } />

                <Route path="/designer" element={<DesignerDashboard />} />
                <Route path="/orders" element={
                    <SignedIn>
                        <Layout><OrdersPage /></Layout>
                    </SignedIn>
                } />
                <Route path="/payment-portal" element={<PaymentPortal />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CartSidebar />
            <AppContent />
            <Toaster position="top-center" richColors />
        </Router>
    );
}

export default App;
