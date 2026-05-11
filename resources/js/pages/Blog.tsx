import { motion } from 'framer-motion';
import { Breadcrumb } from '@/components/Breadcrumb';
import { BlogSection } from '@/components/BlogSection';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';

const Blog = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.blog'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.header
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <h1 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('blog.title')}
                        </h1>
                        <p className="mx-auto max-w-xl text-muted-foreground">
                            {t('blog.subtitle')}
                        </p>
                    </motion.header>
                </div>
            </div>
            <div>
                <BlogSection />
            </div>
            <Footer />
        </div>
    );
};

export default Blog;
