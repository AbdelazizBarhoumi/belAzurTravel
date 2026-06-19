import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCities, type LocalizedName } from '@/hooks/useCountries';
import type { Lang } from '@/i18n/translations';

interface CitySelectProps {
    countryCode: string | null;
    value: string;
    onChange: (names: LocalizedName) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

function localizeName(name: LocalizedName, lang: Lang): string {
    return name[lang] || name.en || '';
}

export function CitySelect({
    countryCode,
    value,
    onChange,
    placeholder,
    disabled,
    className,
}: CitySelectProps) {
    const { lang } = useLanguage();
    const cities = useCities(countryCode);

    const selectedCity = cities.find(
        (c) => c.name.en === value || c.name.fr === value || c.name.ar === value,
    );

    return (
        <Select
            value={value}
            onValueChange={(val) => {
                const city = cities.find(
                    (c) =>
                        c.name.en === val ||
                        c.name.fr === val ||
                        c.name.ar === val,
                );
                if (city) {
                    onChange(city.name);
                }
            }}
            disabled={disabled || !countryCode}
        >
            <SelectTrigger className={className}>
                <SelectValue
                    placeholder={
                        !countryCode
                            ? 'Select country first'
                            : placeholder || 'Select city'
                    }
                >
                    {selectedCity
                        ? localizeName(selectedCity.name, lang)
                        : null}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {cities.map((city, index) => (
                    <SelectItem
                        key={`${city.name.en}-${index}`}
                        value={city.name.en}
                    >
                        {localizeName(city.name, lang)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
