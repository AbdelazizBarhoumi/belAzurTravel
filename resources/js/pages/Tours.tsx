import { motion } from 'framer-motion';
import { Clock, Users, MapPin, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useTours } from '@/hooks/usePublicData';
import { matchesSearchText } from '@/lib/listFilters';

const ALL = 'all';

const Tours = () => {
    const { t, lang } = useLanguage();
    const { data: tours = [] } = useTours();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(ALL);
    const [selectedDuration, setSelectedDuration] = useState(ALL);

    const locationOptions = useMemo(
        () =>
            Array.from(
                new Set(tours.map((tour) => localizeText(tour.location, lang))),
            ),
        [tours, lang],
    );
    const durationOptions = useMemo(
        () =>
            Array.from(
                new Set(tours.map((tour) => localizeText(tour.duration, lang))),
            ),
        [tours, lang],
    );

    const filteredTours = useMemo(
        () =>
            tours.filter((tour) => {
                const matchesSearch = matchesSearchText(searchQuery, [
                    localizeText(tour.name, lang),
                    localizeText(tour.location, lang),
                    localizeText(tour.duration, lang),
                    localizeText(tour.description, lang),
                ]);
                const matchesLocation =
                    selectedLocation === ALL ||
                    localizeText(tour.location, lang) === selectedLocation;
                const matchesDuration =
                    selectedDuration === ALL ||
                    localizeText(tour.duration, lang) === selectedDuration;

                return matchesSearch && matchesLocation && matchesDuration;
            }),
        [tours, lang, searchQuery, selectedLocation, selectedDuration],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        selectedLocation !== ALL ||
        selectedDuration !== ALL;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedLocation(ALL);
        setSelectedDuration(ALL);
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <div className="flex-1 pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.tours'), active: true },
                            ]}
                        />
                    </motion.div>
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <h1 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('tours.title')}
                        </h1>
                        <p className="mx-auto max-w-xl text-muted-foreground">
                            {t('tours.subtitle')}
                        </p>
                    </motion.div>

                    <ListFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        resultCount={filteredTours.length}
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                        searchPlaceholder={t('common.search')}
                    >
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                            <label className="grid gap-2 text-sm">
                                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('tours.filterByLocation')}
                                </span>
                                <Select
                                    value={selectedLocation}
                                    onValueChange={setSelectedLocation}
                                >
                                    <SelectTrigger
                                        aria-label={t('tours.filterByLocation')}
                                        className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                                    >
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
                            </label>

                            <label className="grid gap-2 text-sm">
                                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('tours.filterByDuration')}
                                </span>
                                <Select
                                    value={selectedDuration}
                                    onValueChange={setSelectedDuration}
                                >
                                    <SelectTrigger
                                        aria-label={t('tours.filterByDuration')}
                                        className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                                    >
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>
                                            {t('common.all')}
                                        </SelectItem>
                                        {durationOptions.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>
                        </div>
                    </ListFilterBar>

                    {/* Grid */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {filteredTours.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground md:col-span-2">
                                {t('common.noResults')}
                            </div>
                        ) : (
                            filteredTours.map((tour, i) => (
                                <Link
                                    key={localizeText(tour.name, lang)}
                                    to={`/tours/${tour.slug}`}
                                    className="group block h-full"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="h-full cursor-pointer"
                                    >
                                        <div className="card-elevated flex h-52 flex-col overflow-hidden rounded-2xl bg-card md:h-52 md:flex-row">
                                            {/* Image */}
                                            <div className="relative h-52 shrink-0 overflow-hidden md:h-full md:w-64">
                                                <img
                                                    src={tour.image}
                                                    alt={localizeText(
                                                        tour.name,
                                                        lang,
                                                    )}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    loading="lazy"
                                                />

                                                <FavoriteButton
                                                    className="absolute right-3 top-3"
                                                    item={{
                                                        id: `tour-${localizeText(tour.name, lang)}`,
                                                        type: 'tour',
                                                        name: localizeText(
                                                            tour.name,
                                                            lang,
                                                        ),
                                                        image: tour.image,
                                                        price: tour.price,
                                                        location: localizeText(
                                                            tour.location,
                                                            lang,
                                                        ),
                                                    }}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex flex-1 flex-col justify-between p-6">
                                                <div>
                                                    <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />{' '}
                                                            {localizeText(
                                                                tour.location,
                                                                lang,
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />{' '}
                                                            {localizeText(
                                                                tour.duration,
                                                                lang,
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />{' '}
                                                            {t('tours.max')}{' '}
                                                            {tour.maxGroup}
                                                        </span>
                                                    </div>

                                                    <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                                        {localizeText(
                                                            tour.name,
                                                            lang,
                                                        )}
                                                    </h3>

                                                    <p className="mb-4 text-sm text-muted-foreground">
                                                        {localizeText(
                                                            tour.description,
                                                            lang,
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="mb-1 flex items-center gap-1 text-secondary">
                                                            <Star className="h-3.5 w-3.5 fill-current" />
                                                            <span className="text-xs font-bold">
                                                                {tour.rating}
                                                            </span>
                                                        </div>

                                                        <span className="text-lg font-bold text-primary">
                                                            $
                                                            {tour.price.toLocaleString()}
                                                        </span>

                                                        <span className="ml-1 text-xs text-muted-foreground">
                                                            {t('tours.person')}
                                                        </span>
                                                    </div>

                                                    <Button className="text-primary-foreground">
                                                        {t('tours.bookTour')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tours;
