import { motion } from 'framer-motion';
import { CalendarClock, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FilterRenderer } from '@/components/filters/FilterRenderer';
import { FilterSidebar } from '@/components/lists/FilterSidebar';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import {
    useDeals,
    useCategories,
    useCategoryTypesPublic,
} from '@/hooks/usePublicData';

import { getLocalizedCategoryLabel } from '@/lib/categoryLabels';
import { matchesSearchText } from '@/lib/listFilters';

const ALL = 'all';

export default function Deals() {
    const { t, lang, dir } = useLanguage();
    const [params] = useSearchParams();
    const initialSearch = params.get('q') || '';
    const initialCategory = params.get('cat')?.toLowerCase() || ALL;

    const { data: deals = [] } = useDeals();
    const { data: dynamicCategories = [] } = useCategories('deals');
    const { data: categoryTypes = [] } = useCategoryTypesPublic('deals');

    const initialCategoryTypeFilters = useMemo(() => {
        const filters: Record<string, string[]> = {};
        for (const [key, val] of params.entries()) {
            if (key.startsWith('category_')) {
                const typeKey = key.slice('category_'.length);
                filters[typeKey] = val.split(',').filter(Boolean);
            }
        }
        return filters;
    }, [params]);
    const [categoryTypeFilters, setCategoryTypeFilters] = useState<
        Record<string, string[]>
    >(initialCategoryTypeFilters);

    const [activeCategory, setActiveCategory] = useState<'all' | string>(
        initialCategory,
    );
    const [searchQuery, setSearchQuery] = useState(initialSearch);

    // Adjust state during render when URL params change (e.g. navbar subcategory links)
    const [prevParamsKey, setPrevParamsKey] = useState(() => params.toString());
    if (params.toString() !== prevParamsKey) {
        setPrevParamsKey(params.toString());
        setSearchQuery(params.get('q') || '');
        setActiveCategory(params.get('cat')?.toLowerCase() || ALL);
        const nextFilters: Record<string, string[]> = {};
        for (const [key, val] of params.entries()) {
            if (key.startsWith('category_')) {
                nextFilters[key.slice('category_'.length)] = val
                    .split(',')
                    .filter(Boolean);
            }
        }
        setCategoryTypeFilters(nextFilters);
    }

    const categories = useMemo(
        () => [
            { value: 'all', label: t('common.all') },
            ...dynamicCategories.map((c) => ({
                value: c.key,
                label: getLocalizedCategoryLabel(c, lang),
            })),
        ],
        [dynamicCategories, lang, t],
    );

    const filteredDeals = useMemo(
        () =>
            (Array.isArray(deals) ? deals : []).filter((deal) => {
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
                const dealAssignments = deal.category_assignments;
                const activeTypeFilters = Object.entries(
                    categoryTypeFilters,
                ).filter(([, v]) => v.length > 0);
                const matchesCategoryTypes =
                    activeTypeFilters.length === 0 ||
                    activeTypeFilters.some(
                        ([typeKey, values]) =>
                            dealAssignments &&
                            values.includes(dealAssignments[typeKey]),
                    );
                return matchesSearch && matchesCategory && matchesCategoryTypes;
            }),
        [activeCategory, deals, lang, searchQuery, categoryTypeFilters],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        activeCategory !== ALL ||
        Object.values(categoryTypeFilters).some((v) => v.length > 0);

    const clearFilters = () => {
        setSearchQuery('');
        setActiveCategory(ALL);
        setCategoryTypeFilters({});
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHeroCarousel pageKey="deals" />
            <main className="pb-16 pt-8">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-4"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.deals'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.header
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <h1 className="mb-3 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('deals.title')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('deals.subtitle')}
                        </p>
                    </motion.header>

                    <ListFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        resultCount={filteredDeals.length}
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                        searchPlaceholder={t('common.search')}
                        className="mb-8"
                    />

                    <div
                        className={`flex gap-6 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <FilterSidebar
                            title={t('hotels.filters')}
                            hasActiveFilters={hasActiveFilters}
                            onClearAll={clearFilters}
                            clearLabel={t('common.viewAll')}
                            dir={dir}
                        >
                            <div className="border-t border-border pt-6">
                                <h3 className="mb-4 font-serif text-base font-bold text-foreground">
                                    {t('hotels.filterByTags')}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((category) => (
                                        <button
                                            key={category.value}
                                            type="button"
                                            onClick={() =>
                                                setActiveCategory(
                                                    category.value,
                                                )
                                            }
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                                activeCategory ===
                                                category.value
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {category.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {categoryTypes.length > 0 && (
                                <div className="space-y-4 border-t border-border pt-6">
                                    {categoryTypes.map((catType) => (
                                        <FilterRenderer
                                            key={catType.key}
                                            categoryType={catType as never}
                                            selectedValues={
                                                categoryTypeFilters[
                                                    catType.key
                                                ] ?? []
                                            }
                                            onChange={(values) =>
                                                setCategoryTypeFilters(
                                                    (prev) => ({
                                                        ...prev,
                                                        [catType.key]: values,
                                                    }),
                                                )
                                            }
                                            lang={lang}
                                        />
                                    ))}
                                </div>
                            )}
                        </FilterSidebar>

                        <div className="min-w-0 flex-1">
                            {filteredDeals.length === 0 ? (
                                <RequestThingEmptyState
                                    variant={
                                        deals.length === 0
                                            ? 'empty'
                                            : 'no-results'
                                    }
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                    {filteredDeals.map((deal, i) => (
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
                                                    {localizeText(
                                                        deal.discount,
                                                        lang,
                                                    )}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                    <CalendarClock className="h-3.5 w-3.5" />{' '}
                                                    {localizeText(
                                                        deal.expires,
                                                        lang,
                                                    )}
                                                </span>
                                            </div>
                                            <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                                {localizeText(deal.title, lang)}
                                            </h3>
                                            <p className="mb-6 text-sm text-muted-foreground">
                                                {localizeText(
                                                    deal.description,
                                                    lang,
                                                )}
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
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
