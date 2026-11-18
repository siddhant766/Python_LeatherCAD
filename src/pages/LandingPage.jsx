import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NewHeroSection from '../components/marketing/NewHeroSection';
import FeaturesSection from '../components/marketing/FeaturesSection';
import ShowcaseSection from '../components/marketing/ShowcaseSection';
import PricingSection from '../components/marketing/PricingSection';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';

export default function LandingPage() {
    const location = useLocation();

    useEffect(() => {
        if (location.hash === '#features' || window.location.hash === '#features') {
            const timer = setTimeout(() => {
                const el = document.getElementById('features');
                if (el) {
                    const navHeight = 70;
                    const top = el.getBoundingClientRect().top + window.pageYOffset - navHeight;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [location]);

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary selection:text-white">
            <Navbar />
            <NewHeroSection />
            <FeaturesSection />
            <ShowcaseSection />
            <PricingSection />
            <Footer />
        </div>
    );
}
