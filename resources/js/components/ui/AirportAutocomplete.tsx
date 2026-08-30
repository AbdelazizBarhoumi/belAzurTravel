import { Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from 'cmdk';
import { AIRPORTS } from '@/data/airports';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface AirportAutocompleteProps {
    value: string | null;
    onChange: (iata: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    disabled?: boolean;
}

export function AirportAutocomplete({
    value,
    onChange,
    placeholder,
    label,
    className,
    disabled = false,
}: AirportAutocompleteProps) {
    const { dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedAirport = value ? AIRPORTS.find((a) => a.iata === value) : null;
    const displayLabel = selectedAirport
        ? `${selectedAirport.city} (${selectedAirport.iata})`
        : null;

    const filtered = search.trim()
        ? AIRPORTS.filter(
              (a) =>
                  a.iata.toLowerCase().includes(search.toLowerCase()) ||
                  a.city.toLowerCase().includes(search.toLowerCase()) ||
                  a.country.toLowerCase().includes(search.toLowerCase()),
          )
        : AIRPORTS;

    useEffect(() => {
        if (open) {
            setSearch('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn('relative', className)} ref={containerRef}>
            {label && (
                <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {label}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className={cn(
                    'flex h-12 w-full items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 text-left text-sm shadow-sm backdrop-blur-sm transition-colors',
                    'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
                    isRtl && 'flex-row-reverse text-right',
                    disabled && 'cursor-not-allowed opacity-50',
                )}
            >
                <Search className="h-5 w-5 shrink-0 text-primary" />
                {displayLabel ? (
                    <span className="truncate">
                        <span className="font-semibold">{selectedAirport?.iata}</span>
                        <span className="ml-1.5 text-muted-foreground">
                            {selectedAirport?.city}, {selectedAirport?.country}
                        </span>
                    </span>
                ) : (
                    <span className="text-muted-foreground">{placeholder || 'Search airport...'}</span>
                )}
            </button>

            {open && (
                <div
                    className={cn(
                        'absolute z-[100] mt-1 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-xl',
                        isRtl && 'text-right',
                    )}
                >
                    <Command shouldFilter={false} className="w-full">
                        <div className={cn('flex items-center border-b px-3', isRtl && 'flex-row-reverse')}>
                            <Search className="h-4 w-4 shrink-0 opacity-50" />
                            <CommandInput
                                ref={inputRef}
                                value={search}
                                onValueChange={setSearch}
                                placeholder={placeholder || 'Search airport...'}
                                className="h-11 border-0 bg-transparent px-2 text-sm shadow-none outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                        <CommandList className="max-h-[280px]">
                            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                                No airport found.
                            </CommandEmpty>
                            <CommandGroup>
                                {filtered.map((airport, index) => (
                                    <CommandItem
                                        key={`${airport.iata}-${index}`}
                                        value={`${airport.iata} ${airport.city} ${airport.country}`}
                                        onSelect={() => {
                                            onChange(airport.iata);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            'cursor-pointer px-3 py-2.5 text-sm',
                                            value === airport.iata && 'bg-accent',
                                        )}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <div className={cn('flex items-center gap-2', isRtl && 'flex-row-reverse')}>
                                                <span className="font-semibold">{airport.iata}</span>
                                                <span className="text-muted-foreground">{airport.city}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {airport.country}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            )}
        </div>
    );
}
