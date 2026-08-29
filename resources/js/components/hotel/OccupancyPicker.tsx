import { BedDouble, Minus, Plus } from 'lucide-react';
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
    rooms: number;
    adults: number;
    childAges: number[];
}

export const DEFAULT_OCCUPANCY: Occupancy = {
    rooms: 1,
    adults: 2,
    childAges: [],
};

const MAX_ROOMS = 8;
const MAX_ADULTS = 10;
const MAX_CHILDREN = 6;
const MIN_AGE = 0;
const MAX_AGE = 17;

export function occupancyLabel(o: Occupancy): string {
    const parts = [
        `${o.rooms} ch.`,
        `${o.adults} ${o.adults > 1 ? 'adultes' : 'adulte'}`,
    ];
    if (o.childAges.length) {
        parts.push(
            `${o.childAges.length} enfant${o.childAges.length > 1 ? 's' : ''}`,
        );
    }
    return parts.join(', ');
}

interface OccupancyPickerProps {
    value: Occupancy;
    onChange: (o: Occupancy) => void;
    className?: string;
    /** Controlled open state for the popover. */
    open?: boolean;
    /** Callback when popover open state changes. */
    onOpenChange?: (open: boolean) => void;
}

export function OccupancyPicker({
    value,
    onChange,
    className,
    open,
    onOpenChange,
}: OccupancyPickerProps) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';

    const totalGuests = value.rooms * (value.adults + value.childAges.length);

    const setRooms = (rooms: number) => {
        onChange({ ...value, rooms: Math.max(1, Math.min(MAX_ROOMS, rooms)) });
    };

    const setAdults = (adults: number) => {
        onChange({
            ...value,
            adults: Math.max(1, Math.min(MAX_ADULTS, adults)),
        });
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
                    aria-label={t('hotelDetail.occupancy')}
                    className={cn(
                        'h-11 w-full justify-between rounded-2xl border-border/70 bg-background px-3 text-sm shadow-sm',
                        isRtl && 'flex-row-reverse text-right',
                        className,
                    )}
                >
                    <span
                        className={cn(
                            'flex items-center gap-2',
                            isRtl && 'flex-row-reverse',
                        )}
                    >
                        <BedDouble className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate text-xs text-muted-foreground">
                            {value.rooms}{' '}
                            {t('hotelDetail.roomsTitle').toLowerCase()} ·{' '}
                            {totalGuests} {t('hotels.guestsLabel')}
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
                            {t('hotelDetail.roomsTitle')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('hotelDetail.advancedSearch')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setRooms(value.rooms - 1)}
                            disabled={value.rooms <= 1}
                            aria-label="decrease rooms"
                        >
                            <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="min-w-8 text-center text-base font-semibold">
                            {value.rooms}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setRooms(value.rooms + 1)}
                            disabled={value.rooms >= MAX_ROOMS}
                            aria-label="increase rooms"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {t('hotelDetail.adults')}
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
                            <Minus className="h-3.5 w-3.5" />
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
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {t('hotelDetail.children')}
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
                                        <SelectItem key={a} value={String(a)}>
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
