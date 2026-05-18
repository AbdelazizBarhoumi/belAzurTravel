import { motion } from 'framer-motion';
import { Globe, MapPin, Star } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { StickyBookingCard } from '@/components/cards/StickyBookingCard';
import { PageShell } from '@/components/layout/PageShell';
import { Gallery } from '@/components/media/Gallery';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useHotelById } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

type HotelAmenity = string | LocalizedText;

type HotelRoom = {
    id: string;
    name: LocalizedText;
    description: LocalizedText;
    pricePerNight: number;
    capacity: number;
    size: number;
    features: Array<LocalizedText | string>;
    images?: string[];
};

type HotelDetailRecord = {
    id: string;
    name: LocalizedText;
    location: LocalizedText;
    price: number;
    rating: number;
    stars: number;
    reviews: number;
    image?: string;
    images?: string[];
    gallery?: string[];
    description?: LocalizedText;
    about?: LocalizedText;
    amenities?: HotelAmenity[];
    rooms?: HotelRoom[];
    city?: LocalizedText;
    country?: LocalizedText;
    whatsapp?: string;
};

function text(value: LocalizedText | undefined, lang: Lang): string {
    return value ? localizeText(value, lang) : '';
}

function amenityText(amenity: HotelAmenity, lang: Lang): string {
    return typeof amenity === 'string' ? amenity : localizeText(amenity, lang);
}

