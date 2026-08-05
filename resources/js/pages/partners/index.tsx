import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { localizeText } from '@/api/entities.api';
import { apiFetch } from '@/api/http';
import { fetchPartners, type PartnerItem } from '@/api/partners.api';
import { FilterRenderer } from '@/components/filters/FilterRenderer';
import { FilterSidebar } from '@/components/lists/FilterSidebar';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategoryTypesPublic } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

interface Category {
    id: number;
    entity_type: string;
    key: string;
    name: { en: string; fr: string; ar: string };
}

function getPartnerName(p: PartnerItem, lang: Lang): string {
    if (typeof p.name === 'string') return p.name;
    return localizeText(p.name, lang);
}

const Partners = () => {
    const { t, lang, dir } = useLanguage();
    const [params] = useSearchParams();
    const [q, setQ] = useState('');
    const [cat, setCat] = useState<string>('All');

    const { data: partners = [], isLoading } = useQuery<PartnerItem[]>({
        queryKey: ['partners'],
        queryFn: fetchPartners,
        staleTime: 5 * 60 * 1000,
    });

    const { data: dbCategories = [] } = useQuery<Category[]>({
        queryKey: ['categories', 'partners'],
        queryFn: () => apiFetch<{ data: Category[] }>('/api/categories').then((res) => res.data?.filter((c: Category) => c.entity_type === 'partners') ?? []),
    });

    const { data: categoryTypes = [] } = useCategoryTypesPublic('partners');

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
    const [categoryTypeFilters, setCategoryTypeFilters] = useState<Record<string, string[]>>(initialCategoryTypeFilters);

    // Adjust state during render when URL params change (e.g. navbar subcategory links)
    const [prevParamsKey, setPrevParamsKey] = useState(() => params.toString());
    if (params.toString() !== prevParamsKey) {
        setPrevParamsKey(params.toString());
        setQ(params.get('q') || '');
        setCat(params.get('cat') || 'All');
        const nextFilters: Record<string, string[]> = {};
        for (const [key, val] of params.entries()) {
            if (key.startsWith('category_')) {
                nextFilters[key.slice('category_'.length)] = val.split(',').filter(Boolean);
            }
        }
        setCategoryTypeFilters(nextFilters);
    }

    const categories = useMemo(() => {
        const keys = new Set(partners.map((p) => p.category).filter(Boolean) as string[]);
        return ['All', ...Array.from(keys)];
    }, [partners]);

    const getCategoryLabel = (key: string | undefined) => {
        if (!key || key === 'All') return t('admin.all');
        const catItem = dbCategories.find((c) => c.key === key);
        return catItem?.name?.[lang] || catItem?.name?.en || key;
    };

    const filtered = useMemo(() => {
        return (Array.isArray(partners) ? partners : []).filter((p) => {
            const matchesCategory = cat === 'All' || p.category === cat;
            const matchesSearch = !q || getPartnerName(p, lang).toLowerCase().includes(q.toLowerCase());
            const assignments = (p as unknown as Record<string, unknown>).category_assignments as Record<string, string> | undefined;
            const activeTypeFilters = Object.entries(categoryTypeFilters).filter(([, v]) => v.length > 0);
            const matchesCategoryTypes = activeTypeFilters.length === 0 ||
                activeTypeFilters.some(([typeKey, values]) =>
                    assignments && values.includes(assignments[typeKey]),
                );
            return matchesCategory && matchesSearch && matchesCategoryTypes;
        });
    }, [partners, cat, q, lang, categoryTypeFilters]);

    const hasActiveFilters =
        q.trim().length > 0 ||
        cat !== 'All' ||
        Object.values(categoryTypeFilters).some((v) => v.length > 0);

    const clearFilters = () => {
        setQ('');
        setCat('All');
        setCategoryTypeFilters({});
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHeroCarousel pageKey="home" />
            <div className="pb-16 pt-8">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.partners'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.header
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <h1 className="mb-3 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('partners.title')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('partners.subtitle')}
                        </p>
                    </motion.header>

                    <ListFilterBar
                        searchValue={q}
                        onSearchChange={setQ}
                        resultCount={filtered.length}
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                        searchPlaceholder={t('partners.searchPlaceholder')}
                        className="mb-8"
                    />

                    <div className={`flex gap-6 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                                    {categories.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setCat(c)}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                                cat === c
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {getCategoryLabel(c)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {categoryTypes.length > 0 && (
                                <div className="border-t border-border pt-6 space-y-4">
                                    {categoryTypes.map((catType) => (
                                        <FilterRenderer
                                            key={catType.key}
                                            categoryType={catType as never}
                                            selectedValues={categoryTypeFilters[catType.key] ?? []}
                                            onChange={(values) =>
                                                setCategoryTypeFilters((prev) => ({
                                                    ...prev,
                                                    [catType.key]: values,
                                                }))
                                            }
                                            lang={lang}
                                        />
                                    ))}
                                </div>
                            )}
                        </FilterSidebar>

                        <div className="min-w-0 flex-1">
                            {isLoading ? (
                                <div className="py-20 text-center text-muted-foreground">
                                    Loading partners...
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="py-20 text-center text-muted-foreground">
                                    {t('partners.noResults')}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filtered.map((p, i) => (
                                        <motion.a
                                            key={p.id}
                                            href={p.website || '#'}
                                            target={p.website ? '_blank' : undefined}
                                            rel={p.website ? 'noreferrer' : undefined}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="bg-card rounded-2xl p-8 card-elevated flex flex-col items-center justify-center text-center group"
                                        >
                                            <div className="h-20 w-full flex items-center justify-center mb-4">
                                                <img
                                                    src={p.logo}
                                                    alt={getPartnerName(p, lang)}
                                                    className="max-h-16 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <h3 className="font-serif text-lg font-bold text-foreground">
                                                {getPartnerName(p, lang)}
                                            </h3>
                                            {p.category && (
                                                <p className="text-xs text-muted-foreground">
                                                    {getCategoryLabel(p.category)}
                                                </p>
                                            )}
                                        </motion.a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Partners;
