import { BlogSection } from '@/components/BlogSection';
import { DealsSection } from '@/components/DealsSection';
import { FeaturedDestinations } from '@/components/FeaturedDestinations';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { Navbar } from '@/components/Navbar';

const Index = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <HeroSection />
            <FeaturedDestinations />
            <DealsSection />
            <BlogSection />
            <Footer />
        </div>
    );
};

export default Index;
