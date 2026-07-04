import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { localizeText } from '@/api/entities.api';
import { apiFetch } from '@/api/http';
import { fetchPartners, type PartnerItem } from '@/api/partners.api';
import { PageShell } from '@/components/layout/PageShell';
import { Input } from '@/components/ui/input';
import { FilterRenderer } from '@/components/filters/FilterRenderer';
import { useCategoryTypesPublic } from '@/hooks/usePublicData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchParams } from 'react-router-dom';
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
    const { t, lang } = useLanguage();
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

    // Category type filters from URL params
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
        return partners.filter((p) => {
            const matchesCategory = cat === 'All' || p.category === cat;
            const matchesSearch = !q || getPartnerName(p, lang).toLowerCase().includes(q.toLowerCase());

            // Category type filters
            const assignments = (p as unknown as Record<string, unknown>).category_assignments as Record<string, string> | undefined;
            const matchesCategoryTypes = Object.entries(categoryTypeFilters).every(
                ([typeKey, values]) =>
                    values.length === 0 ||
                    (assignments && values.includes(assignments[typeKey])),
            );

            return matchesCategory && matchesSearch && matchesCategoryTypes;
        });
    }, [partners, cat, q, lang, categoryTypeFilters]);

    return (
        <PageShell
            title={t('partners.title')}
            subtitle={t('partners.subtitle')}
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.partners'), active: true },
            ]}
        >
            <div className="flex flex-col md:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t('partners.searchPlaceholder')}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {categories.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCat(c)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                cat === c
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                            }`}
                        >
                            {getCategoryLabel(c)}
                        </button>
                    ))}
                </div>
            </div>

            {categoryTypes.length > 0 && (
                <div className="mb-8 space-y-3">
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

            {isLoading ? (
                <div className="py-20 text-center text-muted-foreground">
                    Loading partners...
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
                    {filtered.length === 0 && (
                        <p className="col-span-full text-center text-muted-foreground py-12">
                            {t('partners.noResults')}
                        </p>
                    )}
                </div>
            )}
        </PageShell>
    );
};

export default Partners;
