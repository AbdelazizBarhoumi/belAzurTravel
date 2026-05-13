import destBali from '@/assets/dest-bali.jpg';
import destDubai from '@/assets/dest-dubai.jpg';
import destParis from '@/assets/dest-paris.jpg';
import destSantorini from '@/assets/dest-santorini.jpg';
import { carsData, type CarItem } from '@/data/cars.data';
import { dealsData, type DealItem } from '@/data/deals.data';
import { eventsData, type EventItem } from '@/data/events.data';
import { flightsData, type FlightItem } from '@/data/flights.data';
import { promosData, type PromoItem } from '@/data/promos.data';
import type { Lang } from '@/i18n/translations';
export {
    blogPosts,
    contactMethods,
    dealsSectionData,
    designTripAccommodations,
    designTripBudgets,
    designTripDestinations,
    designTripInterests,
    designTripSteps,
    designTripTransports,
    footerQuickLinks,
    footerSupportLinks,
    galleryPhotos,
    hotelDetailDatabase,
    landingAssurances,
    landingTrustCards,
    legalSections,
    navbarDestinationLinks,
    navbarHotelLinks,
    navbarMoreLinks,
    navbarSimpleLinks,
    socialLinks,
    teamMembers,
    type BlogPost,
    type ContactMethod,
    type DealCard,
    type HotelAmenity,
    type HotelDetailData,
    type HotelRoom,
    type LegalSection,
    type NavDropdownItem,
    type OptionItem,
    type SearchWidgetConfig,
    type SimpleLinkItem,
    type SocialLink,
    type StepItem,
    type TeamMember,
} from '@/api/siteContent.api';

export type { CarItem } from '@/data/cars.data';
export type { DealItem } from '@/data/deals.data';
export type { EventItem } from '@/data/events.data';
export type { FlightItem } from '@/data/flights.data';
export type { PromoItem } from '@/data/promos.data';

export type LocalizedText = Record<Lang, string>;

export interface DestinationItem {
    slug: string;
    name: LocalizedText;
    country: LocalizedText;
    image: string;
    gallery: string[];
    rating: number;
    price: number;
    categoryKey: string;
    category: LocalizedText;
    description: LocalizedText;
    about: LocalizedText;
    highlights: LocalizedText[];
    bestTime: LocalizedText;
    language: LocalizedText;
    currency: LocalizedText;
    weather: LocalizedText;
}

export interface HotelItem {
    slug: string;
    id: string;
    name: LocalizedText;
    location: LocalizedText;
    destinationSlug: string;
    price: number;
    rating: number;
    stars: number;
    reviews: number;
    image: string;
    amenities: string[];
    tags: string[];
}

export interface TourItem {
    slug: string;
    name: LocalizedText;
    location: LocalizedText;
    duration: LocalizedText;
    maxGroup: number;
    price: number;
    rating: number;
    image: string;
    description: LocalizedText;
}

export interface TourDetailStep {
    day: number;
    title: LocalizedText;
    details: LocalizedText;
}

export interface TourDetailItem {
    slug: string;
    name: LocalizedText;
    type: LocalizedText;
    location: LocalizedText[];
    durationDays: number;
    durationNights: number;
    maxGroup: number;
    pricePerPerson: number;
    rating: number;
    images: string[];
    tags: string[];
    itinerary: TourDetailStep[];
    inclusions: LocalizedText[];
    excludes: LocalizedText[];
    description: LocalizedText;
}

