import { motion } from 'framer-motion';
import {
    BadgePercent,
    Bed,
    Building2,
    Car,
    Coffee,
    Droplet,
    Dumbbell,
    Heart,
    Map as MapIcon,
    MapPin,
    Ruler,
    Search,
    ShieldCheck,
    Star,
    Trees,
    Users,
    Utensils,
    UtensilsCrossed,
    Wifi,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Navigate, useParams } from 'react-router-dom';
import { notifyInteraction } from '@/api/interactions.api';
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
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import {
    useHotelById,
    useHotelSearch,
    type HotelDetailLookupData,
    type HotelSearchQuery,
} from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';
import { toLocalISODate } from '@/lib/utils';

type AmenityIcon = typeof Wifi | null;

type RoomView = {
    id: string;
    name: string;
    description?: string;
    pricePerNight: number;
    // Live OS-TRAVEL rooms carry a TOTAL-stay price; static admin rooms only
    // have an admin-defined per-night price.
    priceTotal?: number;
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
    stopSales?: { from: string; to: string } | null;
    notRefundable?: boolean;
    cancellationDeadline?: string;
};

type AmenityView = {
    id: string;
    name: string;
    icon: AmenityIcon;
    customSvg?: string | null;
    iconifyName?: string | null;
};

const AMENITY_ICONS: Record<string, AmenityIcon> = {
    wifi: Wifi,
    parking: Car,
    breakfast: Coffee,
    gym: Dumbbell,
    restaurant: Utensils,
    pool: Droplet,
};

function normalizeAmenityKey(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z]+/g, ' ')
        .trim();
}

