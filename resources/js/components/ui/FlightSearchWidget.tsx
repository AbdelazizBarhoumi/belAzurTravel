import { ArrowLeftRight, Minus, Plus, Plane, PlaneTakeoff, Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { AirportAutocomplete } from '@/components/ui/AirportAutocomplete';
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
                <div className="flex gap-2">
                    {TRIP_TYPES.map((tt) => (
                        <Button
                            key={tt.value}
                            type="button"
                            variant={tripType === tt.value ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                                'rounded-full text-xs',
                                tripType === tt.value && 'shadow-md',
                            )}
                            onClick={() => handleTripTypeChange(tt.value)}
                        >
                            {t(tt.labelKey)}
                        </Button>
                    ))}
                </div>

                <PassengerCabinPicker
                    value={passengers}
                    onChange={setPassengers}
                    compact
                />

                <Select value={flexibility} onValueChange={(v) => setFlexibility(v as Flexibility)}>
                    <SelectTrigger className="h-10 w-36 rounded-2xl border-border/70 bg-background/80 text-xs shadow-sm backdrop-blur-sm">
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

            {/* Row 2: Segments */}
            <div className="space-y-2">
                {segments.map((segment, index) => (
                    <div
                        key={index}
                        className={cn(
                            'flex flex-wrap items-end gap-2',
                            isRtl && 'flex-row-reverse',
                        )}
                    >
                        <AirportAutocomplete
                            value={segment.from}
                            onChange={(iata) => updateSegment(index, 'from', iata)}
                            label={index === 0 ? t('search.fields.departure') : ''}
                            placeholder={t('search.placeholders.departure')}
                            className="flex-1 min-w-[180px]"
                        />

                        {index === 0 && !showMultiCity && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mb-1 h-10 w-10 shrink-0 rounded-full"
                                onClick={swapFromTo}
                            >
                                <ArrowLeftRight className="h-4 w-4" />
                            </Button>
                        )}

                        <AirportAutocomplete
                            value={segment.to}
                            onChange={(iata) => updateSegment(index, 'to', iata)}
                            label={index === 0 ? t('search.fields.destination') : ''}
                            placeholder={t('search.placeholders.destination')}
                            className="flex-1 min-w-[180px]"
                        />

                        <div className={cn('flex flex-col gap-2', index === 0 && 'min-w-[150px]')}>
                            {index === 0 ? (
                                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    {t('label.departureDate')}
                                </span>
                            ) : (
                                <span className="h-[18px]" />
                            )}
                            <DateRangePicker
                                value={{ from: segment.date, to: segment.date }}
                                onChange={(range) => updateSegment(index, 'date', range?.from)}
                                fromDate={tomorrow}
                            />
                        </div>

                        {showMultiCity && segments.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mb-1 h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
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
                <div className={cn('flex items-center gap-4', isRtl && 'flex-row-reverse')}>
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
                        'h-12 rounded-2xl bg-primary px-8 text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90',
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