export default function HotelDetail() {
    const { id } = useParams<{ id: string }>();
    const { t, lang } = useLanguage();
    const { data: hotelData, isLoading } = useHotelById(id);

    const hotel = hotelData as HotelDetailRecord | null;

    if (isLoading) return null;

    if (!hotel) {
        return <Navigate to="/hotels" replace />;
    }

    const hotelName = localizeText(hotel.name, lang);
    const hotelLocation = localizeText(hotel.location, lang);
    const hotelCity = hotel.city ? localizeText(hotel.city, lang) : '';
    const hotelCountry = hotel.country ? localizeText(hotel.country, lang) : '';
    const aboutDescription = text(hotel.description ?? hotel.about, lang);
    const galleryImages = hotel.gallery ?? hotel.images;
    const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];
    const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];

    const handleReserve = () => {
        const roomsElement = document.getElementById('rooms-list');
        roomsElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleBookRoom = (roomId: string) => {
        if (hotel.whatsapp) {
            const message = encodeURIComponent(
                `Hello, I want to reserve:\nHotel: ${hotelName}\nRoom: ${roomId}\nPlease confirm availability.`,
            );
            window.open(
                `https://wa.me/${hotel.whatsapp}?text=${message}`,
                '_blank',
            );
            return;
        }

        window.open('/contact', '_self');
    };

    return (
        <PageShell
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.hotels'), href: '/hotels' },
                { label: hotelName, active: true },
            ]}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-10 lg:grid-cols-[2fr_1fr]"
            >
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {hotelName}
                        </h1>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1 font-semibold text-secondary">
                                <Star className="h-4 w-4 fill-current" />
                                {hotel.stars}
                            </span>
                            <span>
                                {hotel.rating} · {hotel.reviews}{' '}
                                {t('hotels.reviews')}
                            </span>
                        </div>

                        {hotelLocation && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                                <MapPin className="mt-1 h-4 w-4 shrink-0" />
                                <div>
                                    <div className="text-foreground">
                                        {hotelLocation}
                                    </div>
                                    {(hotelCity || hotelCountry) && (
                                        <div className="text-sm">
                                            {[hotelCity, hotelCountry]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {galleryImages && galleryImages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Gallery
                                images={galleryImages}
                                hotelName={hotelName}
                            />
                        </motion.div>
                    )}

                    {aboutDescription && (
                        <section className="max-w-3xl space-y-4">
                            <h2 className="font-serif text-2xl font-bold text-foreground">
                                {t('hotelDetail.aboutHotel')}
                            </h2>
                            <p className="leading-relaxed text-muted-foreground">
                                {aboutDescription}
                            </p>
                        </section>
                    )}

                    {amenities.length > 0 && (
                        <section className="max-w-4xl space-y-4">
                            <h2 className="font-serif text-2xl font-bold text-foreground">
                                {t('hotelDetail.amenities')}
                            </h2>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {amenities.map((amenity, index) => (
                                    <div
                                        key={`${index}-${amenityText(amenity, lang)}`}
                                        className="rounded-lg border border-border p-4 text-sm font-medium text-foreground"
                                    >
                                        {amenityText(amenity, lang)}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {rooms.length > 0 && (
                        <section id="rooms-list" className="space-y-6">
                            <h2 className="font-serif text-3xl font-bold text-foreground">
                                {t('hotelDetail.availableRooms')}
                            </h2>
                            <div className="space-y-6">
                                {rooms.map((room) => {
                                    const roomName = localizeText(
                                        room.name,
                                        lang,
                                    );
                                    const roomDescription = localizeText(
                                        room.description,
                                        lang,
                                    );
                                    const roomFeatures = (
                                        room.features ?? []
                                    ).map((feature) =>
                                        typeof feature === 'string'
                                            ? feature
                                            : localizeText(feature, lang),
                                    );

                                    return (
                                        <motion.article
                                            key={room.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="overflow-hidden rounded-2xl border border-border bg-card p-6"
                                        >
                                            <div className="grid gap-6 lg:grid-cols-4">
                                                <div className="lg:col-span-1">
                                                    {room.images?.[0] && (
                                                        <img
                                                            src={room.images[0]}
                                                            alt={roomName}
                                                            className="h-40 w-full rounded-lg object-cover"
                                                            loading="lazy"
                                                        />
                                                    )}
                                                </div>

                                                <div className="lg:col-span-2">
                                                    <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                                        {roomName}
                                                    </h3>
                                                    <p className="mb-4 text-sm text-muted-foreground">
                                                        {roomDescription}
                                                    </p>
                                                    <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Globe className="h-4 w-4" />
                                                            {room.capacity}{' '}
                                                            {t(
                                                                'hotelDetail.guests',
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            •
                                                        </div>
                                                        <div>
                                                            {room.size} m²
                                                        </div>
                                                    </div>
                                                    {roomFeatures.length >
                                                        0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {roomFeatures.map(
                                                                (feature) => (
                                                                    <span
                                                                        key={
                                                                            feature
                                                                        }
                                                                        className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground"
                                                                    >
                                                                        {
                                                                            feature
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col items-end justify-between lg:col-span-1">
                                                    <div className="text-right">
                                                        <div className="text-sm text-muted-foreground">
                                                            {t(
                                                                'hotelDetail.pricePerNight',
                                                            )}
                                                        </div>
                                                        <div className="mb-4 font-serif text-3xl font-bold text-secondary">
                                                            $
                                                            {room.pricePerNight}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        onClick={() =>
                                                            handleBookRoom(
                                                                room.id,
                                                            )
                                                        }
                                                        className="w-full"
                                                    >
                                                        {t(
                                                            'hotelDetail.selectRoom',
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.article>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>

                <aside className="sticky top-20 hidden self-start lg:block">
                    <StickyBookingCard
                        minPrice={hotel.price}
                        currency="$"
                        priceLabel={t('common.from')}
                        priceSuffix="/night"
                        title={hotelName}
                        location={hotelLocation}
                        description={aboutDescription || undefined}
                        rating={hotel.rating}
                        reviews={hotel.reviews}
                        favoriteItem={{
                            id: `hotel-${hotel.id}`,
                            type: 'hotel',
                            name: hotelName,
                            image: galleryImages?.[0] ?? hotel.image ?? '',
                            price: hotel.price,
                            location: hotelLocation,
                        }}
                        primaryButtonLabel={t('hotelDetail.reserveNow')}
                        onBook={handleReserve}
                    />
                </aside>
            </motion.div>
        </PageShell>
    );
}
