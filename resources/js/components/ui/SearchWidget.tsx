import { AnimatePresence, motion } from 'framer-motion';
import {
    BedDouble,
    Compass,
    Globe2,
    MapPin,
    Plane,
    Search,
    type LucideIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CitySelect } from '@/components/ui/CitySelect';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { FlightSearchWidget } from '@/components/ui/FlightSearchWidget';
import {
    OccupancyPicker,
    type Occupancy,
} from '@/components/ui/OccupancyPicker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LocalizedName } from '@/data/locations';
import { cn, toLocalISODate } from '@/lib/utils';

type SearchTab = 'hotels' | 'tours' | 'flights' | 'travels';

interface SearchWidgetProps {
    className?: string;
}

interface SearchFormValues {
    city: LocalizedName | null;
    hotelName: string;
    dateRange: DateRange | undefined;
    occupancy: Occupancy;
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
        extraFields: [],
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
                    {
                        value: 'multi-day',
                        labelKey: 'search.options.multiDay',
                    },
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
                    {
                        value: 'round-trip',
                        labelKey: 'search.options.roundTrip',
                    },
                    { value: 'one-way', labelKey: 'search.options.oneWay' },
                    {
                        value: 'multi-city',
                        labelKey: 'search.options.multiCity',
                    },
                ],
            },
            {
                key: 'cabinClass',
                labelKey: 'search.fields.cabinClass',
                options: [
                    { value: 'economy', labelKey: 'search.options.economy' },
                    {
                        value: 'premium-economy',
                        labelKey: 'search.options.premiumEconomy',
                    },
                    { value: 'business', labelKey: 'search.options.business' },
                    { value: 'first', labelKey: 'search.options.first' },
                ],
            },
        ],
    },
    travels: {
        titleKey: 'search.tabs.travels',
        buttonKey: 'search.actions.travels',
        guestLabelKey: 'search.fields.travelers',
        extraFields: [
            {
                key: 'tripType',
                labelKey: 'search.fields.tripTypeTravel',
                options: [
                    { value: 'organise', labelKey: 'search.options.organized' },
                    { value: 'a_la_carte', labelKey: 'search.options.aLaCarte' },
                ],
            },
        ],
    },
};

const DEFAULT_FORM_STATE: Record<SearchTab, SearchFormValues> = {
    hotels: {
        city: null,
        hotelName: '',
        dateRange: undefined,
        occupancy: { adults: 1, childAges: [] },
        extras: {
            propertyClass: 'any',
        },
    },
    tours: {
        city: null,
        hotelName: '',
        dateRange: undefined,
        occupancy: { adults: 2, childAges: [] },
        extras: {
            tourStyle: 'guided',
            duration: 'half-day',
        },
    },
    flights: {
        city: null,
        hotelName: '',
        dateRange: undefined,
        occupancy: { adults: 1, childAges: [] },
        extras: {
            tripType: 'round-trip',
            cabinClass: 'economy',
        },
    },
    travels: {
        city: null,
        hotelName: '',
        dateRange: undefined,
        occupancy: { adults: 2, childAges: [] },
        extras: {
            tripType: 'organise',
        },
    },
};

const MotionTabsTrigger = motion.create(TabsTrigger);

const TAB_ICONS: Record<SearchTab, LucideIcon> = {
    hotels: BedDouble,
    tours: Compass,
    flights: Plane,
    travels: Globe2,
};

const SEARCH_TARGETS: Record<SearchTab, string> = {
    hotels: '/hotels',
    tours: '/tours',
    flights: '/flights',
    travels: '/travels',
};

interface ActiveSearchFormProps {
    tab: SearchTab;
    values: SearchFormValues;
    onCityChange: (names: LocalizedName) => void;
    onHotelNameChange: (value: string) => void;
    onDateRangeChange: (value: DateRange | undefined) => void;
    onOccupancyChange: (value: Occupancy) => void;
    onExtraChange: (key: string, value: string) => void;
}

function SearchFieldLabel({ children }: { children: string }) {
    return (
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">
            {children}
        </span>
    );
}

