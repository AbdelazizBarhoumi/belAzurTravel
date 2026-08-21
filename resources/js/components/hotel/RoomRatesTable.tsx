import {
    Baby,
    BedDouble,
    Info,
    User,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Occupancy } from '@/components/hotel/OccupancyPicker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, promoPrice } from '@/lib/utils';

export interface RateRoom {
    id: string;
    name: string;
    description?: string;
    size: number;
    capacity: number;
    features: string[];
    images: string[];
    // Live OS-TRAVEL offers carry a TOTAL-stay price with a fixed boarding.
    priceTotal?: number;
    pricePerNight: number;
    nights?: number;
    boardingName?: string;
    // Provider bookability metadata powering the row badges.
    onRequest?: boolean;
    stopSales?: { from: string; to: string } | null;
    notRefundable?: boolean;
    cancellationDeadline?: string;
    cancellationPolicy?: Array<{
        fees: number;
        type: string | null;
        nature: string | null;
        description: string | null;
        from_date: string | null;
    }>;
    supplements?: Array<{ name: string; price: number; perNight?: boolean }>;
}

interface RoomRatesTableProps {
    rooms: RateRoom[];
    occupancy: Occupancy;
    currency?: string;
    promoRate?: string | null;
    bookDisabled?: boolean;
    onReserve: (room: RateRoom) => void;
}

function formatBadgeDate(value: string, lang: string): string {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(
        lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-TN' : 'en-GB',
    );
}

