import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Flag } from '@/components/ui/Flag';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { COUNTRIES, TN_GOVERNORATES } from '@/data/locations';
import {
    useCities,
    type CityItem,
    type LocalizedName,
} from '@/hooks/useCountries';
import type { Lang } from '@/i18n/translations';
import { cn, foldSearch, matchesSearch } from '@/lib/utils';

interface CitySelectProps {
    countryCode: string | null;
    value: string;
    onChange: (names: LocalizedName) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

interface CityGroup {
    key: string;
    label: string;
    countryCode: string;
    cities: CityItem[];
}

const GOVERNORATE_ORDER = Object.keys(TN_GOVERNORATES);

function localizeName(name: LocalizedName, lang: Lang): string {
    return name[lang] || name.fr || name.en || '';
}

/**
 * Searchable city picker. Tunisian cities are grouped by governorate, other
 * cities by country; every city appears exactly once. Typing filters cities
 * (accent-, case- and Arabic-insensitive) and also matches a governorate
 * name, which keeps its whole group. Free text can still be searched.
 */
export function CitySelect({
    countryCode,
    value,
    onChange,
    placeholder,
    disabled,
    className,
}: CitySelectProps) {
    const { lang, t } = useLanguage();
    const cities = useCities(countryCode);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const selectedCity = cities.find(
        (c) => c.name.en === value || c.name.fr === value || c.name.ar === value,
    );
    const selectedLabel = selectedCity
        ? localizeName(selectedCity.name, lang)
        : value;

    const groups = useMemo<CityGroup[]>(() => {
        const byKey = new Map<string, CityGroup>();

        for (const city of cities) {
            const governorate =
                city.countryCode === 'TN' && city.region
                    ? TN_GOVERNORATES[city.region]
                    : undefined;
            const country = COUNTRIES.find((c) => c.code === city.countryCode);
            const groupName = governorate ?? country?.name;

            const matches = matchesSearch(
                query,
                city.name.fr,
                city.name.en,
                city.name.ar,
                groupName?.fr,
                groupName?.en,
                groupName?.ar,
            );
            if (!matches) continue;

            const key = governorate ? `tn:${city.region}` : `c:${city.countryCode}`;
            if (!byKey.has(key)) {
                byKey.set(key, {
                    key,
                    countryCode: city.countryCode,
                    label: groupName ? localizeName(groupName, lang) : city.countryCode,
                    cities: [],
                });
            }
            byKey.get(key)!.cities.push(city);
        }

        const groupRank = (g: CityGroup) =>
            g.key.startsWith('tn:')
                ? GOVERNORATE_ORDER.indexOf(g.key.slice(3))
                : GOVERNORATE_ORDER.length;

        return [...byKey.values()]
            .map((group) => ({
                ...group,
                // Cities with bookable hotels first, then alphabetical.
                cities: [...group.cities].sort(
                    (a, b) =>
                        Number(b.ostravelId != null) -
                            Number(a.ostravelId != null) ||
                        localizeName(a.name, lang).localeCompare(
                            localizeName(b.name, lang),
                            lang,
                        ),
                ),
            }))
            .sort(
                (a, b) =>
                    groupRank(a) - groupRank(b) ||
                    a.label.localeCompare(b.label, lang),
            );
    }, [cities, query, lang]);

    const typed = query.trim();
    const needle = foldSearch(typed);
    const hasExactMatch = groups.some((g) =>
        g.cities.some((c) =>
            [c.name.fr, c.name.en, c.name.ar].some(
                (n) => foldSearch(n) === needle,
            ),
        ),
    );

    const select = (names: LocalizedName) => {
        onChange(names);
        setOpen(false);
        setQuery('');
    };

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) setQuery('');
            }}
        >
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'flex h-full w-full min-w-0 items-center justify-between gap-2 text-start text-sm outline-none disabled:opacity-50',
                        !selectedLabel && 'text-muted-foreground',
                        className,
                    )}
                >
                    <span className="truncate">
                        {selectedLabel ||
                            placeholder ||
                            t('search.placeholders.destination')}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                sideOffset={12}
                className="w-[min(22rem,calc(100vw-2rem))] p-0"
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder={t('search.citySearchPlaceholder')}
                    />
                    <CommandList className="max-h-[min(22rem,50vh)]">
                        <CommandEmpty>{t('search.cityNoResult')}</CommandEmpty>
                        {typed && !hasExactMatch && (
                            <CommandGroup>
                                <CommandItem
                                    value={`typed:${typed}`}
                                    onSelect={() =>
                                        select({ en: typed, fr: typed, ar: typed })
                                    }
                                >
                                    <Search className="me-2 h-4 w-4 text-primary" />
                                    {t('search.cityUseTyped').replace(
                                        '{query}',
                                        typed,
                                    )}
                                </CommandItem>
                            </CommandGroup>
                        )}
                        {groups.map((group) => (
                            <CommandGroup
                                key={group.key}
                                heading={
                                    <span className="flex items-center gap-2">
                                        <Flag code={group.countryCode} />
                                        {group.label}
                                    </span>
                                }
                            >
                                {group.cities.map((city, index) => (
                                    <CommandItem
                                        key={`${group.key}-${city.name.en}-${index}`}
                                        value={`${group.key}:${city.name.en}:${index}`}
                                        onSelect={() => select(city.name)}
                                    >
                                        <Check
                                            className={cn(
                                                'me-2 h-4 w-4 shrink-0',
                                                city === selectedCity
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        <span className="truncate">
                                            {localizeName(city.name, lang)}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
