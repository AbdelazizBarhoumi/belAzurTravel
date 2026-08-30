import { Minus, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface PassengerCabinState {
    adults: number;
    children: number;
    infants: number;
    cabinClass: string;
}

interface PassengerCabinPickerProps {
    value: PassengerCabinState;
    onChange: (value: PassengerCabinState) => void;
    className?: string;
    compact?: boolean;
}

const CABIN_OPTIONS = [
    { value: 'economy', labelKey: 'search.options.economy' },
    { value: 'premium-economy', labelKey: 'search.options.premiumEconomy' },
    { value: 'business', labelKey: 'search.options.business' },
    { value: 'first', labelKey: 'search.options.first' },
];

const MAX_ADULTS = 9;
const MAX_CHILDREN = 8;
const MAX_INFANTS = 2;

function Counter({
    label,
    value,
    min,
    max,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                >
                    <Minus className="h-3 w-3" />
                </Button>
                <span className="min-w-8 text-center text-base font-semibold">{value}</span>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onChange(Math.min(max, value + 1))}
                    disabled={value >= max}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}

export function PassengerCabinPicker({
    value,
    onChange,
    className,
    compact = false,
}: PassengerCabinPickerProps) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [open, setOpen] = useState(false);

    const total = value.adults + value.children + value.infants;
    const cabinLabel =
        CABIN_OPTIONS.find((c) => c.value === value.cabinClass)?.labelKey ?? 'search.options.economy';

    const summary =
        total === 1
            ? `1 ${t('search.fields.passengers').toLowerCase()}, ${t(cabinLabel)}`
            : `${total} ${t('search.fields.passengers').toLowerCase()}, ${t(cabinLabel)}`;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'h-12 justify-start gap-3 rounded-2xl border-border/70 bg-background/80 px-4 text-sm font-normal shadow-sm backdrop-blur-sm',
                        isRtl && 'flex-row-reverse text-right',
                        compact && 'h-10',
                        className,
                    )}
                >
                    <Users className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-foreground">{summary}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn('w-80 space-y-4', isRtl && 'text-right')}
                align={isRtl ? 'end' : 'start'}
            >
                <Counter
                    label={t('hotels.adultsLabel')}
                    value={value.adults}
                    min={1}
                    max={MAX_ADULTS}
                    onChange={(v) => onChange({ ...value, adults: v })}
                />
                <Counter
                    label={t('hotels.childrenLabel')}
                    value={value.children}
                    min={0}
                    max={MAX_CHILDREN}
                    onChange={(v) => onChange({ ...value, children: v })}
                />
                <Counter
                    label={t('search.fields.infants')}
                    value={value.infants}
                    min={0}
                    max={MAX_INFANTS}
                    onChange={(v) => onChange({ ...value, infants: v })}
                />
                <div className="border-t border-border pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t('search.fields.cabinClass')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {CABIN_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onChange({ ...value, cabinClass: opt.value })}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                    value.cabinClass === opt.value
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground hover:border-primary/40',
                                )}
                            >
                                {t(opt.labelKey)}
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
