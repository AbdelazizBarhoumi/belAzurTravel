import { Icon } from '@iconify/react';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { t } from '@/i18n/translations';

interface IconResult {
    name: string;
    provider: string;
}

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const DEBOUNCE_MS = 300;
const API_BASE = 'https://api.iconify.design';

// Common icons shown before the user types anything
const DEFAULT_ICONS: IconResult[] = [
    { name: 'wifi', provider: 'mdi' },
    { name: 'car', provider: 'mdi' },
    { name: 'food-fork-drink', provider: 'mdi' },
    { name: 'dumbbell', provider: 'mdi' },
    { name: 'swim', provider: 'mdi' },
    { name: 'coffee', provider: 'mdi' },
    { name: 'bed', provider: 'mdi' },
    { name: 'pool', provider: 'mdi' },
    { name: 'spa', provider: 'mdi' },
    { name: 'air-conditioner', provider: 'mdi' },
    { name: 'shower', provider: 'mdi' },
    { name: 'television', provider: 'mdi' },
    { name: 'fridge-outline', provider: 'mdi' },
    { name: ' washer', provider: 'mdi' },
    { name: 'parking', provider: 'mdi' },
    { name: 'elevator', provider: 'mdi' },
    { name: 'hand-heart', provider: 'mdi' },
    { name: 'baby-face-outline', provider: 'mdi' },
    { name: 'dog', provider: 'mdi' },
    { name: 'briefcase-outline', provider: 'mdi' },
    { name: 'map-marker', provider: 'mdi' },
    { name: 'phone', provider: 'mdi' },
    { name: 'lock', provider: 'mdi' },
    { name: 'key', provider: 'mdi' },
].map((i) => ({ ...i, name: i.name.trim() }));

function toFullId(icon: IconResult): string {
    return icon.provider ? `${icon.provider}:${icon.name}` : icon.name;
}

export function IconPicker({ value, onChange, placeholder }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<IconResult[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const { lang } = useLanguage();

    const searchIcons = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}/search?query=${encodeURIComponent(q)}&limit=40`,
            );
            const data = await res.json();
            const icons: IconResult[] = (data.icons ?? []).map(
                (name: string) => ({
                    name,
                    provider: data.provider ?? '',
                }),
            );
            setResults(icons);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search when query changes
    useEffect(() => {
        if (!open) return;
        clearTimeout(debounceRef.current);
        if (query.trim()) {
            debounceRef.current = setTimeout(
                () => searchIcons(query),
                DEBOUNCE_MS,
            );
        }
        return () => clearTimeout(debounceRef.current);
    }, [query, open, searchIcons]);

    // Reset state when closing
    useEffect(() => {
        if (!open) {
            setQuery('');
        }
    }, [open]);

    const selectedIcon = value && value.includes(':') ? value : null;
    const displayIcons = query.trim() ? results : DEFAULT_ICONS;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedIcon ? (
                        <span className="flex items-center gap-2">
                            <Icon icon={selectedIcon} className="h-4 w-4" />
                            <span className="truncate text-sm">
                                {selectedIcon}
                            </span>
                        </span>
                    ) : (
                        <span className="text-muted-foreground">
                            {placeholder ??
                                t('admin.iconPicker.selectIcon', lang)}
                        </span>
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={t('admin.iconPicker.search', lang)}
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {loading
                                ? '...'
                                : t('admin.iconPicker.noResults', lang)}
                        </CommandEmpty>
                        <CommandGroup>
                            <div className="grid grid-cols-4 gap-1 p-1">
                                {displayIcons.map((icon) => {
                                    const fullId = toFullId(icon);
                                    return (
                                        <CommandItem
                                            key={fullId}
                                            value={fullId}
                                            onSelect={() => {
                                                onChange(fullId);
                                                setOpen(false);
                                                setQuery('');
                                            }}
                                            className="flex h-10 w-10 items-center justify-center rounded-md p-0 aria-selected:bg-accent cursor-pointer hover:bg-accent/80"
                                        >
                                            <Icon
                                                icon={fullId}
                                                className="h-5 w-5"
                                            />
                                        </CommandItem>
                                    );
                                })}
                            </div>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