function toAmenityView(
    amenity: { name: Record<string, string>; icon?: string | null },
    lang: Lang,
    index: number,
): AmenityView {
    const nameData = amenity.name;
    const name = localizeText(nameData, lang);
    const key = normalizeAmenityKey(name);

    let icon: AmenityIcon = (AMENITY_ICONS[key] ?? Wifi) as AmenityIcon;
    let customSvg: string | null = null;
    let iconifyName: string | null = null;

    if (amenity.icon) {
        const iconVal = String(amenity.icon);
        if (iconVal.trim().startsWith('<svg')) {
            customSvg = iconVal;
            icon = null;
        } else if (iconVal.includes(':')) {
            iconifyName = iconVal;
            icon = null;
        } else {
            icon = (AMENITY_ICONS[iconVal] ?? icon) as AmenityIcon;
        }
    }

    return {
        id: `amenity-${index + 1}`,
        name,
        icon,
        customSvg,
        iconifyName,
    };
}

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
                      ? (s.name as Record<string, string>).en ??
                        (s.name as Record<string, string>).fr ??
                        ''
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
    const { lang, t } = useLanguage();
    const { data: hotel, isLoading } = useHotelById(id);
    const [selectedRoom, setSelectedRoom] = useState<RoomView | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [occupancy, setOccupancy] = useState<Occupancy>({
        rooms: 1,
        adults: 2,
        childAges: [],
    });
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [selectedBoardingIds, setSelectedBoardingIds] = useState<number[]>([]);

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
            boarding_ids:
                selectedBoardingIds.length > 0 ? selectedBoardingIds : undefined,
        };
    }, [dateRange, occupancy.rooms, occupancy.adults, occupancy.childAges, id, selectedBoardingIds]);

    // The live search only fires after the user explicitly clicks the
    // availability button; it never runs from stored price/availability data.
    const [submittedQuery, setSubmittedQuery] = useState<
        HotelSearchQuery | undefined
    >(undefined);
    const handleCheckAvailability = () => {
        setSubmittedQuery(liveQuery);
    };

    // Results are trusted only while the submitted query still matches the
    // current inputs; as soon as dates, occupancy or boardings change the
    // query becomes stale and the search is cleared without a new request.
    const submittedKey = JSON.stringify(submittedQuery);
    const liveKey = JSON.stringify(liveQuery);
    const resultsAreStale =
        Boolean(submittedQuery) && submittedKey !== liveKey;
    const activeQuery = resultsAreStale ? undefined : submittedQuery;

    const { data: liveResult, isLoading: liveSearchLoading } =
        useHotelSearch(activeQuery);
    const liveResults = liveResult?.data ?? [];
    const liveHotel = liveResults[0] ?? undefined;

    // A completed search with no result means the hotel has no availability
    // for the selected dates — never offer stale room prices for it.
    const searchedUnavailable =
        Boolean(activeQuery) && !liveSearchLoading && !liveHotel;

    if (isLoading) {
        return null;
    }

    if (!hotel) {
        return <Navigate to="/hotels" replace />;
    }

    const detail = hotel as HotelDetailLookupData;
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
    const staticRooms = (detail.rooms ?? []).map((room) =>
        toRoomView(room, lang),
    );
    const staticRoomByName = new Map(
        staticRooms.map((room) => [room.name, room]),
    );

    const liveRooms: RoomView[] = (liveHotel?.rooms ?? [])
        .filter((room) => {
            // Only offer rooms that are actually bookable for the searched
            // window: not stop-reserved, minimum stay fits, and no stop-sale
            // range covers the dates.
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
                    staticRoom?.description ??
                    (room.boarding_name
                        ? `Boarding: ${room.boarding_name}`
                        : ''),
                pricePerNight: room.price_per_night,
                priceTotal: room.price_total,
                nights: room.nights,
                capacity: staticRoom?.capacity ?? 2,
                size: staticRoom?.size ?? 0,
                features: staticRoom?.features ?? [],
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
                stopSales: room.stop_sales,
                notRefundable: room.not_refundable,
                cancellationDeadline:
                    room.cancellation_deadline ?? undefined,
            };
        });

    // The rates table renders the bookable live rooms after a search; before
    // any search (or for manual hotels) it falls back to the static catalog.
    const rateRooms: RateRoom[] =
        liveRooms.length > 0 ? liveRooms : staticRooms;

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
        liveHotel?.price ??
        (detail.provider === 'manual' ? displayMinPrice : 0);
    const currency = liveHotel?.currency ?? detail.currency ?? 'TND';
    const headerPerNight = liveHotel
        ? liveHotel.price_per_night * occupancy.rooms
        : detail.provider === 'manual'
          ? displayMinPrice
          : null;
    const amenities = (detail.amenities ?? [])
        .filter((amenity) => {
            const nameData =
                typeof amenity === 'object' &&
                amenity !== null &&
                'name' in amenity
                    ? ((amenity as { name?: Record<string, string> }).name ??
                      {})
                    : {};
            return Boolean(
                nameData && (nameData.en || nameData.fr || nameData.ar),
            );
        })
        .map((amenity, index) =>
            toAmenityView(
                amenity as unknown as {
                    name: Record<string, string>;
                    icon?: string | null;
                },
                lang,
                index,
            ),
        );
    const title = localizeText(detail.name, lang);
    const location = localizeText(detail.location, lang);
    const description = localizeText(detail.description ?? detail.about, lang);
    const address = detail.address ?? location;

    const stars = Math.min(5, Math.max(0, detail.stars));
    const scoreLabel = (rating: number) =>
        rating >= 4.7
            ? t('hotelDetail.scoreExcellent')
            : rating >= 4.4
              ? t('hotelDetail.scoreAdorable')
              : rating >= 4
                ? t('hotelDetail.scoreVeryGood')
                : t('hotelDetail.scoreGood');

    const hasMap =
        typeof detail.coordinates?.latitude === 'number' &&
        typeof detail.coordinates?.longitude === 'number';
    const mapSrc = hasMap
        ? `https://www.google.com/maps?q=${detail.coordinates!.longitude},${detail.coordinates!.latitude}&output=embed`
        : undefined;
    const mapLink = hasMap
        ? `https://www.google.com/maps?q=${detail.coordinates!.longitude},${detail.coordinates!.latitude}`
        : `https://www.google.com/maps?q=${encodeURIComponent(address)}`;

    const scrollToRates = () => {
        document
            .getElementById('rates')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleReserve = (room: RateRoom) => {
        setSelectedRoom(room);
    };

    const handleWhatsAppInquiry = () => {
        notifyInteraction('whatsapp');
        window.open('/contact', '_self');
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
            <div className="grid items-start gap-8 lg:grid-cols-[320px_1fr]">
                {/* ── Sticky search sidebar ─────────────────────────── */}
                <aside className="space-y-4 lg:sticky lg:top-24">
                    <div className="rounded-3xl border border-border bg-card p-5">
                        <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
                            {t('hotelDetail.search')}
                        </h2>
                        <div className="space-y-3">
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                                <Input
                                    value={address}
                                    readOnly
                                    aria-label={t('hotelDetail.destination')}
                                    className="h-11 rounded-xl pl-9"
                                />
                            </div>
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                            />
                            <OccupancyPicker
                                value={occupancy}
                                onChange={setOccupancy}
                            />
                            {(detail.boardings?.length ?? 0) > 0 && (
                                <div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAdvancedOpen((open) => !open)
                                        }
                                        className="text-xs text-primary underline underline-offset-4"
                                    >
                                        {t('hotelDetail.advancedSearch')}
                                    </button>
                                    {advancedOpen && (
                                        <div className="mt-2 space-y-1.5">
                                            {detail.boardings!.map(
                                                (boarding) => {
                                                    const checked =
                                                        selectedBoardingIds.includes(
                                                            boarding.id,
                                                        );
                                                    return (
                                                        <label
                                                            key={boarding.id}
                                                            className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() =>
                                                                    setSelectedBoardingIds(
                                                                        (ids) =>
                                                                            checked
                                                                                ? ids.filter(
                                                                                      (i) =>
                                                                                          i !==
                                                                                          boarding.id,
                                                                                  )
                                                                                : [
                                                                                      ...ids,
                                                                                      boarding.id,
                                                                                  ],
                                                                    )
                                                                }
                                                                className="h-4 w-4 accent-primary"
                                                            />
                                                            {boarding.name ||
                                                                boarding.code}
                                                        </label>
                                                    );
                                                },
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <Button
                                type="button"
                                disabled={!liveQuery}
                                onClick={handleCheckAvailability}
                                className="h-11 w-full bg-primary text-primary-foreground"
                            >
                                <Search className="h-4 w-4" />
                                {liveSearchLoading
                                    ? t('hotelDetail.checkingAvailability')
                                    : t('hotelDetail.search')}
                            </Button>
                        </div>
                    </div>

                    {/* Map card */}
                    <div className="relative h-44 overflow-hidden rounded-3xl border border-border">
                        {mapSrc ? (
                            <iframe
                                title={`${t('hotelDetail.mapOf')} ${title}`}
                                src={mapSrc}
                                loading="lazy"
                                className="h-full w-full border-0 saturate-50"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                                <MapPin className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                        )}
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

                    {/* Best-rate guarantee card */}
                    <div className="space-y-2 rounded-3xl border border-primary/20 bg-primary/5 p-5">
                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            {t('hotelDetail.bestRateGuaranteed')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('hotelDetail.bestRateHint')}
                        </p>
                    </div>
                </aside>

                {/* ── Main content ──────────────────────────────────── */}
                <div className="min-w-0 space-y-10">
                    {/* Header */}
                    <motion.header
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap items-start justify-between gap-4"
                    >
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                                    {title}
                                </h1>
                                <div className="flex text-secondary">
                                    {Array.from({ length: stars }).map(
                                        (_, i) => (
                                            <Star
                                                key={i}
                                                className="h-4 w-4 fill-current"
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                {location}
                            </p>
                            <div className="mt-3 flex items-center gap-4">
                                <FavoriteButton
                                    item={{
                                        id: `hotel-${detail.id}`,
                                        type: 'hotel',
                                        name: title,
                                        image: gallery[0] ?? '',
                                        price: minPrice,
                                        location,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleWhatsAppInquiry}
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <Heart className="h-3.5 w-3.5" />
                                    {t('hotelDetail.reserveNow')}
                                </button>
                            </div>
                        </div>
                        <div className="text-right">
                            {headerPerNight !== null && headerPerNight > 0 ? (
                                <>
                                    <p className="text-3xl font-bold text-foreground">
                                        {headerPerNight.toLocaleString()}
                                        <span className="align-top text-sm font-semibold">
                                            {' '}
                                            {currency}
                                        </span>
                                    </p>
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        {t('hotelDetail.perNightFrom')}
                                    </p>
                                </>
                            ) : null}
                            <Button
                                type="button"
                                onClick={scrollToRates}
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            >
                                {t('hotelDetail.roomsAndRates')}
                            </Button>
                        </div>
                    </motion.header>

                    {/* Gallery + score */}
                    <section className="relative">
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
                        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-2xl bg-card/90 px-3 py-2 shadow-lg backdrop-blur">
                            <span className="text-xs font-medium text-muted-foreground">
                                {scoreLabel(detail.rating)}
                            </span>
                            <span className="rounded-xl bg-primary px-2 py-1 text-sm font-bold text-primary-foreground">
                                {detail.rating.toFixed(1)}
                            </span>
                        </div>
                    </section>

                    {/* Services & équipements */}
                    <section>
                        <h2 className="mb-4 inline-block border-b-2 border-secondary pb-1 font-serif text-2xl font-bold text-foreground">
                            {t('hotelDetail.servicesAndEquipments')}
                        </h2>
                        {amenities.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {amenities.map((amenity) => {
                                    const Icon = amenity.icon;
                                    return (
                                        <div
                                            key={amenity.id}
                                            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                                {Icon && (
                                                    <Icon className="h-4 w-4 text-primary" />
                                                )}
                                            </div>
                                            <span className="text-sm text-foreground">
                                                {amenity.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-5 space-y-3">
                            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                <BadgePercent className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                <p className="text-sm text-foreground">
                                    {t('hotelDetail.bestPriceNote')}
                                </p>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
                                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                                <p className="text-sm text-foreground">
                                    {t('hotelDetail.freeCancellationNote')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Dates & Tarifs */}
                    <section id="rates" className="scroll-mt-28">
                        <h2 className="mb-4 inline-block border-b-2 border-secondary pb-1 font-serif text-2xl font-bold text-foreground">
                            {t('hotelDetail.datesAndRates')}
                        </h2>

                        <div className="mt-4 grid items-end gap-3 rounded-3xl border border-border bg-card p-5 md:grid-cols-[1.4fr_1.2fr_auto]">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    {t('hotelDetail.checkInOut')}
                                </label>
                                <DateRangePicker
                                    value={dateRange}
                                    onChange={setDateRange}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    {t('hotelDetail.occupancy')}
                                </label>
                                <OccupancyPicker
                                    value={occupancy}
                                    onChange={setOccupancy}
                                />
                            </div>
                            <Button
                                type="button"
                                disabled={!liveQuery}
                                onClick={handleCheckAvailability}
                                className="h-11 bg-primary text-primary-foreground"
                            >
                                {liveSearchLoading
                                    ? t('hotelDetail.checkingAvailability')
                                    : t('hotelDetail.checkAvailability')}
                            </Button>
                        </div>

                        <div className="mt-5">
                            {liveHotel &&
                            (liveHotel.promotion?.rate ||
                                liveHotel.free_child?.length ||
                                liveHotel.recommended) ? (
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {liveHotel.promotion?.rate &&
                                    liveHotel.promotion.title ? (
                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                            {t('hotelDetail.promo')}{' '}
                                            {liveHotel.promotion.title}
                                        </span>
                                    ) : null}
                                    {liveHotel.free_child?.length ? (
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                            {t('hotelDetail.freeChild')}
                                        </span>
                                    ) : null}
                                    {liveHotel.recommended && (
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                                            {t('hotelDetail.recommended')}
                                        </span>
                                    )}
                                </div>
                            ) : null}

                            {searchedUnavailable ? (
                                <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-800">
                                    {t('hotelDetail.unavailableNotice') ||
                                        'This hotel has no availability for the selected dates. Try other dates.'}
                                </div>
                            ) : submittedQuery && liveHotel ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                                        {t('hotelDetail.livePrices')}
                                    </div>
                                    <RoomRatesTable
                                        rooms={rateRooms}
                                        occupancy={occupancy}
                                        currency={currency}
                                        onReserve={handleReserve}
                                    />
                                </motion.div>
                            ) : (
                                <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                    {t('hotelDetail.ratesHint')}
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Hébergement */}
                    <section>
                        <h2 className="mb-4 inline-block border-b-2 border-secondary pb-1 font-serif text-2xl font-bold text-foreground">
                            {t('hotelDetail.accommodation')}
                        </h2>
                        <div className="mt-4 max-w-3xl space-y-5">
                            <div>
                                <h3 className="mb-1 text-sm font-bold text-foreground">
                                    {t('hotelDetail.discover')} {title}
                                </h3>
                                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                            <div>
                                <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    {t('hotelDetail.locationTitle')}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {address}
                                    {' — '}
                                    {t(
                                        'hotelDetail.accommodationLocationCopy',
                                    )}
                                </p>
                            </div>
                            <div>
                                <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
                                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                                    {t('hotelDetail.diningAndBar')}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {t('hotelDetail.accommodationDiningCopy')}
                                </p>
                            </div>
                            <div>
                                <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Trees className="h-4 w-4 text-primary" />
                                    {t('hotelDetail.activitiesAndLeisure')}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {t(
                                        'hotelDetail.accommodationActivitiesCopy',
                                    )}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Chambres */}
                    {staticRooms.length > 0 && (
                        <section>
                            <h2 className="mb-4 inline-block border-b-2 border-secondary pb-1 font-serif text-2xl font-bold text-foreground">
                                {t('hotelDetail.roomsTitle')}
                            </h2>
                            <div className="mt-4 max-w-3xl space-y-3">
                                {staticRooms.map((room) => (
                                    <div
                                        key={room.id}
                                        className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                            <Bed className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="min-w-[140px] flex-1">
                                            <h3 className="font-serif text-lg font-bold text-foreground">
                                                {room.name}
                                            </h3>
                                            <p className="flex items-center gap-3 text-xs text-muted-foreground">
                                                {room.size ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Ruler className="h-3 w-3" />{' '}
                                                        {room.size} m²
                                                    </span>
                                                ) : null}
                                                <span className="inline-flex items-center gap-1">
                                                    <Users className="h-3 w-3" />{' '}
                                                    {room.capacity}{' '}
                                                    {t(
                                                        'hotelDetail.guests',
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {detail.provider === 'manual' ? (
                                                <>
                                                    <p className="text-xl font-bold text-primary">
                                                        {room.pricePerNight.toLocaleString()}{' '}
                                                        {currency}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t(
                                                            'hotelDetail.pernight',
                                                        )}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        'hotelDetail.livePriceHint',
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            className="bg-primary text-primary-foreground"
                                            onClick={scrollToRates}
                                        >
                                            {t('hotelDetail.reserve')}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Practical info + boardings + options + tags */}
                    <HotelInfo
                        description=""
                        category={
                            detail.category
                                ? localizeText(detail.category, lang)
                                : ''
                        }
                        amenities={[]}
                        checkIn={detail.check_in_time}
                        checkOut={detail.check_out_time}
                        address={detail.address}
                        phone={detail.phone}
                        email={detail.email}
                        options={detail.options}
                        boardings={detail.boardings}
                        facilities={detail.facilities}
                        amenityTags={detail.amenity_tags}
                        note={detail.note}
                    />

                    <Separator />

                    {/* Reviews summary */}
                    <section className="grid items-center gap-6 rounded-3xl border border-border bg-card p-6 sm:grid-cols-[auto_1fr]">
                        <div className="text-center">
                            <p className="text-4xl font-bold text-primary">
                                {detail.rating.toFixed(1)}
                            </p>
                            <div className="mt-1 flex justify-center text-secondary">
                                {Array.from({ length: Math.round(stars) }).map(
                                    (_, i) => (
                                        <Star
                                            key={i}
                                            className="h-3.5 w-3.5 fill-current"
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                        <div className="flex h-full items-center rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                            {scoreLabel(detail.rating)} —{' '}
                            {t('hotelDetail.freeCancellationNote')}
                        </div>
                    </section>
                </div>
            </div>

            {bookingRoom && (
                <BookingDialog
                    open={!!bookingRoom}
                    onOpenChange={(open) => !open && setSelectedRoom(null)}
                    type="hotel"
                    itemId={detail.id}
                    itemName={`${title} - ${bookingRoom.name}`}
                    amount={
                        (bookingRoom.priceTotal ??
                            bookingRoom.pricePerNight) * occupancy.rooms
                    }
                    minDate={new Date()}
                    provider={
                        liveHotel
                            ? {
                                  token: liveHotel.rooms[0]?.token,
                                  source: liveHotel.rooms[0]?.source,
                                  rooms: Array.from(
                                      { length: occupancy.rooms },
                                      () => ({
                                          id: bookingRoom.providerRoomId
                                              ? String(
                                                    bookingRoom.providerRoomId,
                                                )
                                              : undefined,
                                          boardingId:
                                              bookingRoom.boardingId,
                                          viewIds: bookingRoom.viewIds,
                                          supplements:
                                              bookingRoom.supplements,
                                      }),
                                  ),
                                  adults: occupancy.adults,
                                  children: occupancy.childAges.length,
                                  childrenAges: occupancy.childAges,
                                  checkIn: toLocalISODate(dateRange?.from),
                                  checkOut: toLocalISODate(dateRange?.to),
                              }
                            : undefined
                    }
                />
            )}
        </PageShell>
    );
}
