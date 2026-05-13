import { BlogSection } from '@/components/BlogSection';
import { DealsSection } from '@/components/DealsSection';
import { FeaturedDestinations } from '@/components/FeaturedDestinations';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { LandingCtaSection } from '@/components/LandingCtaSection';
import { LandingTrustStrip } from '@/components/LandingTrustStrip';
import { Navbar } from '@/components/Navbar';

const Index = () => {
    return (
        <main id="main-content" className="min-h-screen bg-background">
            <Navbar />
            <HeroSection />
            <FeaturedDestinations />
            <LandingTrustStrip />
            <DealsSection />
            <BlogSection previewCount={3} />
            <LandingCtaSection />
            <Footer />
        </main>
    );
};

export default Index;
