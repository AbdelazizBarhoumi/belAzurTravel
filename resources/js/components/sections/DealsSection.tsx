import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useDeals } from '@/hooks/usePublicData';

export function DealsSection() {
    const { t, lang } = useLanguage();
    const [activeCategory, setActiveCategory] = useState<'all' | string>('all');
    const { data: deals = [] } = useDeals();

    const categories = useMemo(
        () => [
            { value: 'all', label: t('common.all') },
            ...Array.from(
                new Set(deals.map((deal) => deal.category[lang])),
            ).map((label) => ({ value: label, label })),
        ],
        [deals, lang, t],
    );

    const filtered = useMemo(
        () =>
            deals.filter(
                (deal) =>
                    activeCategory === 'all' ||
                    deal.category[lang] === activeCategory,
            ),
        [activeCategory, deals, lang],
    );

    return (
        <section className="bg-muted py-24">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <p className="mb-3 text-sm font-medium uppercase tracking-widest text-secondary">
                        {t('deals.save')}
                    </p>

                    <h2 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                        {t('deals.title')}
                    </h2>

                    <p className="mx-auto max-w-xl text-muted-foreground">
                        {t('deals.subtitle')}
                    </p>
                </motion.div>
                <div className="mb-6 flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <button
                            key={category.value}
                            type="button"
                            onClick={() => setActiveCategory(category.value)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeCategory === category.value ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                <div className="mb-4 text-sm text-muted-foreground">
                    {filtered.length} {t('common.results')}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {filtered.length === 0 ? (
                        <RequestThingEmptyState
                            variant={deals.length === 0 ? 'empty' : 'no-results'}
                            className="lg:col-span-3"
                        />
                    ) : (
                        filtered.map((deal, i) => (
                            <motion.div
                                key={deal.slug}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-2xl"
                            >
                                {/* Top Accent */}
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-secondary" />

                                <div className="flex h-full flex-col">
                                    {/* Header */}
                                    <div className="mb-6 flex items-center justify-between">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <Tag className="h-7 w-7" />
                                        </div>

                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                            {localizeText(deal.discount, lang)}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3 className="mb-3 font-serif text-2xl font-bold text-foreground transition-colors group-hover:text-primary">
                                            {localizeText(deal.title, lang)}
                                        </h3>

                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {localizeText(
                                                deal.description,
                                                lang,
                                            )}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-8">
                                        <Link to={`/deals/${deal.slug}`}>
                                            <Button
                                                variant="ghost"
                                                className="w-full rounded-xl border border-border bg-background transition-all group-hover:bg-primary group-hover:text-primary-foreground"
                                            >
                                                {t('deals.viewDeal')}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
