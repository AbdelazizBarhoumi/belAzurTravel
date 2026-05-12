import { AnimatePresence, motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronDown, MapPin, Minus, Plus, Search, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type SearchTab = 'hotels' | 'tours' | 'flights';

interface SearchWidgetProps {
    className?: string;
}

interface SearchFormValues {
    destination: string;
    dateRange: DateRange | undefined;
    guests: number;
    extras: Record<string, string>;
}

interface ExtraFieldOption {
    value: string;
    labelKey: string;
}

interface ExtraFieldConfig {
    key: string;
    labelKey: string;
    options: ExtraFieldOption[];
}

interface SearchTabConfig {
    titleKey: string;
    buttonKey: string;
    guestLabelKey: string;
    extraFields: ExtraFieldConfig[];
}

const SEARCH_TABS: Record<SearchTab, SearchTabConfig> = {
    hotels: {
        titleKey: 'search.tabs.hotels',
        buttonKey: 'search.actions.hotels',
        guestLabelKey: 'search.fields.guests',
        extraFields: [
            {
                key: 'roomType',
                labelKey: 'search.fields.roomType',
                options: [
                    { value: 'any', labelKey: 'search.options.any' },
                    { value: 'standard', labelKey: 'search.options.standard' },
                    { value: 'deluxe', labelKey: 'search.options.deluxe' },
                    { value: 'suite', labelKey: 'search.options.suite' },
                ],
            },
            {
                key: 'propertyClass',
                labelKey: 'search.fields.propertyClass',
                options: [
                    { value: 'any', labelKey: 'search.options.any' },
                    { value: '3-star', labelKey: 'search.options.threeStar' },
                    { value: '4-star', labelKey: 'search.options.fourStar' },
                    { value: '5-star', labelKey: 'search.options.fiveStar' },
                ],
            },
        ],
    },
    tours: {
        titleKey: 'search.tabs.tours',
        buttonKey: 'search.actions.tours',
        guestLabelKey: 'search.fields.travelers',
        extraFields: [
            {
                key: 'tourStyle',
                labelKey: 'search.fields.tourStyle',
                options: [
                    { value: 'guided', labelKey: 'search.options.guided' },
                    { value: 'private', labelKey: 'search.options.private' },
                    { value: 'group', labelKey: 'search.options.group' },
                ],
            },
            {
                key: 'duration',
                labelKey: 'search.fields.duration',
                options: [
                    { value: 'half-day', labelKey: 'search.options.halfDay' },
                    { value: 'full-day', labelKey: 'search.options.fullDay' },
                    { value: 'multi-day', labelKey: 'search.options.multiDay' },
                ],
            },
        ],
    },
    flights: {
        titleKey: 'search.tabs.flights',
        buttonKey: 'search.actions.flights',
        guestLabelKey: 'search.fields.passengers',
        extraFields: [
            {
                key: 'tripType',
                labelKey: 'search.fields.tripType',
                options: [
                    { value: 'round-trip', labelKey: 'search.options.roundTrip' },
                    { value: 'one-way', labelKey: 'search.options.oneWay' },
                    { value: 'multi-city', labelKey: 'search.options.multiCity' },
                ],
            },
            {
                key: 'cabinClass',
                labelKey: 'search.fields.cabinClass',
                options: [
                    { value: 'economy', labelKey: 'search.options.economy' },
                    { value: 'premium-economy', labelKey: 'search.options.premiumEconomy' },
                    { value: 'business', labelKey: 'search.options.business' },
                    { value: 'first', labelKey: 'search.options.first' },
                ],
            },
        ],
    },
};

const DEFAULT_FORM_STATE: Record<SearchTab, SearchFormValues> = {
    hotels: {
        destination: '',
        dateRange: undefined,
        guests: 2,
        extras: {
            roomType: 'any',
            propertyClass: 'any',
        },
    },
    tours: {
        destination: '',
        dateRange: undefined,
        guests: 2,
        extras: {
            tourStyle: 'guided',
            duration: 'half-day',
        },
    },
    flights: {
        destination: '',
        dateRange: undefined,
        guests: 1,
        extras: {
            tripType: 'round-trip',
            cabinClass: 'economy',
        },
    },
};

const MotionTabsTrigger = motion(TabsTrigger);

const SEARCH_TARGETS: Record<SearchTab, string> = {
    hotels: '/hotels',
    tours: '/tours',
    flights: '/flights',
};

function getLocale(lang: string): string {
    if (lang === 'ar') return 'ar-EG';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
}

interface ActiveSearchFormProps {
    tab: SearchTab;
    values: SearchFormValues;
    onDestinationChange: (value: string) => void;
    onDateRangeChange: (value: DateRange | undefined) => void;
    onGuestChange: (value: number) => void;
    onExtraChange: (key: string, value: string) => void;
}

function SearchFieldLabel({ children }: { children: string }) {
    return <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{children}</span>;
}

function DestinationInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void; }) {
    const { t } = useLanguage();

    return (
        <label className="flex min-w-0 flex-col gap-2">
            <SearchFieldLabel>{label}</SearchFieldLabel>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 shadow-sm backdrop-blur-sm">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <Input
                    aria-label={label}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={t('search.placeholders.destination')}
                    className="border-0 bg-transparent px-0 text-sm shadow-none ring-0 placeholder:text-muted-foreground focus-visible:ring-0"
                />
            </div>
        </label>
    );
}

