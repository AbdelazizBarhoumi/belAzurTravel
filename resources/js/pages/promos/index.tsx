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
import { matchesSearchText } from '@/lib/listFilters';

const ALL = 'all';

const PROMO_GRADIENT_CLASS_PATTERN =
    /^(from|via|to)-(primary|secondary)(\/\d{1,3})?$/;

function getPromoGradient(color?: string): string {
    const normalizedColor = color?.trim().replace(/\s+/g, ' ') ?? '';

    if (!normalizedColor) {
        return 'from-primary to-secondary';
    }

    const gradientClasses = normalizedColor.split(' ');
    const hasValidLength =
        gradientClasses.length >= 2 && gradientClasses.length <= 3;
    const hasOnlyAllowedClasses = gradientClasses.every((gradientClass) =>
        PROMO_GRADIENT_CLASS_PATTERN.test(gradientClass),
    );

    if (!hasValidLength || !hasOnlyAllowedClasses) {
        return 'from-primary to-secondary';
    }

    return normalizedColor;
}

function getPromoType(discount: string): 'perk' | 'percentage' {
    return discount.includes('%') ? 'percentage' : 'perk';
}

function PromosContent() {
    const { t, lang } = useLanguage();
    const [params] = useSearchParams();
    const { data: promos = [] } = usePromos();
    const initialSearch = params.get('q') || '';
    const initialType = params.get('type') || ALL;
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedType, setSelectedType] = useState(initialType);

    const filteredPromos = useMemo(
        () =>
            promos.filter((promo) => {
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
                return matchesSearch && matchesType;
            }),
        [lang, promos, searchQuery, selectedType],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 || selectedType !== ALL;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedType(ALL);
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
                </div>
            </ListFilterBar>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredPromos.length === 0 ? (
                    <RequestThingEmptyState
                        variant={promos.length === 0 ? 'empty' : 'no-results'}
                        className="md:col-span-2"
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
                                className={`bg-gradient-to-br ${getPromoGradient(p.color)} p-8 text-primary-foreground`}
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
