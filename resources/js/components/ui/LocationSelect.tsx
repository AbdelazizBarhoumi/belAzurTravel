import { ChevronDown, Check } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
import {
    COUNTRIES,
    findCityByEnglishName,
    findCountryByCodeOrEnglishName,
    getCitiesByCountry,
    type LocalizedName,
} from '@/data/locations';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { cn, matchesSearch } from '@/lib/utils';

// Accent/case-insensitive matching over every name packed into an item value.
const filterLocations = (itemValue: string, search: string) =>
    matchesSearch(search, itemValue) ? 1 : 0;

interface LocationSelectProps {
    value: string;
    onChange: (location: string) => void;
    lang: Lang;
    placeholder?: string;
    className?: string;
    countryOnly?: boolean;
}

export function LocationSelect({
    value,
    onChange,
    lang,
    placeholder = 'Search location...',
    className,
    countryOnly = false,
}: LocationSelectProps) {
    const { t: translate } = useLanguage();
    const [open, setOpen] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
    const cities = useMemo(
        () => getCitiesByCountry(selectedCountryCode),
        [selectedCountryCode],
    );

    const t = (name: LocalizedName, l: Lang) => name[l] || name.en || '';

    const allLocations = useMemo(() => {
        return COUNTRIES.map((c) => ({
            code: c.code,
            nameEn: c.name.en,
            nameDisplay: t(c.name, lang),
            keywords: `${c.name.fr} ${c.name.en} ${c.name.ar} ${c.code}`,
        }));
    }, [lang]);

    const cityItems = useMemo(() => {
        if (!selectedCountryCode) return [];
        const country = COUNTRIES.find((c) => c.code === selectedCountryCode);
        const countryDisplay = country ? t(country.name, lang) : '';
        return cities.map((city) => ({
            nameEn: city.name.en,
            nameDisplay: `${t(city.name, lang)}, ${countryDisplay}`,
            keywords: `${city.name.fr} ${city.name.en} ${city.name.ar}`,
            countryCode: selectedCountryCode,
        }));
    }, [cities, selectedCountryCode, lang]);

    // Resolve display value from the stored English key
    const displayValue = useMemo(() => {
        if (!value) return '';

        // Check countries first
        const countryMatch = findCountryByCodeOrEnglishName(value);
        if (countryMatch) {
            return t(countryMatch.name, lang);
        }

        // Check cities
        const cityMatch = findCityByEnglishName(value);
        if (cityMatch) {
            const countryName = COUNTRIES.find(
                (c) => c.code === cityMatch.countryCode,
            )?.name;
            return `${t(cityMatch.name, lang)}${countryName ? `, ${t(countryName, lang)}` : ''}`;
        }

        // Fallback: raw value (custom or unrecognized)
        return value;
    }, [value, lang]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between font-normal',
                        !value && 'text-muted-foreground',
                        className,
                    )}
                >
                    {displayValue || placeholder}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command filter={filterLocations}>
                    <CommandInput placeholder={placeholder} />
                    <CommandList>
                        <CommandEmpty>{translate('location.noResult')}</CommandEmpty>
                        {!selectedCountryCode ? (
                            <CommandGroup heading={translate('location.countries')}>
                                {allLocations.map((loc) => (
                                    <CommandItem
                                        key={loc.code}
                                        value={loc.keywords}
                                        onSelect={() => {
                                            if (countryOnly) {
                                                onChange(loc.nameEn);
                                                setOpen(false);
                                            } else {
                                                setSelectedCountryCode(loc.code);
                                            }
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === loc.nameEn ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                        <Flag code={loc.code} className="me-2" />
                                        {loc.nameDisplay}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : (
                            <>
                                <CommandGroup heading={translate('location.cities')}>
                                    {cityItems.map((loc, index) => (
                                        <CommandItem
                                            key={`${loc.nameEn}-${index}`}
                                            value={`${loc.keywords} ${index}`}
                                            onSelect={() => {
                                                onChange(loc.nameEn);
                                                setOpen(false);
                                                setSelectedCountryCode(null);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    value === loc.nameEn ? 'opacity-100' : 'opacity-0',
                                                )}
                                            />
                                            {loc.nameDisplay}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandGroup>
                                    <CommandItem
                                        value={`${allLocations.find((c) => c.code === selectedCountryCode)?.nameDisplay || ''} (country only)`}
                                        onSelect={() => {
                                            const country = allLocations.find((c) => c.code === selectedCountryCode);
                                            if (country) onChange(country.nameEn);
                                            setOpen(false);
                                            setSelectedCountryCode(null);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === allLocations.find((c) => c.code === selectedCountryCode)?.nameEn
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        {allLocations.find((c) => c.code === selectedCountryCode)?.nameDisplay} (country only)
                                    </CommandItem>
                                </CommandGroup>
                                <CommandGroup>
                                    <CommandItem value="back" onSelect={() => setSelectedCountryCode(null)}>
                                        ← Back to countries
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}