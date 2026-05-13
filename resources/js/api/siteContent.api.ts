import type { Calendar } from 'lucide-react';
import {
    Facebook,
    Instagram,
    Linkedin,
    Mail,
    MessageCircle,
    Percent,
    Phone,
    ShieldCheck,
    Twitter,
    Zap,
    Youtube,
} from 'lucide-react';
import destBali from '@/assets/dest-bali.jpg';
import destDubai from '@/assets/dest-dubai.jpg';
import destParis from '@/assets/dest-paris.jpg';
import destSantorini from '@/assets/dest-santorini.jpg';
import type { Lang } from '@/i18n/translations';

export type LocalizedText = Record<Lang, string>;

export interface HotelAmenity {
    id: string;
    name: LocalizedText;
    icon: typeof Phone;
}

export interface HotelRoom {
    id: string;
    name: LocalizedText;
    description: LocalizedText;
    pricePerNight: number;
    capacity: number;
    size: number;
    features: LocalizedText[];
    images: string[];
}

export interface HotelDetailData {
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
    amenities: Array<{ id: string; name: LocalizedText; icon: typeof Phone }>;
    rooms: HotelRoom[];
}

export interface ContactMethod {
    labelKey: string;
    value: string;
    href: string;
    icon: typeof Phone;
}

export interface SocialLink {
    label: string;
    href: string;
    icon: typeof Facebook;
}

export interface BlogPost {
    slug: string;
    title: LocalizedText;
    excerpt: LocalizedText;
    date: string;
    category: LocalizedText;
    image: string;
}

export interface DealCard {
    slug: string;
    title: LocalizedText;
    description: LocalizedText;
    discount: LocalizedText;
    category: LocalizedText;
    icon: typeof Calendar;
    color: string;
}

export interface SimpleLinkItem {
    labelKey: string;
    href: string;
}

export interface NavDropdownItem {
    labelKey: string;
    href: string;
}

export interface SearchWidgetConfig {
    titleKey: string;
    buttonKey: string;
    guestLabelKey: string;
    extraFields: Array<{
        key: string;
        labelKey: string;
        options: Array<{ value: string; labelKey: string }>;
    }>;
}

export interface OptionItem {
    id: string;
    label: string;
    icon: typeof Phone;
    desc?: string;
}

export interface StepItem {
    key: string;
    title: string;
    subtitle: string;
    icon: typeof Phone;
}

export interface LegalSection {
    title: LocalizedText;
    body: LocalizedText;
}

export interface TeamMember {
    name: string;
    role: string;
    image: string;
    bio: string;
}

export const hotelDetailDatabase: HotelDetailData[] = [
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
                icon: Phone,
            },
            {
                id: '2',
                name: { fr: 'Parking', ar: 'موقف سيارات', en: 'Parking' },
                icon: Phone,
            },
            {
                id: '3',
                name: { fr: 'Petit-déjeuner', ar: 'إفطار', en: 'Breakfast' },
                icon: Phone,
            },
            {
                id: '4',
                name: { fr: 'Salle de sport', ar: 'نادي رياضي', en: 'Gym' },
                icon: Phone,
            },
            {
                id: '5',
                name: { fr: 'Restaurant', ar: 'مطعم', en: 'Restaurant' },
                icon: Phone,
            },
            {
                id: '6',
                name: { fr: 'Piscine', ar: 'مسبح', en: 'Pool' },
                icon: Phone,
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
];

export const contactMethods: ContactMethod[] = [
    {
        labelKey: 'contact.calls',
        value: '+1 (555) 123-4567',
        href: 'tel:+15551234567',
        icon: Phone,
    },
    {
        labelKey: 'contact.whatsapp',
        value: '+1 (555) 123-4567',
        href: 'https://wa.me/15551234567',
        icon: MessageCircle,
    },
    {
        labelKey: 'contact.email',
        value: 'hello@voyageur.com',
        href: 'mailto:hello@voyageur.com',
        icon: Mail,
    },
];

