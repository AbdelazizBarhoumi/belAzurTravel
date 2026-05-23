import { motion } from 'framer-motion';
import { Car, Coffee, Droplet, Dumbbell, Utensils, Wifi } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { notifyInteraction } from '@/api/interactions.api';
import { HotelInfo } from '@/components/cards/HotelInfo';
import { StickyBookingCard } from '@/components/cards/StickyBookingCard';
import { BookingDialog } from '@/components/forms/BookingDialog';
import { PageShell } from '@/components/layout/PageShell';
import { RoomsList } from '@/components/lists/RoomsList';
import { Gallery } from '@/components/media/Gallery';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import {
    useHotelById,
    type HotelDetailLookupData,
} from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

type AmenityIcon = typeof Wifi;

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

    if (amenity.icon) {
        icon = (AMENITY_ICONS[String(amenity.icon)] ?? icon) as AmenityIcon;
    }

    return {
        id: `amenity-${index + 1}`,
        name,
        icon,
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
    const minPrice = rooms.length
        ? Math.min(...rooms.map((room) => room.pricePerNight))
        : (detail.price ?? 0);
    const title = localizeText(detail.name, lang);
    const location = localizeText(detail.location, lang);
    const description = localizeText(detail.description ?? detail.about, lang);
    const _city = detail.city ? localizeText(detail.city, lang) : '';
    const _country = detail.country
        ? localizeText(detail.country, lang)
        : location;
    const whatsapp = detail.whatsapp ?? '';

    const handleReserve = () => {
        const roomsElement = document.getElementById('rooms-list');
        roomsElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleBookRoom = (roomId: string) => {
        const room = rooms.find((r) => r.id === roomId);
        if (room) {
            setSelectedRoom(room);
        }
    };

    const handleWhatsAppInquiry = () => {
        notifyInteraction('whatsapp');
        const message = encodeURIComponent(
            `Hello, I want to reserve:\nHotel: ${title}\nPlease confirm availability.`,
        );

        if (whatsapp) {
            window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
            return;
        }

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
                            currency="DT"
                            priceLabel={t('hotelDetail.startingFrom') || 'From'}
                            priceSuffix={t('hotelDetail.pernight')}
                            title={title}
                            location={location}
                            entityType="hotel"
                            itemId={detail.id}
                            rating={detail.rating}
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
                        address={detail.address}
                        phone={detail.phone}
                    />

                    {rooms.length > 0 && (
                        <motion.div
                            id="rooms-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                        >
                            <RoomsList rooms={rooms} onBookRoom={handleBookRoom} />
                        </motion.div>
                    )}
                </div>

                <aside className="sticky top-24 hidden self-start lg:block">
                    <StickyBookingCard
                        minPrice={minPrice}
                        currency="DT"
                        priceLabel={t('hotelDetail.startingFrom') || 'From'}
                        priceSuffix={t('hotelDetail.pernight')}
                        title={title}
                        location={location}
                        entityType="hotel"
                        itemId={detail.id}
                        rating={detail.rating}
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
