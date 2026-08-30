import { Baby, BedDouble, Info, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Occupancy } from '@/components/hotel/OccupancyPicker';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, formatPrice, roomPromo } from '@/lib/utils';

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
    basePrice?: number;
    nights?: number;
    boardingName?: string;
    // Provider bookability metadata powering the row badges.
    onRequest?: boolean;
    bookable?: boolean;
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
    boardingId?: number;
}

interface RoomRatesTableProps {
    rooms: RateRoom[];
    occupancy: Occupancy;
    currency?: string;
    bookDisabled?: boolean;
    onReserve: (room: RateRoom) => void;
    /** Called whenever the user switches boarding selection (radio change). */
    onSelect?: (room: RateRoom) => void;
    requestMode?: boolean;
    /** Change this value to reset the internal selection (e.g. when new search results arrive). */
    resetKey?: string | number;
}

// One physical room, with every boarding/rate plan offered for it nested
// underneath. This replaces the old model where a room's image, name,
// description and features were repeated once per boarding — the actual
// complaint being fixed here.
interface RoomGroup {
    key: string;
    name: string;
    description?: string;
    size: number;
    capacity: number;
    features: string[];
    images: string[];
    rates: RateRoom[];
}

function groupByRoomType(rooms: RateRoom[]): RoomGroup[] {
    const order: string[] = [];
    const groups = new Map<string, RoomGroup>();

    for (const room of rooms) {
        // Rooms are grouped by display name. If your provider can return two
        // physically different rooms sharing a name, widen this key (e.g.
        // `${room.name}-${room.capacity}-${room.size}`).
        const key = room.name;
        let group = groups.get(key);
        if (!group) {
            group = {
                key,
                name: room.name,
                description: room.description,
                size: room.size,
                capacity: room.capacity,
                features: room.features,
                images: room.images,
                rates: [],
            };
            groups.set(key, group);
            order.push(key);
        }
        if (!group.description && room.description) {
            group.description = room.description;
        }
        if (group.images.length === 0 && room.images.length > 0) {
            group.images = room.images;
        }
        group.rates.push(room);
    }

    for (const group of groups.values()) {
        group.rates.sort(
            (a, b) =>
                (a.priceTotal ?? a.pricePerNight) -
                (b.priceTotal ?? b.pricePerNight),
        );
    }

    return order.map((key) => groups.get(key)!);
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
    bookDisabled = false,
    onReserve,
    onSelect,
    requestMode = false,
    resetKey,
}: RoomRatesTableProps) {
    const { t, lang } = useLanguage();
    const groups = useMemo(() => groupByRoomType(rooms), [rooms]);

    // Selection is keyed by "group + position in that group" rather than
    // rate.id. rate.id comes straight from the booking payload — if two
    // rate plans on the same room ever resolve to the same id upstream
    // (e.g. a missing boarding_id defaults more than one rate to the same
    // key), matching selection by id alone makes BOTH rows read as
    // selected. A key built locally can never collide.
    const firstKey = groups[0]?.rates.length ? `${groups[0].key}::0` : '';
    const [selected, setSelected] = useState(firstKey);

    useEffect(() => {
        setSelected(groups[0]?.rates.length ? `${groups[0].key}::0` : '');
        // Reset to the first rate whenever new search results arrive.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    const activeEntry = useMemo(() => {
        for (const group of groups) {
            const idx = group.rates.findIndex(
                (_, i) => `${group.key}::${i}` === selected,
            );
            if (idx !== -1) return { group, rate: group.rates[idx] };
        }
        return groups[0]
            ? { group: groups[0], rate: groups[0].rates[0] }
            : undefined;
    }, [groups, selected]);

    const active = activeEntry?.rate;
    const activeGroup = activeEntry?.group;

    const activeTotal = active
        ? (active.priceTotal ?? active.pricePerNight) * occupancy.rooms
        : 0;
    const activeBaseTotal = active
        ? (active.basePrice ?? active.priceTotal ?? active.pricePerNight) *
          occupancy.rooms
        : 0;
    const activeTotalPromo = roomPromo(activeTotal, activeBaseTotal);

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* Occupancy is identical for every room/rate below (it's the
                same search), so it's stated once here instead of being
                repeated as icons on every single row. */}
            <div className="flex items-center gap-2 bg-muted/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{t('hotelDetail.roomsAndRates')}</span>
                <span className="ml-auto flex items-center gap-1 normal-case text-muted-foreground/80">
                    {Array.from({ length: occupancy.adults }).map((_, i) => (
                        <User key={i} className="h-3.5 w-3.5" />
                    ))}
                    {occupancy.childAges.map((_, i) => (
                        <Baby key={i} className="h-3.5 w-3.5" />
                    ))}
                    {occupancy.rooms > 1 && (
                        <span className="ml-1">× {occupancy.rooms}</span>
                    )}
                </span>
            </div>

            <div className="divide-y divide-border">
                {groups.map((group) => (
                    <div key={group.key} className="p-5">
                        {/* Room identity — shown ONCE per room, not once per boarding */}
                        <div className="flex gap-4">
                            {group.images[0] ? (
                                <img
                                    src={group.images[0]}
                                    alt={group.name}
                                    loading="lazy"
                                    className="hidden h-20 w-24 shrink-0 rounded-2xl object-cover sm:block"
                                />
                            ) : (
                                <div className="hidden h-20 w-24 shrink-0 items-center justify-center rounded-2xl bg-muted sm:flex">
                                    <BedDouble className="h-6 w-6 text-muted-foreground/60" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">
                                    {occupancy.rooms > 1
                                        ? `${occupancy.rooms} × ${group.name}`
                                        : group.name}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {group.size ? `${group.size} m²` : ''}
                                    {group.size &&
                                    occupancy.adults +
                                        occupancy.childAges.length >
                                        0
                                        ? ' · '
                                        : ''}
                                    {occupancy.adults +
                                        occupancy.childAges.length >
                                    0
                                        ? `${occupancy.adults + occupancy.childAges.length} ${t('hotelDetail.guests')}`
                                        : group.capacity
                                          ? `${group.capacity} ${t('hotelDetail.guests')}`
                                          : ''}
                                </p>
                                {group.description ? (
                                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                        {group.description}
                                    </p>
                                ) : null}
                                {group.features?.length ? (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                        {group.features
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
                            </div>
                        </div>

                        {/* Rate plans for this room — all boardings visible
                            together, no tabs to switch between. */}
                        <div className="mt-3 space-y-2 sm:pl-[104px]">
                            {group.rates.map((rate, idx) => {
                                const selKey = `${group.key}::${idx}`;
                                const isSelected = selected === selKey;
                                const total =
                                    (rate.priceTotal ?? rate.pricePerNight) *
                                    occupancy.rooms;
                                const baseTotal =
                                    (rate.basePrice ??
                                        rate.priceTotal ??
                                        rate.pricePerNight) * occupancy.rooms;
                                const totalPromo = roomPromo(total, baseTotal);

                                return (
                                    <label
                                        key={selKey}
                                        className={cn(
                                            'flex cursor-pointer flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
                                            isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:bg-muted/40',
                                        )}
                                    >
                                        {/* A <label> is used deliberately (rather than a
                                            click handler on the row) — clicking anywhere in
                                            the row toggles the radio, but browsers already
                                            exclude nested interactive elements (like the
                                            cancellation-policy button below) from that
                                            forwarding, so it doesn't fight with the popover. */}
                                        <input
                                            type="radio"
                                            name="rate-select"
                                            checked={isSelected}
                                            onChange={() => {
                                                setSelected(selKey);
                                                onSelect?.(rate);
                                            }}
                                            className="h-4 w-4 accent-primary"
                                            aria-label={`Select ${group.name} — ${rate.boardingName ?? ''}`}
                                        />

                                        <div className="min-w-[140px] flex-1">
                                            <p className="text-sm font-semibold text-foreground">
                                                {rate.boardingName ||
                                                    t(
                                                        'hotelDetail.standardBoarding',
                                                    )}
                                            </p>

                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                {rate.onRequest ? (
                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                                        {t(
                                                            'hotelDetail.onRequest',
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                                        {t(
                                                            'hotelDetail.available',
                                                        )}
                                                    </span>
                                                )}
                                                {rate.notRefundable && (
                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                                        {t(
                                                            'hotelDetail.nonRefundable',
                                                        )}
                                                    </span>
                                                )}
                                                {rate.cancellationDeadline && (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                        {t(
                                                            'hotelDetail.freeCancellationUntil',
                                                        )}{' '}
                                                        {formatBadgeDate(
                                                            rate.cancellationDeadline,
                                                            lang,
                                                        )}
                                                    </span>
                                                )}
                                                {rate.cancellationPolicy
                                                    ?.length ? (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button
                                                                type="button"
                                                                // stopPropagation, not preventDefault: preventDefault
                                                                // sets event.defaultPrevented, which Radix's asChild
                                                                // trigger checks before running its own open-toggle
                                                                // logic — so it was silently blocking the popover
                                                                // from ever opening. stopPropagation only stops the
                                                                // click bubbling further (which we don't even need
                                                                // here since it's a <label>, but keeps this element
                                                                // safe if the row markup changes later).
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                                                            >
                                                                <Info className="h-3 w-3" />
                                                                {t(
                                                                    'hotelDetail.cancellationPolicy',
                                                                )}
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80">
                                                            <p className="mb-2 text-xs font-semibold text-foreground">
                                                                {t(
                                                                    'hotelDetail.cancellationPolicy',
                                                                )}
                                                            </p>
                                                            <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                                                                {rate.cancellationPolicy.map(
                                                                    (
                                                                        entry,
                                                                        i,
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                i
                                                                            }
                                                                            className="flex items-start gap-1.5"
                                                                        >
                                                                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                                                                            <span>
                                                                                {entry.description ||
                                                                                    (entry.type ===
                                                                                    'PERCENT'
                                                                                        ? `${entry.fees}%`
                                                                                        : `${entry.fees} ${currency}`)}
                                                                                {entry.from_date
                                                                                    ? ` — ${formatBadgeDate(entry.from_date.slice(0, 10), lang)}`
                                                                                    : ''}
                                                                            </span>
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        </PopoverContent>
                                                    </Popover>
                                                ) : null}
                                            </div>

                                            {rate.supplements &&
                                                rate.supplements.length > 0 && (
                                                    <div className="mt-1.5 space-y-0.5">
                                                        {rate.supplements.map(
                                                            (supplement, i) => (
                                                                <p
                                                                    key={`${selKey}-supplement-${i}`}
                                                                    className="text-[11px] text-muted-foreground"
                                                                >
                                                                    +
                                                                    {formatPrice(
                                                                        supplement.price,
                                                                        currency,
                                                                    )}{' '}
                                                                    {
                                                                        supplement.name
                                                                    }
                                                                    {supplement.perNight
                                                                        ? ` ${t('hotelDetail.pernight')}`
                                                                        : ''}
                                                                </p>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                        </div>

                                        <div className="text-right">
                                            <p className="text-base font-bold text-foreground">
                                                {requestMode ? (
                                                    <>- {currency}</>
                                                ) : (
                                                    <>
                                                        {formatPrice(
                                                            totalPromo
                                                                ? totalPromo.discounted
                                                                : total,
                                                            currency,
                                                        )}
                                                    </>
                                                )}
                                            </p>
                                            {!requestMode && totalPromo && (
                                                <p className="text-xs font-medium text-muted-foreground line-through">
                                                    {formatPrice(
                                                        totalPromo.original,
                                                        currency,
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center justify-end gap-4 border-t border-border bg-muted/50 px-5 py-4 sm:flex-row">
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                            {t('hotelDetail.stayTotalLabel')}
                            {activeGroup && active ? (
                                <>
                                    {' · '}
                                    {activeGroup.name} ·{' '}
                                    {active.boardingName ||
                                        t('hotelDetail.standardBoarding')}
                                </>
                            ) : null}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                            {requestMode ? (
                                t('hotelDetail.requestTitle')
                            ) : (
                                <>
                                    {formatPrice(
                                        activeTotalPromo
                                            ? activeTotalPromo.discounted
                                            : activeTotal,
                                        currency,
                                    )}
                                    {active?.nights != null &&
                                        active.nights > 0 && (
                                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                                · {active.nights}{' '}
                                                {active.nights === 1
                                                    ? t('hotelDetail.night')
                                                    : t(
                                                          'hotelDetail.nightsLabel',
                                                      )}
                                            </span>
                                        )}
                                </>
                            )}
                        </p>
                        {!requestMode && activeTotalPromo && (
                            <p className="text-xs font-medium text-muted-foreground line-through">
                                {formatPrice(
                                    activeTotalPromo.original,
                                    currency,
                                )}
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
                        {requestMode
                            ? t('hotelDetail.requestBooking')
                            : t('hotelDetail.reserve')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
