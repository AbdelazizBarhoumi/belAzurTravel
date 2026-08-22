import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface CityOption {
    key: string;
    label: { en: string; fr: string; ar: string };
    count: number;
}

interface CityFilterProps {
    cities: CityOption[];
    selected: string[];
    onChange: (values: string[]) => void;
    lang: string;
}

export function CityFilter({
    cities,
    selected,
    onChange,
    lang,
}: CityFilterProps) {
    const { dir } = useLanguage();
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [triggerWidth, setTriggerWidth] = useState(0);

    const selectedLabels = cities
        .filter((c) => selected.includes(c.key))
        .map((c) => c.label[lang] || c.label.en);

    const placeholder =
        lang === 'fr'
            ? 'Toutes les villes'
            : lang === 'ar'
              ? 'كل المدن'
              : 'All cities';
    const searchPlaceholder =
        lang === 'fr'
            ? 'Rechercher une ville...'
            : lang === 'ar'
              ? 'ابحث عن مدينة...'
              : 'Search cities...';
    const emptyText =
        lang === 'fr'
            ? 'Aucune ville trouvée.'
            : lang === 'ar'
              ? 'لم يتم العثور على مدينة.'
              : 'No cities found.';
    const clearText =
        lang === 'fr'
            ? 'Effacer la sélection'
            : lang === 'ar'
              ? 'مسح التحديد'
              : 'Clear selection';

    useEffect(() => {
        if (triggerRef.current) {
            setTriggerWidth(triggerRef.current.offsetWidth);
        }
    }, [open]);

    const toggle = (key: string) => {
        onChange(
            selected.includes(key)
                ? selected.filter((v) => v !== key)
                : [...selected, key],
        );
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    ref={triggerRef}
                    variant="outline"
                    role="combobox"
                    aria-label={placeholder}
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal focus:border-primary focus:ring-2 focus:ring-primary/20',
                        selected.length === 0 && 'text-muted-foreground',
                    )}
                >
                    <span className="truncate">
                        {selectedLabels.length > 0
                            ? selectedLabels.join(', ')
                            : placeholder}
                    </span>
                    <ChevronsUpDown
                        className={cn(
                            'h-4 w-4 shrink-0 opacity-50',
                            dir === 'rtl' ? 'mr-2' : 'ml-2',
                        )}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0"
                style={{ width: triggerWidth || '100%' }}
                align="start"
            >
                {selected.length > 0 && (
                    <div className="flex items-center justify-between border-b px-3 py-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            {selectedLabels.length}{' '}
                            {selectedLabels.length === 1
                                ? lang === 'fr'
                                    ? 'ville sélectionnée'
                                    : lang === 'ar'
                                      ? 'مدينة مختارة'
                                      : 'city selected'
                                : lang === 'fr'
                                  ? 'villes sélectionnées'
                                  : lang === 'ar'
                                    ? 'مدن مختارة'
                                    : 'cities selected'}
                        </span>
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3 w-3" />
                            {clearText}
                        </button>
                    </div>
                )}
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {cities.map((city) => {
                                const isSelected = selected.includes(city.key);
                                return (
                                    <CommandItem
                                        key={city.key}
                                        value={
                                            city.label[lang] || city.label.en
                                        }
                                        onSelect={() => toggle(city.key)}
                                    >
                                        <Check
                                            className={cn(
                                                'h-4 w-4',
                                                dir === 'rtl' ? 'ml-2' : 'mr-2',
                                                isSelected
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        <span className="flex-1">
                                            {city.label[lang] || city.label.en}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            ({city.count})
                                        </span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