export const socialLinks: SocialLink[] = [
    { label: 'Facebook', href: 'https://facebook.com', icon: Facebook },
    { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
    { label: 'Twitter', href: 'https://x.com', icon: Twitter },
    { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
    { label: 'YouTube', href: 'https://youtube.com', icon: Youtube },
];

export const blogPosts: BlogPost[] = [
    {
        slug: 'southeast-asia-hidden-gems',
        title: {
            fr: "10 Joyaux Cachés d'Asie du Sud-Est à Découvrir",
            ar: '10 جواهر مخفية في جنوب شرق آسيا يجب عليك زيارتها',
            en: '10 Hidden Gems in Southeast Asia You Must Visit',
        },
        excerpt: {
            fr: 'Découvrez des destinations moins connues offrant des expériences extraordinaires loin de la foule de touristes.',
            ar: 'اكتشف الوجهات الأقل شهرة التي تقدم تجارب لا تصدق بعيدًا عن حشود السياح.',
            en: 'Discover lesser-known destinations that offer incredible experiences without the tourist crowds.',
        },
        date: 'Feb 15, 2026',
        category: { fr: 'Aventure', ar: 'مغامرة', en: 'Adventure' },
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    },
    {
        slug: 'budget-travel-europe',
        title: {
            fr: 'Guide Ultime du Voyage Économique en Europe',
            ar: 'الدليل الشامل للسفر برخص في أوروبا',
            en: 'The Ultimate Guide to Budget Travel in Europe',
        },
        excerpt: {
            fr: "Comment explorer les plus belles villes d'Europe sans dépasser votre budget. Conseils de voyageurs expérimentés.",
            ar: 'كيفية استكشاف أجمل مدن أوروبا دون تجاوز ميزانيتك. نصائح من المسافرين المتمرسين.',
            en: "How to explore Europe's most iconic cities without breaking the bank. Tips from seasoned travelers.",
        },
        date: 'Feb 10, 2026',
        category: { fr: 'Conseils', ar: 'نصائح', en: 'Tips' },
        image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&h=400&fit=crop',
    },
    {
        slug: 'sustainable-travel-2026',
        title: {
            fr: 'Pourquoi le Voyage Durable est Important en 2026',
            ar: 'لماذا السفر المستدام مهم في 2026',
            en: 'Why Sustainable Travel Matters in 2026',
        },
        excerpt: {
            fr: 'Le mouvement croissant vers le tourisme écologiquement conscient et comment vous pouvez faire une différence.',
            ar: 'الحركة المتنامية نحو السياحة الواعية بيئيًا وكيف يمكنك إحداث فرق.',
            en: 'The growing movement towards eco-conscious tourism and how you can make a difference.',
        },
        date: 'Feb 5, 2026',
        category: { fr: 'Durabilité', ar: 'الاستدامة', en: 'Sustainability' },
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=400&fit=crop',
    },
];

export const dealsSectionData: DealCard[] = [
    {
        slug: 'early-bird-summer-2026',
        title: {
            fr: 'Early Bird Été 2026',
            ar: 'صيف 2026 مبكرًا',
            en: 'Early Bird Summer 2026',
        },
        description: {
            fr: "Réservez votre escapade d'été avant le 31 mars et économisez jusqu'à 35% sur certaines destinations balnéaires.",
            ar: 'احجز عطلتك الصيفية قبل 31 مارس ووفر حتى 35٪ على وجهات شاطئية مختارة.',
            en: 'Book your summer getaway before March 31st and save up to 35% on selected beach destinations.',
        },
        discount: { fr: '35% DE RÉDUCTION', ar: 'خصم 35%', en: '35% OFF' },
        category: { fr: 'Saisonnière', ar: 'موسمية', en: 'Seasonal' },
        icon: Zap,
        color: 'bg-secondary/10 text-secondary',
    },
    {
        slug: 'last-minute-escapes',
        title: {
            fr: 'Évasions Dernière Minute',
            ar: 'عروض اللحظة الأخيرة',
            en: 'Last Minute Escapes',
        },
        description: {
            fr: 'Des prix incroyables pour des départs sous 14 jours. Parfait pour les voyageurs spontanés.',
            ar: 'أسعار مذهلة للرحلات المغادرة خلال 14 يومًا. مثالي للمسافرين العفويين.',
            en: 'Incredible prices on departures within the next 14 days. Perfect for spontaneous travelers.',
        },
        discount: { fr: 'Jusqu’à 50%', ar: 'حتى 50%', en: 'Up to 50%' },
        category: {
            fr: 'Dernière minute',
            ar: 'اللحظة الأخيرة',
            en: 'Last minute',
        },
        icon: ShieldCheck,
        color: 'bg-primary/10 text-primary',
    },
    {
        slug: 'honeymoon-packages',
        title: {
            fr: 'Forfaits Lune de Miel',
            ar: 'باقات شهر العسل',
            en: 'Honeymoon Packages',
        },
        description: {
            fr: 'Escapades romantiques tout compris avec spa, restauration et excursions privées. Surclassement offert.',
            ar: 'عطلات رومانسية شاملة مع منتجع صحي، طعام وجولات خاصة. ترقية مجانية.',
            en: 'All-inclusive romantic getaways with spa, dining, and private excursions. Complimentary upgrade.',
        },
        discount: {
            fr: 'Surclassement Gratuit',
            ar: 'ترقية مجانية',
            en: 'Free Upgrade',
        },
        category: { fr: 'Romance', ar: 'رومانسي', en: 'Romance' },
        icon: Percent,
        color: 'bg-destructive/10 text-destructive',
    },
];

export const footerQuickLinks: SimpleLinkItem[] = [
    { labelKey: 'nav.destinations', href: '/destinations' },
    { labelKey: 'nav.hotels', href: '/hotels' },
    { labelKey: 'nav.tours', href: '/tours' },
    { labelKey: 'nav.deals', href: '/deals' },
    { labelKey: 'nav.contact', href: '/contact' },
    { labelKey: 'nav.gallery', href: '/gallery' },
    { labelKey: 'nav.events', href: '/events' },
    { labelKey: 'nav.blog', href: '/blog' },
];

export const footerSupportLinks: SimpleLinkItem[] = [
    { labelKey: 'nav.team', href: '/team' },
    { labelKey: 'nav.legal', href: '/legal' },
    { labelKey: 'nav.cars', href: '/cars' },
    { labelKey: 'nav.flights', href: '/flights' },
    { labelKey: 'nav.promos', href: '/promos' },
];

export const navbarDestinationLinks: NavDropdownItem[] = [
    { labelKey: 'cat.beach', href: '/destinations?cat=Beach' },
    { labelKey: 'cat.city', href: '/destinations?cat=City' },
    { labelKey: 'cat.nature', href: '/destinations?cat=Nature' },
    { labelKey: 'cat.luxury', href: '/destinations?cat=Luxury' },
    { labelKey: 'cat.adventure', href: '/destinations?cat=Adventure' },
];

export const navbarHotelLinks: NavDropdownItem[] = [
    { labelKey: 'search.options.fiveStar', href: '/hotels?stars=5' },
    { labelKey: 'search.options.fourStar', href: '/hotels?stars=4' },
    { labelKey: 'search.options.threeStar', href: '/hotels?stars=3' },
];

export const navbarMoreLinks: NavDropdownItem[] = [
    { labelKey: 'nav.cars', href: '/cars' },
    { labelKey: 'nav.flights', href: '/flights' },
    { labelKey: 'nav.promos', href: '/promos' },
    { labelKey: 'nav.team', href: '/team' },
    { labelKey: 'nav.contact', href: '/contact' },
    { labelKey: 'nav.legal', href: '/legal' },
];

export const navbarSimpleLinks: SimpleLinkItem[] = [
    { labelKey: 'nav.design', href: '/design-trip' },
    { labelKey: 'nav.tours', href: '/tours' },
    { labelKey: 'nav.deals', href: '/deals' },
    { labelKey: 'nav.gallery', href: '/gallery' },
    { labelKey: 'nav.events', href: '/events' },
    { labelKey: 'nav.blog', href: '/blog' },
];

export const designTripDestinations: OptionItem[] = [
    { id: 'santorini', label: 'Santorini', icon: Phone, desc: 'Greece' },
    { id: 'bali', label: 'Bali', icon: Phone, desc: 'Indonesia' },
    { id: 'paris', label: 'Paris', icon: Phone, desc: 'France' },
    { id: 'dubai', label: 'Dubai', icon: Phone, desc: 'UAE' },
    { id: 'tokyo', label: 'Tokyo', icon: Phone, desc: 'Japan' },
];

export const designTripInterests: OptionItem[] = [
    { id: 'beach', label: 'Beach', icon: Phone },
    { id: 'city', label: 'City', icon: Phone },
    { id: 'culture', label: 'Culture', icon: Phone },
    { id: 'nature', label: 'Nature', icon: Phone },
    { id: 'luxury', label: 'Luxury', icon: Phone },
    { id: 'adventure', label: 'Adventure', icon: Phone },
];

export const designTripAccommodations: OptionItem[] = [
    { id: 'eco', label: 'Eco', icon: Phone, desc: 'Sustainable stays' },
    { id: 'comfort', label: 'Comfort', icon: Phone, desc: 'Mid-range hotels' },
    {
        id: 'premium',
        label: 'Premium',
        icon: Phone,
        desc: 'Upscale experiences',
    },
    { id: 'luxury', label: 'Luxury', icon: Phone, desc: 'Ultra-luxury' },
];

export const designTripTransports: OptionItem[] = [
    { id: 'flight', label: 'Flight', icon: Phone },
    { id: 'train', label: 'Train', icon: Phone },
    { id: 'private', label: 'Private Driver', icon: Phone },
    { id: 'rental', label: 'Rental Car', icon: Phone },
];

export const designTripBudgets: OptionItem[] = [
    { id: 'eco', label: 'Eco', icon: Phone, desc: 'Under $2,000' },
    { id: 'comfort', label: 'Comfort', icon: Phone, desc: '$2,000–$4,500' },
    { id: 'premium', label: 'Premium', icon: Phone, desc: '$4,500–$8,000' },
    { id: 'luxury', label: 'Luxury', icon: Phone, desc: '$8,000+' },
];

export const designTripSteps: StepItem[] = [
    {
        key: 'destinations',
        title: 'Destinations',
        subtitle: 'Choose up to 3 places',
        icon: Phone,
    },
    {
        key: 'interests',
        title: 'Interests',
        subtitle: 'What do you love?',
        icon: Phone,
    },
    {
        key: 'accommodation',
        title: 'Accommodation',
        subtitle: 'Choose your style',
        icon: Phone,
    },
    {
        key: 'transport',
        title: 'Transport',
        subtitle: 'How would you like to move?',
        icon: Phone,
    },
    {
        key: 'details',
        title: 'Trip Details',
        subtitle: 'Dates and travelers',
        icon: Phone,
    },
    {
        key: 'budget',
        title: 'Your Budget',
        subtitle: 'Per person estimate',
        icon: Phone,
    },
    {
        key: 'summary',
        title: 'Your Custom Trip',
        subtitle: 'Review and confirm',
        icon: Phone,
    },
];

export const galleryPhotos: string[] = [
    destSantorini,
    destBali,
    destParis,
    destDubai,
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&h=900&fit=crop',
    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&h=900&fit=crop',
];

export const teamMembers: TeamMember[] = [
    {
        name: 'Amina',
        role: 'Travel Advisor',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop',
        bio: 'Designs tailor-made escapes with a focus on luxury and comfort.',
    },
    {
        name: 'Youssef',
        role: 'Operations Lead',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop',
        bio: 'Coordinates logistics so every trip runs smoothly.',
    },
    {
        name: 'Sara',
        role: 'Destination Specialist',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop',
        bio: 'Knows hidden gems, local culture, and the best places to stay.',
    },
];

export const legalSections: LegalSection[] = [
    {
        title: {
            fr: 'Conditions d’utilisation',
            ar: 'شروط الاستخدام',
            en: 'Terms of Use',
        },
        body: { fr: '...', ar: '...', en: '...' },
    },
    {
        title: {
            fr: 'Politique de confidentialité',
            ar: 'سياسة الخصوصية',
            en: 'Privacy Policy',
        },
        body: { fr: '...', ar: '...', en: '...' },
    },
];

export const landingAssurances: Array<{ icon: typeof Phone; textKey: string }> =
    [
        { icon: Phone, textKey: 'landing.assurance1' },
        { icon: Phone, textKey: 'landing.assurance2' },
        { icon: Phone, textKey: 'landing.assurance3' },
    ];

export const landingTrustCards: Array<{
    icon: typeof Phone;
    titleKey: string;
    descriptionKey: string;
}> = [
    { icon: Phone, titleKey: 'trust.card1', descriptionKey: 'trust.card1desc' },
    { icon: Phone, titleKey: 'trust.card2', descriptionKey: 'trust.card2desc' },
    { icon: Phone, titleKey: 'trust.card3', descriptionKey: 'trust.card3desc' },
];
