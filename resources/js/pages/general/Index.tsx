import { HeroSection } from '@/components/sections/HeroSection';
import { LandingCtaSection } from '@/components/sections/LandingCtaSection';
import { LandingSections } from '@/components/sections/LandingSections';
import { LandingVideoModal } from '@/components/sections/LandingVideoModal';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { MarqueeShowcase } from '@/components/ui/MarqueeShowcase';

const Index = () => {
    return (
        <main id="main-content" className="min-h-screen bg-background">
            <LandingVideoModal />
            <div className="relative">
                <PageHeroCarousel pageKey="home" height="500px" />
                <HeroSection />
            </div>
            <LandingSections />
            <MarqueeShowcase />
            <LandingCtaSection />
        </main>
    );
};

export default Index;
