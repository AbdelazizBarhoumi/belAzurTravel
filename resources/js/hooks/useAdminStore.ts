import { useEffect, useState, useCallback } from 'react';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

export interface AdminDestination {
    id: string;
    name: string;
    country: string;
    category: string;
    price: number;
    rating: number;
    image: string;
    description: string;
}
export interface AdminHotel {
    id: string;
    name: string;
    location: string;
    category: string;
    price: number;
    rating: number;
    image: string;
}
export interface AdminTour {
    id: string;
    name: string;
    location: string;
    duration: string;
    price: number;
    rating: number;
    image: string;
}
export interface AdminBooking {
    id: string;
    client: string;
    type: string;
    item: string;
    date: string;
    amount: number;
    status: 'Pending' | 'Confirmed' | 'Cancelled';
}
export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'client' | 'admin' | 'assistant';
    active: boolean;
    joined: string;
}

export interface AdminState {
    destinations: AdminDestination[];
    hotels: AdminHotel[];
    tours: AdminTour[];
    bookings: AdminBooking[];
    users: AdminUser[];
}

const STORAGE_KEY = 'voyageur_admin_state';

type LocalizedAdminDestination = Omit<AdminDestination, 'name' | 'country' | 'category' | 'description'> & {
    name: LocalizedText;
    country: LocalizedText;
    category: LocalizedText;
    description: LocalizedText;
};

type LocalizedAdminHotel = Omit<AdminHotel, 'name' | 'location' | 'category'> & {
    name: LocalizedText;
    location: LocalizedText;
    category: LocalizedText;
};

type LocalizedAdminTour = Omit<AdminTour, 'name' | 'location' | 'duration'> & {
    name: LocalizedText;
    location: LocalizedText;
    duration: LocalizedText;
};

type LocalizedAdminBooking = Omit<AdminBooking, 'client' | 'type' | 'item' | 'status'> & {
    client: LocalizedText;
    type: LocalizedText;
    item: LocalizedText;
    status: LocalizedText;
};

function pick(value: LocalizedText, lang: Lang = 'en'): string {
    return value[lang];
}

function hydrateSeed(seedData: {
    destinations: LocalizedAdminDestination[];
    hotels: LocalizedAdminHotel[];
    tours: LocalizedAdminTour[];
    bookings: LocalizedAdminBooking[];
    users: AdminUser[];
}): AdminState {
    return {
        destinations: seedData.destinations.map((d) => ({
            ...d,
            name: pick(d.name),
            country: pick(d.country),
            category: pick(d.category),
            description: pick(d.description),
        })),
        hotels: seedData.hotels.map((h) => ({
            ...h,
            name: pick(h.name),
            location: pick(h.location),
            category: pick(h.category),
        })),
        tours: seedData.tours.map((t) => ({
            ...t,
            name: pick(t.name),
            location: pick(t.location),
            duration: pick(t.duration),
        })),
        bookings: seedData.bookings.map((b) => ({
            ...b,
            client: pick(b.client),
            type: pick(b.type),
            item: pick(b.item),
            status: pick(b.status) as AdminBooking['status'],
        })),
        users: seedData.users,
    };
}

