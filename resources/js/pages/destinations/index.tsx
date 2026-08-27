import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { FilterRenderer } from '@/components/filters/FilterRenderer';
import { FilterSidebar } from '@/components/lists/FilterSidebar';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { Button } from '@/components/ui/button';
import CardMedia from '@/components/ui/CardMedia';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
} from '@/components/ui/navigation-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useCountries } from '@/hooks/useCountries';
import {
    useDestinations,
    useCategories,
    useCategoryTypesPublic,
} from '@/hooks/usePublicData';

import { getLocalizedCategoryLabel } from '@/lib/categoryLabels';
import { formatPrice } from '@/lib/utils';

const SORT_OPTIONS = [
    { value: 'featured', labelKey: 'dest.sort.featured' },
    { value: 'price-asc', labelKey: 'dest.sort.priceAsc' },
    { value: 'price-desc', labelKey: 'dest.sort.priceDesc' },
    { value: 'rating', labelKey: 'dest.sort.rating' },
] as const;

const Destinations = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const initialSearch = params.get('q') || '';
    const initialCategory = params.get('cat')?.toLowerCase() || 'all';
    const initialCountry = params.get('country') || 'all';

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedCountry, setSelectedCountry] = useState(initialCountry);
    const [sortBy, setSortBy] = useState<
        'featured' | 'price-asc' | 'price-desc' | 'rating'
    >('featured');
    const { t, lang, dir } = useLanguage();
    const { data: allDestinations = [] } = useDestinations();
    const { data: dynamicCategories = [] } = useCategories('destinations');
    const { data: categoryTypes = [] } = useCategoryTypesPublic('destinations');
    const allCountries = useCountries();

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

    // Adjust state during render when URL params change (e.g. navbar subcategory links)
    const [prevParamsKey, setPrevParamsKey] = useState(() => params.toString());
    if (params.toString() !== prevParamsKey) {
        setPrevParamsKey(params.toString());
        setSearchQuery(params.get('q') || '');
        setSelectedCategory(params.get('cat')?.toLowerCase() || 'all');
        setSelectedCountry(params.get('country') || 'all');
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

    const countries = useMemo(() => {
        return [
            { value: 'all', label: t('common.all') },
            ...allCountries.map((c) => ({
                value: c.name.en,
                label: c.name[lang] || c.name.en,
            })),
        ];
    }, [allCountries, lang, t]);

    const categories = [
        { value: 'all', label: t('common.all') },
        ...dynamicCategories.map((c) => ({
            value: c.key,
            label: getLocalizedCategoryLabel(c, lang),
        })),
    ];

    const filtered = allDestinations
        .filter((d) => {
            const matchesSearch =
                localizeText(d.name, lang)
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                localizeText(d.country, lang)
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
            const matchesCategory =
                selectedCategory === 'all' ||
                (d.categoryKey ?? '').toLowerCase() === selectedCategory;
            const matchesCountry =
                selectedCountry === 'all' ||
                localizeText(d.country, lang) === selectedCountry;
            const destAssignments = d.category_assignments;
            const activeTypeFilters = Object.entries(
                categoryTypeFilters,
            ).filter(([, v]) => v.length > 0);
            const matchesCategoryTypes =
                activeTypeFilters.length === 0 ||
                activeTypeFilters.some(
                    ([typeKey, values]) =>
                        destAssignments &&
                        values.includes(destAssignments[typeKey]),
                );
            return (
                matchesSearch &&
                matchesCategory &&
                matchesCountry &&
                matchesCategoryTypes
            );
        })
        .sort((a, b) => {
            if (sortBy === 'price-asc') return a.price - b.price;
            if (sortBy === 'price-desc') return b.price - a.price;
            if (sortBy === 'rating') return b.rating - a.rating;
            return 0;
        });

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        selectedCategory !== 'all' ||
        selectedCountry !== 'all' ||
        Object.values(categoryTypeFilters).some((v) => v.length > 0);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedCountry('all');
        setCategoryTypeFilters({});
    };

    const handleProceed = (slug: string) => {
        navigate(`/destinations/${slug}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHeroCarousel pageKey="destinations" />
            <div className="pb-16 pt-8">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-4"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.destinations'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.header
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <h1 className="mb-3 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('dest.title')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('dest.subtitle')}
                        </p>
                    </motion.header>

                    <ListFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        resultCount={filtered.length}
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                        searchPlaceholder={t('dest.searchPlaceholder')}
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
                            <div>
                                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('admin.country')}
                                </label>
                                <Select
                                    value={selectedCountry}
                                    onValueChange={setSelectedCountry}
                                >
                                    <SelectTrigger className="w-full rounded-lg border-border bg-background">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map((c) => (
                                            <SelectItem
                                                key={c.value}
                                                value={c.value}
                                            >
                                                {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border-t border-border pt-6">
                                <h3 className="mb-4 font-serif text-base font-bold text-foreground">
                                    {t('hotels.filterByTags')}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.value}
                                            onClick={() =>
                                                setSelectedCategory(cat.value)
                                            }
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                                selectedCategory === cat.value
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-border pt-6">
                                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('dest.sortBy')}
                                </label>
                                <NavigationMenu className="relative z-10 w-full">
                                    <NavigationMenuList className="gap-0">
                                        <NavigationMenuItem>
                                            <NavigationMenuTrigger
                                                onClick={(e) =>
                                                    e.preventDefault()
                                                }
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
                                            >
                                                <span className="flex items-center gap-2">
                                                    {t(
                                                        SORT_OPTIONS.find(
                                                            (opt) =>
                                                                opt.value ===
                                                                sortBy,
                                                        )?.labelKey ??
                                                            'dest.sort.featured',
                                                    )}
                                                </span>
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent>
                                                <ul className="grid w-full gap-1 bg-card p-2 shadow-xl">
                                                    {SORT_OPTIONS.map(
                                                        (option) => {
                                                            const isActive =
                                                                sortBy ===
                                                                option.value;
                                                            return (
                                                                <li
                                                                    key={
                                                                        option.value
                                                                    }
                                                                >
                                                                    <NavigationMenuLink
                                                                        asChild
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setSortBy(
                                                                                    option.value,
                                                                                )
                                                                            }
                                                                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                                                                isActive
                                                                                    ? 'bg-primary text-primary-foreground'
                                                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                                            }`}
                                                                        >
                                                                            <span>
                                                                                {t(
                                                                                    option.labelKey,
                                                                                )}
                                                                            </span>
                                                                            {isActive && (
                                                                                <span className="text-xs font-semibold">
                                                                                    ✓
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    </NavigationMenuLink>
                                                                </li>
                                                            );
                                                        },
                                                    )}
                                                </ul>
                                            </NavigationMenuContent>
                                        </NavigationMenuItem>
                                    </NavigationMenuList>
                                    <NavigationMenuViewport />
                                </NavigationMenu>
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
                            {filtered.length === 0 ? (
                                <RequestThingEmptyState
                                    variant={
                                        allDestinations.length === 0
                                            ? 'empty'
                                            : 'no-results'
                                    }
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {filtered.map((dest, i) => (
                                        <Link
                                            key={localizeText(dest.name, lang)}
                                            to={`/destinations/${dest.slug}`}
                                            className="group block"
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="cursor-pointer"
                                            >
                                                <div className="card-elevated overflow-hidden rounded-2xl bg-card">
                                                    <CardMedia
                                                        src={dest.image}
                                                        alt={localizeText(
                                                            dest.name,
                                                            lang,
                                                        )}
                                                        wrapperClass="relative h-56"
                                                        imgClass="transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    <FavoriteButton
                                                        className="absolute right-3 top-3"
                                                        item={{
                                                            id: `dest-${localizeText(dest.name, lang)}`,
                                                            type: 'destination',
                                                            name: localizeText(
                                                                dest.name,
                                                                lang,
                                                            ),
                                                            image: dest.image,
                                                            price: dest.price,
                                                            location:
                                                                localizeText(
                                                                    dest.country,
                                                                    lang,
                                                                ),
                                                        }}
                                                    />
                                                    <div className="p-5">
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <MapPin className="h-3 w-3" />{' '}
                                                                {localizeText(
                                                                    dest.country,
                                                                    lang,
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs font-bold text-secondary">
                                                                <Star className="h-3 w-3 fill-current" />{' '}
                                                                {dest.rating}
                                                            </div>
                                                        </div>
                                                        <h3 className="mb-1 font-serif text-xl font-bold text-foreground">
                                                            {localizeText(
                                                                dest.name,
                                                                lang,
                                                            )}
                                                        </h3>
                                                        <p className="mb-4 text-sm text-muted-foreground">
                                                            {localizeText(
                                                                dest.description,
                                                                lang,
                                                            )}
                                                        </p>
                                                        <div className="flex items-center justify-between gap-2">
                                                            {dest.price > 0 && (
                                                                <span className="font-bold text-primary">
                                                                    From{' '}
                                                                    {formatPrice(dest.price, 'TND')}
                                                                </span>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                className="bg-primary text-xs text-primary-foreground"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    handleProceed(
                                                                        dest.slug,
                                                                    );
                                                                }}
                                                            >
                                                                {t(
                                                                    'common.bookNow',
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
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

export default Destinations;