function ExtraFieldsByType({
    tab,
    values,
    onChange,
}: {
    tab: SearchTab;
    values: SearchFormValues;
    onChange: (key: string, value: string) => void;
}) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const config = SEARCH_TABS[tab];
    const fields = isRtl
        ? [...config.extraFields].reverse()
        : config.extraFields;

    return (
        <>
            {fields.map((field) => (
                <label
                    key={field.key}
                    className="flex min-w-0 flex-col gap-2"
                >
                    <SearchFieldLabel>{t(field.labelKey)}</SearchFieldLabel>
                    <Select
                        value={values.extras[field.key]}
                        onValueChange={(value) => onChange(field.key, value)}
                    >
                        <SelectTrigger className="h-12 rounded-2xl border-border/70 bg-background/80 shadow-sm backdrop-blur-sm">
                            <SelectValue placeholder={t(field.labelKey)} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
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
    const { dir } = useLanguage();
    const isRtl = dir === 'rtl';

    return (
        <Button
            type="submit"
            size="lg"
            className={cn(
                'h-12 w-full rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 sm:text-sm xl:w-auto',
                isRtl && 'flex-row-reverse',
            )}
        >
            <Search className="h-4 w-4" />
            {label}
        </Button>
    );
}

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

function ActiveSearchForm({
    tab,
    values,
    onCityChange,
    onHotelNameChange,
    onDateRangeChange,
    onOccupancyChange,
    onExtraChange,
}: ActiveSearchFormProps) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';

    if (tab === 'flights') {
        return <FlightSearchWidget />;
    }

    const config = SEARCH_TABS[tab];

    const topFields = [
        <label
            key="city"
            className="flex min-w-0 flex-col gap-2"
        >
            <SearchFieldLabel>{t('search.fields.destination')}</SearchFieldLabel>
            <div
                className={cn(
                    'flex h-12 items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 shadow-sm backdrop-blur-sm',
                    isRtl && 'flex-row-reverse',
                )}
            >
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <CitySelect
                    countryCode={null}
                    value={values.city?.en || ''}
                    onChange={onCityChange}
                    placeholder={t('search.placeholders.destination')}
                    className="border-0 bg-transparent px-0 text-sm shadow-none ring-0 placeholder:text-muted-foreground focus-visible:ring-0"
                />
            </div>
        </label>,
        ...(tab === 'hotels'
            ? [
                  <label
                      key="hotelName"
                      className="flex min-w-0 flex-col gap-2"
                  >
                      <SearchFieldLabel>{t('search.fields.hotelName')}</SearchFieldLabel>
                      <div
                          className={cn(
                              'flex h-12 items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 shadow-sm backdrop-blur-sm',
                              isRtl && 'flex-row-reverse',
                          )}
                      >
                          <Search className="h-5 w-5 shrink-0 text-primary" />
                          <input
                              type="text"
                              value={values.hotelName}
                              onChange={(e) => onHotelNameChange(e.target.value)}
                              placeholder={t('search.placeholders.hotelName')}
                              className="h-full w-full min-w-0 flex-1 truncate border-0 bg-transparent px-0 text-sm shadow-none ring-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                          />
                      </div>
                  </label>,
              ]
            : []),
        <DateRangePicker
            key="dates"
            value={values.dateRange}
            onChange={onDateRangeChange}
            fromDate={tomorrow}
            className="h-12 w-full gap-3 px-4 sm:h-12"
        />,
        <OccupancyPicker
            key="guests"
            value={values.occupancy}
            onChange={onOccupancyChange}
            className="h-12 w-full px-4 sm:h-12"
        />,
    ];

    const orderedTopFields = isRtl ? [...topFields].reverse() : topFields;

    return (
        <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:items-end">
                {orderedTopFields}
            </div>

            <div
                className={cn(
                    'grid gap-3 xl:grid-cols-3 xl:items-end',
                    isRtl && 'xl:[direction:rtl]',
                )}
            >
                <ExtraFieldsByType
                    tab={tab}
                    values={values}
                    onChange={onExtraChange}
                />
                <div
                    className={cn(
                        'mt-1 w-full xl:col-start-3 xl:mt-0 xl:w-auto xl:justify-self-end',
                        isRtl && 'xl:justify-self-start',
                    )}
                >
                    <SearchButton label={t(config.buttonKey)} />
                </div>
            </div>
        </div>
    );
}

export function SearchWidget({ className }: SearchWidgetProps) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SearchTab>('hotels');
    const [formState, setFormState] =
        useState<Record<SearchTab, SearchFormValues>>(DEFAULT_FORM_STATE);

    const updateForm = <K extends keyof SearchFormValues>(
        tab: SearchTab,
        key: K,
        value: SearchFormValues[K],
    ) => {
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

    const handleCityChange = (
        tab: SearchTab,
        names: LocalizedName,
    ) => {
        updateForm(tab, 'city', names);
    };

    const handleHotelNameChange = (tab: SearchTab, value: string) => {
        updateForm(tab, 'hotelName', value);
    };

    const handleOccupancyChange = (
        tab: SearchTab,
        value: Occupancy,
    ) => {
        updateForm(tab, 'occupancy', value);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const values = formState[activeTab];
        const params = new URLSearchParams();

        if (activeTab === 'hotels' && values.hotelName) {
            params.set('q', values.hotelName);
        } else if (values.city?.en) {
            params.set('q', values.city.en);
        }

        if (values.dateRange?.from) {
            params.set(
                'from',
                toLocalISODate(values.dateRange.from) ?? '',
            );
        }

        if (values.dateRange?.to) {
            params.set('to', toLocalISODate(values.dateRange.to) ?? '');
        }

        params.set('guests', String(values.occupancy.adults));

        if (values.occupancy.childAges.length > 0) {
            params.set('children', values.occupancy.childAges.join(','));
        }

        if (activeTab === 'hotels') {
            const propertyClass = values.extras.propertyClass;

            if (propertyClass && propertyClass !== 'any') {
                const stars = propertyClass.replace(/[^0-9]/g, '');
                if (stars) {
                    params.set('stars', stars);
                }
            }
        }

        if (activeTab === 'tours') {
            const tourStyle = values.extras.tourStyle;
            const duration = values.extras.duration;

            if (tourStyle) {
                params.set('cat', tourStyle);
            }

            if (duration) {
                params.set('duration', duration);
            }
        }

        if (activeTab === 'flights') {
            const tripType = values.extras.tripType;
            const cabinClass = values.extras.cabinClass;

            if (tripType && tripType !== 'any') {
                params.set('type', tripType);
            }

            if (cabinClass && cabinClass !== 'any') {
                params.set('cabinClass', cabinClass);
            }
        }

        if (activeTab === 'travels') {
            const tripType = values.extras.tripType;

            if (tripType) {
                params.set('category_trip_type', tripType);
            }
        }

        Object.entries(values.extras).forEach(([key, value]) => {
            if (
                activeTab === 'hotels' &&
                key === 'propertyClass'
            ) {
                return;
            }

            if (
                activeTab === 'tours' &&
                (key === 'tourStyle' || key === 'duration')
            ) {
                return;
            }

            if (activeTab === 'flights' && key === 'cabinClass') {
                return;
            }

            if (activeTab === 'flights' && key === 'tripType') {
                return;
            }

            if (activeTab === 'travels' && key === 'tripType') {
                return;
            }

            if (value && value !== 'any') {
                params.set(key, value);
            }
        });

        const queryString = params.toString();
        navigate(
            queryString
                ? `${SEARCH_TARGETS[activeTab]}?${queryString}`
                : SEARCH_TARGETS[activeTab],
        );
    };

    const tabs = Object.keys(SEARCH_TABS) as SearchTab[];
    const orderedTabs = isRtl ? [...tabs].reverse() : tabs;

    return (
        <div
            dir={dir}
            className={cn(
                'glass rounded-3xl p-3 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-4 md:rounded-[2rem] md:p-5',
                className,
            )}
        >
            <form onSubmit={handleSubmit} className="w-full">
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="w-full"
                >
                    <TabsList className="flex h-auto w-full snap-x snap-mandatory justify-start gap-1 overflow-x-auto rounded-[1.25rem] bg-background/40 p-1 text-foreground/80 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {orderedTabs.map((tab) => (
                            <MotionTabsTrigger
                                key={tab}
                                value={tab}
                                onFocus={(e) =>
                                    e.currentTarget.scrollIntoView({
                                        block: 'nearest',
                                        inline: 'nearest',
                                        behavior: 'smooth',
                                    })
                                }
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 500,
                                    damping: 35,
                                }}
                                className="relative min-w-max shrink-0 snap-start overflow-hidden rounded-[1rem] px-3.5 py-2.5 text-sm font-semibold text-foreground/70 data-[state=active]:text-foreground md:px-4 md:py-3 xl:flex-1"
                            >
                                {activeTab === tab && (
                                    <motion.span
                                        layoutId="search-tab-indicator"
                                        className="absolute inset-0 rounded-[1rem] bg-background shadow-sm"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 500,
                                            damping: 40,
                                        }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                                    {(() => {
                                        const Icon = TAB_ICONS[tab];
                                        return (
                                            <Icon
                                                className={cn(
                                                    'h-4 w-4 shrink-0',
                                                    activeTab === tab
                                                        ? 'text-primary'
                                                        : 'text-foreground/50',
                                                )}
                                            />
                                        );
                                    })()}
                                    {t(SEARCH_TABS[tab].titleKey)}
                                </span>
                            </MotionTabsTrigger>
                        ))}
                    </TabsList>

                    <div className="mt-3 md:mt-4">
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
                                    onCityChange={(names) =>
                                        handleCityChange(activeTab, names)
                                    }
                                    onHotelNameChange={(value) =>
                                        handleHotelNameChange(activeTab, value)
                                    }
                                    onDateRangeChange={(value) =>
                                        updateForm(activeTab, 'dateRange', value)
                                    }
                                    onOccupancyChange={(value) =>
                                        handleOccupancyChange(activeTab, value)
                                    }
                                    onExtraChange={(key, value) =>
                                        updateExtraField(activeTab, key, value)
                                    }
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Tabs>
            </form>
        </div>
    );
}
