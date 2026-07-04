import { HeroSection } from '@/components/sections/HeroSection';
import { LandingCtaSection } from '@/components/sections/LandingCtaSection';
import { LandingSections } from '@/components/sections/LandingSections';
import { LandingTrustStrip } from '@/components/sections/LandingTrustStrip';
import { LandingVideoModal } from '@/components/sections/LandingVideoModal';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { MarqueeShowcase } from '@/components/ui/MarqueeShowcase';

const Index = () => {
    return (
        <main id="main-content" className="min-h-screen bg-background">
            <LandingVideoModal />
            <PageHeroCarousel pageKey="home" />
            <HeroSection />
            <LandingSections />
            <LandingTrustStrip />
            <MarqueeShowcase />
            <LandingCtaSection />
        </main>
    );
};

export default Index;