const destinationsData: DestinationItem[] = [
    {
        slug: 'santorini',
        name: { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
        country: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
        image: destSantorini,
        gallery: [
            destSantorini,
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&h=900&fit=crop',
        ],
        rating: 4.9,
        price: 1299,
        categoryKey: 'beach',
        category: { fr: 'Plage', ar: 'شاطئ', en: 'Beach' },
        description: {
            fr: 'Bâtiments blanchis à la chaux emblématiques surplombant la mer Égée.',
            ar: 'مبانٍ بيضاء أيقونية تطل على بحر إيجه.',
            en: 'Iconic whitewashed buildings overlooking the Aegean Sea.',
        },
        about: {
            fr: 'Santorin offre des couchers de soleil de carte postale, des villages à flanc de falaise et une atmosphère romantique idéale pour une escapade inoubliable.',
            ar: 'تقدم سانتوريني غروب شمس خلاب وقرى على المنحدرات وأجواء رومانسية مثالية لرحلة لا تُنسى.',
            en: 'Santorini delivers postcard sunsets, cliffside villages, and a romantic atmosphere ideal for an unforgettable escape.',
        },
        highlights: [
            {
                fr: 'Vues sur la caldeira au coucher du soleil',
                ar: 'إطلالات الغروب على الكالديرا',
                en: 'Sunset caldera views',
            },
            {
                fr: 'Villages blanchis à la chaux sur la falaise',
                ar: 'قرى بيضاء على المنحدرات',
                en: 'Whitewashed cliff villages',
            },
            {
                fr: 'Dégustations de vin',
                ar: 'تجارب تذوق النبيذ',
                en: 'Wine tasting experiences',
            },
        ],
        bestTime: {
            fr: 'Printemps et début d’été',
            ar: 'الربيع وبداية الصيف',
            en: 'Spring and early summer',
        },
        language: { fr: 'Grec', ar: 'اليونانية', en: 'Greek' },
        currency: { fr: 'Euro', ar: 'اليورو', en: 'Euro' },
        weather: {
            fr: 'Climat doux et ensoleillé',
            ar: 'طقس معتدل ومشمس',
            en: 'Mild and sunny climate',
        },
    },
    {
        slug: 'bali',
        name: { fr: 'Bali', ar: 'بالي', en: 'Bali' },
        country: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
        image: destBali,
        gallery: [
            destBali,
            'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1600&h=900&fit=crop',
        ],
        rating: 4.8,
        price: 899,
        categoryKey: 'nature',
        category: { fr: 'Nature', ar: 'طبيعة', en: 'Nature' },
        description: {
            fr: 'Rizières luxuriantes, temples et paradis tropical.',
            ar: 'مدرجات أرز خضراء ومعابد وجنة استوائية.',
            en: 'Lush rice terraces, temples, and tropical paradise.',
        },
        about: {
            fr: 'Bali combine bien-être, aventure et culture dans un décor tropical chaleureux qui convient aussi bien aux couples qu’aux familles.',
            ar: 'تجمع بالي بين العافية والمغامرة والثقافة في أجواء استوائية دافئة تناسب الأزواج والعائلات.',
            en: 'Bali blends wellness, adventure, and culture in a warm tropical setting that suits couples and families alike.',
        },
        highlights: [
            {
                fr: 'Promenades dans les rizières',
                ar: 'نزهات مدرجات الأرز',
                en: 'Rice terrace walks',
            },
            {
                fr: 'Rituels des temples balinais',
                ar: 'طقوس معابد بالي',
                en: 'Balinese temple rituals',
            },
            {
                fr: 'Retraites spa et bien-être',
                ar: 'منتجعات سبا وعافية',
                en: 'Spa and wellness retreats',
            },
        ],
        bestTime: {
            fr: 'Mai à octobre',
            ar: 'من مايو إلى أكتوبر',
            en: 'May to October',
        },
        language: { fr: 'Indonésien', ar: 'الإندونيسية', en: 'Indonesian' },
        currency: {
            fr: 'Roupie indonésienne',
            ar: 'الروبية الإندونيسية',
            en: 'Indonesian rupiah',
        },
        weather: {
            fr: 'Chaud et tropical',
            ar: 'حار واستوائي',
            en: 'Warm and tropical',
        },
    },
    {
        slug: 'paris',
        name: { fr: 'Paris', ar: 'باريس', en: 'Paris' },
        country: { fr: 'France', ar: 'فرنسا', en: 'France' },
        image: destParis,
        gallery: [
            destParis,
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600&h=900&fit=crop',
        ],
        rating: 4.9,
        price: 1499,
        categoryKey: 'city',
        category: { fr: 'Ville', ar: 'مدينة', en: 'City' },
        description: {
            fr: 'La Ville Lumière avec de l’art, de la gastronomie et de la culture de classe mondiale.',
            ar: 'مدينة النور مع فن وطعام وثقافة عالمية المستوى.',
            en: 'The City of Light with world-class art, food, and culture.',
        },
        about: {
            fr: 'Paris séduit par ses musées, ses cafés, ses promenades le long de la Seine et son élégance intemporelle.',
            ar: 'تأسر باريس الزوار بمتاحفها ومقاهيها ونزهاتها على ضفاف السين وأناقتها الخالدة.',
            en: 'Paris charms with museums, cafés, Seine-side strolls, and timeless elegance.',
        },
        highlights: [
            {
                fr: 'Louvre et promenades sur la Seine',
                ar: 'اللوفر ونزهات على السين',
                en: 'Louvre and Seine walks',
            },
            {
                fr: 'Scène gastronomique raffinée',
                ar: 'مشهد طعام راقٍ',
                en: 'Gourmet dining scene',
            },
            {
                fr: 'Vues sur les monuments emblématiques',
                ar: 'إطلالات على المعالم الشهيرة',
                en: 'Iconic landmark views',
            },
        ],
        bestTime: {
            fr: 'Avril à juin',
            ar: 'من أبريل إلى يونيو',
            en: 'April to June',
        },
        language: { fr: 'Français', ar: 'الفرنسية', en: 'French' },
        currency: { fr: 'Euro', ar: 'اليورو', en: 'Euro' },
        weather: {
            fr: 'Doux au printemps',
            ar: 'معتدل في الربيع',
            en: 'Mild in spring',
        },
    },
    {
        slug: 'dubai',
        name: { fr: 'Dubaï', ar: 'دبي', en: 'Dubai' },
        country: {
            fr: 'Émirats Arabes Unis',
            ar: 'الإمارات العربية المتحدة',
            en: 'UAE',
        },
        image: destDubai,
        gallery: [
            destDubai,
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1600&h=900&fit=crop',
        ],
        rating: 4.7,
        price: 1199,
        categoryKey: 'luxury',
        category: { fr: 'Luxe', ar: 'فاخر', en: 'Luxury' },
        description: {
            fr: 'Une silhouette futuriste rencontre des aventures dans le désert.',
            ar: 'أفق مستقبلي يلتقي بمغامرات الصحراء.',
            en: 'Futuristic skyline meets desert adventures.',
        },
        about: {
            fr: 'Dubaï allie shopping, plages, vues vertigineuses et escapades désertiques dans une destination ultra-moderne.',
            ar: 'تجمع دبي بين التسوق والشواطئ والإطلالات المدهشة ورحلات الصحراء في وجهة حديثة للغاية.',
            en: 'Dubai combines shopping, beaches, skyline views, and desert escapes in a highly modern destination.',
        },
        highlights: [
            {
                fr: 'Safaris dans le désert',
                ar: 'رحلات سفاري في الصحراء',
                en: 'Desert safaris',
            },
            {
                fr: 'Terrasses panoramiques sur l’horizon',
                ar: 'منصات مشاهدة الأفق',
                en: 'Skyline viewing decks',
            },
            {
                fr: 'Resorts luxueux en bord de mer',
                ar: 'منتجعات شاطئية فاخرة',
                en: 'Luxury beachfront resorts',
            },
        ],
        bestTime: {
            fr: 'Novembre à mars',
            ar: 'من نوفمبر إلى مارس',
            en: 'November to March',
        },
        language: {
            fr: 'Arabe et anglais',
            ar: 'العربية والإنجليزية',
            en: 'Arabic and English',
        },
        currency: {
            fr: 'Dirham des EAU',
            ar: 'الدرهم الإماراتي',
            en: 'UAE dirham',
        },
        weather: { fr: 'Chaud et sec', ar: 'حار وجاف', en: 'Hot and dry' },
    },
];

const hotelsData: HotelItem[] = [
    {
        slug: 'sunset-paradise-resort',
        id: 'sunset-paradise',
        destinationSlug: 'santorini',
        name: {
            fr: 'Sunset Paradise Resort',
            ar: 'منتجع صن ست بارادايس',
            en: 'Sunset Paradise Resort',
        },
        location: {
            fr: 'Santorin, Grèce',
            ar: 'سانتوريني، اليونان',
            en: 'Santorini, Greece',
        },
        price: 320,
        rating: 4.9,
        stars: 5,
        reviews: 234,
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop',
        amenities: ['wifi', 'parking', 'breakfast'],
        tags: ['luxury', 'beach', 'resort'],
    },
    {
        slug: 'ubud-jungle-retreat',
        id: 'ubud-jungle',
        destinationSlug: 'bali',
        name: {
            fr: 'Ubud Jungle Retreat',
            ar: 'منتجع أوبود للغابات',
            en: 'Ubud Jungle Retreat',
        },
        location: {
            fr: 'Bali, Indonésie',
            ar: 'بالي، إندونيسيا',
            en: 'Bali, Indonesia',
        },
        price: 180,
        rating: 4.8,
        stars: 4,
        reviews: 189,
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop',
        amenities: ['wifi', 'breakfast'],
        tags: ['adventure', 'nature', 'boutique'],
    },
    {
        slug: 'grand-parisien',
        id: 'grand-parisien',
        destinationSlug: 'paris',
        name: {
            fr: 'Le Grand Parisien',
            ar: 'لو غراند باريسيان',
            en: 'Le Grand Parisien',
        },
        location: {
            fr: 'Paris, France',
            ar: 'باريس، فرنسا',
            en: 'Paris, France',
        },
        price: 450,
        rating: 4.9,
        stars: 5,
        reviews: 312,
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop',
        amenities: ['wifi', 'parking', 'breakfast'],
        tags: ['luxury', 'city', 'boutique'],
    },
    {
        slug: 'marina-bay-suites',
        id: 'marina-bay',
        destinationSlug: 'dubai',
        name: {
            fr: 'Marina Bay Suites',
            ar: 'فندق مارينا باي سويتس',
            en: 'Marina Bay Suites',
        },
        location: {
            fr: 'Dubaï, Émirats Arabes Unis',
            ar: 'دبي، الإمارات العربية المتحدة',
            en: 'Dubai, UAE',
        },
        price: 280,
        rating: 4.7,
        stars: 5,
        reviews: 156,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
        amenities: ['wifi', 'parking'],
        tags: ['luxury', 'city', 'resort'],
    },
    {
        slug: 'imperial-tokyo-hotel',
        id: 'imperial-tokyo',
        destinationSlug: 'tokyo',
        name: {
            fr: 'Hôtel Impérial Tokyo',
            ar: 'فندق إمبريال طوكيو',
            en: 'Imperial Tokyo Hotel',
        },
        location: {
            fr: 'Tokyo, Japon',
            ar: 'طوكيو، اليابان',
            en: 'Tokyo, Japan',
        },
        price: 350,
        rating: 4.8,
        stars: 4,
        reviews: 278,
        image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&h=400&fit=crop',
        amenities: ['wifi', 'breakfast'],
        tags: ['city', 'family', 'resort'],
    },
];

const toursData: TourItem[] = [
    {
        slug: 'greek-island-hopping',
        name: {
            fr: 'Îles Grecques en Liberté',
            ar: 'جولة الجزر اليونانية',
            en: 'Greek Island Hopping',
        },
        location: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
        duration: { fr: '7 jours', ar: '7 أيام', en: '7 Days' },
        maxGroup: 12,
        price: 2499,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&h=400&fit=crop',
        description: {
            fr: 'Explorez les magnifiques îles des Cyclades avec des visites guidées et du temps libre.',
            ar: 'استكشف الجزر السيكلادية الرائعة مع الجولات الموجهة والوقت الحر.',
            en: 'Explore the stunning Cycladic islands with guided tours and free time.',
        },
    },
    {
        slug: 'bali-cultural-immersion',
        name: {
            fr: 'Immersion Culturelle à Bali',
            ar: 'انغمس في ثقافة بالي',
            en: 'Bali Cultural Immersion',
        },
        location: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
        duration: { fr: '10 jours', ar: '10 أيام', en: '10 Days' },
        maxGroup: 8,
        price: 1899,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop',
        description: {
            fr: 'Temples, rizières et cérémonies traditionnelles au cœur de Bali.',
            ar: 'المعابد والحقول الأرزية والطقوس التقليدية في قلب بالي.',
            en: 'Temples, rice fields, and traditional ceremonies in the heart of Bali.',
        },
    },
    {
        slug: 'paris-art-gastronomy',
        name: {
            fr: 'Paris: Art et Gastronomie',
            ar: 'باريس: الفن والطعام',
            en: 'Parisian Art & Gastronomy',
        },
        location: { fr: 'France', ar: 'فرنسا', en: 'France' },
        duration: { fr: '5 jours', ar: '5 أيام', en: '5 Days' },
        maxGroup: 10,
        price: 3200,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
        description: {
            fr: 'Visites privées de musées, cours de cuisine et dégustations de vin.',
            ar: 'جولات خاصة بالمتاحف وفصول الطبخ وتذوق النبيذ.',
            en: 'Private museum tours, cooking classes, and wine tastings.',
        },
    },
];

const tourDetailsData: TourDetailItem[] = [
    {
        slug: 'greek-island-hopping',
        name: {
            fr: 'Îles Grecques en Liberté',
            ar: 'جولة الجزر اليونانية',
            en: 'Greek Island Hopping',
        },
        type: { fr: 'Circuit', ar: 'جولة', en: 'Circuit' },
        location: [
            { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
            { fr: 'Mykonos', ar: 'ميكونوس', en: 'Mykonos' },
            { fr: 'Naxos', ar: 'ناكسوس', en: 'Naxos' },
        ],
        durationDays: 7,
        durationNights: 6,
        maxGroup: 12,
        pricePerPerson: 2499,
        rating: 4.9,
        images: [
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1505765057921-4b6cf2d7fbf8?w=1200&h=800&fit=crop',
        ],
        tags: ['islands', 'beach', 'culture'],
        itinerary: [
            {
                day: 1,
                title: {
                    fr: 'Arrivée et dîner de bienvenue à Santorin',
                    ar: 'الوصول وعشاء ترحيبي في سانتوريني',
                    en: 'Arrival and welcome dinner in Santorini',
                },
                details: {
                    fr: 'Installez-vous à l’hôtel, rencontrez votre accompagnateur et savourez un dîner de bienvenue face au coucher du soleil sur la caldeira.',
                    ar: 'استقر في الفندق، تعرّف على مضيف الرحلة، واستمتع بعشاء ترحيبي عند الغروب مطل على الكالديرا.',
                    en: 'Settle into your hotel, meet your travel host, and enjoy a sunset welcome dinner overlooking the caldera.',
                },
            },
            {
                day: 2,
                title: {
                    fr: 'Visite de la caldeira et coucher du soleil',
                    ar: 'جولة الكالديرا والغروب',
                    en: 'Caldera tour and sunset',
                },
                details: {
                    fr: 'Naviguez dans la caldeira, visitez les belvédères volcaniques et terminez la journée par une vue au coucher du soleil depuis la falaise.',
                    ar: 'أبحر في الكالديرا، زر نقاط المشاهدة البركانية، وأنهِ اليوم بتجربة غروب من على المنحدر.',
                    en: 'Cruise the caldera by boat, visit volcanic viewpoints, and end the day with a cliffside sunset experience.',
                },
            },
            {
                day: 3,
                title: {
                    fr: 'Traversée vers Mykonos et plage',
                    ar: 'العبّارة إلى ميكونوس ووقت الشاطئ',
                    en: 'Ferry to Mykonos and beach time',
                },
                details: {
                    fr: 'Prenez le ferry pour Mykonos, installez-vous dans votre boutique-hôtel et passez l’après-midi dans un beach club détendu.',
                    ar: 'استقل العبّارة إلى ميكونوس، استقر في إقامتك البوتيكية، واقضِ بعد الظهر في نادٍ شاطئي هادئ.',
                    en: 'Take the ferry to Mykonos, check into your boutique stay, and spend the afternoon at a relaxed beach club.',
                },
            },
        ],
        inclusions: [
            { fr: 'Petit-déjeuner', ar: 'الإفطار', en: 'Breakfast' },
            {
                fr: 'Transferts en ferry',
                ar: 'نقل بالعبّارة',
                en: 'Ferry transfers',
            },
            { fr: 'Guide local', ar: 'مرشد محلي', en: 'Local guide' },
        ],
        excludes: [
            {
                fr: 'Vols internationaux',
                ar: 'الرحلات الدولية',
                en: 'International flights',
            },
            {
                fr: 'Assurance voyage',
                ar: 'تأمين السفر',
                en: 'Travel insurance',
            },
            {
                fr: 'Dépenses personnelles',
                ar: 'المصاريف الشخصية',
                en: 'Personal expenses',
            },
        ],
        description: {
            fr: 'Explorez les Cyclades avec des traversées en ferry, des villages blancs et des plages secrètes.',
            ar: 'استكشف السيكلاديس عبر العبارات والقرى البيضاء والشواطئ السرية.',
            en: 'Explore the Cyclades with ferry crossings, white villages, and hidden beaches.',
        },
    },
    {
        slug: 'bali-cultural-immersion',
        name: {
            fr: 'Immersion Culturelle à Bali',
            ar: 'انغمس في ثقافة بالي',
            en: 'Bali Cultural Immersion',
        },
        type: { fr: 'Retraite', ar: 'منتجع', en: 'Retreat' },
        location: [{ fr: 'Ubud', ar: 'أوبود', en: 'Ubud' }],
        durationDays: 10,
        durationNights: 9,
        maxGroup: 8,
        pricePerPerson: 1899,
        rating: 4.8,
        images: [
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&h=900&fit=crop',
        ],
        tags: ['wellness', 'culture'],
        itinerary: [
            {
                day: 1,
                title: {
                    fr: 'Arrivée à Ubud',
                    ar: 'الوصول إلى أوبود',
                    en: 'Arrival in Ubud',
                },
                details: {
                    fr: 'Arrivez au cœur culturel de Bali, installez-vous à votre retraite et profitez d’une cérémonie de bienvenue apaisante.',
                    ar: 'صل إلى القلب الثقافي لبالي، استقر في المنتجع، واستمتع بحفل ترحيبي هادئ.',
                    en: 'Arrive in the cultural heart of Bali, check in to your retreat, and enjoy a soothing welcome ceremony.',
                },
            },
            {
                day: 2,
                title: {
                    fr: 'Visites de temples',
                    ar: 'زيارات المعابد',
                    en: 'Temple visits',
                },
                details: {
                    fr: 'Explorez des temples sacrés, découvrez les traditions hindoues balinaises et savourez un déjeuner local au village.',
                    ar: 'استكشف المعابد المقدسة، وتعرّف إلى التقاليد الهندوسية البالية، واستمتع بغداء محلي في القرية.',
                    en: 'Explore sacred temples, learn about Balinese Hindu traditions, and enjoy a local lunch in the village.',
                },
            },
            {
                day: 3,
                title: {
                    fr: 'Rizières et cours de cuisine',
                    ar: 'مدرجات الأرز وورشة طبخ',
                    en: 'Rice terraces and cooking class',
                },
                details: {
                    fr: 'Marchez parmi les rizières émeraude le matin avant de participer à un cours de cuisine balinaise pratique.',
                    ar: 'تجوّل بين مدرجات الأرز الخضراء صباحًا قبل الانضمام إلى درس طبخ بالي عملي.',
                    en: 'Walk through emerald rice terraces in the morning before joining a hands-on Balinese cooking class.',
                },
            },
        ],
        inclusions: [
            { fr: 'Petit-déjeuner', ar: 'الإفطار', en: 'Breakfast' },
            {
                fr: 'Transfert aéroport',
                ar: 'نقل من المطار',
                en: 'Airport transfer',
            },
            {
                fr: 'Activités mentionnées',
                ar: 'الأنشطة المذكورة',
                en: 'Activities as listed',
            },
        ],
        excludes: [
            { fr: 'Frais de visa', ar: 'رسوم التأشيرة', en: 'Visa fees' },
            {
                fr: 'Déjeuner et dîner',
                ar: 'الغداء والعشاء',
                en: 'Lunch and dinner',
            },
            {
                fr: 'Soins spa optionnels',
                ar: 'علاجات سبا اختيارية',
                en: 'Optional spa treatments',
            },
        ],
        description: {
            fr: 'Temples, cérémonies et paysages de rizières pour une immersion profonde.',
            ar: 'معابد وطقوس ومناظر أرز لرحلة غامرة.',
            en: 'Temples, ceremonies, and rice landscapes for deep immersion.',
        },
    },
    {
        slug: 'paris-art-gastronomy',
        name: {
            fr: 'Paris: Art et Gastronomie',
            ar: 'باريس: الفن والطعام',
            en: 'Parisian Art & Gastronomy',
        },
        type: { fr: 'Séjour urbain', ar: 'عطلة مدينة', en: 'City Break' },
        location: [{ fr: 'Paris', ar: 'باريس', en: 'Paris' }],
        durationDays: 5,
        durationNights: 4,
        maxGroup: 10,
        pricePerPerson: 3200,
        rating: 4.9,
        images: [
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&h=900&fit=crop',
        ],
        tags: ['food', 'art', 'city'],
        itinerary: [
            {
                day: 1,
                title: {
                    fr: 'Louvre et promenade sur la Seine',
                    ar: 'اللوفر ونزهة على السين',
                    en: 'Louvre and Seine walk',
                },
                details: {
                    fr: 'Commencez par une visite privée du musée puis une balade guidée le long de la Seine pour profiter de l’atmosphère parisienne.',
                    ar: 'ابدأ بزيارة خاصة للمتحف ثم نزهة بصحبة مرشد على ضفاف السين للاستمتاع بأجواء باريس.',
                    en: 'Begin with a private museum visit and a guided walk along the Seine to soak in Parisian atmosphere.',
                },
            },
            {
                day: 2,
                title: {
                    fr: 'Cours de cuisine et marché',
                    ar: 'درس طبخ وزيارة سوق',
                    en: 'Cooking class and market visit',
                },
                details: {
                    fr: 'Faites vos achats au marché local puis cuisinez un menu français classique avec un chef instructeur.',
                    ar: 'تسوّق في السوق المحلي ثم اطبخ قائمة فرنسية كلاسيكية مع طاهٍ مدرّب.',
                    en: 'Shop for fresh ingredients at a local market, then cook a classic French menu with a chef instructor.',
                },
            },
            {
                day: 3,
                title: {
                    fr: 'Visite de musée',
                    ar: 'جولة متحفية',
                    en: 'Museum tour',
                },
                details: {
                    fr: 'Profitez d’un programme artistique sélectionné avec commentaires d’experts et du temps libre pour explorer une galerie préférée à votre rythme.',
                    ar: 'استمتع ببرنامج فني منسّق مع تعليق من خبراء ووقت لاستكشاف معرض مفضل على وتيرتك.',
                    en: 'Enjoy a curated art itinerary with expert commentary and time to explore a favorite gallery at your own pace.',
                },
            },
        ],
        inclusions: [
            { fr: 'Petit-déjeuner', ar: 'الإفطار', en: 'Breakfast' },
            {
                fr: 'Entrées des musées mentionnées',
                ar: 'دخول المتاحف المذكور',
                en: 'Museum entries as listed',
            },
        ],
        excludes: [
            {
                fr: 'Transferts aéroport',
                ar: 'نقل من المطار',
                en: 'Airport transfers',
            },
            {
                fr: 'Déjeuners et dîners',
                ar: 'الغداء والعشاء',
                en: 'Lunches and dinners',
            },
            { fr: 'Pourboires', ar: 'الإكراميات', en: 'Gratuities' },
        ],
        description: {
            fr: 'Musées, gastronomie et promenades élégantes dans la capitale.',
            ar: 'متاحف ومأكولات فاخرة ومشي أنيق في العاصمة.',
            en: 'Museums, cuisine, and elegant walks through the capital.',
        },
    },
];

export function localizeText(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

export function getDestinations(): DestinationItem[] {
    return destinationsData;
}

export function findDestinationBySlug(
    slug?: string | null,
): DestinationItem | null {
    return (
        destinationsData.find((destination) => destination.slug === slug) ??
        null
    );
}

export function getHotels(): HotelItem[] {
    return hotelsData;
}

export function findHotelById(id?: string | null): HotelItem | null {
    return hotelsData.find((hotel) => hotel.id === id) ?? null;
}

export function getTours(): TourItem[] {
    return toursData;
}

export function findTourBySlug(slug?: string | null): TourItem | null {
    return toursData.find((tour) => tour.slug === slug) ?? null;
}

export function findTourDetailBySlug(
    slug?: string | null,
): TourDetailItem | null {
    return tourDetailsData.find((tour) => tour.slug === slug) ?? null;
}

export function getCars(): CarItem[] {
    return carsData;
}

export function findCarBySlug(slug?: string | null): CarItem | null {
    return carsData.find((car) => car.slug === slug) ?? null;
}

export function getFlights(): FlightItem[] {
    return flightsData;
}

export function findFlightById(id?: string | null): FlightItem | null {
    return flightsData.find((flight) => flight.id === id) ?? null;
}

export function getEvents(): EventItem[] {
    return eventsData;
}

export function findEventBySlug(slug?: string | null): EventItem | null {
    return eventsData.find((event) => event.slug === slug) ?? null;
}

export function getDeals(): DealItem[] {
    return dealsData;
}

export function findDealBySlug(slug?: string | null): DealItem | null {
    return dealsData.find((deal) => deal.slug === slug) ?? null;
}

export function searchDeals(query: string, lang: Lang): DealItem[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return dealsData;
    }

    return dealsData.filter((deal) => {
        const haystack = [
            deal.title[lang],
            deal.description[lang],
            deal.discount[lang],
            deal.category[lang],
        ]
            .join(' ')
            .toLowerCase();

        return haystack.includes(normalizedQuery);
    });
}

export function getPromos(): PromoItem[] {
    return promosData;
}

export function findPromoByCode(code?: string | null): PromoItem | null {
    return promosData.find((promo) => promo.code === code) ?? null;
}
