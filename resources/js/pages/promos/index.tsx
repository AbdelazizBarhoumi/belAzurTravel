import { motion } from 'framer-motion';
import { Tag, Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { usePromos } from '@/hooks/usePublicData';
import { useViewMode } from '@/hooks/useViewMode';
import { matchesSearchText } from '@/lib/listFilters';
import { getPromoBackground } from '@/lib/promoColor';
import { cn } from '@/lib/utils';
import type { PromoItem } from '@/types/public';
import { ViewToggle } from '@/components/ui/ViewToggle';

const ALL = 'all';

function getPromoType(discount: string): 'perk' | 'percentage' {
    return discount.includes('%') ? 'percentage' : 'perk';
}

function PromosContent() {
    const { t, lang } = useLanguage();
    const [params] = useSearchParams();
    const { data: promos = [] } = usePromos();
    const initialSearch = params.get('q') || '';
    const initialType = params.get('type') || ALL;
    const initialSpecial = params.get('special') === 'true';
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedType, setSelectedType] = useState(initialType);
    const [specialOnly, setSpecialOnly] = useState(initialSpecial);
    const [viewMode, setViewMode] = useViewMode();

    const filteredPromos = useMemo(
        () =>
            (Array.isArray(promos) ? promos : []).filter((promo) => {
                const matchesSearch = matchesSearchText(searchQuery, [
                    promo.code,
                    localizeText(promo.title, lang),
                    localizeText(promo.description, lang),
                    localizeText(promo.discount, lang),
                    localizeText(promo.expires, lang),
                ]);
                const matchesType =
                    selectedType === ALL ||
                    getPromoType(localizeText(promo.discount, lang)) ===
                        selectedType;
                const matchesSpecial =
                    !specialOnly ||
                    (promo as PromoItem & { is_special?: boolean })
                        .is_special === true;
                return matchesSearch && matchesType && matchesSpecial;
            }),
        [lang, promos, searchQuery, selectedType, specialOnly],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 || selectedType !== ALL || specialOnly;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedType(ALL);
        setSpecialOnly(false);
    };

    return (
        <PageShell
            titleKey="promos.title"
            subtitleKey="promos.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.promos'), active: true },
            ]}
        >
            <ListFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                resultCount={filteredPromos.length}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                searchPlaceholder={t('common.search')}
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {t('promos.filterByType')}
                        </span>
                        <Select
                            value={selectedType}
                            onValueChange={setSelectedType}
                        >
                            <SelectTrigger
                                aria-label={t('promos.filterByType')}
                                className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                            >
                                <SelectValue placeholder={t('common.all')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    {t('common.all')}
                                </SelectItem>
                                <SelectItem value="percentage">
                                    {t('promos.typePercentage')}
                                </SelectItem>
                                <SelectItem value="perk">
                                    {t('promos.typePerk')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {t('admin.promos.special') || 'Special'}
                        </span>
                        <button
                            type="button"
                            onClick={() => setSpecialOnly(!specialOnly)}
                            className={`h-12 rounded-2xl border px-4 text-sm font-medium transition-all ${
                                specialOnly
                                    ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm dark:bg-amber-900/20 dark:text-amber-400'
                                    : 'border-border/70 bg-background/90 text-muted-foreground hover:border-amber-300 hover:text-amber-600'
                            }`}
                        >
                            {specialOnly
                                ? t('admin.promos.special') || 'Special'
                                : t('admin.promos.notSpecial') || 'All'}
                        </button>
                    </label>
                </div>
            </ListFilterBar>

            <div className="mb-4 flex items-center justify-end">
                <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
            <div
                className={cn(
                    'grid gap-6',
                    viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1',
                )}
            >
                {filteredPromos.length === 0 ? (
                    <RequestThingEmptyState
                        variant={promos.length === 0 ? 'empty' : 'no-results'}
                        className={viewMode === 'grid' ? 'md:col-span-2' : ''}
                    />
                ) : (
                    filteredPromos.map((p, i) => (
                        <motion.div
                            key={p.code}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="card-elevated overflow-hidden rounded-2xl"
                        >
                            <div
                                className={`p-8 text-primary-foreground ${getPromoBackground(p.color).className ? `bg-gradient-to-br ${getPromoBackground(p.color).className}` : ''}`}
                                style={getPromoBackground(p.color).style}
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <Tag className="h-8 w-8 opacity-80" />
                                    <span className="rounded-full bg-card/20 px-3 py-1 text-xs font-bold backdrop-blur">
                                        {localizeText(p.discount, lang)}
                                    </span>
                                </div>
                                <h3 className="mb-2 font-serif text-2xl font-bold">
                                    {localizeText(p.title, lang)}
                                </h3>
                                <p className="mb-6 text-sm text-primary-foreground/80">
                                    {localizeText(p.description, lang)}
                                </p>
                                <div className="flex items-center justify-between">
                                    <code className="rounded-lg bg-card/20 px-3 py-1.5 font-mono text-sm font-bold backdrop-blur">
                                        {p.code}
                                    </code>
                                    <span className="flex items-center gap-1 text-xs opacity-80">
                                        <Calendar className="h-3 w-3" />{' '}
                                        {localizeText(p.expires, lang)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end bg-card p-4">
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-primary text-primary-foreground"
                                >
                                    <Link to={`/promos/${p.code}`}>
                                        {t('common.viewDetails')}
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </PageShell>
    );
}

export default function Promos() {
    const location = useLocation();
    return <PromosContent key={location.search} />;
}
