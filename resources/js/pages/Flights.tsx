import { motion } from 'framer-motion';
import { Plane, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
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
import { useFlights } from '@/hooks/usePublicData';
import { matchesSearchText } from '@/lib/listFilters';

const ALL = 'all';

const Flights = () => {
    const { t, dir, lang } = useLanguage();
    const navigate = useNavigate();
    const { data: flights = [] } = useFlights();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAirline, setSelectedAirline] = useState(ALL);
    const [selectedStops, setSelectedStops] = useState(ALL);
    const [selectedCabin, setSelectedCabin] = useState(ALL);

    const airlineOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    flights.map((flight) => localizeText(flight.airline, lang)),
                ),
            ),
        [flights, lang],
    );
    const stopsOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    flights.map((flight) => localizeText(flight.stops, lang)),
                ),
            ),
        [flights, lang],
    );
    const cabinOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    flights.map((flight) => localizeText(flight.cabin, lang)),
                ),
            ),
        [flights, lang],
    );

    const filteredFlights = useMemo(
        () =>
            flights.filter((flight) => {
                const matchesSearch = matchesSearchText(searchQuery, [
                    localizeText(flight.airline, lang),
                    flight.from,
                    localizeText(flight.to, lang),
                    localizeText(flight.duration, lang),
                    localizeText(flight.stops, lang),
                    localizeText(flight.cabin, lang),
                    localizeText(flight.aircraft, lang),
                    localizeText(flight.baggage, lang),
                    localizeText(flight.refund, lang),
                    flight.departure,
                    flight.arrival,
                ]);
                const matchesAirline =
                    selectedAirline === ALL ||
                    localizeText(flight.airline, lang) === selectedAirline;
                const matchesStops =
                    selectedStops === ALL ||
                    localizeText(flight.stops, lang) === selectedStops;
                const matchesCabin =
                    selectedCabin === ALL ||
                    localizeText(flight.cabin, lang) === selectedCabin;

                return (
                    matchesSearch &&
                    matchesAirline &&
                    matchesStops &&
                    matchesCabin
                );
            }),
        [
            flights,
            lang,
            searchQuery,
            selectedAirline,
            selectedStops,
            selectedCabin,
        ],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        selectedAirline !== ALL ||
        selectedStops !== ALL ||
        selectedCabin !== ALL;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedAirline(ALL);
        setSelectedStops(ALL);
        setSelectedCabin(ALL);
    };

    return (
        <PageShell
            titleKey="flights.title"
            subtitleKey="flights.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.flights'), active: true },
            ]}
        >
            <ListFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                resultCount={filteredFlights.length}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                searchPlaceholder={t('common.search')}
            >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {t('flights.filterByAirline')}
                        </span>
                        <Select
                            value={selectedAirline}
                            onValueChange={setSelectedAirline}
                        >
                            <SelectTrigger
                                aria-label={t('flights.filterByAirline')}
                                className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                            >
                                <SelectValue placeholder={t('common.all')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    {t('common.all')}
                                </SelectItem>
                                {airlineOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {t('flights.filterByStops')}
                        </span>
                        <Select
                            value={selectedStops}
                            onValueChange={setSelectedStops}
                        >
                            <SelectTrigger
                                aria-label={t('flights.filterByStops')}
                                className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                            >
                                <SelectValue placeholder={t('common.all')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    {t('common.all')}
                                </SelectItem>
                                {stopsOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {t('flights.filterByCabin')}
                        </span>
                        <Select
                            value={selectedCabin}
                            onValueChange={setSelectedCabin}
                        >
                            <SelectTrigger
                                aria-label={t('flights.filterByCabin')}
                                className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                            >
                                <SelectValue placeholder={t('common.all')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    {t('common.all')}
                                </SelectItem>
                                {cabinOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                </div>
            </ListFilterBar>

            <div className="space-y-4">
                {filteredFlights.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
                        {t('common.noResults')}
                    </div>
                ) : (
                    filteredFlights.map((f, i) => (
                        <motion.div
                            key={f.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="card-elevated flex flex-col items-center gap-6 rounded-2xl bg-card p-5 md:flex-row"
                        >
                            <div className="flex items-center gap-3 md:w-40">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                    <Plane className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {localizeText(f.airline, lang)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {localizeText(f.stops, lang)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-1 items-center justify-center gap-6">
                                <div className="text-center">
                                    <p className="font-bold text-foreground">
                                        {f.departure}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {f.from}
                                    </p>
                                </div>
                                <div className="flex flex-col items-center text-muted-foreground">
                                    <Clock className="mb-1 h-3 w-3" />
                                    <span className="text-xs">
                                        {localizeText(f.duration, lang)}
                                    </span>
                                    {dir === 'rtl' ? (
                                        <ArrowLeft className="mt-1 h-3 w-3" />
                                    ) : (
                                        <ArrowRight className="mt-1 h-3 w-3" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-foreground">
                                        {f.arrival}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {localizeText(f.to, lang)}
                                    </p>
                                </div>
                            </div>

                            <div
                                className={`text-center md:${dir === 'rtl' ? 'text-left' : 'text-right'}`}
                            >
                                <p className="text-2xl font-bold text-primary">
                                    ${f.price}
                                </p>
                                <Button
                                    size="sm"
                                    className="mt-2 bg-primary text-primary-foreground"
                                    onClick={() => navigate(`/flights/${f.id}`)}
                                >
                                    {t('flights.select')}
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </PageShell>
    );
};

export default Flights;
