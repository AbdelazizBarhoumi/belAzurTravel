import { motion } from 'framer-motion';
import { Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogPosts } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

interface BlogSectionProps {
    showHeader?: boolean;
    previewCount?: number;
}

export function BlogSection({
    showHeader = true,
    previewCount = 3,
}: BlogSectionProps) {
    const { t, dir, lang } = useLanguage();
    const { data: posts = [] } = useBlogPosts();

    const recentPosts = useMemo(
        () => posts.slice(0, previewCount),
        [posts, previewCount],
    );

    return (
        <section className="bg-background py-24">
            <div className="container mx-auto px-4">
                {showHeader && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16 flex items-end justify-between"
                    >
                        <div>
                            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-secondary">
                                {t('blog.stories')}
                            </p>
                            <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
                                {t('blog.title')}
                            </h2>
                        </div>
                        <Link
                            to="/blog"
                            className="hidden items-center gap-2 font-medium text-primary transition-all hover:gap-3 md:flex"
                        >
                            {t('common.viewAll')}{' '}
                            {dir === 'rtl' ? (
                                <ArrowLeft className="h-4 w-4" />
                            ) : (
                                <ArrowRight className="h-4 w-4" />
                            )}
                        </Link>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {recentPosts.map((post, i) => (
                        <Link
                            key={post.slug}
                            to={`/blog/${post.slug}`}
                            className="group block"
                        >
                            <motion.article
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group cursor-pointer"
                            >
                                <div className="card-elevated mb-5 overflow-hidden rounded-2xl">
                                    <img
                                        src={post.image}
                                        alt={localize(post.title, lang)}
                                        className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="mb-3 flex items-center gap-3">
                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                        {localize(post.category, lang)}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {post.date}
                                    </div>
                                </div>
                                <h3 className="mb-2 font-serif text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                                    {localize(post.title, lang)}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {localize(post.excerpt, lang)}
                                </p>
                            </motion.article>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
