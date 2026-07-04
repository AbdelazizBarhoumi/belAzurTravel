import { motion } from 'framer-motion';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { BlogListing } from '@/components/sections/blog/BlogListing';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { useLanguage } from '@/contexts/LanguageContext';

const Blog = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background">
            <PageHeroCarousel pageKey="blog" />
            <div className="pt-8">
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
                        className="mb-6 text-center"
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
            <BlogListing pageSize={6} />
        </div>
    );
};

export default Blog;