function DateRangePicker({ label, value, onChange }: { label: string; value: DateRange | undefined; onChange: (value: DateRange | undefined) => void; }) {
    const { lang, t } = useLanguage();
    const locale = getLocale(lang);
    const startLabel = value?.from ? value.from.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : t('search.placeholders.checkIn');
    const endLabel = value?.to ? value.to.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : t('search.placeholders.checkOut');

    return (
        <label className="flex min-w-0 flex-col gap-2">
            <SearchFieldLabel>{label}</SearchFieldLabel>
            <Popover>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="h-12 justify-start gap-3 rounded-2xl border-border/70 bg-background/80 px-4 text-left font-normal shadow-sm backdrop-blur-sm hover:bg-background">
                        <CalendarIcon className="h-5 w-5 shrink-0 text-primary" />
                        <span className="min-w-0 truncate text-sm text-foreground">
                            {value?.from ? `${startLabel} — ${value?.to ? endLabel : t('search.placeholders.flexibleDates')}` : t('search.placeholders.dates')}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="range" selected={value} onSelect={onChange} numberOfMonths={2} initialFocus />
                </PopoverContent>
            </Popover>
        </label>
    );
}

function GuestSelector({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void; }) {
    const { t } = useLanguage();

    return (
        <label className="flex min-w-0 flex-col gap-2">
            <SearchFieldLabel>{label}</SearchFieldLabel>
            <Popover>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="h-12 justify-between rounded-2xl border-border/70 bg-background/80 px-4 shadow-sm backdrop-blur-sm hover:bg-background">
                        <span className="flex items-center gap-3">
                            <Users className="h-5 w-5 shrink-0 text-primary" />
                            <span className="text-sm text-foreground">
                                {value} {value === 1 ? t('search.placeholders.guest') : t('search.placeholders.guests')}
                            </span>
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="start">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{t('search.placeholders.guestsHelp')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="icon" onClick={() => onChange(Math.max(1, value - 1))} aria-label={t('search.actions.decreaseGuests')}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="min-w-8 text-center text-base font-semibold">{value}</span>
                            <Button type="button" variant="outline" size="icon" onClick={() => onChange(value + 1)} aria-label={t('search.actions.increaseGuests')}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </label>
    );
}

function ExtraFieldsByType({ tab, values, onChange }: { tab: SearchTab; values: SearchFormValues; onChange: (key: string, value: string) => void; }) {
    const { t } = useLanguage();
    const config = SEARCH_TABS[tab];

    return (
        <>
            {config.extraFields.map((field) => (
                <label key={field.key} className="flex min-w-0 flex-col gap-2">
                    <SearchFieldLabel>{t(field.labelKey)}</SearchFieldLabel>
                    <Select value={values.extras[field.key]} onValueChange={(value) => onChange(field.key, value)}>
                        <SelectTrigger className="h-12 rounded-2xl border-border/70 bg-background/80 shadow-sm backdrop-blur-sm">
                            <SelectValue placeholder={t(field.labelKey)} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {t(option.labelKey)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </label>
            ))}
        </>
    );
}

function SearchButton({ label }: { label: string }) {
    return (
        <Button type="submit" size="lg" className="h-12 w-full rounded-2xl bg-primary px-8 text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 xl:w-auto">
            <Search className="h-4 w-4" />
            {label}
        </Button>
    );
}

function ActiveSearchForm({ tab, values, onDestinationChange, onDateRangeChange, onGuestChange, onExtraChange }: ActiveSearchFormProps) {
    const { t } = useLanguage();
    const config = SEARCH_TABS[tab];

    return (
        <div className="grid gap-3">
            <div className="grid gap-3 xl:grid-cols-3 xl:items-end">
                <DestinationInput label={t('search.fields.destination')} value={values.destination} onChange={onDestinationChange} />
                <DateRangePicker label={t('search.fields.dates')} value={values.dateRange} onChange={onDateRangeChange} />
                <GuestSelector label={t(config.guestLabelKey)} value={values.guests} onChange={onGuestChange} />
            </div>

            <div className="grid gap-3 xl:grid-cols-3 xl:items-end">
                <ExtraFieldsByType tab={tab} values={values} onChange={onExtraChange} />
                <SearchButton label={t(config.buttonKey)} />
            </div>
        </div>
    );
}

export function SearchWidget({ className }: SearchWidgetProps) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SearchTab>('hotels');
    const [formState, setFormState] = useState<Record<SearchTab, SearchFormValues>>(DEFAULT_FORM_STATE);

    const updateForm = <K extends keyof SearchFormValues>(tab: SearchTab, key: K, value: SearchFormValues[K]) => {
        setFormState((previous) => ({
            ...previous,
            [tab]: {
                ...previous[tab],
                [key]: value,
            },
        }));
    };

    const updateExtraField = (tab: SearchTab, key: string, value: string) => {
        setFormState((previous) => ({
            ...previous,
            [tab]: {
                ...previous[tab],
                extras: {
                    ...previous[tab].extras,
                    [key]: value,
                },
            },
        }));
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value as SearchTab);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const values = formState[activeTab];
        const params = new URLSearchParams();

        if (values.destination.trim()) {
            params.set('destination', values.destination.trim());
        }

        if (values.dateRange?.from) {
            params.set('from', values.dateRange.from.toISOString().slice(0, 10));
        }

        if (values.dateRange?.to) {
            params.set('to', values.dateRange.to.toISOString().slice(0, 10));
        }

        params.set('guests', String(values.guests));

        Object.entries(values.extras).forEach(([key, value]) => {
            if (value && value !== 'any') {
                params.set(key, value);
            }
        });

        const queryString = params.toString();
        navigate(queryString ? `${SEARCH_TARGETS[activeTab]}?${queryString}` : SEARCH_TARGETS[activeTab]);
    };

    return (
        <div className={cn('glass rounded-[2rem] p-4 shadow-2xl shadow-black/10 backdrop-blur-xl md:p-5', className)}>
            <form onSubmit={handleSubmit} className="w-full">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-[1.25rem] bg-background/40 p-1 text-foreground/80">
                    {(Object.keys(SEARCH_TABS) as SearchTab[]).map((tab) => (
                        <MotionTabsTrigger
                            key={tab}
                            value={tab}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            className="relative overflow-hidden rounded-[1rem] px-4 py-3 text-sm font-semibold text-foreground/70 data-[state=active]:text-foreground"
                        >
                            {activeTab === tab && (
                                <motion.span
                                    layoutId="search-tab-indicator"
                                    className="absolute inset-0 rounded-[1rem] bg-background shadow-sm"
                                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                                />
                            )}
                            <span className="relative z-10">{t(SEARCH_TABS[tab].titleKey)}</span>
                        </MotionTabsTrigger>
                    ))}
                </TabsList>

                <div className="mt-4">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="focus-visible:outline-none"
                        >
                            <ActiveSearchForm
                                tab={activeTab}
                                values={formState[activeTab]}
                                onDestinationChange={(value) => updateForm(activeTab, 'destination', value)}
                                onDateRangeChange={(value) => updateForm(activeTab, 'dateRange', value)}
                                onGuestChange={(value) => updateForm(activeTab, 'guests', value)}
                                onExtraChange={(key, value) => updateExtraField(activeTab, key, value)}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Tabs>
            </form>
        </div>
    );
}
