import { arSA, enUS, fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

function getLocale(lang: string) {
    if (lang === 'ar') return 'ar-EG';
    if (lang === 'en') return 'en-US';
    return 'fr-FR';
}

function getDatePickerLocale(lang: string) {
    if (lang === 'ar') return arSA;
    if (lang === 'en') return enUS;
    return fr;
}

interface DateRangePickerProps {
    value: DateRange | undefined;
    onChange: (value: DateRange | undefined) => void;
    className?: string;
    placeholderFrom?: string;
    placeholderTo?: string;
    placeholderSingle?: string;
    placeholderEmpty?: string;
}

export function DateRangePicker({
    value,
    onChange,
    className,
    placeholderFrom,
    placeholderTo,
    placeholderSingle,
    placeholderEmpty,
}: DateRangePickerProps) {
    const { lang, t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const locale = getLocale(lang);

    const startLabel = value?.from
        ? value.from.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
        : (placeholderFrom ?? t('search.placeholders.checkIn'));

    const endLabel = value?.to
        ? value.to.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
        : (placeholderTo ?? t('search.placeholders.checkOut'));

    const emptyLabel = placeholderEmpty ?? t('search.placeholders.dates');

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'h-10 sm:h-12 justify-start gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border-border/70 bg-background/80 px-3 sm:px-4 font-normal shadow-sm backdrop-blur-sm hover:bg-background',
                        isRtl ? 'flex-row-reverse text-right' : 'text-left',
                        className,
                    )}
                >
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-primary" />
                    <span className="min-w-0 truncate text-xs sm:text-sm text-foreground">
                        {value?.from
                            ? `${startLabel} — ${value?.to ? endLabel : (placeholderSingle ?? t('search.placeholders.flexibleDates'))}`
                            : emptyLabel}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn('w-auto p-0', isRtl && 'text-right')}
                align={isRtl ? 'end' : 'start'}
            >
                <Calendar
                    mode="range"
                    selected={value}
                    onSelect={onChange}
                    numberOfMonths={2}
                    initialFocus
                    locale={getDatePickerLocale(lang)}
                    dir={dir}
                />
            </PopoverContent>
        </Popover>
    );
}
