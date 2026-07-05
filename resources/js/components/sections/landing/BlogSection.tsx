import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { HorizontalDeals } from '@/components/sections/HorizontalDeals';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useBlogPosts } from '@/hooks/usePublicData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { isPageEnabled } from '@/lib/pageVisibility';

interface Props { config: LandingSectionConfig; }

export function BlogSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { settings } = useSiteSettings();
    const { data: posts = [] } = useBlogPosts();
    if (!isPageEnabled('blog', settings.content?.nav?.settings)) return null;

    const title = config.title?.[lang] ?? config.title?.en ?? t('home.latestBlog');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? t('home.latestBlogDesc');
    if (posts.length === 0) return null;

    const style = config.style ?? 'carousel';

    if (style === 'carousel') {
        const items = posts.slice(0, 6).map((post) => ({
            id: post.slug,
            title: localizeText(post.title, lang),
            price: localizeText(post.category, lang),
            meta: post.date,
            image: post.image,
            href: `/blog/${post.slug}`,
        }));
        return (
            <HorizontalDeals
                eyebrow={t('home.ourBest')}
                title={title}
                description={subtitle}
                ctaLabel={t('common.viewAll')}
                ctaHref="/blog"
                items={items}
                accent="primary"
            />
        );
    }

    if (style === 'cards') {
        const items = posts.slice(0, 3);
        return (
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                        <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
                        <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
                    </motion.div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((post, i) => (
                            <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
                                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="relative h-48 overflow-hidden">
                                        <img src={post.image} alt={localizeText(post.title, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute left-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-primary-foreground">{localizeText(post.category, lang)}</div>
                                    </div>
                                    <div className="p-5">
                                        <div className="text-xs text-muted-foreground">{post.date}</div>
                                        <h3 className="mt-1 font-serif text-lg font-bold line-clamp-2">{localizeText(post.title, lang)}</h3>
                                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{localizeText(post.excerpt, lang)}</p>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // grid — 6 items, 2 rows of 3
    const items = posts.slice(0, 6);
    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                    <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
                </motion.div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((post, i) => (
                        <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                <div className="relative h-48 overflow-hidden">
                                    <img src={post.image} alt={localizeText(post.title, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute left-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-primary-foreground">{localizeText(post.category, lang)}</div>
                                </div>
                                <div className="p-5">
                                    <div className="text-xs text-muted-foreground">{post.date}</div>
                                    <h3 className="mt-1 font-serif text-lg font-bold line-clamp-2">{localizeText(post.title, lang)}</h3>
                                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{localizeText(post.excerpt, lang)}</p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
