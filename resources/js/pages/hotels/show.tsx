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
    capacity: number;
    size: number;
    features: string[];
    images: string[];
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
    const [guests, setGuests] = useState(2);

    const liveQuery = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to || !id) {
            return undefined;
        }

        return {
            check_in: dateRange.from.toISOString().slice(0, 10),
            check_out: dateRange.to.toISOString().slice(0, 10),
            hotel_slugs: [id],
            rooms: [{ adults: guests }],
            only_available: true,
        };
    }, [dateRange, guests, id]);

    const { data: liveResults = [] } = useHotelSearch(liveQuery);
    const liveHotel = liveResults[0] ?? undefined;

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
                pricePerNight: room.price,
                capacity: staticRoom?.capacity ?? 2,
                size: staticRoom?.size ?? 0,
                features:
                    staticRoom?.features ??
                    (room.view ? [room.view] : []),
                images: staticRoom?.images ?? [],
            };
        });
    const liveRoomIds = new Set(liveRooms.map((room) => room.id));
    const displayRooms =
        liveRooms.length > 0
            ? [...liveRooms, ...rooms.filter((room) => !liveRoomIds.has(room.id))]
            : rooms;
    const displayMinPrice = displayRooms.length
        ? Math.min(...displayRooms.map((room) => room.pricePerNight))
        : (detail.price ?? 0);
    const minPrice = liveHotel?.price ?? displayMinPrice;
    const livePriceLabel = liveHotel
        ? `${t('hotelDetail.livePrices')} - ${liveHotel.price} TND`
        : undefined;
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
                            priceSuffix={t('hotelDetail.pernight')}
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
                            />
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={guests}
                                onChange={(event) =>
                                    setGuests(
                                        Math.max(
                                            1,
                                            Math.min(
                                                10,
                                                Number(event.target.value) || 1,
                                            ),
                                        ),
                                    )
                                }
                                className="h-10 w-20 rounded-xl border border-border/70 bg-background/80 px-3 text-sm text-foreground shadow-sm sm:h-12 sm:rounded-2xl"
                                aria-label={t('hotelDetail.guests')}
                            />
                            <span className="text-sm text-muted-foreground">
                                {t('hotelDetail.guests')}
                            </span>
                        </div>
                    </div>

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
                        priceSuffix={t('hotelDetail.pernight')}
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
                    amount={selectedRoom.pricePerNight}
                />
            )}
        </PageShell>
    );
}
