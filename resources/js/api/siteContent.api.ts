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
import type { LegalSectionBody } from '@/api/siteSettings.api';
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
    stars: number;
    rating: number;
    reviews: number;
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
    id?: string;
    labelKey: string;
    href: string;
}

export interface NavDropdownItem {
    id?: string;
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
    body: LegalSectionBody;
}

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
        image: '/images/hero-travel.jpg',
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
        image: '/images/destination-santorini.jpg',
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
        image: '/images/destination-bali.jpg',
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
    {
        id: 'nav-destinations',
        labelKey: 'nav.destinations',
        href: '/destinations',
    },
    { id: 'nav-hotels', labelKey: 'nav.hotels', href: '/hotels' },
    { id: 'nav-tours', labelKey: 'nav.tours', href: '/tours' },
    { id: 'nav-deals', labelKey: 'nav.deals', href: '/deals' },
    { id: 'nav-contact', labelKey: 'nav.contact', href: '/contact' },
    { id: 'nav-gallery', labelKey: 'nav.gallery', href: '/gallery' },
    { id: 'nav-events', labelKey: 'nav.events', href: '/events' },
    { id: 'nav-blog', labelKey: 'nav.blog', href: '/blog' },
];

export const footerSupportLinks: SimpleLinkItem[] = [
    { id: 'nav-team', labelKey: 'nav.team', href: '/team' },
    { id: 'nav-legal', labelKey: 'nav.legal', href: '/legal' },
    { id: 'nav-cars', labelKey: 'nav.cars', href: '/cars' },
    { id: 'nav-flights', labelKey: 'nav.flights', href: '/flights' },
    { id: 'nav-promos', labelKey: 'nav.promos', href: '/promos' },
];

export const navbarDestinationLinks: NavDropdownItem[] = [
    { id: 'cat-beach', labelKey: 'cat.beach', href: '/destinations?cat=beach' },
    { id: 'cat-city', labelKey: 'cat.city', href: '/destinations?cat=city' },
    {
        id: 'cat-nature',
        labelKey: 'cat.nature',
        href: '/destinations?cat=nature',
    },
    {
        id: 'cat-luxury',
        labelKey: 'cat.luxury',
        href: '/destinations?cat=luxury',
    },
    {
        id: 'cat-adventure',
        labelKey: 'cat.adventure',
        href: '/destinations?cat=adventure',
    },
];

export const navbarHotelLinks: NavDropdownItem[] = [
    {
        id: 'hotel-5',
        labelKey: 'search.options.fiveStar',
        href: '/hotels?stars=5',
    },
    {
        id: 'hotel-4',
        labelKey: 'search.options.fourStar',
        href: '/hotels?stars=4',
    },
    {
        id: 'hotel-3',
        labelKey: 'search.options.threeStar',
        href: '/hotels?stars=3',
    },
];

export const navbarMoreLinks: NavDropdownItem[] = [
    { id: 'more-cars', labelKey: 'nav.cars', href: '/cars' },
    { id: 'more-flights', labelKey: 'nav.flights', href: '/flights' },
    { id: 'more-promos', labelKey: 'nav.promos', href: '/promos' },
    { id: 'more-team', labelKey: 'nav.team', href: '/team' },
    { id: 'more-contact', labelKey: 'nav.contact', href: '/contact' },
    { id: 'more-legal', labelKey: 'nav.legal', href: '/legal' },
];

export const navbarSimpleLinks: SimpleLinkItem[] = [
    { id: 'simple-tours', labelKey: 'nav.tours', href: '/tours' },
    { id: 'simple-deals', labelKey: 'nav.deals', href: '/deals' },
    { id: 'simple-gallery', labelKey: 'nav.gallery', href: '/gallery' },
    { id: 'simple-events', labelKey: 'nav.events', href: '/events' },
    { id: 'simple-blog', labelKey: 'nav.blog', href: '/blog' },
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
    { id: 'eco', label: 'Eco', icon: Phone, desc: 'Under 2,000 DT' },
    {
        id: 'comfort',
        label: 'Comfort',
        icon: Phone,
        desc: '2,000 DT – 4,500 DT',
    },
    {
        id: 'premium',
        label: 'Premium',
        icon: Phone,
        desc: '4,500 DT – 8,000 DT',
    },
    { id: 'luxury', label: 'Luxury', icon: Phone, desc: '8,000 DT+' },
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
    '/images/destination-paris.jpg',
    '/images/destination-dubai.jpg',
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
