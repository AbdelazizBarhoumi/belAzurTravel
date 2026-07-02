import { BlogSectionWrapper } from '@/components/sections/blog/BlogSectionWrapper';
import { DealsSectionWrapper } from '@/components/sections/DealsSectionWrapper';
import { FeaturedDestinationsWrapper } from '@/components/sections/FeaturedDestinationsWrapper';
import { OrganizedAndCircuits } from "@/components/sections/OrganizedAndCircuits";
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { HeroSection } from '@/components/sections/HeroSection';
import { LandingCtaSection } from '@/components/sections/LandingCtaSection';
import { LandingTrustStrip } from '@/components/sections/LandingTrustStrip';
import { LandingVideoModal } from '@/components/sections/LandingVideoModal';
import { MarqueeShowcase } from '@/components/ui/MarqueeShowcase';

const Index = () => {
    return (
        <main id="main-content" className="min-h-screen bg-background">
            <LandingVideoModal />
            <PageHeroCarousel pageKey="home" />
            <HeroSection />
            <FeaturedDestinationsWrapper />
            <OrganizedAndCircuits />
            <LandingTrustStrip />
            <MarqueeShowcase />
            <DealsSectionWrapper />
            <BlogSectionWrapper previewCount={3} />
            <LandingCtaSection />
        </main>
    );
};

export default Index;
