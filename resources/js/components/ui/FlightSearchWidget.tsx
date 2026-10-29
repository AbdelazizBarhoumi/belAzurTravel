import { ArrowLeftRight, Minus, Plus, Plane, PlaneTakeoff, Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AirportAutocomplete } from '@/components/ui/AirportAutocomplete';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import {
    PassengerCabinPicker,
    type PassengerCabinState,
} from '@/components/ui/PassengerCabinPicker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, toLocalISODate } from '@/lib/utils';

type TripType = 'round-trip' | 'one-way' | 'multi-city';
type Flexibility = 'exact' | '±1' | '±2' | '±3';

interface FlightSegment {
    from: string | null;
    to: string | null;
    date: Date | undefined;
}

interface FlightSearchFormState {
    tripType: TripType;
    passengers: PassengerCabinState;
    flexibility: Flexibility;
    directOnly: boolean;
    baggageIncluded: boolean;
    segments: FlightSegment[];
}

interface FlightSearchWidgetProps {
    className?: string;
    compact?: boolean;
    initialValues?: Partial<FlightSearchFormState>;
    onSearch?: (params: URLSearchParams) => void;
}

const TRIP_TYPES: { value: TripType; labelKey: string }[] = [
    { value: 'round-trip', labelKey: 'search.options.roundTrip' },
    { value: 'one-way', labelKey: 'search.options.oneWay' },
    { value: 'multi-city', labelKey: 'search.options.multiCity' },
];

const FLEX_OPTIONS: { value: Flexibility; labelKey: string }[] = [
    { value: 'exact', labelKey: 'search.options.exactDates' },
    { value: '±1', labelKey: 'search.options.plusMinus1Day' },
    { value: '±2', labelKey: 'search.options.plusMinus2Days' },
    { value: '±3', labelKey: 'search.options.plusMinus3Days' },
];

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

