import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FilterRenderer } from '@/components/filters/FilterRenderer';
import { FilterSidebar } from '@/components/lists/FilterSidebar';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
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
import {
    useEvents,
    useCategories,
    useCategoryTypesPublic,
} from '@/hooks/usePublicData';

import { getLocalizedCategoryLabel } from '@/lib/categoryLabels';
import { matchesSearchText } from '@/lib/listFilters';
import { uniqueNonEmptySelectOptions } from '@/lib/selectOptions';

const ALL = 'all';

export default function Events() {
    const location = useLocation();
    return <EventsContent key={location.search} />;
}

function EventsContent() {
    const { t, lang, dir } = useLanguage();
    const [params] = useSearchParams();
    const initialSearch = params.get('q') || '';
    const initialCategory = params.get('cat')?.toLowerCase() || ALL;

    const { data: events = [] } = useEvents();
    const { data: dynamicCategories = [] } = useCategories('events');
    const { data: categoryTypes = [] } = useCategoryTypesPublic('events');

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

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedLocation, setSelectedLocation] = useState(ALL);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);

    // Sync state with URL params happens via the `EventsContent key={location.search}`
    // remount in the parent; no effect needed here.
    const categories = useMemo(
        () => [
            { value: ALL, label: t('common.all') },
            ...dynamicCategories.map((c) => ({
                value: c.key,
                label: getLocalizedCategoryLabel(c, lang),
            })),
        ],
        [dynamicCategories, lang, t],
    );

    const locationOptions = useMemo(
        () =>
            uniqueNonEmptySelectOptions(
                events.map((event) => localizeText(event.location, lang)),
            ),
        [events, lang],
    );

    const filteredEvents = useMemo(
        () =>
            (Array.isArray(events) ? events : []).filter((event) => {
                const matchesSearch = matchesSearchText(searchQuery, [
                    localizeText(event.title, lang),
                    localizeText(event.location, lang),
                    localizeText(event.date, lang),
                    localizeText(event.attendees, lang),
                    localizeText(event.description, lang),
                    localizeText(event.about, lang),
                ]);
                const matchesLocation =
                    selectedLocation === ALL ||
                    localizeText(event.location, lang) === selectedLocation;
                const matchesCategory =
                    selectedCategory === ALL ||
                    event.category_key === selectedCategory;
                const eventAssignments = event.category_assignments;
                const activeTypeFilters = Object.entries(
                    categoryTypeFilters,
                ).filter(([, v]) => v.length > 0);
                const matchesCategoryTypes =
                    activeTypeFilters.length === 0 ||
                    activeTypeFilters.some(
                        ([typeKey, values]) =>
                            eventAssignments &&
                            values.includes(eventAssignments[typeKey]),
                    );
                return (
                    matchesSearch &&
                    matchesLocation &&
                    matchesCategory &&
                    matchesCategoryTypes
                );
            }),
        [
            events,
            lang,
            searchQuery,
            selectedLocation,
            selectedCategory,
            categoryTypeFilters,
        ],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        selectedLocation !== ALL ||
        selectedCategory !== ALL ||
        Object.values(categoryTypeFilters).some((v) => v.length > 0);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedLocation(ALL);
        setSelectedCategory(ALL);
        setCategoryTypeFilters({});
    };

    return (
        <div key={params.toString()} className="min-h-screen bg-background">
            <PageHeroCarousel pageKey="events" />
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
                                { label: t('nav.events'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.header
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <h1 className="mb-3 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('events.title')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('events.subtitle')}
                        </p>
                    </motion.header>

                    <ListFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        resultCount={filteredEvents.length}
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
                            <div>
                                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('events.filterByLocation')}
                                </label>
                                <Select
                                    value={selectedLocation}
                                    onValueChange={setSelectedLocation}
                                >
                                    <SelectTrigger className="w-full rounded-lg border-border bg-background">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>
                                            {t('common.all')}
                                        </SelectItem>
                                        {locationOptions.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={option}
                                            >
                                                {option}
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
                                            type="button"
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
                            {filteredEvents.length === 0 ? (
                                <RequestThingEmptyState
                                    variant={
                                        events.length === 0
                                            ? 'empty'
                                            : 'no-results'
                                    }
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    {filteredEvents.map((e, i) => (
                                        <motion.div
                                            key={e.slug}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="card-elevated group overflow-hidden rounded-2xl bg-card"
                                        >
                                            <div className="h-56 overflow-hidden">
                                                <img
                                                    src={e.image}
                                                    alt={localizeText(
                                                        e.title,
                                                        lang,
                                                    )}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="p-6">
                                                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />{' '}
                                                        {localizeText(
                                                            e.date,
                                                            lang,
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />{' '}
                                                        {localizeText(
                                                            e.location,
                                                            lang,
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />{' '}
                                                        {localizeText(
                                                            e.attendees,
                                                            lang,
                                                        )}
                                                    </span>
                                                </div>
                                                <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                                    {localizeText(
                                                        e.title,
                                                        lang,
                                                    )}
                                                </h3>
                                                <p className="mb-5 text-sm text-muted-foreground">
                                                    {localizeText(
                                                        e.description,
                                                        lang,
                                                    )}
                                                </p>
                                                <Button
                                                    asChild
                                                    className="bg-primary text-primary-foreground"
                                                >
                                                    <Link
                                                        to={`/events/${e.slug}`}
                                                    >
                                                        {t(
                                                            'common.viewDetails',
                                                        )}
                                                    </Link>
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
