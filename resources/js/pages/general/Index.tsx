import { BlogSectionWrapper } from '@/components/sections/blog/BlogSectionWrapper';
import { DealsSectionWrapper } from '@/components/sections/DealsSectionWrapper';
import { FeaturedDestinationsWrapper } from '@/components/sections/FeaturedDestinationsWrapper';
import { HeroSection } from '@/components/sections/HeroSection';
import { LandingCtaSection } from '@/components/sections/LandingCtaSection';
import { LandingTrustStrip } from '@/components/sections/LandingTrustStrip';

const Index = () => {
    return (
        <main id="main-content" className="min-h-screen bg-background">
            <HeroSection />
            <FeaturedDestinationsWrapper />
            <LandingTrustStrip />
            <DealsSectionWrapper />
            <BlogSectionWrapper previewCount={3} />
            <LandingCtaSection />
        </main>
    );
};

export default Index;
