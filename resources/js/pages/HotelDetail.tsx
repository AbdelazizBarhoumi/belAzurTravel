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
    name: string;
    description: string;
    pricePerNight: number;
    capacity: number;
    size: number;
    features: string[];
    images: string[];
};

type Amenity = {
    id: string;
    name: string;
    icon: typeof Wifi;
};

type HotelDetailData = {
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

const HOTEL_DATABASE: HotelDetailData[] = [
    {
        id: 'sunset-paradise',
        name: { fr: 'Sunset Paradise Resort', ar: 'منتجع صن ست بارادايس', en: 'Sunset Paradise Resort' },
        city: { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
        country: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
        location: { fr: 'Santorin, Grèce', ar: 'سانتوريني، اليونان', en: 'Santorini, Greece' },
        address: '123 Caldera View Street',
        stars: 5,
        rating: 4.9,
        reviews: 234,
        phone: '+1234567890',
        whatsapp: '1234567890',
        description: { fr: 'Un resort de luxe surplombant la caldeira, avec des couchers de soleil spectaculaires. L\'établissement offre une expérience inoubliable dans l\'une des destinations les plus belles du monde.', ar: 'منتجع فاخر يطل على الكالديرا، مع غروب شمس رائع. يوفر المنتجع تجربة لا تُنسى في إحدى أجمل الوجهات السياحية في العالم.', en: 'A luxury resort overlooking the caldera, with spectacular sunsets. The property offers an unforgettable experience in one of the world\'s most beautiful destinations.' },
        images: [
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1551632786-de41eccbe38b?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1512207736139-6ea3b122658f?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1537359387622-ef9e36b62a61?w=800&h=600&fit=crop',
        ],
        amenities: [
            { id: '1', name: 'WiFi', icon: Wifi },
            { id: '2', name: 'Parking', icon: Car },
            { id: '3', name: 'Breakfast', icon: Coffee },
            { id: '4', name: 'Gym', icon: Dumbbell },
            { id: '5', name: 'Restaurant', icon: Utensils },
            { id: '6', name: 'Pool', icon: Droplet },
        ],
        rooms: [
            {
                id: 'deluxe-1',
                name: 'Deluxe Ocean View',
                description: 'Spacious room with private balcony overlooking the Aegean Sea',
                pricePerNight: 320,
                capacity: 2,
                size: 45,
                features: ['wifi', 'ac', 'bathroom', 'tv'],
                images: ['https://images.unsplash.com/photo-1631049307038-da0ec36d9c46?w=600&h=400&fit=crop'],
            },
            {
                id: 'suite-1',
                name: 'Sunset Suite',
                description: 'Luxury suite with direct caldera views and Jacuzzi bath',
                pricePerNight: 520,
                capacity: 2,
                size: 65,
                features: ['wifi', 'ac', 'bathroom', 'tv'],
                images: ['https://images.unsplash.com/photo-1618588507045-cf1ee4dba957?w=600&h=400&fit=crop'],
            },
            {
                id: 'family-1',
                name: 'Family Bungalow',
                description: 'Two-bedroom bungalow perfect for families with private garden',
                pricePerNight: 420,
                capacity: 4,
                size: 85,
                features: ['wifi', 'ac', 'bathroom', 'tv'],
                images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop'],
            },
        ],
    },
    {
        id: 'ubud-jungle',
        name: { fr: 'Ubud Jungle Retreat', ar: 'منتجع أوبود للغابات', en: 'Ubud Jungle Retreat' },
        city: { fr: 'Bali', ar: 'بالي', en: 'Bali' },
        country: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
        location: { fr: 'Bali, Indonésie', ar: 'بالي، إندونيسيا', en: 'Bali, Indonesia' },
        address: '456 Rice Terrace Lane',
        stars: 4,
        rating: 4.8,
        reviews: 189,
        phone: '+1234567891',
        whatsapp: '1234567891',
        description: { fr: 'Un sanctuaire de nature niché au cœur des forêts de Bali. Ce retreat offre une connexion authentique avec la nature balinaise.', ar: 'معاذ طبيعي مخفي في قلب غابات بالي. يوفر هذا المنتجع اتصالاً حقيقياً مع الطبيعة البالية.', en: 'A nature sanctuary nestled in the heart of Bali\'s forests. This retreat offers authentic connection with Balinese nature.' },
        images: [
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1514585534-4ee97f0e5ee8?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1552733407-5d5c46b3da98?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
        ],
        amenities: [
            { id: '1', name: 'WiFi', icon: Wifi },
            { id: '3', name: 'Breakfast', icon: Coffee },
            { id: '4', name: 'Yoga Classes', icon: Dumbbell },
            { id: '5', name: 'Restaurant', icon: Utensils },
        ],
        rooms: [
            {
                id: 'garden-1',
                name: 'Garden Bungalow',
                description: 'Cozy bungalow with garden access and traditional design',
                pricePerNight: 180,
                capacity: 2,
                size: 35,
                features: ['wifi', 'ac', 'bathroom', 'tv'],
                images: ['https://images.unsplash.com/photo-1631049307038-da0ec36d9c46?w=600&h=400&fit=crop'],
            },
            {
                id: 'villa-1',
                name: 'Jungle Villa',
                description: 'Private villa with open-air shower and rice field views',
                pricePerNight: 350,
                capacity: 2,
                size: 50,
                features: ['wifi', 'ac', 'bathroom', 'tv'],
                images: ['https://images.unsplash.com/photo-1618588507045-cf1ee4dba957?w=600&h=400&fit=crop'],
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

    const handleReserve = () => {
        const roomsElement = document.getElementById('rooms-list');
        roomsElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(
            `Hello, I want to reserve:\nHotel: ${localize(hotel.name, lang)}\nLocation: ${localize(hotel.location, lang)}\nPlease share available rooms and dates.`
        );
        window.open(`https://wa.me/${hotel.whatsapp}?text=${message}`, '_blank');
    };

    const handleBookRoom = (roomId: string) => {
        const message = encodeURIComponent(
            `Hello, I want to reserve:\nHotel: ${localize(hotel.name, lang)}\nRoom: ${roomId}\nPlease confirm availability.`
        );
        window.open(`https://wa.me/${hotel.whatsapp}?text=${message}`, '_blank');
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
                                { label: localize(hotel.name, lang), active: true },
                            ]}
                        />
                    </motion.div>

                    {/* Hotel Summary — full width above the columns */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        
                    </motion.div>

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
<HotelSummary
                            name={localize(hotel.name, lang)}
                            stars={hotel.stars}
                            rating={hotel.rating}
                            reviews={hotel.reviews}
                            location={hotel.address}
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
                                    description={localize(hotel.description, lang)}
                                    amenities={hotel.amenities}
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
                                    rooms={hotel.rooms}
                                    onBookRoom={handleBookRoom}
                                />
                            </motion.div>
                        </div>

                        {/* RIGHT col — Sticky booking card */}
                        <div className="lg:col-span-1 self-start sticky top-20">
                            <StickyBookingCard
                                minPrice={minPrice}
                                rating={hotel.rating}
                                reviews={hotel.reviews}
                                phoneNumber={hotel.phone}
                                onBook={handleReserve}
                                onWhatsApp={handleWhatsApp}
                            />
                        </div>
                    </div>

                </div>
            </div>

            <Footer />
        </div>
    );
}