const seedData = {
    destinations: [
        {
            id: 'd1',
            name: { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
            country: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
            category: { fr: 'Plage', ar: 'شاطئ', en: 'Beach' },
            price: 1299,
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop',
            description: {
                fr: 'Bâtiments blanchis à la chaux emblématiques surplombant la mer Égée.',
                ar: 'مبانٍ بيضاء أيقونية تطل على بحر إيجه.',
                en: 'Iconic white-washed buildings overlooking the Aegean Sea.',
            },
        },
        {
            id: 'd2',
            name: { fr: 'Bali', ar: 'بالي', en: 'Bali' },
            country: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
            category: { fr: 'Nature', ar: 'طبيعة', en: 'Nature' },
            price: 899,
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop',
            description: {
                fr: 'Rizières luxuriantes, temples et paradis tropical.',
                ar: 'مدرجات أرز خضراء ومعابد وجنة استوائية.',
                en: 'Lush rice terraces, temples, and tropical paradise.',
            },
        },
        {
            id: 'd3',
            name: { fr: 'Paris', ar: 'باريس', en: 'Paris' },
            country: { fr: 'France', ar: 'فرنسا', en: 'France' },
            category: { fr: 'Ville', ar: 'مدينة', en: 'City' },
            price: 1499,
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
            description: {
                fr: 'La Ville Lumière.',
                ar: 'مدينة النور.',
                en: 'The City of Light.',
            },
        },
        {
            id: 'd4',
            name: { fr: 'Dubaï', ar: 'دبي', en: 'Dubai' },
            country: { fr: 'Émirats Arabes Unis', ar: 'الإمارات العربية المتحدة', en: 'UAE' },
            category: { fr: 'Luxe', ar: 'فاخر', en: 'Luxury' },
            price: 1199,
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop',
            description: {
                fr: 'Une silhouette futuriste et des aventures dans le désert.',
                ar: 'أفق مستقبلي ومغامرات صحراوية.',
                en: 'Futuristic skyline and desert adventures.',
            },
        },
    ],
    hotels: [
        {
            id: 'h1',
            name: { fr: 'Sunset Paradise Resort', ar: 'منتجع صن ست بارادايس', en: 'Sunset Paradise Resort' },
            location: { fr: 'Santorin, Grèce', ar: 'سانتوريني، اليونان', en: 'Santorini, Greece' },
            category: { fr: 'Complexes', ar: 'منتجعات', en: 'Resorts' },
            price: 320,
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop',
        },
        {
            id: 'h2',
            name: { fr: 'Le Grand Parisien', ar: 'لو غراند باريسيان', en: 'Le Grand Parisien' },
            location: { fr: 'Paris, France', ar: 'باريس، فرنسا', en: 'Paris, France' },
            category: { fr: 'Luxe', ar: 'فاخر', en: 'Luxury' },
            price: 450,
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop',
        },
        {
            id: 'h3',
            name: { fr: 'Marina Bay Suites', ar: 'فندق مارينا باي سويتس', en: 'Marina Bay Suites' },
            location: { fr: 'Dubaï, Émirats Arabes Unis', ar: 'دبي، الإمارات العربية المتحدة', en: 'Dubai, UAE' },
            category: { fr: 'Boutique', ar: 'بوتيك', en: 'Boutique' },
            price: 280,
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
        },
    ],
    tours: [
        {
            id: 't1',
            name: { fr: 'Îles Grecques en Liberté', ar: 'جولة الجزر اليونانية', en: 'Greek Island Hopping' },
            location: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
            duration: { fr: '7 Jours', ar: '7 أيام', en: '7 Days' },
            price: 2499,
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&h=400&fit=crop',
        },
        {
            id: 't2',
            name: { fr: 'Immersion Culturelle à Bali', ar: 'انغمس في ثقافة بالي', en: 'Bali Cultural Immersion' },
            location: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
            duration: { fr: '10 Jours', ar: '10 أيام', en: '10 Days' },
            price: 1899,
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop',
        },
    ],
    bookings: [
        {
            id: 'B001',
            client: { fr: 'Sarah Johnson', ar: 'سارة جونسون', en: 'Sarah Johnson' },
            type: { fr: 'Destination', ar: 'وجهة', en: 'Destination' },
            item: { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
            date: '2026-02-20',
            amount: 2450,
            status: { fr: 'Confirmé', ar: 'مؤكد', en: 'Confirmed' },
        },
        {
            id: 'B002',
            client: { fr: 'Mike Chen', ar: 'مايك تشين', en: 'Mike Chen' },
            type: { fr: 'Hôtel', ar: 'فندق', en: 'Hotel' },
            item: { fr: 'Marina Bay Suites', ar: 'فندق مارينا باي سويتس', en: 'Marina Bay Suites' },
            date: '2026-02-19',
            amount: 1890,
            status: { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
        },
        {
            id: 'B003',
            client: { fr: 'Emma Davis', ar: 'إيما ديفيس', en: 'Emma Davis' },
            type: { fr: 'Circuit', ar: 'جولة', en: 'Tour' },
            item: { fr: 'Immersion Culturelle à Bali', ar: 'انغمس في ثقافة بالي', en: 'Bali Cultural Immersion' },
            date: '2026-02-18',
            amount: 3200,
            status: { fr: 'Confirmé', ar: 'مؤكد', en: 'Confirmed' },
        },
        {
            id: 'B004',
            client: { fr: 'James Wilson', ar: 'جيمس ويلسون', en: 'James Wilson' },
            type: { fr: 'Destination', ar: 'وجهة', en: 'Destination' },
            item: { fr: 'Dubaï', ar: 'دبي', en: 'Dubai' },
            date: '2026-02-17',
            amount: 2100,
            status: { fr: 'Annulé', ar: 'ملغي', en: 'Cancelled' },
        },
        {
            id: 'B005',
            client: { fr: 'Lisa Brown', ar: 'ليزا براون', en: 'Lisa Brown' },
            type: { fr: 'Hôtel', ar: 'فندق', en: 'Hotel' },
            item: { fr: 'Le Grand Parisien', ar: 'لو غراند باريسيان', en: 'Le Grand Parisien' },
            date: '2026-02-16',
            amount: 1599,
            status: { fr: 'Confirmé', ar: 'مؤكد', en: 'Confirmed' },
        },
    ],
    users: [
        {
            id: 'u1',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            role: 'client',
            active: true,
            joined: '2025-11-12',
        },
        {
            id: 'u2',
            name: 'Mike Chen',
            email: 'mike@example.com',
            role: 'client',
            active: true,
            joined: '2025-12-03',
        },
        {
            id: 'u3',
            name: 'Anna Admin',
            email: 'admin@voyageur.com',
            role: 'admin',
            active: true,
            joined: '2024-06-01',
        },
        {
            id: 'u4',
            name: 'Liam Helper',
            email: 'liam@voyageur.com',
            role: 'assistant',
            active: true,
            joined: '2025-02-18',
        },
        {
            id: 'u5',
            name: 'James Wilson',
            email: 'james@example.com',
            role: 'client',
            active: false,
            joined: '2025-09-21',
        },
    ] as AdminUser[],
};

const seed: AdminState = hydrateSeed(seedData);

function load(): AdminState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        // Failed to parse stored data, using seed
        console.error(e);
    }
    return seed;
}

let listeners: Array<() => void> = [];
let state: AdminState = load();

function setState(next: AdminState) {
    state = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    listeners.forEach((l) => l());
}

export function useAdminStore() {
    const [, setTick] = useState(0);
    useEffect(() => {
        const l = () => setTick((t) => t + 1);
        listeners.push(l);
        return () => {
            listeners = listeners.filter((x) => x !== l);
        };
    }, []);

    const upsert = useCallback(
        <K extends keyof AdminState>(key: K, item: AdminState[K][number]) => {
            const list: AdminState[K] = state[key];
            const idx = (list as Array<{ id?: string }>).findIndex(
                (x) =>
                    (x as { id?: string }).id === (item as { id?: string }).id,
            );
            const next: AdminState[K] =
                idx >= 0
                    ? ((list as unknown[]).map((x, i) =>
                          i === idx ? item : x,
                      ) as AdminState[K])
                    : ([...(list as unknown[]), item] as AdminState[K]);
            setState({ ...state, [key]: next } as AdminState);
        },
        [],
    );

    const remove = useCallback(
        <K extends keyof AdminState>(key: K, id: string) => {
            const list = state[key] as unknown[];
            const next: AdminState[K] = list.filter(
                (x: unknown) => (x as { id?: string }).id !== id,
            ) as AdminState[K];
            setState({ ...state, [key]: next } as AdminState);
        },
        [],
    );

    const reset = useCallback(() => setState(seed), []);

    return { state, upsert, remove, reset };
}

export function generateId() {
    return Math.random().toString(36).slice(2, 9);
}
