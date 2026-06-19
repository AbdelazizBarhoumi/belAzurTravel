import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountries, type LocalizedName } from '@/hooks/useCountries';
import type { Lang } from '@/i18n/translations';

interface CountrySelectProps {
    value: string;
    onChange: (code: string, names: LocalizedName) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

function localizeName(name: LocalizedName, lang: Lang): string {
    return name[lang] || name.en || '';
}

export function CountrySelect({
    value,
    onChange,
    placeholder,
    disabled,
    className,
}: CountrySelectProps) {
    const { lang } = useLanguage();
    const countries = useCountries();

    const selectedCountry = countries.find((c) => c.code === value);

    return (
        <Select
            value={value}
            onValueChange={(code) => {
                const country = countries.find((c) => c.code === code);
                if (country) {
                    onChange(country.code, country.name);
                }
            }}
            disabled={disabled}
        >
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder || 'Select country'}>
                    {selectedCountry
                        ? localizeName(selectedCountry.name, lang)
                        : null}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                        {localizeName(country.name, lang)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
