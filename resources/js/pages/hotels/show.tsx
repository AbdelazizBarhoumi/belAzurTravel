import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { arSA, enUS, fr } from 'date-fns/locale';
import {
    BadgePercent,
    Bed,
    Building2,
    Info,
    LogIn,
    LogOut,
    Map as MapIcon,
    MapPin,
    Minus,
    Plus,
    Ruler,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import {
    Navigate,
    useNavigate,
    useParams,
    useSearchParams,
} from 'react-router-dom';
import { HotelInfo } from '@/components/cards/HotelInfo';
import { BookingDialog } from '@/components/forms/BookingDialog';
import {
    OccupancyPicker,
    type Occupancy,
} from '@/components/hotel/OccupancyPicker';
import {
    RoomRatesTable,
    type RateRoom,
} from '@/components/hotel/RoomRatesTable';
import { PageShell } from '@/components/layout/PageShell';
import { Gallery } from '@/components/media/Gallery';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import {
    useHotelById,
    useHotelSearch,
    type HotelDetailLookupData,
} from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';
import {
    cn,
    formatPrice,
    parseChildAges,
    roomPromo,
    toLocalISODate,
} from '@/lib/utils';

const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

function datePickerLocale(lang: Lang) {
    if (lang === 'fr') return fr;
    if (lang === 'ar') return arSA;
    return enUS;
}

type RoomView = {
    id: string;
    name: string;
    description?: string;
    pricePerNight: number;
    // Live OS-TRAVEL rooms carry a TOTAL-stay price; static admin rooms only
    // have an admin-defined per-night price.
    priceTotal?: number;
    basePrice?: number;
    nights?: number;
    capacity: number;
    size: number;
    features: string[];
    images: string[];
    // OS-TRAVEL live-search context for the booking proxy.
    providerRoomId?: number;
    boardingId?: number;
    boardingName?: string;
    viewIds?: number[];
    supplements?: Array<{ name: string; price: number; perNight?: boolean }>;
    // Provider bookability metadata powering the room badges.
    minStay?: number;
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
};

const cleanDescription = (raw?: string | null): string => {
    if (!raw) return '';

    return raw
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/p>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\\r\\n|\\r|\\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

function normalizeSupplements(
    supplements: unknown[],
): Array<{ name: string; price: number; perNight?: boolean }> {
    if (!Array.isArray(supplements)) {
        return [];
    }

    return supplements
        .filter(
            (s): s is Record<string, unknown> =>
                typeof s === 'object' && s !== null,
        )
        .map((s) => {
            const rawName =
                typeof s.Name === 'string'
                    ? s.Name
                    : s.name && typeof s.name === 'object'
                      ? ((s.name as Record<string, string>).en ??
                        (s.name as Record<string, string>).fr ??
                        '')
                      : typeof s.name === 'string'
                        ? s.name
                        : '';
            const rawPrice =
                typeof s.Price === 'number' || typeof s.Price === 'string'
                    ? Number(s.Price)
                    : typeof s.price === 'number'
                      ? s.price
                      : 0;

            return {
                name: rawName || 'Supplement',
                price: Number.isFinite(rawPrice) ? rawPrice : 0,
                perNight:
                    typeof s.Mandatory === 'boolean'
                        ? Boolean(s.Mandatory)
                        : typeof s.PerNight === 'boolean'
                          ? Boolean(s.PerNight)
                          : false,
            };
        });
}

function toRoomView(
    room: NonNullable<HotelDetailLookupData['rooms']>[number],
    lang: Lang,
): RoomView {
    const features = Array.isArray(room.features) ? room.features : [];
    const images = Array.isArray(room.images) ? room.images : [];

    return {
        id: room.id,
        name: localizeText(room.name, lang),
        description: localizeText(room.description, lang),
        pricePerNight: room.pricePerNight,
        capacity: room.capacity,
        size: room.size,
        features: features.map((feature) => localizeText(feature, lang)),
        images,
    };
}

export default function HotelDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { lang, t } = useLanguage();
    const { data: hotel, isLoading } = useHotelById(id);
    const [selectedRoom, setSelectedRoom] = useState<RoomView | null>(null);
    const [activeRate, setActiveRate] = useState<RoomView | null>(null);
    const [requestMode, setRequestMode] = useState(false);

    // Search context preserved from the hotels listing: ?from&to&guests&rooms&children
    // pre-fill the availability search so the user doesn't re-enter it here.
    const [searchParams] = useSearchParams();
    const urlCheckIn = searchParams.get('from') || '';
    const urlCheckOut = searchParams.get('to') || '';
    const urlGuests = Number(searchParams.get('guests') || 1);
    const urlRooms = Number(searchParams.get('rooms') || 1);
    const urlChildren = parseChildAges(searchParams.get('children'));

    // A lone check-in date defaults check-out to +1 night, matching the
    // listing page's behavior when only a start date was chosen.
    // When no URL params, default to tomorrow so prices are shown immediately.
    const initialFrom = urlCheckIn
        ? new Date(`${urlCheckIn}T00:00:00`)
        : tomorrowDate;
    const initialTo = urlCheckOut
        ? new Date(`${urlCheckOut}T00:00:00`)
        : new Date(initialFrom.getTime() + 86_400_000);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        { from: initialFrom, to: initialTo },
    );
    const [occupancy, setOccupancy] = useState<Occupancy>({
        rooms: Number.isFinite(urlRooms) && urlRooms > 0 ? urlRooms : 1,
        adults: Number.isFinite(urlGuests) && urlGuests > 0 ? urlGuests : 1,
        childAges: urlChildren,
    });
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [occupancyPickerOpen, setOccupancyPickerOpen] = useState(false);
    const [selectedBoardingIds] = useState<number[]>([]);
    // Policy notice (e.g. "couples & families only", tourist tax) is
    // collapsed to 2 lines by default but always visible — this used to be
    // buried inside a closed accordion three levels deep.
    const [noteExpanded, setNoteExpanded] = useState(false);

    const liveQuery = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to || !id) {
            return undefined;
        }

        return {
            check_in: toLocalISODate(dateRange.from) ?? '',
            check_out: toLocalISODate(dateRange.to) ?? '',
            hotel_slugs: [id],
            rooms: Array.from({ length: occupancy.rooms }, () => ({
                adults: occupancy.adults,
                children: occupancy.childAges,
            })),
            only_available: true,
        };
    }, [dateRange, occupancy.rooms, occupancy.adults, occupancy.childAges, id]);

    // Phase 1: search with only_available: true — if the hotel has rooms, we're done.
    // Phase 2: if nothing returned, re-fire with only_available: false to get the
    // hotel flagged as unavailable so we can show the "Per request" section.

    // Use liveQuery directly as the active search — no intermediate state needed.
    const activeQuery = liveQuery;

    const {
        data: liveResult,
        isLoading: liveSearchLoading,
        isError: liveSearchError,
        refetch: refetchSearch,
    } = useHotelSearch(activeQuery);
    const liveResults = liveResult?.data ?? [];
    const liveHotel = liveResults[0] ?? undefined;

    // Phase 2: when the first search completes with no result, fire the
    // fallback with only_available: false so the backend returns the hotel
    // flagged as unavailable (available: false, empty rooms).
    const firstSearchDone =
        Boolean(activeQuery) && !liveSearchLoading && liveResult !== undefined;
    const noRoomsFound = firstSearchDone && !liveHotel;

    // Derive phase 2 query directly — React Query deduplicates identical requests.
    const unavailableQuery = useMemo(() => {
        if (!noRoomsFound || !activeQuery) return undefined;
        return { ...activeQuery, only_available: false };
    }, [noRoomsFound, activeQuery]);

    // Phase 2 result
    const { data: unavailableResult, isLoading: unavailableLoading } =
        useHotelSearch(unavailableQuery);
    const unavailableHotel = unavailableResult?.data?.[0] ?? undefined;

    // Merge: use phase 1 if it found rooms, otherwise use phase 2
    const effectiveHotel = liveHotel ?? unavailableHotel;
    const effectiveLoading =
        liveSearchLoading || (noRoomsFound && unavailableLoading);

    // A completed two-phase search where the hotel exists but has no rooms
    // for the selected dates.
    const searchedUnavailable =
        Boolean(activeQuery) &&
        !effectiveLoading &&
        !liveHotel &&
        unavailableHotel !== undefined &&
        unavailableHotel.available === false;
    // A completed search where the hotel truly doesn't exist.
    const hotelNotFound =
        Boolean(activeQuery) &&
        !effectiveLoading &&
        !liveHotel &&
        !unavailableHotel;

    // Pre-compute static rooms early so useMemo hooks stay above any early returns.
    const detail = (hotel ?? {}) as HotelDetailLookupData;
    const staticRooms = useMemo(
        () => (detail.rooms ?? []).map((room) => toRoomView(room, lang)),
        [detail.rooms, lang],
    );
    const staticRoomByName = useMemo(
        () => new Map(staticRooms.map((room) => [room.name, room])),
        [staticRooms],
    );

    if (isLoading) {
        return (
            <PageShell
                breadcrumbs={[
                    { label: t('common.home'), href: '/' },
                    { label: t('nav.hotels'), href: '/hotels' },
                ]}
            >
                <div className="grid items-start gap-8 lg:grid-cols-[320px_1fr]">
                    <aside className="space-y-4">
                        <Skeleton className="h-96 rounded-2xl" />
                        <Skeleton className="h-44 rounded-2xl" />
                    </aside>
                    <div className="min-w-0 space-y-10">
                        <Skeleton className="h-16 w-2/3 rounded-2xl" />
                        <Skeleton className="h-[300px] w-full rounded-2xl md:h-[500px]" />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Skeleton className="h-24 rounded-2xl" />
                            <Skeleton className="h-24 rounded-2xl" />
                        </div>
                        <Skeleton className="h-40 w-full rounded-2xl" />
                    </div>
                </div>
            </PageShell>
        );
    }

    if (!hotel) {
        return <Navigate to="/hotels" replace />;
    }

    const otherImages = detail.gallery?.length
        ? detail.gallery
        : detail.images?.length
          ? detail.images
          : [];
    const gallery = detail.image
        ? [
              detail.image,
              ...otherImages.filter((image) => image !== detail.image),
          ]
        : otherImages;

    // When Phase 2 returns a hotel with available=false, show all rooms
    // as "On request" instead of filtering to only bookable ones.
    const isRequestMode = Boolean(
        effectiveHotel && effectiveHotel.available === false,
    );

    const liveRooms: RoomView[] = (effectiveHotel?.rooms ?? [])
        .filter((room) => {
            if (isRequestMode) return true;
            if (room.stop_reservation) return false;
            if ((room.min_stay ?? 1) > (room.nights ?? 1)) return false;
            if (room.stop_sales && dateRange?.from && dateRange?.to) {
                const checkIn = new Date(
                    `${toLocalISODate(dateRange.from) ?? ''}T00:00:00`,
                );
                const checkOut = new Date(
                    `${toLocalISODate(dateRange.to) ?? ''}T00:00:00`,
                );
                const saleFrom = new Date(`${room.stop_sales.from}T00:00:00`);
                const saleTo = new Date(`${room.stop_sales.to}T00:00:00`);
                if (checkIn <= saleTo && checkOut >= saleFrom) return false;
            }
            return true;
        })
        .map((room, index) => {
            const staticRoom = staticRoomByName.get(room.name);

            return {
                id: staticRoom?.id ?? `live-${room.id ?? index}`,
                name: room.name,
                description:
                    (room.description ?? '').trim() ||
                    staticRoom?.description ||
                    '',
                pricePerNight: room.price_per_night,
                priceTotal: room.price_total,
                basePrice: room.base_price,
                nights: room.nights,
                capacity: staticRoom?.capacity ?? 2,
                size: staticRoom?.size ?? 0,
                features: room.features?.length
                    ? room.features
                    : (staticRoom?.features ?? []),
                images: staticRoom?.images?.length
                    ? staticRoom.images
                    : room.image
                      ? [room.image]
                      : [],
                providerRoomId: room.id ? Number(room.id) : undefined,
                boardingId: room.boarding_id ?? undefined,
                boardingName: room.boarding_name ?? undefined,
                viewIds: room.view_ids ?? [],
                supplements: normalizeSupplements(room.supplements ?? []),
                minStay: room.min_stay,
                onRequest: room.on_request,
                bookable: room.bookable,
                stopSales: room.stop_sales,
                notRefundable: room.not_refundable,
                cancellationDeadline: room.cancellation_deadline ?? undefined,
                cancellationPolicy: room.cancellation_policy ?? [],
            };
        });

    // The rates table renders the bookable live rooms after a search; before
    // any search (or for manual hotels) it falls back to the static catalog.
    const baseRooms: RateRoom[] =
        liveRooms.length > 0 ? liveRooms : staticRooms;
    const rateRooms: RateRoom[] =
        selectedBoardingIds.length > 0
            ? baseRooms.filter(
                  (r) =>
                      r.boardingId != null &&
                      selectedBoardingIds.includes(r.boardingId),
              )
            : baseRooms;

    const displayMinPrice = staticRooms.length
        ? Math.min(
              ...staticRooms.map(
                  (room) => room.priceTotal ?? room.pricePerNight,
              ),
          )
        : (detail.price ?? 0);
    // Provider-linked hotels show no price until a live search returns one;
    // manual hotels keep their stored price.
    const minPrice =
        effectiveHotel?.price ??
        (detail.provider === 'manual' ? displayMinPrice : 0);
    const currency = effectiveHotel?.currency ?? detail.currency ?? 'TND';
    const headerNights = effectiveHotel?.nights ?? 0;
    const headerDisplayPrice = effectiveHotel
        ? headerNights === 1
            ? effectiveHotel.price_per_night * occupancy.rooms
            : effectiveHotel.price_total
        : detail.provider === 'manual'
          ? displayMinPrice
          : null;
    // Match the "Montant total du séjour" calculation in BookingDialog
    const sidebarPrice = activeRate
        ? (activeRate.priceTotal ?? activeRate.pricePerNight) *
          occupancy.rooms
        : headerDisplayPrice;
    const sidebarBasePrice = activeRate
        ? (activeRate.basePrice ?? activeRate.priceTotal ?? activeRate.pricePerNight) *
          occupancy.rooms
        : sidebarPrice;
    const sidebarPromo = roomPromo(sidebarPrice, sidebarBasePrice);
    const title = localizeText(detail.name, lang);
    const location = localizeText(detail.location, lang);
    const description = localizeText(detail.description ?? detail.about, lang);
    const address = detail.address ?? location;
    const rawLatitude = detail.coordinates?.latitude;
    const rawLongitude = detail.coordinates?.longitude;

    let latitude = rawLatitude;
    let longitude = rawLongitude;

    if (typeof rawLatitude === 'number' && typeof rawLongitude === 'number') {
        // Detect swapped Tunisia coordinates:
        // latitude should be ~30–37.5
        // longitude should be ~7.5–11.6
        const latitudeLooksLikeLongitude =
            rawLatitude >= 7.5 && rawLatitude <= 11.6;

        const longitudeLooksLikeLatitude =
            rawLongitude >= 30.0 && rawLongitude <= 37.5;

        if (latitudeLooksLikeLongitude && longitudeLooksLikeLatitude) {
            [latitude, longitude] = [rawLongitude, rawLatitude];
        }
    }

    const stars = Math.min(5, Math.max(0, detail.stars));

    // -- New: surfaced fields that previously had no home in the layout --
    // A short teaser of the richest amenity data (icons + real photos) sits
    // right under the hero instead of the old, mostly-empty "Services &
    // amenities" block. The full set still lives in the Equipment tab below.
    const topTags = (detail.amenity_tags ?? []).slice(0, 8);
    // NOTE: `themes` isn't on HotelDetailLookupData yet in the snippet I was
    // given — it maps 1:1 to the raw `Theme` string array in your API
    // payload. Wire it through your data layer (or tell me the actual field
    // name) and this renders immediately; until then it's a no-op.
    const themes = (detail as { themes?: string[] }).themes ?? [];
    const noteText = cleanDescription(detail.note);
    const noteIsLong = noteText.length > 170;

    const hasMap =
        typeof latitude === 'number' && typeof longitude === 'number';

    const mapSrc = hasMap
        ? `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`
        : undefined;

    const mapLink = hasMap
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : `https://www.google.com/maps?q=${encodeURIComponent(address)}`;

    const scrollToRates = () => {
        document
            .getElementById('rates')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const handleReserve = (room: RateRoom) => {
        setSelectedRoom(room);
    };

    // The sidebar search hands the selected destination, dates and guest
    // count over to the hotels listing, which reads them from the URL.
    const handleSearchRedirect = () => {
        const params = new URLSearchParams();

        if (location.trim()) {
            params.set('q', location.trim());
        }

        const checkIn = toLocalISODate(dateRange?.from);
        const checkOut = toLocalISODate(dateRange?.to);
        if (checkIn) {
            params.set('from', checkIn);
        }
        if (checkOut) {
            params.set('to', checkOut);
        }

        params.set('guests', String(occupancy.adults));
        if (occupancy.rooms > 1) {
            params.set('rooms', String(occupancy.rooms));
        }
        if (occupancy.childAges.length > 0) {
            params.set('children', occupancy.childAges.join(','));
        }

        const queryString = params.toString();
        navigate(queryString ? `/hotels?${queryString}` : '/hotels');
    };

    const bookingRoom = selectedRoom;

    return (
        <PageShell
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.hotels'), href: '/hotels' },
                { label: title, active: true },
            ]}
        >
            {/* Gallery — full width at top */}
            <section className="mb-8">
                {gallery.length > 0 ? (
                    <Gallery
                        images={gallery}
                        hotelName={title}
                        favoriteItem={{
                            id: `hotel-${detail.id}`,
                            type: 'hotel',
                            name: title,
                            image: gallery[0] ?? '',
                            price: minPrice,
                            location,
                        }}
                    />
                ) : (
                    <div className="flex h-[300px] w-full items-center justify-center rounded-2xl border border-border bg-muted md:h-[500px]">
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
            </section>

            <div className="grid items-start gap-8 lg:grid-cols-[1fr_355px]">
                {/* ── Main content ──────────────────────────────────── */}
                <div className="min-w-0 space-y-10">
                    {/* Info Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex text-secondary">
                                {Array.from({ length: stars }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-4 w-4 fill-current"
                                    />
                                ))}
                            </div>
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {location}
                            </span>
                        </div>
                        <h1 className="font-serif text-3xl font-bold text-primary mb-4 md:text-4xl">
                            {title}
                        </h1>
                        {(() => {
                            const shortDesc =
                                cleanDescription(detail.short_description) ||
                                cleanDescription(
                                    (effectiveHotel as { short_description?: string | null })
                                        ?.short_description,
                                ) ||
                                cleanDescription(localizeText(detail.description ?? detail.about, lang));
                            if (shortDesc) {
                                return (
                                    <p className="text-base text-muted-foreground leading-relaxed">
                                        {shortDesc}
                                    </p>
                                );
                            }
                            return null;
                        })()}
                    </motion.div>

                    {/* Highlights — a teaser of the richest amenity data
                        (icons + real photos), replacing what used to be a
                        section header with almost nothing under it. */}
                    <section>
                        <h2 className="mb-4 inline-block border-b-2 border-secondary pb-1 font-serif text-2xl font-bold text-foreground">
                            {t('hotelInfo.highlights')}
                        </h2>

                        {topTags.length > 0 && (
                            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                                {topTags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card py-2 pl-2 pr-4"
                                    >
                                        {tag.image ? (
                                            <img
                                                src={tag.image}
                                                alt=""
                                                loading="lazy"
                                                className="h-7 w-7 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display =
                                                        'none';
                                                }}
                                            />
                                        ) : (
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                            </span>
                                        )}
                                        <span className="whitespace-nowrap text-xs font-medium text-foreground">
                                            {tag.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 gap-3">
                            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                <BadgePercent className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                <p className="text-sm text-foreground">
                                    {t('hotelDetail.bestPriceNote')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Booking policy notice — moved out of a closed
                        accordion three levels deep, placed right where the
                        booking decision happens. Always visible, not
                        dismissible. */}
                    {noteText && (
                        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-4">
                            <div className="flex items-start gap-3">
                                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-amber-900">
                                        {t('hotelInfo.importantNote')}
                                    </p>
                                    <p
                                        className={cn(
                                            'mt-1 text-sm leading-relaxed text-amber-900/90',
                                            !noteExpanded &&
                                                noteIsLong &&
                                                'line-clamp-2',
                                        )}
                                    >
                                        {noteText}
                                    </p>
                                    {noteIsLong && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setNoteExpanded((v) => !v)
                                            }
                                            className="mt-1 text-xs font-semibold text-amber-700 underline underline-offset-2"
                                        >
                                            {noteExpanded
                                                ? t('hotelInfo.less')
                                                : t('hotelInfo.more')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dates & Tarifs */}
                    <section id="rates" className="scroll-mt-28">
                        <h2 className="mb-4 inline-block border-b-2 border-secondary pb-1 font-serif text-2xl font-bold text-foreground">
                            {t('hotelDetail.datesAndRates')}
                        </h2>

                            {effectiveHotel &&
                            (effectiveHotel.price != null &&
                                effectiveHotel.base_price != null &&
                                effectiveHotel.price < effectiveHotel.base_price ||
                                effectiveHotel.free_child?.length ||
                                effectiveHotel.recommended) ? (
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {effectiveHotel.free_child?.length ? (
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                            {t('hotelDetail.freeChild')}
                                        </span>
                                    ) : null}
                                    {effectiveHotel.recommended && (
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                                            {t('hotelDetail.recommended')}
                                        </span>
                                    )}
                                </div>
                            ) : null}

                            {liveSearchError ? (
                                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm">
                                    <p className="font-semibold text-destructive">
                                        {t('search.error.title')}
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                        {t('search.error.description')}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => refetchSearch()}
                                    >
                                        {t('search.error.retry')}
                                    </Button>
                                </div>
                            ) : effectiveLoading ? (
                                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                                    <div className="flex items-center gap-2 bg-muted/60 px-5 py-3">
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <div className="divide-y divide-border">
                                        {Array.from({ length: 2 }).map(
                                            (_, i) => (
                                                <div key={i} className="p-5">
                                                    <div className="flex gap-4">
                                                        <Skeleton className="hidden h-20 w-24 shrink-0 rounded-2xl sm:block" />
                                                        <div className="flex-1 space-y-2">
                                                            <Skeleton className="h-4 w-40" />
                                                            <Skeleton className="h-3 w-24" />
                                                            <Skeleton className="h-3 w-64" />
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 space-y-2 sm:pl-[104px]">
                                                        <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
                                                            <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                                                            <div className="flex-1 space-y-1.5">
                                                                <Skeleton className="h-4 w-28" />
                                                                <Skeleton className="h-3 w-16" />
                                                            </div>
                                                            <Skeleton className="h-5 w-20" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-5 py-4">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-28 rounded-md" />
                                    </div>
                                </div>
                            ) : searchedUnavailable ? (
                                rateRooms.length > 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="mb-3 rounded-2xl border border-amber-300/50 bg-amber-50 p-4">
                                            <p className="text-sm text-amber-800">
                                                {t(
                                                    'hotelDetail.requestNotice',
                                                ) ||
                                                    'This hotel has no availability for your selected dates, but you can submit a request.'}
                                            </p>
                                            {unavailableHotel?.first_available_at && (
                                                <p className="mt-1 text-xs font-semibold text-amber-700">
                                                    {t(
                                                        'hotelDetail.availableFrom',
                                                    )}{' '}
                                                    {
                                                        unavailableHotel.first_available_at
                                                    }
                                                    {unavailableHotel.min_nights &&
                                                        unavailableHotel.min_nights >
                                                            1 &&
                                                        ` · ${t('hotelDetail.minimumNights')} ${unavailableHotel.min_nights}`}
                                                </p>
                                            )}
                                        </div>
                                        <RoomRatesTable
                                            rooms={rateRooms}
                                            occupancy={occupancy}
                                            currency={currency}
                                            onReserve={handleReserve}
                                            onSelect={(room) => setActiveRate(room)}
                                            requestMode
                                            resetKey={effectiveHotel?.id ?? 'static'}
                                        />
                                    </motion.div>
                                ) : (
                                    <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-6">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                                <span className="text-lg text-amber-700">
                                                    ?
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-serif text-lg font-bold text-amber-900">
                                                    {t(
                                                        'hotelDetail.requestTitle',
                                                    ) || 'Per request'}
                                                </h3>
                                                <p className="mt-1 text-sm text-amber-800">
                                                    {t(
                                                        'hotelDetail.requestNotice',
                                                    ) ||
                                                        'This hotel has no availability for your selected dates, but you can submit a request.'}
                                                </p>
                                                {unavailableHotel?.first_available_at && (
                                                    <p className="mt-2 text-xs font-semibold text-amber-700">
                                                        {t(
                                                            'hotelDetail.availableFrom',
                                                        )}{' '}
                                                        {
                                                            unavailableHotel.first_available_at
                                                        }
                                                        {unavailableHotel.min_nights &&
                                                            unavailableHotel.min_nights >
                                                                1 &&
                                                            ` · ${t('hotelDetail.minimumNights')} ${unavailableHotel.min_nights}`}
                                                    </p>
                                                )}
                                                <Button
                                                    className="mt-4 bg-amber-600 text-white hover:bg-amber-700"
                                                    onClick={() => {
                                                        setRequestMode(true);
                                                    }}
                                                >
                                                    {t(
                                                        'hotelDetail.requestBooking',
                                                    ) || 'Request Booking'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ) : hotelNotFound ? (
                                <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-800">
                                    {t('hotelDetail.unavailableNotice') ||
                                        'This hotel has no availability for the selected dates. Try other dates.'}
                                </div>
                            ) : activeQuery && effectiveHotel ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <RoomRatesTable
                                        rooms={rateRooms}
                                        occupancy={occupancy}
                                        currency={currency}
                                        onReserve={handleReserve}
                                        onSelect={(room) => setActiveRate(room)}
                                        resetKey={effectiveHotel?.id ?? 'static'}
                                    />
                                </motion.div>
                            ) : null}
                    </section>
                </div>

                {/* ── Sticky sidebar ─────────────────────────── */}
                <aside className="space-y-4 lg:sticky lg:top-24">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
                        {/* Price header */}
                        {sidebarPrice !== null && sidebarPrice > 0 && (
                            <div className="mb-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-primary">
                                        {formatPrice(
                                            sidebarPromo ? sidebarPromo.discounted : sidebarPrice,
                                            currency,
                                        )}
                                    </span>
                                    {sidebarPromo && (
                                        <span className="ml-auto bg-destructive/10 text-destructive text-xs font-medium px-2 py-1 rounded-full">
                                            -{Math.round(((sidebarPromo.original - sidebarPromo.discounted) / sidebarPromo.original) * 100)}% {t('hotelDetail.today')}
                                        </span>
                                    )}
                                </div>
                                {sidebarPromo && (
                                    <p className="text-xs font-medium text-muted-foreground line-through">
                                        {formatPrice(sidebarPromo.original, currency)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Dates popover */}
                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="w-full border border-border rounded-lg p-3 text-left hover:bg-muted/50 transition-colors mb-4"
                                >
                                    <div className="flex">
                                        <div className="flex-1 border-r border-border">
                                            <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('hotelDetail.checkIn')}</span>
                                            <span className="text-sm font-medium text-foreground">
                                                {dateRange?.from
                                                    ? format(dateRange.from, 'd MMM yyyy', { locale: datePickerLocale(lang) })
                                                    : '—'}
                                            </span>
                                        </div>
                                        <div className="flex-1 pl-3">
                                            <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('hotelDetail.checkOut')}</span>
                                            <span className="text-sm font-medium text-foreground">
                                                {dateRange?.to
                                                    ? format(dateRange.to, 'd MMM yyyy', { locale: datePickerLocale(lang) })
                                                    : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    initialFocus
                                    locale={datePickerLocale(lang)}
                                    fromDate={tomorrowDate}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Occupancy popover */}
                        <Popover open={occupancyPickerOpen} onOpenChange={setOccupancyPickerOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="w-full border border-border rounded-lg p-3 text-left hover:bg-muted/50 transition-colors mb-6"
                                >
                                    <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('hotelDetail.guests')}</span>
                                    <span className="text-sm font-medium text-foreground">
                                        {occupancy.adults} {t('hotelDetail.adults')}, {occupancy.childAges.length} {t('hotelDetail.children')}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 space-y-4" align="start">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{t('hotelDetail.roomsTitle')}</p>
                                        <p className="text-xs text-muted-foreground">{t('hotelDetail.advancedSearch')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="outline" size="icon" onClick={() => setOccupancy({ ...occupancy, rooms: Math.max(1, occupancy.rooms - 1) })} disabled={occupancy.rooms <= 1}>
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="min-w-8 text-center text-base font-semibold">{occupancy.rooms}</span>
                                        <Button type="button" variant="outline" size="icon" onClick={() => setOccupancy({ ...occupancy, rooms: Math.min(8, occupancy.rooms + 1) })} disabled={occupancy.rooms >= 8}>
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{t('hotelDetail.adults')}</p>
                                        <p className="text-xs text-muted-foreground">{t('hotels.adultsHelp')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="outline" size="icon" onClick={() => setOccupancy({ ...occupancy, adults: Math.max(1, occupancy.adults - 1) })} disabled={occupancy.adults <= 1}>
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="min-w-8 text-center text-base font-semibold">{occupancy.adults}</span>
                                        <Button type="button" variant="outline" size="icon" onClick={() => setOccupancy({ ...occupancy, adults: Math.min(10, occupancy.adults + 1) })} disabled={occupancy.adults >= 10}>
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{t('hotelDetail.children')}</p>
                                        <p className="text-xs text-muted-foreground">{t('hotels.childrenHelp')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="outline" size="icon" onClick={() => setOccupancy({ ...occupancy, childAges: occupancy.childAges.slice(0, -1) })} disabled={occupancy.childAges.length === 0}>
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="min-w-8 text-center text-base font-semibold">{occupancy.childAges.length}</span>
                                        <Button type="button" variant="outline" size="icon" onClick={() => setOccupancy({ ...occupancy, childAges: [...occupancy.childAges, 8] })} disabled={occupancy.childAges.length >= 6}>
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                {occupancy.childAges.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-border">
                                        {occupancy.childAges.map((age, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">{t('hotels.child')} {i + 1}</span>
                                                <select value={age} onChange={(e) => {
                                                    const newAges = [...occupancy.childAges];
                                                    newAges[i] = Number(e.target.value);
                                                    setOccupancy({ ...occupancy, childAges: newAges });
                                                }} className="border border-border rounded-md px-2 py-1 text-sm">
                                                    {Array.from({ length: 18 }, (_, i) => (
                                                        <option key={i} value={i}>{i} {t('hotels.yearsOld')}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>

                        {/* Check availability button */}
                        <Button
                            type="button"
                            onClick={scrollToRates}
                            className="h-12 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                            {t('hotelDetail.checkAvailability')}
                        </Button>
                    </div>

                    {/* Map card */}
                    {hasMap && (
                        <div className="relative h-44 overflow-hidden rounded-2xl border border-border">
                            <iframe
                                title={`${t('hotelDetail.mapOf')} ${title}`}
                                src={mapSrc}
                                loading="lazy"
                                className="h-full w-full border-0 saturate-50"
                            />
                            <a
                                href={mapLink}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute inset-x-6 bottom-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-card text-xs font-medium text-foreground shadow-md hover:bg-card/90"
                            >
                                <MapIcon className="h-4 w-4" />
                                {t('hotelDetail.viewOnMap')}
                            </a>
                        </div>
                    )}

                    {/* Info card */}
                    <aside className="h-fit space-y-3 rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-start gap-2.5">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span className="text-xs text-muted-foreground">
                                {address}
                            </span>
                        </div>
                        <div className="flex flex-row justify-between gap-3 mx-8">
                        {detail.check_in_time && (
                            <div className="flex items-center gap-2.5">
                                <LogIn className="h-4 w-4 shrink-0 text-primary" />
                                <span className="text-xs text-muted-foreground">
                                    {t('hotelInfo.checkIn')}{' '}
                                    {detail.check_in_time}
                                </span>
                            </div>
                        )}
                        {detail.check_out_time && (
                            <div className="flex items-center gap-2.5">
                                <LogOut className="h-4 w-4 shrink-0 text-primary" />
                                <span className="text-xs text-muted-foreground">
                                    {t('hotelInfo.checkOut')}{' '}
                                    {detail.check_out_time}
                                </span>
                            </div>
                        )}
                        </div>
                        {themes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {themes.map((theme) => (
                                    <span
                                        key={theme}
                                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                    >
                                        {theme}
                                    </span>
                                ))}
                            </div>
                        )}
                    </aside>
                </aside>
            </div>

            {bookingRoom && (
                <BookingDialog
                    open={!!bookingRoom}
                    onOpenChange={(open) => !open && setSelectedRoom(null)}
                    type="hotel"
                    itemSlug={id}
                    itemId={detail.id}
                    itemName={`${title} - ${bookingRoom.name}`}
                    amount={(() => {
                        const raw =
                            (bookingRoom.priceTotal ??
                                bookingRoom.pricePerNight) * occupancy.rooms;
                        const promo = roomPromo(
                            raw,
                            (bookingRoom.basePrice ?? bookingRoom.pricePerNight) * occupancy.rooms,
                        );
                        return promo ? promo.discounted : raw;
                    })()}
                    minDate={new Date()}
                    image={bookingRoom.images[0] ?? detail.image ?? undefined}
                    currency={currency}
                    pricePerNight={bookingRoom.pricePerNight}
                    subLabel={bookingRoom.boardingName ?? undefined}
                    notRefundable={bookingRoom.notRefundable}
                    freeCancellationUntil={bookingRoom.cancellationDeadline}
                    basePrice={
                        (bookingRoom.basePrice ?? bookingRoom.priceTotal ?? bookingRoom.pricePerNight) *
                        occupancy.rooms
                    }
                    provider={
                        effectiveHotel
                            ? {
                                  token: effectiveHotel.rooms[0]?.token,
                                  source: effectiveHotel.rooms[0]?.source,
                                  rooms: Array.from(
                                      { length: occupancy.rooms },
                                      () => ({
                                          id: bookingRoom.providerRoomId
                                              ? String(
                                                    bookingRoom.providerRoomId,
                                                )
                                              : undefined,
                                          boardingId: bookingRoom.boardingId,
                                          viewIds: bookingRoom.viewIds,
                                          supplements: bookingRoom.supplements,
                                      }),
                                  ),
                                  adults: occupancy.adults,
                                  children: occupancy.childAges.length,
                                  childrenAges: occupancy.childAges,
                                  checkIn: toLocalISODate(dateRange?.from),
                                  checkOut: toLocalISODate(dateRange?.to),
                                  options: detail.options ?? [],
                              }
                            : undefined
                    }
                    roomName={bookingRoom.name}
                    boardingName={bookingRoom.boardingName}
                    roomSize={bookingRoom.size}
                    roomCapacity={bookingRoom.capacity}
                    roomFeatures={bookingRoom.features}
                    cancellationPolicy={bookingRoom.cancellationPolicy}
                    supplements={bookingRoom.supplements}
                />
            )}

            {requestMode && (
                <BookingDialog
                    open={requestMode}
                    onOpenChange={(open) => {
                        if (!open) {
                            setRequestMode(false);
                        }
                    }}
                    type="hotel"
                    itemSlug={id}
                    itemId={detail.id}
                    itemName={title}
                    amount={detail.price ?? 0}
                    minDate={new Date()}
                    isRequest
                    image={detail.image ?? undefined}
                    currency={currency}
                />
            )}
        </PageShell>
    );
}
