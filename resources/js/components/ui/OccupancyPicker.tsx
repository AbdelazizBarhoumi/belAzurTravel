import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface Occupancy {
    adults: number;
    childAges: number[];
}

export const DEFAULT_OCCUPANCY: Occupancy = { adults: 2, childAges: [] };

const MAX_ADULTS = 10;
const MAX_CHILDREN = 6;
const MIN_AGE = 0;
const MAX_AGE = 17;

interface OccupancyPickerProps {
    value: Occupancy;
    onChange: (value: Occupancy) => void;
    className?: string;
    compact?: boolean;
    /** Controlled open state for the popover. */
    open?: boolean;
    /** Callback when popover open state changes. */
    onOpenChange?: (open: boolean) => void;
}

export function OccupancyPicker({
    value,
    onChange,
    className,
    compact = false,
    open,
    onOpenChange,
}: OccupancyPickerProps) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';

    const totalGuests = value.adults + value.childAges.length;

    const setAdults = (adults: number) => {
        onChange({ ...value, adults: Math.max(1, Math.min(MAX_ADULTS, adults)) });
    };

    const addChild = () => {
        if (value.childAges.length >= MAX_CHILDREN) {
            return;
        }
        onChange({ ...value, childAges: [...value.childAges, 8] });
    };

    const removeChild = (index: number) => {
        onChange({
            ...value,
            childAges: value.childAges.filter((_, i) => i !== index),
        });
    };

    const setChildAge = (index: number, age: number) => {
        onChange({
            ...value,
            childAges: value.childAges.map((a, i) => (i === index ? age : a)),
        });
    };

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    aria-label={t('hotels.occupancy')}
                    className={cn(
                        'h-10 rounded-2xl border-border/70 bg-background/80 px-3 text-sm shadow-sm sm:h-12 sm:rounded-2xl',
                        isRtl
                            ? 'flex-row-reverse justify-between text-right'
                            : 'justify-between text-left',
                        compact && 'h-10 sm:h-10',
                        className,
                    )}
                >
                    <span
                        className={cn(
                            'flex items-center gap-2',
                            isRtl && 'flex-row-reverse',
                        )}
                    >
                        <Users className="h-4 w-4 shrink-0 text-primary" />
                        <span className="text-xs text-muted-foreground">
                            {totalGuests}{' '}
                            {t('hotels.guestsLabel')}
                            {value.childAges.length > 0 &&
                                ` · ${value.childAges.length} ${t('hotels.childrenLabel')}`}
                        </span>
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn('w-72 space-y-4', isRtl && 'text-right')}
                align={isRtl ? 'end' : 'start'}
            >
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {t('hotels.adultsLabel')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('hotels.adultsHelp')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setAdults(value.adults - 1)}
                            disabled={value.adults <= 1}
                            aria-label={t('hotels.decreaseAdults')}
                        >
                            -
                        </Button>
                        <span className="min-w-8 text-center text-base font-semibold">
                            {value.adults}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setAdults(value.adults + 1)}
                            disabled={value.adults >= MAX_ADULTS}
                            aria-label={t('hotels.increaseAdults')}
                        >
                            +
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {t('hotels.childrenLabel')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('hotels.childrenHelp')}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addChild}
                        disabled={value.childAges.length >= MAX_CHILDREN}
                    >
                        + {t('hotels.addChild')}
                    </Button>
                </div>

                {value.childAges.map((age, index) => (
                    <div
                        key={`child-${index}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-2"
                    >
                        <span className="text-xs font-medium text-muted-foreground">
                            {t('hotels.childAge')} {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                            <Select
                                value={String(age)}
                                onValueChange={(v) =>
                                    setChildAge(index, Number(v))
                                }
                            >
                                <SelectTrigger className="h-8 w-24 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from(
                                        { length: MAX_AGE - MIN_AGE + 1 },
                                        (_, i) => MIN_AGE + i,
                                    ).map((a) => (
                                        <SelectItem
                                            key={a}
                                            value={String(a)}
                                        >
                                            {a} {t('hotels.years')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => removeChild(index)}
                                aria-label={t('hotels.removeChild')}
                            >
                                ×
                            </Button>
                        </div>
                    </div>
                ))}
            </PopoverContent>
        </Popover>
    );
}