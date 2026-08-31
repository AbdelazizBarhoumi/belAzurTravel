import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

export interface MultiSelectOption {
    key: string;
    label: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
}

export function MultiSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    className,
    disabled = false,
}: MultiSelectProps) {
    const [open, setOpen] = useState(false);

    const selected = value ?? [];

    const toggleOption = (optionKey: string) => {
        if (selected.includes(optionKey)) {
            onChange(selected.filter((k) => k !== optionKey));
        } else {
            onChange([...selected, optionKey]);
        }
    };

    const removeOption = (optionKey: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter((k) => k !== optionKey));
    };

    const selectedLabels = selected
        .map((k) => options.find((o) => o.key === k)?.label ?? k)
        .join(', ');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between text-left font-normal',
                        selected.length === 0 && 'text-muted-foreground',
                        className,
                    )}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {selected.length > 0
                            ? `${selected.length} selected`
                            : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selected.includes(option.key);
                                return (
                                    <CommandItem
                                        key={option.key}
                                        value={option.label}
                                        onSelect={() => toggleOption(option.key)}
                                        className="cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            className="mr-2 pointer-events-none"
                                        />
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
                {selected.length > 0 && (
                    <div className="border-t border-border p-2">
                        <div className="flex flex-wrap gap-1">
                            {selected.map((key) => (
                                <Badge
                                    key={key}
                                    variant="secondary"
                                    className="gap-1 text-xs"
                                >
                                    {options.find((o) => o.key === key)?.label ?? key}
                                    <button
                                        type="button"
                                        onClick={(e) => removeOption(key, e)}
                                        className="ml-0.5 rounded-full hover:bg-muted"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
