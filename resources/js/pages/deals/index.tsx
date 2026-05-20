import { motion } from 'framer-motion';
import { CalendarClock, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useDeals, useCategories } from '@/hooks/usePublicData';
import { matchesSearchText } from '@/lib/listFilters';

const ALL = 'all';

export default function Deals() {
    const { t, lang } = useLanguage();
    const [params] = useSearchParams();
    const initialSearch = params.get('q') || '';
    const initialCategory = params.get('cat')?.toLowerCase() || ALL;

    const { data: deals = [] } = useDeals();
    const { data: dynamicCategories = [] } = useCategories('deals');
    const [activeCategory, setActiveCategory] = useState<'all' | string>(
        initialCategory,
    );
    const [searchQuery, setSearchQuery] = useState(initialSearch);

    const categories = useMemo(
        () => [
            { value: 'all', label: t('common.all') },
            ...dynamicCategories.map((c) => ({
                value: c.key,
                label: c.name[lang] || c.name.en,
            })),
        ],
        [dynamicCategories, lang, t],
    );

    const filteredDeals = useMemo(
        () =>
            deals.filter((deal) => {
                const matchesSearch = matchesSearchText(searchQuery, [
                    localizeText(deal.title, lang),
                    localizeText(deal.description, lang),
                    localizeText(deal.discount, lang),
                    localizeText(deal.expires, lang),
                    localizeText(deal.category, lang),
                ]);
                const matchesCategory =
                    activeCategory === ALL ||
                    deal.category_key === activeCategory;
                return matchesSearch && matchesCategory;
            }),
        [activeCategory, deals, lang, searchQuery],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 || activeCategory !== ALL;

    const clearFilters = () => {
        setSearchQuery('');
        setActiveCategory(ALL);
    };

    return (
        <div key={params.toString()} className="min-h-screen bg-background">
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.deals'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <h1 className="mb-3 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('deals.title')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('deals.subtitle')}
                        </p>
                    </motion.div>

                    <ListFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        resultCount={filteredDeals.length}
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                        searchPlaceholder={t('common.search')}
                    >
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category.value}
                                    type="button"
                                    onClick={() =>
                                        setActiveCategory(category.value)
                                    }
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeCategory === category.value ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    </ListFilterBar>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filteredDeals.length === 0 ? (
                            <RequestThingEmptyState
                                variant={deals.length === 0 ? 'empty' : 'no-results'}
                                className="md:col-span-2 xl:col-span-3"
                            />
                        ) : (
                            filteredDeals.map((deal, i) => (
                                <motion.article
                                    key={deal.slug}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                            <Tag className="h-3 w-3" />{' '}
                                            {localizeText(deal.discount, lang)}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            <CalendarClock className="h-3.5 w-3.5" />{' '}
                                            {localizeText(deal.expires, lang)}
                                        </span>
                                    </div>

                                    <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                        {localizeText(deal.title, lang)}
                                    </h3>
                                    <p className="mb-6 text-sm text-muted-foreground">
                                        {localizeText(deal.description, lang)}
                                    </p>

                                    <div className="flex gap-2">
                                        <Link
                                            to={`/deals/${deal.slug}`}
                                            className="flex-1"
                                        >
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                            >
                                                {t('deals.viewDeal')}
                                            </Button>
                                        </Link>
                                        <Link
                                            to={`/deals/${deal.slug}`}
                                            className="flex-1"
                                        >
                                            <Button className="w-full">
                                                {t('common.bookNow')}
                                            </Button>
                                        </Link>
                                    </div>
                                </motion.article>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
