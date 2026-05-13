import { motion } from 'framer-motion';
import { Wifi, Car, Coffee, Dumbbell, Utensils, Droplet } from 'lucide-react';
import { useParams, Navigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Gallery } from '@/components/Gallery';
import { HotelInfo } from '@/components/HotelInfo';
import { HotelSummary } from '@/components/HotelSummary';
import { Navbar } from '@/components/Navbar';
import { RoomsList } from '@/components/RoomsList';
import { StickyBookingCard } from '@/components/StickyBookingCard';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

type Room = {
    id: string;
    name: LocalizedText;
    description: LocalizedText;
    pricePerNight: number;
    capacity: number;
    size: number;
    features: LocalizedText[];
    images: string[];
};

type Amenity = {
    id: string;
    name: LocalizedText;
    icon: typeof Wifi;
};

export type HotelDetailData = {
    id: string;
    name: LocalizedText;
    city: LocalizedText;
    country: LocalizedText;
    location: LocalizedText;
    address: string;
    stars: number;
    rating: number;
    reviews: number;
    phone: string;
    whatsapp: string;
    description: LocalizedText;
    images: string[];
    amenities: Amenity[];
    rooms: Room[];
};

export const HOTEL_DATABASE: HotelDetailData[] = [
    {
        id: 'sunset-paradise',
        name: {
            fr: 'Sunset Paradise Resort',
            ar: 'منتجع صن ست بارادايس',
            en: 'Sunset Paradise Resort',
        },
        city: { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
        country: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
        location: {
            fr: 'Santorin, Grèce',
            ar: 'سانتوريني، اليونان',
            en: 'Santorini, Greece',
        },
        address: '123 Caldera View Street',
        stars: 5,
        rating: 4.9,
        reviews: 234,
        phone: '+1234567890',
        whatsapp: '1234567890',
        description: {
            fr: "Un resort de luxe surplombant la caldeira, avec des couchers de soleil spectaculaires. L'établissement offre une expérience inoubliable dans l'une des destinations les plus belles du monde.",
            ar: 'منتجع فاخر يطل على الكالديرا، مع غروب شمس رائع. يوفر المنتجع تجربة لا تُنسى في إحدى أجمل الوجهات السياحية في العالم.',
            en: "A luxury resort overlooking the caldera, with spectacular sunsets. The property offers an unforgettable experience in one of the world's most beautiful destinations.",
        },
        images: [
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1551632786-de41eccbe38b?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1512207736139-6ea3b122658f?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1537359387622-ef9e36b62a61?w=800&h=600&fit=crop',
        ],
        amenities: [
            {
                id: '1',
                name: { fr: 'Wi‑Fi', ar: 'واي فاي', en: 'WiFi' },
                icon: Wifi,
            },
            {
                id: '2',
                name: { fr: 'Parking', ar: 'موقف سيارات', en: 'Parking' },
                icon: Car,
            },
            {
                id: '3',
                name: { fr: 'Petit-déjeuner', ar: 'إفطار', en: 'Breakfast' },
                icon: Coffee,
            },
            {
                id: '4',
                name: { fr: 'Salle de sport', ar: 'نادي رياضي', en: 'Gym' },
                icon: Dumbbell,
            },
            {
                id: '5',
                name: { fr: 'Restaurant', ar: 'مطعم', en: 'Restaurant' },
                icon: Utensils,
            },
            {
                id: '6',
                name: { fr: 'Piscine', ar: 'مسبح', en: 'Pool' },
                icon: Droplet,
            },
        ],
        rooms: [
            {
                id: 'deluxe-1',
                name: {
                    fr: 'Deluxe Vue Mer',
                    ar: 'ديلوكس بإطلالة على البحر',
                    en: 'Deluxe Ocean View',
                },
                description: {
                    fr: 'Chambre spacieuse avec balcon privé donnant sur la mer Égée',
                    ar: 'غرفة واسعة مع شرفة خاصة تطل على بحر إيجه',
                    en: 'Spacious room with private balcony overlooking the Aegean Sea',
                },
                pricePerNight: 320,
                capacity: 2,
                size: 45,
                features: [
                    { fr: 'Wi‑Fi', ar: 'واي فاي', en: 'wifi' },
                    { fr: 'Climatisation', ar: 'تكييف', en: 'ac' },
                    {
                        fr: 'Salle de bains privée',
                        ar: 'حمام خاص',
                        en: 'bathroom',
                    },
                    { fr: 'Télévision', ar: 'تلفاز', en: 'tv' },
                ],
                images: [
                    'https://images.unsplash.com/photo-1631049307038-da0ec36d9c46?w=600&h=400&fit=crop',
                ],
            },
            {
                id: 'suite-1',
                name: {
                    fr: 'Suite Sunset',
                    ar: 'جناح الغروب',
                    en: 'Sunset Suite',
                },
                description: {
                    fr: 'Suite de luxe avec vue directe sur la caldeira et baignoire jacuzzi',
                    ar: 'جناح فاخر مع إطلالة مباشرة على الكالديرا وحوض جاكوزي',
                    en: 'Luxury suite with direct caldera views and Jacuzzi bath',
                },
                pricePerNight: 520,
                capacity: 2,
                size: 65,
                features: [
                    { fr: 'Wi‑Fi', ar: 'واي فاي', en: 'wifi' },
                    { fr: 'Climatisation', ar: 'تكييف', en: 'ac' },
                    {
                        fr: 'Salle de bains privée',
                        ar: 'حمام خاص',
                        en: 'bathroom',
                    },
                    { fr: 'Télévision', ar: 'تلفاز', en: 'tv' },
                ],
                images: [
                    'https://images.unsplash.com/photo-1618588507045-cf1ee4dba957?w=600&h=400&fit=crop',
                ],
            },
            {
                id: 'family-1',
                name: {
                    fr: 'Bungalow Familial',
                    ar: 'بنغل عائلي',
                    en: 'Family Bungalow',
                },
                description: {
                    fr: 'Bungalow à deux chambres parfait pour les familles avec jardin privé',
                    ar: 'بنغل بغرفتي نوم مثالي للعائلات مع حديقة خاصة',
                    en: 'Two-bedroom bungalow perfect for families with private garden',
                },
                pricePerNight: 420,
                capacity: 4,
                size: 85,
                features: [
                    { fr: 'Wi‑Fi', ar: 'واي فاي', en: 'wifi' },
                    { fr: 'Climatisation', ar: 'تكييف', en: 'ac' },
                    {
                        fr: 'Salle de bains privée',
                        ar: 'حمام خاص',
                        en: 'bathroom',
                    },
                    { fr: 'Télévision', ar: 'تلفاز', en: 'tv' },
                ],
                images: [
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
                ],
            },
        ],
    },
    {
        id: 'ubud-jungle',
        name: {
            fr: 'Ubud Jungle Retreat',
            ar: 'منتجع أوبود للغابات',
            en: 'Ubud Jungle Retreat',
        },
        city: { fr: 'Bali', ar: 'بالي', en: 'Bali' },
        country: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
        location: {
            fr: 'Bali, Indonésie',
            ar: 'بالي، إندونيسيا',
            en: 'Bali, Indonesia',
        },
        address: '456 Rice Terrace Lane',
        stars: 4,
        rating: 4.8,
        reviews: 189,
        phone: '+1234567891',
        whatsapp: '1234567891',
        description: {
            fr: 'Un sanctuaire de nature niché au cœur des forêts de Bali. Ce retreat offre une connexion authentique avec la nature balinaise.',
            ar: 'معاذ طبيعي مخفي في قلب غابات بالي. يوفر هذا المنتجع اتصالاً حقيقياً مع الطبيعة البالية.',
            en: "A nature sanctuary nestled in the heart of Bali's forests. This retreat offers authentic connection with Balinese nature.",
        },
        images: [
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1514585534-4ee97f0e5ee8?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1552733407-5d5c46b3da98?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
        ],
        amenities: [
            {
                id: '1',
                name: { fr: 'Wi‑Fi', ar: 'واي فاي', en: 'WiFi' },
                icon: Wifi,
            },
            {
                id: '3',
                name: { fr: 'Petit-déjeuner', ar: 'إفطار', en: 'Breakfast' },
                icon: Coffee,
            },
            {
                id: '4',
                name: {
                    fr: 'Cours de yoga',
                    ar: 'حصص يوغا',
                    en: 'Yoga Classes',
                },
                icon: Dumbbell,
            },
            {
                id: '5',
                name: { fr: 'Restaurant', ar: 'مطعم', en: 'Restaurant' },
                icon: Utensils,
            },
        ],
        rooms: [
            {
                id: 'garden-1',
                name: {
                    fr: 'Bungalow Jardin',
                    ar: 'بنغل الحديقة',
                    en: 'Garden Bungalow',
                },
                description: {
                    fr: 'Bungalow confortable avec accès au jardin et design traditionnel',
                    ar: 'بنغل مريح مع وصول إلى الحديقة وتصميم تقليدي',
                    en: 'Cozy bungalow with garden access and traditional design',
                },
                pricePerNight: 180,
                capacity: 2,
                size: 35,
                features: [
                    { fr: 'Wi‑Fi', ar: 'واي فاي', en: 'wifi' },
                    { fr: 'Climatisation', ar: 'تكييف', en: 'ac' },
                    {
                        fr: 'Salle de bains privée',
                        ar: 'حمام خاص',
                        en: 'bathroom',
                    },
                    { fr: 'Télévision', ar: 'تلفاز', en: 'tv' },
                ],
                images: [
                    'https://images.unsplash.com/photo-1631049307038-da0ec36d9c46?w=600&h=400&fit=crop',
                ],
            },
            {
                id: 'villa-1',
                name: {
                    fr: 'Villa Jungle',
                    ar: 'فيلا الغابة',
                    en: 'Jungle Villa',
                },
                description: {
                    fr: 'Villa privée avec douche à ciel ouvert et vue sur les rizières',
                    ar: 'فيلا خاصة مع دش مفتوح وإطلالات على حقول الأرز',
                    en: 'Private villa with open-air shower and rice field views',
                },
                pricePerNight: 350,
                capacity: 2,
                size: 50,
                features: [
                    { fr: 'Wi‑Fi', ar: 'واي فاي', en: 'wifi' },
                    { fr: 'Climatisation', ar: 'تكييف', en: 'ac' },
                    {
                        fr: 'Salle de bains privée',
                        ar: 'حمام خاص',
                        en: 'bathroom',
                    },
                    { fr: 'Télévision', ar: 'تلفاز', en: 'tv' },
                ],
                images: [
                    'https://images.unsplash.com/photo-1618588507045-cf1ee4dba957?w=600&h=400&fit=crop',
                ],
            },
        ],
    },
];

export default function HotelDetail() {
    const { id } = useParams<{ id: string }>();
    const { t, lang } = useLanguage();

    const hotel = HOTEL_DATABASE.find((h) => h.id === id);

    if (!hotel) {
        return <Navigate to="/hotels" replace />;
    }

    const minPrice = Math.min(...hotel.rooms.map((r) => r.pricePerNight));
    const rooms = hotel.rooms.map((room) => ({
        ...room,
        name: localize(room.name, lang),
        description: localize(room.description, lang),
        features: room.features.map((feature) => localize(feature, lang)),
    }));
    const amenities = hotel.amenities.map((amenity) => ({
        ...amenity,
        name: localize(amenity.name, lang),
    }));

    const handleReserve = () => {
        const roomsElement = document.getElementById('rooms-list');
        roomsElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleBookRoom = (roomId: string) => {
        const message = encodeURIComponent(
            `Hello, I want to reserve:\nHotel: ${localize(hotel.name, lang)}\nRoom: ${roomId}\nPlease confirm availability.`,
        );
        window.open(
            `https://wa.me/${hotel.whatsapp}?text=${message}`,
            '_blank',
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.hotels'), href: '/hotels' },
                                {
                                    label: localize(hotel.name, lang),
                                    active: true,
                                },
                            ]}
                        />
                    </motion.div>

                    {/* Hotel Summary — full width above the columns */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    ></motion.div>

                    {/* 2-Column layout: Gallery + Info LEFT | Booking card RIGHT */}
                    <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
                        {/* LEFT col — Gallery, then description, then rooms */}
                        <div className="flex flex-col gap-8 lg:col-span-2">
                            {/* Gallery */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Gallery
                                    images={hotel.images}
                                    hotelName={localize(hotel.name, lang)}
                                />
                            </motion.div>

                            <div className="lg:hidden">
                                <StickyBookingCard
                                    minPrice={minPrice}
                                    currency="$"
                                    priceLabel="From"
                                    priceSuffix="/night"
                                    title={localize(hotel.name, lang)}
                                    location={localize(hotel.location, lang)}
                                    description={localize(
                                        hotel.description,
                                        lang,
                                    )}
                                    rating={hotel.rating}
                                    reviews={hotel.reviews}
                                    favoriteItem={{
                                        id: `hotel-${hotel.id}`,
                                        type: 'hotel',
                                        name: localize(hotel.name, lang),
                                        image: hotel.images[0] ?? '',
                                        price: minPrice,
                                        location: localize(
                                            hotel.location,
                                            lang,
                                        ),
                                    }}
                                    primaryButtonLabel="Book now"
                                    onBook={handleReserve}
                                />
                            </div>
                            <HotelSummary
                                name={localize(hotel.name, lang)}
                                stars={hotel.stars}
                                rating={hotel.rating}
                                reviews={hotel.reviews}
                                location={localize(hotel.location, lang)}
                                city={localize(hotel.city, lang)}
                                country={localize(hotel.country, lang)}
                            />
                            {/* Hotel Info */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <HotelInfo
                                    description={localize(
                                        hotel.description,
                                        lang,
                                    )}
                                    amenities={amenities}
                                />
                            </motion.div>

                            {/* Rooms List */}
                            <motion.div
                                id="rooms-list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <RoomsList
                                    rooms={rooms}
                                    onBookRoom={handleBookRoom}
                                />
                            </motion.div>
                        </div>

                        {/* RIGHT col — Sticky booking card */}
                        <div className="sticky top-20 hidden self-start lg:col-span-1 lg:block">
                            <StickyBookingCard
                                minPrice={minPrice}
                                currency="$"
                                priceLabel="From"
                                priceSuffix="/night"
                                title={localize(hotel.name, lang)}
                                location={localize(hotel.location, lang)}
                                description={localize(hotel.description, lang)}
                                rating={hotel.rating}
                                reviews={hotel.reviews}
                                favoriteItem={{
                                    id: `hotel-${hotel.id}`,
                                    type: 'hotel',
                                    name: localize(hotel.name, lang),
                                    image: hotel.images[0] ?? '',
                                    price: minPrice,
                                    location: localize(hotel.location, lang),
                                }}
                                primaryButtonLabel="Book now"
                                onBook={handleReserve}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
