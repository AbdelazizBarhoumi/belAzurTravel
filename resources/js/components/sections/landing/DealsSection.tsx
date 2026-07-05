import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { HorizontalDeals } from '@/components/sections/HorizontalDeals';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useDeals } from '@/hooks/usePublicData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { isPageEnabled } from '@/lib/pageVisibility';

interface Props { config: LandingSectionConfig; }

export function DealsSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { settings } = useSiteSettings();
    const { data: deals = [] } = useDeals();
    if (!isPageEnabled('deals', settings.content?.nav?.settings)) return null;

    const title = config.title?.[lang] ?? config.title?.en ?? t('home.featuredDeals');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? t('home.featuredDealsDesc');
    if (deals.length === 0) return null;

    const style = config.style ?? 'carousel';

    if (style === 'carousel') {
        const items = deals.slice(0, 6).map((deal) => ({
            id: deal.slug,
            title: localizeText(deal.title, lang),
            price: localizeText(deal.discount, lang),
            meta: localizeText(deal.description, lang).slice(0, 60),
            image: '',
            href: `/deals/${deal.slug}`,
        }));
        return (
            <HorizontalDeals
                eyebrow={t('home.ourBest')}
                title={title}
                description={subtitle}
                ctaLabel={t('common.viewAll')}
                ctaHref="/deals"
                items={items}
                accent="primary"
            />
        );
    }

    if (style === 'cards') {
        const items = deals.slice(0, 3);
        return (
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                        <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
                        <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
                    </motion.div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((deal, i) => (
                            <Link key={deal.slug} to={`/deals/${deal.slug}`} className="group">
                                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                        <Zap className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="mb-2 inline-block rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">{localizeText(deal.discount, lang)}</div>
                                    <h3 className="mb-2 font-serif text-xl font-bold">{localizeText(deal.title, lang)}</h3>
                                    <p className="line-clamp-2 text-sm text-muted-foreground">{localizeText(deal.description, lang)}</p>
                                    <div className="mt-4 text-sm font-semibold text-primary transition-colors group-hover:underline">View Deal →</div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // grid — 6 items, 2 rows of 3
    const items = deals.slice(0, 6);
    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                    <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>
                </motion.div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((deal, i) => (
                        <Link key={deal.slug} to={`/deals/${deal.slug}`} className="group">
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                    <Zap className="h-6 w-6 text-primary" />
                                </div>
                                <div className="mb-2 inline-block rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">{localizeText(deal.discount, lang)}</div>
                                <h3 className="mb-2 font-serif text-xl font-bold">{localizeText(deal.title, lang)}</h3>
                                <p className="line-clamp-2 text-sm text-muted-foreground">{localizeText(deal.description, lang)}</p>
                                <div className="mt-4 text-sm font-semibold text-primary transition-colors group-hover:underline">View Deal →</div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
