import { Country, City } from 'country-state-city';
import countries from 'i18n-iso-countries';
import ar from 'i18n-iso-countries/langs/ar.json';
import en from 'i18n-iso-countries/langs/en.json';
import fr from 'i18n-iso-countries/langs/fr.json';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { getLocalizedName } from '@/data/cityTranslations';
import { useCountries, useCities } from '@/hooks/useCountries';
import type { Lang } from '@/i18n/translations';
import { cn } from '@/lib/utils';

countries.registerLocale(en);
countries.registerLocale(fr);
countries.registerLocale(ar);

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
    const [open, setOpen] = useState(false);
    const allCountries = useCountries();
    const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
    const cities = useCities(selectedCountryCode);

    const t = (name: Record<string, string>, l: Lang) => name[l] || name.en || '';

    const allLocations = useMemo(() => {
        return allCountries.map((c) => ({
            code: c.code,
            nameEn: c.name.en,
            nameDisplay: t(c.name, lang),
        }));
    }, [allCountries, lang]);

    const cityItems = useMemo(() => {
        if (!selectedCountryCode) return [];
        const country = allCountries.find((c) => c.code === selectedCountryCode);
        const countryDisplay = country ? t(country.name, lang) : '';
        return cities.map((city) => ({
            nameEn: city.name.en,
            nameDisplay: `${getLocalizedName(city.name.en, lang)}, ${countryDisplay}`,
            countryCode: selectedCountryCode,
        }));
    }, [cities, selectedCountryCode, allCountries, lang]);

    // Resolve display value from the stored English key
    const displayValue = useMemo(() => {
        if (!value) return '';
        const langKey = lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr' : 'en';

        // Check countries first
        const countryMatch = Country.getAllCountries().find(
            (c) => c.isoCode === value || countries.getName(c.isoCode, 'en') === value,
        );
        if (countryMatch) {
            return countries.getName(countryMatch.isoCode, langKey) || countryMatch.name;
        }

        // Check cities — search all countries
        const allCountryCodes = Country.getAllCountries().map((c) => c.isoCode);
        for (const code of allCountryCodes) {
            const cityList = City.getCitiesOfCountry(code) || [];
            const cityMatch = cityList.find((c) => c.name === value);
            if (cityMatch) {
                const countryName = countries.getName(code, langKey) || code;
                return `${getLocalizedName(cityMatch.name, lang)}, ${countryName}`;
            }
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
                <Command>
                    <CommandInput placeholder="Search countries and cities..." />
                    <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        {!selectedCountryCode ? (
                            <CommandGroup heading="Countries">
                                {allLocations.map((loc) => (
                                    <CommandItem
                                        key={loc.code}
                                        value={loc.nameDisplay}
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
                                        {loc.nameDisplay}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : (
                            <>
                                <CommandGroup heading="Cities">
                                    {cityItems.map((loc) => (
                                        <CommandItem
                                            key={loc.nameEn}
                                            value={loc.nameDisplay}
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
