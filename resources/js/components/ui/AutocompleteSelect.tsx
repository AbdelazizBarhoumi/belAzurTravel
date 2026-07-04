import { Check, ChevronsUpDown } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
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
import { cn } from '@/lib/utils';

interface AutocompleteSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    className?: string;
}

export function AutocompleteSelect({
    value,
    onValueChange,
    options,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    disabled = false,
    className,
}: AutocompleteSelectProps) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [triggerWidth, setTriggerWidth] = useState(0);

    const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

    useEffect(() => {
        if (triggerRef.current) {
            setTriggerWidth(triggerRef.current.offsetWidth);
        }
    }, [open]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        },
        [],
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    ref={triggerRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal focus:border-primary focus:ring-2 focus:ring-primary/20',
                        !value && 'text-muted-foreground',
                        className,
                    )}
                >
                    <span className="truncate">
                        {selectedLabel || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0"
                style={{ width: triggerWidth || '100%' }}
                align="start"
                onkeydown={handleKeyDown}
            >
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onValueChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === option.value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
