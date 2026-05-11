import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

export interface CarItem {
    slug: string;
    name: LocalizedText;
    category: LocalizedText;
    price: number;
    seats: number;
    fuel: LocalizedText;
    transmission: LocalizedText;
    image: string;
    features: string[];
    policy: string[];
}

export const carsData: CarItem[] = [
    {
        slug: 'mercedes-e-class',
        name: { fr: 'Mercedes Classe E', ar: 'مرسيدس الفئة E', en: 'Mercedes E-Class' },
        category: { fr: 'Luxe', ar: 'فاخر', en: 'Luxury' },
        price: 120,
        seats: 5,
        fuel: { fr: 'Hybride', ar: 'هجين', en: 'Hybrid' },
        transmission: { fr: 'Automatique', ar: 'أوتوماتيك', en: 'Auto' },
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&h=560&fit=crop',
        features: ['Premium insurance', 'Unlimited mileage', 'Roadside assistance'],
        policy: ['Driver age 25+', 'Deposit required', 'Fuel must be returned at same level'],
    },
    {
        slug: 'bmw-x5-suv',
        name: { fr: 'BMW X5 SUV', ar: 'بي إم دبليو X5 SUV', en: 'BMW X5 SUV' },
        category: { fr: 'SUV', ar: 'دفع رباعي', en: 'SUV' },
        price: 150,
        seats: 7,
        fuel: { fr: 'Diesel', ar: 'ديزل', en: 'Diesel' },
        transmission: { fr: 'Automatique', ar: 'أوتوماتيك', en: 'Auto' },
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&h=560&fit=crop',
        features: ['Child seat available', 'GPS included', 'Airport pickup optional'],
        policy: ['Driver age 25+', 'Cross-border not included', 'Late return fee applies'],
    },
    {
        slug: 'tesla-model-3',
        name: { fr: 'Tesla Model 3', ar: 'تسلا موديل 3', en: 'Tesla Model 3' },
        category: { fr: 'Électrique', ar: 'كهربائي', en: 'Electric' },
        price: 130,
        seats: 5,
        fuel: { fr: 'Électrique', ar: 'كهربائي', en: 'Electric' },
        transmission: { fr: 'Automatique', ar: 'أوتوماتيك', en: 'Auto' },
        image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900&h=560&fit=crop',
        features: ['Fast charging support', 'Premium interior', 'Autopilot assistance'],
        policy: ['Charger cable included', 'Charging costs billed separately', 'City-only use recommended'],
    },
];
