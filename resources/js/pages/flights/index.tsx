import { motion } from 'framer-motion';
import { Plane, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { DatePicker } from '@/components/ui/DatePicker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { getAirportDisplayName, getCityNameByIata } from '@/data/airports';
import { useFlights } from '@/hooks/usePublicData';
import { useViewMode } from '@/hooks/useViewMode';
import { matchesSearchText } from '@/lib/listFilters';
import { cn } from '@/lib/utils';
import { uniqueNonEmptySelectOptions } from '@/lib/selectOptions';

const ALL = 'all';

function FlightsContent() {
    const { t, dir, lang } = useLanguage();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [viewMode, setViewMode] = useViewMode();
    const { data: flights = [] } = useFlights();
    // Accept search params from landing widget / FlightSearchWidget
    const initialSearch = params.get('q') || params.get('destination') || '';
    const initialAirline = params.get('airline') || ALL;
    const initialCabin =
        params.get('cabinClass') || params.get('cabinclass') || ALL;
    const initialTripType = params.get('tripType') || params.get('type') || ALL;
    const initialPassengers = Number(
        params.get('passengers') || params.get('guests') || 1,
    );
    const initialFromDate = params.get('departureDate') || params.get('from') || '';
    const initialToDate = params.get('returnDate') || params.get('to') || '';
    const initialDirectOnly = params.get('directOnly') === '1';
    const initialBaggageIncluded = params.get('baggageIncluded') === '1';
    const initialFlexibility = (params.get('flexibility') || 'exact') as 'exact' | '±1' | '±2' | '±3';
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedAirline, setSelectedAirline] = useState(initialAirline);
    const [selectedStops, setSelectedStops] = useState(ALL);
    const [selectedCabin, setSelectedCabin] = useState(initialCabin);
    const [selectedTripType, setSelectedTripType] = useState(initialTripType);
    const [passengers, setPassengers] = useState(
        Number.isFinite(initialPassengers) && initialPassengers > 0
            ? initialPassengers
            : 1,
    );
    const [fromDate, setFromDate] = useState(initialFromDate);
    const [toDate, setToDate] = useState(initialToDate);
    const [directOnly, setDirectOnly] = useState(initialDirectOnly);
    const [baggageIncluded, setBaggageIncluded] = useState(initialBaggageIncluded);
    const [flexibility, setFlexibility] = useState(initialFlexibility);

    const airlineOptions = useMemo(
        () =>
            uniqueNonEmptySelectOptions(
                flights.map((flight) =>
                    localizeText(flight.airline, lang),
                ),
            ),
        [flights, lang],
    );
    const stopsOptions = useMemo(
        () =>
            uniqueNonEmptySelectOptions(
                flights.map((flight) => localizeText(flight.stops, lang)),
            ),
        [flights, lang],
    );
    const cabinOptions = useMemo(
        () =>
            uniqueNonEmptySelectOptions(
                flights.map((flight) =>
                    localizeText(flight.details.cabin, lang),
                ),
            ),
        [flights, lang],
    );

    const tripTypeOptions = [
        { value: ALL, label: t('common.all') },
        { value: 'round-trip', label: t('search.options.roundTrip') },
        { value: 'one-way', label: t('search.options.oneWay') },
        { value: 'multi-city', label: t('search.options.multiCity') },
    ];

    const filteredFlights = useMemo(
        () =>
            (Array.isArray(flights) ? flights : []).filter((flight) => {
                const fromDateTime = fromDate ? new Date(fromDate) : null;
                const toDateTime = toDate ? new Date(toDate) : null;
                const matchesSearch = matchesSearchText(searchQuery, [
                    localizeText(flight.airline, lang),
                    flight.from,
                    getCityNameByIata(flight.to),
                    localizeText(flight.duration, lang),
                    localizeText(flight.stops, lang),
                    localizeText(flight.details.cabin, lang),
                    localizeText(
                        flight.details.aircraft || { en: '', fr: '', ar: '' },
                        lang,
                    ),
                    localizeText(
                        flight.details.baggage || { en: '', fr: '', ar: '' },
                        lang,
                    ),
                    localizeText(
                        flight.details.refund || { en: '', fr: '', ar: '' },
                        lang,
                    ),
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
                    localizeText(flight.details.cabin, lang) === selectedCabin;
                const matchesPassengers =
                    !passengers ||
                    !flight.details.seats ||
                    flight.details.seats >= passengers;
                const flightDate = flight.details.date
                    ? new Date(flight.details.date)
                    : null;
                const matchesDate =
                    (!fromDateTime && !toDateTime) ||
                    (flightDate instanceof Date &&
                    !Number.isNaN(flightDate.getTime())
                        ? (!fromDateTime || flightDate >= fromDateTime) &&
                          (!toDateTime || flightDate <= toDateTime)
                        : true);
                const matchesTripType =
                    selectedTripType === ALL ||
                    flight.trip_type === selectedTripType;
                const matchesDirect =
                    !directOnly ||
                    flight.direct_only ||
                    localizeText(flight.stops, lang).toLowerCase().includes('direct');
                const matchesBaggage =
                    !baggageIncluded ||
                    flight.baggage_included;

                return (
                    matchesSearch &&
                    matchesAirline &&
                    matchesStops &&
                    matchesCabin &&
                    matchesPassengers &&
                    matchesDate &&
                    matchesTripType &&
                    matchesDirect &&
                    matchesBaggage
                );
            }),
        [
            flights,
            lang,
            searchQuery,
            selectedAirline,
            selectedStops,
            selectedCabin,
            selectedTripType,
            passengers,
            fromDate,
            toDate,
            directOnly,
            baggageIncluded,
        ],
    );

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        selectedAirline !== ALL ||
        selectedStops !== ALL ||
        selectedCabin !== ALL ||
        selectedTripType !== ALL ||
        passengers !== 1 ||
        fromDate !== '' ||
        toDate !== '' ||
        directOnly ||
        baggageIncluded;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedAirline(ALL);
        setSelectedStops(ALL);
        setSelectedCabin(ALL);
        setSelectedTripType(ALL);
        setPassengers(1);
        setFromDate('');
        setToDate('');
        setDirectOnly(false);
        setBaggageIncluded(false);
    };

    return (
        <>
            <PageHeroCarousel pageKey="flights" />
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
                                {t('search.fields.dates')}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <DatePicker
                                    date={
                                        fromDate
                                            ? new Date(fromDate)
                                            : undefined
                                    }
                                    onDateChange={(date) =>
                                        setFromDate(
                                            date
                                                ? date
                                                      .toISOString()
                                                      .split('T')[0]
                                                : '',
                                        )
                                    }
                                    placeholder={t(
                                        'search.placeholders.checkIn',
                                    )}
                                />
                                <DatePicker
                                    date={toDate ? new Date(toDate) : undefined}
                                    onDateChange={(date) =>
                                        setToDate(
                                            date
                                                ? date
                                                      .toISOString()
                                                      .split('T')[0]
                                                : '',
                                        )
                                    }
                                    placeholder={t(
                                        'search.placeholders.checkOut',
                                    )}
                                />
                            </div>
                        </label>

                        <label className="grid gap-2 text-sm">
                            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                {t('search.fields.passengers')}
                            </span>
                            <input
                                type="number"
                                min={1}
                                value={passengers}
                                onChange={(event) =>
                                    setPassengers(
                                        Math.max(
                                            1,
                                            Number(event.target.value) || 1,
                                        ),
                                    )
                                }
                                className="h-12 rounded-2xl border border-border/70 bg-background/90 px-3 text-sm shadow-sm"
                                aria-label={t('search.fields.passengers')}
                            />
                        </label>

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
                                    <SelectValue
                                        placeholder={t('common.all')}
                                    />
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
                                    <SelectValue
                                        placeholder={t('common.all')}
                                    />
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
                                {t('search.fields.tripType')}
                            </span>
                            <Select
                                value={selectedTripType}
                                onValueChange={setSelectedTripType}
                            >
                                <SelectTrigger
                                    aria-label={t('search.fields.tripType')}
                                    className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm"
                                >
                                    <SelectValue
                                        placeholder={t('common.all')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {tripTypeOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
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
                                    <SelectValue
                                        placeholder={t('common.all')}
                                    />
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

                        <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/90 px-4 py-3 shadow-sm">
                            <Switch
                                checked={directOnly}
                                onCheckedChange={setDirectOnly}
                            />
                            <span className="text-sm text-foreground">
                                {t('flights.directOnly') || 'Direct only'}
                            </span>
                        </label>

                        <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/90 px-4 py-3 shadow-sm">
                            <Switch
                                checked={baggageIncluded}
                                onCheckedChange={setBaggageIncluded}
                            />
                            <span className="text-sm text-foreground">
                                {t('flights.withBaggage') || 'With baggage'}
                            </span>
                        </label>

                        <ViewToggle
                            value={viewMode}
                            onChange={setViewMode}
                        />
                    </div>
                </ListFilterBar>

                <div className={cn(
                    'grid gap-4',
                    viewMode === 'grid'
                        ? 'md:grid-cols-2'
                        : 'grid-cols-1',
                )}>
                    {filteredFlights.length === 0 ? (
                        <RequestThingEmptyState
                            variant={
                                flights.length === 0 ? 'empty' : 'no-results'
                            }
                        />
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
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
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
                                            {getAirportDisplayName(f.from)}
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
                                            {getAirportDisplayName(f.to)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    {f.trip_type === 'round-trip' && (
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                                            {t('search.options.roundTrip')}
                                        </span>
                                    )}
                                    {f.trip_type === 'one-way' && (
                                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                                            {t('search.options.oneWay')}
                                        </span>
                                    )}
                                    {f.trip_type === 'multi-city' && (
                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                                            {t('search.options.multiCity')}
                                        </span>
                                    )}
                                    {f.direct_only && (
                                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                                            {t('flights.directOnly') || 'Direct'}
                                        </span>
                                    )}
                                    {f.baggage_included && (
                                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-600">
                                            {t('flights.withBaggage') || 'Baggage'}
                                        </span>
                                    )}
                                </div>

                                <div
                                    className={`text-center md:${dir === 'rtl' ? 'text-left' : 'text-right'}`}
                                >
                                    <p className="text-2xl font-bold text-primary">
                                        {f.price} TND
                                    </p>
                                    <Button
                                        size="sm"
                                        className="mt-2 bg-primary text-primary-foreground"
                                        onClick={() =>
                                            navigate(`/flights/${f.id}`)
                                        }
                                    >
                                        {t('flights.select')}
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </PageShell>
        </>
    );
}

export default function Flights() {
    const location = useLocation();
    return <FlightsContent key={location.search} />;
}