export function RoomRatesTable({
    rooms,
    occupancy,
    currency = 'TND',
    promoRate = null,
    bookDisabled = false,
    onReserve,
}: RoomRatesTableProps) {
    const { t, lang } = useLanguage();
    const [selected, setSelected] = useState(rooms[0]?.id ?? '');

    const active = useMemo(
        () => rooms.find((room) => room.id === selected) ?? rooms[0],
        [rooms, selected],
    );

    const activeTotal = active
        ? (active.priceTotal ?? active.pricePerNight) * occupancy.rooms
        : 0;
    const activeTotalPromo = promoPrice(activeTotal, promoRate);

    return (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="hidden grid-cols-[2.2fr_0.8fr_1.2fr_1fr] gap-4 bg-muted/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                <span>{t('hotelDetail.roomType')}</span>
                <span>{t('hotelDetail.occupancy')}</span>
                <span>{t('hotelDetail.boarding')}</span>
                <span className="text-right">
                    {t('hotelDetail.totalForStay')}
                </span>
            </div>

            <div className="divide-y divide-border">
                {rooms.map((room) => {
                    const isSelected = selected === room.id;
                    const total = (room.priceTotal ?? room.pricePerNight) * occupancy.rooms;
                    const totalPromo = promoPrice(total, promoRate);
                    return (
                        <div
                            key={room.id}
                            className={cn(
                                'grid items-center gap-4 px-5 py-4 transition-colors md:grid-cols-[2.2fr_0.8fr_1.2fr_1fr]',
                                isSelected
                                    ? 'bg-primary/5'
                                    : 'hover:bg-muted/40',
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => setSelected(room.id)}
                                    aria-label={`Select ${room.name}`}
                                    className="mt-1"
                                />
                                <div className="flex gap-3">
                                    {room.images[0] ? (
                                        <img
                                            src={room.images[0]}
                                            alt={room.name}
                                            loading="lazy"
                                            className="hidden h-16 w-20 shrink-0 rounded-lg object-cover sm:block"
                                        />
                                    ) : (
                                        <div className="hidden h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-muted sm:flex">
                                            <BedDouble className="h-6 w-6 text-muted-foreground/60" />
                                        </div>
                                    )}
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(room.id)}
                                            className="text-left"
                                        >
                                            <p className="text-sm font-semibold text-foreground">
                                                {occupancy.rooms > 1
                                                    ? `${occupancy.rooms} × ${room.name}`
                                                    : room.name}
                                                <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 align-middle text-[10px] font-bold text-primary">
                                                    {t('hotelDetail.available')}
                                                </span>
                                            </p>
                                        </button>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {room.size ? `${room.size} m²` : ''}
                                            {room.size && room.capacity ? ' · ' : ''}
                                            {room.capacity
                                                ? `${room.capacity} ${t('hotelDetail.guests')}`
                                                : ''}
                                        </p>
                                        {room.description ? (
                                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                                {room.description}
                                            </p>
                                        ) : null}
                                        {room.features?.length ? (
                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                {room.features
                                                    .slice(0, 5)
                                                    .map((feature) => (
                                                        <span
                                                            key={feature}
                                                            className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                                        >
                                                            {feature}
                                                        </span>
                                                    ))}
                                            </div>
                                        ) : null}

                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {room.onRequest && (
                                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                                    {t('hotelDetail.onRequest')}
                                                </span>
                                            )}
                                            {room.notRefundable && (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                                    {t('hotelDetail.nonRefundable')}
                                                </span>
                                            )}
                                            {room.cancellationDeadline && (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                    {t('hotelDetail.freeCancellationUntil')}{' '}
                                                    {formatBadgeDate(
                                                        room.cancellationDeadline,
                                                        lang,
                                                    )}
                                                </span>
                                            )}
                                            {room.cancellationPolicy?.length
                                                ? (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                                                            >
                                                                <Info className="h-3 w-3" />
                                                                {t('hotelDetail.cancellationPolicy')}
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80">
                                                            <p className="mb-2 text-xs font-semibold text-foreground">
                                                                {t('hotelDetail.cancellationPolicy')}
                                                            </p>
                                                            <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                                                                {room.cancellationPolicy.map(
                                                                    (entry, i) => (
                                                                        <li
                                                                            key={i}
                                                                            className="flex items-start gap-1.5"
                                                                        >
                                                                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                                                                            <span>
                                                                                {entry.description ||
                                                                                    (entry.type === 'PERCENT'
                                                                                        ? `${entry.fees}%`
                                                                                        : `${entry.fees} ${currency}`)}
                                                                                {entry.from_date
                                                                                    ? ` — ${formatBadgeDate(
                                                                                          entry.from_date.slice(
                                                                                              0,
                                                                                              10,
                                                                                          ),
                                                                                          lang,
                                                                                      )}`
                                                                                    : ''}
                                                                            </span>
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        </PopoverContent>
                                                    </Popover>
                                                )
                                                : null}
                                        </div>

                                        {room.supplements &&
                                            room.supplements.length > 0 && (
                                                <div className="mt-1.5 space-y-0.5">
                                                    {room.supplements.map(
                                                        (supplement, i) => (
                                                            <p
                                                                key={`${room.id}-supplement-${i}`}
                                                                className="text-[11px] text-muted-foreground"
                                                            >
                                                                +{supplement.price.toLocaleString()}{' '}
                                                                {currency}{' '}
                                                                {supplement.name}
                                                                {supplement.perNight
                                                                    ? ` ${t('hotelDetail.pernight')}`
                                                                    : ''}
                                                            </p>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 text-muted-foreground">
                                {Array.from({ length: occupancy.adults }).map(
                                    (_, i) => (
                                        <User key={i} className="h-4 w-4" />
                                    ),
                                )}
                                {occupancy.childAges.map((_, i) => (
                                    <Baby key={i} className="h-4 w-4" />
                                ))}
                            </div>

                            <div className="text-sm font-medium text-foreground">
                                {room.boardingName ||
                                    t('hotelDetail.standardBoarding')}
                            </div>

                            <div className="text-right">
                                <p className="text-lg font-bold text-foreground">
                                    {(totalPromo
                                        ? totalPromo.discounted
                                        : total
                                    ).toLocaleString()}{' '}
                                    {currency}
                                </p>
                                {totalPromo && (
                                    <p className="text-xs font-medium text-muted-foreground line-through">
                                        {totalPromo.original.toLocaleString()}{' '}
                                        {currency}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col items-center justify-end gap-4 border-t border-border bg-muted/50 px-5 py-4 sm:flex-row">
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                            {t('hotelDetail.stayTotalLabel')}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                            {(activeTotalPromo
                                ? activeTotalPromo.discounted
                                : activeTotal
                            ).toLocaleString()}{' '}
                            {currency}
                        </p>
                        {activeTotalPromo && (
                            <p className="text-xs font-medium text-muted-foreground line-through">
                                {activeTotalPromo.original.toLocaleString()}{' '}
                                {currency}
                            </p>
                        )}
                    </div>
                    <Button
                        size="lg"
                        data-testid="reserve-rate"
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        disabled={!active || bookDisabled}
                        onClick={() => active && onReserve(active)}
                    >
                        {t('hotelDetail.reserve')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