export function FlightSearchWidget({
    className,
    compact = false,
    initialValues,
    onSearch,
}: FlightSearchWidgetProps) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const navigate = useNavigate();

    const [tripType, setTripType] = useState<TripType>(
        initialValues?.tripType ?? 'round-trip',
    );
    const [passengers, setPassengers] = useState<PassengerCabinState>(
        initialValues?.passengers ?? {
            adults: 1,
            children: 0,
            infants: 0,
            cabinClass: 'economy',
        },
    );
    const [flexibility, setFlexibility] = useState<Flexibility>(
        initialValues?.flexibility ?? 'exact',
    );
    const [directOnly, setDirectOnly] = useState(
        initialValues?.directOnly ?? false,
    );
    const [baggageIncluded, setBaggageIncluded] = useState(
        initialValues?.baggageIncluded ?? false,
    );
    const [segments, setSegments] = useState<FlightSegment[]>(
        initialValues?.segments ?? [
            { from: null, to: null, date: undefined },
        ],
    );

    const updateSegment = useCallback(
        (index: number, field: keyof FlightSegment, value: unknown) => {
            setSegments((prev) => {
                const next = [...prev];
                next[index] = { ...next[index], [field]: value } as FlightSegment;
                return next;
            });
        },
        [],
    );

    const addSegment = useCallback(() => {
        setSegments((prev) => [
            ...prev,
            {
                from: prev[prev.length - 1]?.to ?? null,
                to: null,
                date: undefined,
            },
        ]);
    }, []);

    const removeSegment = useCallback((index: number) => {
        setSegments((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const swapFromTo = useCallback(() => {
        setSegments((prev) => {
            if (prev.length !== 1) return prev;
            const s = prev[0];
            return [{ ...s, from: s.to, to: s.from }];
        });
    }, []);

    const buildParams = useCallback((): URLSearchParams => {
        const params = new URLSearchParams();

        params.set('tripType', tripType);
        params.set(
            'passengers',
            String(passengers.adults + passengers.children + passengers.infants),
        );
        params.set('adults', String(passengers.adults));
        if (passengers.children > 0)
            params.set('children', String(passengers.children));
        if (passengers.infants > 0)
            params.set('infants', String(passengers.infants));
        params.set('cabinClass', passengers.cabinClass);
        params.set('flexibility', flexibility);

        if (directOnly) params.set('directOnly', '1');
        if (baggageIncluded) params.set('baggageIncluded', '1');

        if (tripType === 'multi-city') {
            segments.forEach((seg, i) => {
                if (seg.from) params.set(`from_${i}`, seg.from);
                if (seg.to) params.set(`to_${i}`, seg.to);
                if (seg.date) params.set(`date_${i}`, toLocalISODate(seg.date) ?? '');
            });
        } else {
            if (segments[0]?.from) params.set('from', segments[0].from);
            if (segments[0]?.to) params.set('to', segments[0].to);
            if (segments[0]?.date)
                params.set('departureDate', toLocalISODate(segments[0].date) ?? '');

            if (tripType === 'round-trip' && segments[1]?.date) {
                params.set('returnDate', toLocalISODate(segments[1].date) ?? '');
            }
        }

        return params;
    }, [tripType, passengers, flexibility, directOnly, baggageIncluded, segments]);

    const handleSearch = useCallback(
        (e?: React.MouseEvent | React.FormEvent) => {
            e?.preventDefault();
            const params = buildParams();

            if (onSearch) {
                onSearch(params);
            } else {
                const qs = params.toString();
                navigate(qs ? `/flights?${qs}` : '/flights');
            }
        },
        [buildParams, onSearch, navigate],
    );

    const handleTripTypeChange = useCallback(
        (value: string) => {
            const newType = value as TripType;
            setTripType(newType);
            if (newType === 'one-way') {
                setSegments((prev) => [prev[0] ?? { from: null, to: null, date: undefined }]);
            } else if (newType === 'round-trip') {
                setSegments((prev) => {
                    const first = prev[0] ?? { from: null, to: null, date: undefined };
                    return [first, { from: first.to, to: first.from, date: undefined }];
                });
            }
        },
        [],
    );

    const showRoundTrip = tripType === 'round-trip';
    const showMultiCity = tripType === 'multi-city';

    return (
        <div className={cn('space-y-4', className)}>
            {/* Row 1: Trip type + passengers + flexibility + toggles */}
            <div className={cn(
                'flex flex-wrap items-end gap-3',
                isRtl && 'flex-row-reverse',
            )}>
                <div className="-mx-1 flex w-full gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
                    {TRIP_TYPES.map((tt) => (
                        <Button
                            key={tt.value}
                            type="button"
                            variant={tripType === tt.value ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                                'shrink-0 rounded-full text-xs',
                                tripType === tt.value && 'shadow-md',
                            )}
                            onClick={() => handleTripTypeChange(tt.value)}
                        >
                            {t(tt.labelKey)}
                        </Button>
                    ))}
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
                <PassengerCabinPicker
                    value={passengers}
                    onChange={setPassengers}
                    compact
                    className="w-full min-w-0 sm:w-auto"
                />

                <Select value={flexibility} onValueChange={(v) => setFlexibility(v as Flexibility)}>
                    <SelectTrigger className="h-10 w-full rounded-2xl border-border/70 bg-background/80 text-xs shadow-sm backdrop-blur-sm sm:w-36">
                        <SelectValue placeholder={t('search.fields.flexibility')} />
                    </SelectTrigger>
                    <SelectContent>
                        {FLEX_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {t(opt.labelKey)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                </div>
            </div>

            {/* Row 2: Segments */}
            <div className="space-y-2">
                {segments.map((segment, index) => (
                    <div
                        key={index}
                        className={cn(
                            'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end',
                            isRtl && 'sm:flex-row-reverse',
                            index > 0 && 'border-t border-border/50 pt-3 sm:border-0 sm:pt-0',
                        )}
                    >
                        <AirportAutocomplete
                            value={segment.from}
                            onChange={(iata) => updateSegment(index, 'from', iata)}
                            label={index === 0 ? t('search.fields.departure') : ''}
                            placeholder={t('search.placeholders.departure')}
                            className="w-full sm:w-auto sm:min-w-[180px] sm:flex-1"
                        />

                        {index === 0 && !showMultiCity && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label={t('search.actions.swap')}
                                className="-my-3 h-9 w-9 shrink-0 self-center rounded-full bg-background shadow-sm sm:my-0 sm:mb-1 sm:h-10 sm:w-10 sm:self-end sm:border-0 sm:bg-transparent sm:shadow-none"
                                onClick={swapFromTo}
                            >
                                <ArrowLeftRight className="h-4 w-4 rotate-90 sm:rotate-0" />
                            </Button>
                        )}

                        <AirportAutocomplete
                            value={segment.to}
                            onChange={(iata) => updateSegment(index, 'to', iata)}
                            label={index === 0 ? t('search.fields.destination') : ''}
                            placeholder={t('search.placeholders.destination')}
                            className="w-full sm:w-auto sm:min-w-[180px] sm:flex-1"
                        />

                        <div className={cn('flex w-full flex-col gap-2 sm:w-auto', index === 0 && 'sm:min-w-[150px]')}>
                            {index === 0 ? (
                                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('label.departureDate')}
                                </span>
                            ) : (
                                <span className="hidden h-[18px] sm:block" />
                            )}
                            <DateRangePicker
                                value={{ from: segment.date, to: segment.date }}
                                onChange={(range) => updateSegment(index, 'date', range?.from)}
                                fromDate={tomorrow}
                                className="h-12 w-full sm:h-12"
                            />
                        </div>

                        {showMultiCity && segments.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 shrink-0 self-end rounded-full text-muted-foreground hover:text-destructive sm:mb-1"
                                onClick={() => removeSegment(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}

                {showMultiCity && segments.length < 6 && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-full"
                        onClick={addSegment}
                    >
                        <Plus className="h-3 w-3" />
                        {t('search.options.addFlight')}
                    </Button>
                )}
            </div>

            {/* Row 3: Toggles + Search */}
            <div className={cn(
                'flex flex-wrap items-center justify-between gap-3',
                isRtl && 'flex-row-reverse',
            )}>
                <div className={cn('flex w-full flex-wrap items-center gap-x-4 gap-y-2 sm:w-auto', isRtl && 'flex-row-reverse')}>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={directOnly}
                            onCheckedChange={setDirectOnly}
                        />
                        <span className="text-xs text-muted-foreground">
                            {t('search.fields.directFlights')}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch
                            checked={baggageIncluded}
                            onCheckedChange={setBaggageIncluded}
                        />
                        <span className="text-xs text-muted-foreground">
                            {t('search.fields.withBaggage')}
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    size="lg"
                    onClick={handleSearch}
                    className={cn(
                        'h-12 w-full rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 sm:w-auto sm:text-sm',
                        isRtl && 'flex-row-reverse',
                    )}
                >
                    <Search className="h-4 w-4" />
                    {t('search.actions.flights')}
                </Button>
            </div>
        </div>
    );
}
