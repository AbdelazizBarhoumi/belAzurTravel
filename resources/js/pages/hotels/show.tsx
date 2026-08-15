import { format } from 'date-fns';
import { arSA, enUS, fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Car, Coffee, Droplet, Dumbbell, Utensils, Wifi } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Navigate, useParams } from 'react-router-dom';
import { notifyInteraction } from '@/api/interactions.api';
import { HotelInfo } from '@/components/cards/HotelInfo';
import { StickyBookingCard } from '@/components/cards/StickyBookingCard';
import { BookingDialog } from '@/components/forms/BookingDialog';
import { PageShell } from '@/components/layout/PageShell';
import { RoomsList } from '@/components/lists/RoomsList';
import { Gallery } from '@/components/media/Gallery';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import {
    OccupancyPicker,
    type Occupancy,
} from '@/components/ui/OccupancyPicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import {
    useHotelById,
    useHotelSearch,
    type HotelDetailLookupData,
} from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

type AmenityIcon = typeof Wifi | null;

type RoomView = {
    id: string;
    name: string;
    description: string;
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
    viewIds?: number[];
    supplements?: Array<{ name: string; price: number; perNight?: boolean }>;
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

function datePickerLocale(lang: Lang) {
    if (lang === 'ar') return arSA;
    if (lang === 'en') return enUS;
    return fr;
}

function formatDate(date: Date, lang: Lang): string {
    return format(date, 'PPP', { locale: datePickerLocale(lang) });
}

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
        adults: 2,
        childAges: [],
    });

    const liveQuery = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to || !id) {
            return undefined;
        }

        return {
            check_in: dateRange.from.toISOString().slice(0, 10),
            check_out: dateRange.to.toISOString().slice(0, 10),
            hotel_slugs: [id],
            rooms: [
                {
                    adults: occupancy.adults,
                    children: occupancy.childAges,
                },
            ],
            only_available: true,
        };
    }, [dateRange, occupancy.adults, occupancy.childAges, id]);

    const { data: liveResult, isLoading: liveSearchLoading } =
        useHotelSearch(liveQuery);
    const liveResults = liveResult?.data ?? [];
    const liveHotel = liveResults[0] ?? undefined;

    // A completed search with no result means the hotel has no availability
    // for the selected dates — never offer stale room prices for it.
    const searchedUnavailable =
        Boolean(liveQuery) && !liveSearchLoading && !liveHotel;

    if (isLoading) {
        return null;
    }

    if (!hotel) {
        return <Navigate to="/hotels" replace />;
    }

    const detail = hotel as HotelDetailLookupData;
    const firstAvailableDate = detail.first_available_at
        ? new Date(`${detail.first_available_at}T00:00:00`)
        : undefined;
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
    const rooms = (detail.rooms ?? []).map((room) => toRoomView(room, lang));
    const staticRoomByName = new Map(rooms.map((room) => [room.name, room]));

    const liveRooms: RoomView[] = (liveHotel?.rooms ?? [])
        .filter((room) => !room.stop_reservation)
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
                images: staticRoom?.images ?? [],
                providerRoomId: room.id ? Number(room.id) : undefined,
                boardingId: room.boarding_id ?? undefined,
                viewIds: room.view_ids ?? [],
                supplements: normalizeSupplements(room.supplements ?? []),
            };
        });
    const liveRoomIds = new Set(liveRooms.map((room) => room.id));
    const displayRooms =
        liveRooms.length > 0
            ? [...liveRooms, ...rooms.filter((room) => !liveRoomIds.has(room.id))]
            : rooms;
    const displayMinPrice = displayRooms.length
        ? Math.min(...displayRooms.map((room) => room.priceTotal ?? room.pricePerNight))
        : (detail.price ?? 0);
    const minPrice = liveHotel?.price ?? displayMinPrice;
    const livePriceLabel = liveHotel
        ? t('hotelDetail.livePrices')
        : undefined;
    const priceSuffix = liveHotel
        ? liveHotel.nights
            ? `· ${liveHotel.nights} ${t('hotelDetail.nightsLabel')}`
            : undefined
        : t('hotelDetail.pernight');
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
    const _city = detail.city ? localizeText(detail.city, lang) : '';
    const _country = detail.country
        ? localizeText(detail.country, lang)
        : location;

    const handleReserve = () => {
        const roomsElement = document.getElementById('rooms-list');
        roomsElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleBookRoom = (roomId: string) => {
        if (searchedUnavailable) {
            return;
        }
        const room = displayRooms.find((r) => r.id === roomId);
        if (room) {
            setSelectedRoom(room);
        }
    };

    const handleWhatsAppInquiry = () => {
        notifyInteraction('whatsapp');
        window.open('/contact', '_self');
    };

    return (
        <PageShell
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.hotels'), href: '/hotels' },
                { label: title, active: true },
            ]}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-10 lg:grid-cols-[2fr_1fr]"
            >
                <div className="flex flex-col">
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

                    <div className="lg:hidden">
                        <StickyBookingCard
                            minPrice={minPrice}
                            currency="TND"
                            priceLabel={
                                livePriceLabel ??
                                (t('hotelDetail.startingFrom') || 'From')
                            }
                            priceSuffix={priceSuffix}
                            title={title}
                            location={location}
                            entityType="hotel"
                            itemId={detail.id}
                            rating={detail.stars}
                            reviews={detail.reviews}
                            primaryButtonLabel={
                                t('hotelDetail.reserveNow') || 'Book now'
                            }
                            onBook={handleReserve}
                            onWhatsApp={handleWhatsAppInquiry}
                        />
                    </div>

                    <HotelInfo
                        description={description}
                        category={
                            detail.category
                                ? localizeText(detail.category, lang)
                                : ''
                        }
                        amenities={amenities}
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

                    <div className="mt-8 rounded-3xl border border-border bg-card p-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="font-serif text-xl font-bold text-foreground">
                                {t('hotelDetail.livePriceTitle')}
                            </h2>
                            {liveHotel && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                                    {t('hotelDetail.livePrices')}
                                </span>
                            )}
                        </div>
                        <p className="mb-4 text-sm text-muted-foreground">
                            {t('hotelDetail.livePriceHint')}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                className="flex-1"
                                fromDate={firstAvailableDate}
                            />
                            <OccupancyPicker
                                value={occupancy}
                                onChange={setOccupancy}
                                compact
                            />
                        </div>
                        {firstAvailableDate && (
                            <p className="mt-3 text-xs text-muted-foreground">
                                {t('hotelDetail.availableFrom')}{' '}
                                <span className="font-semibold text-foreground">
                                    {formatDate(firstAvailableDate, lang)}
                                </span>
                                {detail.min_nights && detail.min_nights > 1
                                    ? ` · ${t('hotelDetail.minimumNights')} ${detail.min_nights} ${detail.min_nights > 1 ? t('hotelDetail.nightsLabel') : t('hotelDetail.night')}`
                                    : ''}
                            </p>
                        )}
                    </div>

                    {searchedUnavailable && (
                        <div className="mt-6 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-800">
                            {t('hotelDetail.unavailableNotice') ||
                                'This hotel has no availability for the selected dates. Try other dates.'}
                        </div>
                    )}

                    {displayRooms.length > 0 && (
                        <motion.div
                            id="rooms-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                        >
                            <RoomsList
                                rooms={displayRooms}
                                onBookRoom={handleBookRoom}
                                bookDisabled={searchedUnavailable}
                            />
                        </motion.div>
                    )}
                </div>

                <aside className="sticky top-24 hidden self-start lg:block">
                    <StickyBookingCard
                        minPrice={minPrice}
                        currency="TND"
                        priceLabel={
                            livePriceLabel ??
                            (t('hotelDetail.startingFrom') || 'From')
                        }
                        priceSuffix={priceSuffix}
                        title={title}
                        location={location}
                        entityType="hotel"
                        itemId={detail.id}
                        rating={detail.stars}
                        reviews={detail.reviews}
                        primaryButtonLabel={
                            t('hotelDetail.reserveNow') || 'Book now'
                        }
                        onBook={handleReserve}
                        onWhatsApp={handleWhatsAppInquiry}
                    />
                </aside>
            </motion.div>

            {selectedRoom && (
                <BookingDialog
                    open={!!selectedRoom}
                    onOpenChange={(open) => !open && setSelectedRoom(null)}
                    type="hotel"
                    itemId={detail.id}
                    itemName={`${title} - ${selectedRoom.name}`}
                    amount={
                        selectedRoom.priceTotal ?? selectedRoom.pricePerNight
                    }
                    minDate={firstAvailableDate}
                    provider={
                        liveHotel
                            ? {
                                  token: liveHotel.rooms[0]?.token,
                                  source: liveHotel.rooms[0]?.source,
                                  rooms: [
                                      {
                                          id: selectedRoom.providerRoomId
                                              ? String(selectedRoom.providerRoomId)
                                              : undefined,
                                          boardingId:
                                              selectedRoom.boardingId,
                                          viewIds: selectedRoom.viewIds,
                                          supplements:
                                              selectedRoom.supplements,
                                      },
                                  ],
                                  adults: occupancy.adults,
                                  children: occupancy.childAges.length,
                                  childrenAges: occupancy.childAges,
                                  checkIn:
                                      dateRange?.from?.toISOString().slice(0, 10) ??
                                      undefined,
                                  checkOut:
                                      dateRange?.to?.toISOString().slice(0, 10) ??
                                      undefined,
                              }
                            : undefined
                    }
                />
            )}
        </PageShell>
    );
}
