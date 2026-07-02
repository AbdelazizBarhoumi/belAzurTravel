import '@testing-library/jest-dom/vitest';

const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem(key: string) {
            return Object.prototype.hasOwnProperty.call(store, key)
                ? store[key]
                : null;
        },
        setItem(key: string, value: string) {
            store[key] = String(value);
        },
        removeItem(key: string) {
            delete store[key];
        },
        clear() {
            store = {};
        },
        key(index: number) {
            return Object.keys(store)[index] ?? null;
        },
        get length() {
            return Object.keys(store).length;
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
    }),
});

// Mock IntersectionObserver for framer-motion in jsdom test environment
class MockIntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
});

// Mock framer-motion to avoid animation-related duplicate renders in jsdom
// tests which can cause queries to find multiple matching nodes.
try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { vi } = require('vitest');
    vi.mock('framer-motion', () => {
        // Use simple passthroughs for common motion primitives
        const React = require('react');

        const make = (tag) =>
            React.forwardRef(({ children, ...props }, ref) =>
                React.createElement(tag, { ref, ...props }, children),
            );

        return {
            motion: {
                div: make('div'),
                button: make('button'),
                img: make('img'),
                span: make('span'),
                form: make('form'),
                ul: make('ul'),
                li: make('li'),
            },
            AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
                children,
        };
    });
    /* eslint-enable @typescript-eslint/no-require-imports */
} catch {
    // ignore if mocking is not available in this environment
}

// Proxy relative API requests to local PHP dev server during tests.
// This keeps production code unchanged (no fallback) while allowing
// unit tests to exercise real DB-backed endpoints after seeding.
const originalFetch = globalThis.fetch;

// Minimal in-memory fixtures used when a local backend is not available.
const fixtures: Record<string, unknown> = {
    '/api/destinations': [
        {
            slug: 'santorini',
            name: { en: 'Santorini', fr: 'Santorin', ar: 'سانتوريني' },
            country: { en: 'Greece', fr: 'Grèce', ar: 'اليونان' },
            image: '/images/destination-santorini.jpg',
            gallery: ['/images/destination-santorini.jpg'],
            rating: 4.9,
            price: 1299,
            categoryKey: 'beach',
            category: { en: 'Beach', fr: 'Plage', ar: 'شاطئ' },
            description: {
                en: 'Ionian escape',
                fr: 'Ionian escape',
                ar: 'Ionian escape',
            },
        },
    ],
    '/api/destinations/santorini': {
        slug: 'santorini',
        name: { en: 'Santorini', fr: 'Santorin', ar: 'سانتوريني' },
        country: { en: 'Greece', fr: 'Grèce', ar: 'اليونان' },
        image: '/images/destination-santorini.jpg',
        gallery: ['/images/destination-santorini.jpg'],
        rating: 4.9,
        price: 1299,
        categoryKey: 'beach',
        category: { en: 'Beach', fr: 'Plage', ar: 'شاطئ' },
        description: {
            en: 'Ionian escape',
            fr: 'Ionian escape',
            ar: 'Ionian escape',
        },
        about: { en: 'About', fr: 'About', ar: 'About' },
        highlights: [{ en: 'One' }, { en: 'Two' }],
        bestTime: { en: 'Spring' },
    },
    '/api/destinations/nameless': {
        slug: 'nameless',
        name: { en: 'Nameless Coast', fr: 'Côte sans nom', ar: 'ساحل بلا اسم' },
        country: { en: 'Nowhere', fr: 'Nulle part', ar: 'لا مكان' },
        image: '/images/destination-santorini.jpg',
        gallery: ['/images/destination-santorini.jpg'],
        rating: 4.2,
        price: 799,
        categoryKey: 'coastal',
        description: {
            en: 'A destination without optional metadata in the payload.',
            fr: 'Une destination sans métadonnées optionnelles dans la réponse.',
            ar: 'وجهة بدون بيانات اختيارية في الحمولة.',
        },
    },
    '/api/cars': [
        {
            slug: 'mercedes-e-class',
            name: { en: 'Mercedes E-Class', fr: 'Mercedes', ar: 'مرسيدس' },
            category: { en: 'Luxury', fr: 'Luxe', ar: 'فاخرة' },
            fuel: { en: 'Petrol', fr: 'Essence', ar: 'بنزين' },
            transmission: {
                en: 'Automatic',
                fr: 'Automatique',
                ar: 'أوتوماتيكي',
            },
            seats: 5,
            price: 120,
            image: '/images/mercedes.jpg',
            features: [
                {
                    name: {
                        en: 'Leather seats',
                        fr: 'Leather seats',
                        ar: 'Leather seats',
                    },
                },
            ],
            policy: [{ name: { en: 'Age 25+', fr: 'Age 25+', ar: 'Age 25+' } }],
        },
        {
            slug: 'tesla-model-3',
            name: {
                en: 'Tesla Model 3',
                fr: 'Tesla Model 3',
                ar: 'تسلا موديل 3',
            },
            category: { en: 'Electric', fr: 'Électrique', ar: 'كهربائية' },
            fuel: { en: 'Electric', fr: 'Électrique', ar: 'كهربائية' },
            transmission: {
                en: 'Automatic',
                fr: 'Automatique',
                ar: 'أوتوماتيكي',
            },
            seats: 5,
            price: 95,
            image: '/images/tesla.jpg',
            features: [
                { name: { en: 'Autopilot', fr: 'Autopilot', ar: 'Autopilot' } },
            ],
            policy: [{ name: { en: 'Age 25+', fr: 'Age 25+', ar: 'Age 25+' } }],
        },
    ],
    '/api/flights': [
        {
            id: 'emirates-nyc-dxb',
            airline: { en: 'Emirates', fr: 'Emirates', ar: 'طيران الإمارات' },
            from: 'NYC',
            to: { en: 'Dubai', fr: 'Dubaï', ar: 'دبي' },
            departure: '09:45',
            arrival: '21:30',
            duration: { en: '12h', fr: '12h', ar: '12س' },
            stops: { en: 'Direct', fr: 'Direct', ar: 'مباشر' },
            price: 899,
            details: {
                date: '2026-05-20',
                seats: 12,
                cabin: { en: 'Economy', fr: 'Économique', ar: 'اقتصادي' },
                aircraft: { en: 'A380', fr: 'A380', ar: 'A380' },
                baggage: {
                    en: '1 checked bag',
                    fr: '1 bagage enregistré',
                    ar: 'حقيبة واحدة',
                },
                refund: {
                    en: 'Non-refundable',
                    fr: 'Non remboursable',
                    ar: 'غير قابل للاسترداد',
                },
            },
        },
        {
            id: 'air-france-paris',
            airline: {
                en: 'Air France',
                fr: 'Air France',
                ar: 'الخطوط الفرنسية',
            },
            from: 'LHR',
            to: { en: 'Paris', fr: 'Paris', ar: 'باريس' },
            departure: '08:10',
            arrival: '10:25',
            duration: { en: '1h 15m', fr: '1h 15m', ar: '1س 15د' },
            stops: { en: 'Direct', fr: 'Direct', ar: 'مباشر' },
            price: 189,
            details: {
                date: '2026-05-20',
                seats: 24,
                cabin: { en: 'Economy', fr: 'Économique', ar: 'اقتصادي' },
            },
        },
    ],
    '/api/flights/emirates-nyc-dxb': {
        id: 'emirates-nyc-dxb',
        airline: { en: 'Emirates', fr: 'Emirates', ar: 'طيران الإمارات' },
        from: 'NYC',
        to: { en: 'Dubai', fr: 'Dubaï', ar: 'دبي' },
        departure: '09:45',
        arrival: '21:30',
        duration: { en: '12h', fr: '12h', ar: '12س' },
        stops: { en: 'Direct', fr: 'Direct', ar: 'مباشر' },
        price: 899,
        cabin: { en: 'Economy', fr: 'Économique', ar: 'اقتصادي' },
        aircraft: { en: 'Boeing 777-300ER' },
        baggage: { en: '1 checked bag + 1 carry-on' },
        refund: { en: 'Refundable with fee' },
    },
    '/api/promos': [
        {
            code: 'SPRING30',
            title: { en: 'Spring Promo' },
            description: { en: '20% off' },
            discount: { en: '20% OFF' },
            terms: [{ en: 'T&Cs apply' }],
        },
        {
            code: 'GROUP10',
            title: { en: 'Group Discount' },
            description: { en: '10% off for groups' },
            discount: { en: '10% OFF' },
            terms: [{ en: 'T&Cs apply' }],
        },
    ],
    '/api/promos/SPRING30': {
        code: 'SPRING30',
        title: { en: 'Spring Promo' },
        description: { en: '20% off' },
        discount: { en: '20% OFF' },
        terms: [{ en: 'T&Cs apply' }],
    },
    '/api/promos/GROUP10': {
        code: 'GROUP10',
        title: { en: 'Group Discount' },
        description: { en: '10% off for groups' },
        discount: { en: '10% OFF' },
        terms: [{ en: 'T&Cs apply' }],
    },
    '/api/blog-posts': [
        {
            slug: 'budget-travel-europe',
            title: { en: 'Budget Travel in Europe' },
            excerpt: { en: 'Save money while exploring Europe' },
            date: 'May 2026',
            category: { en: 'Tips' },
            image: '/images/destination-santorini.jpg',
        },
    ],
    '/api/deals': [
        {
            slug: 'early-bird-summer-2026',
            title: { en: 'Early Bird Summer 2026' },
            description: { en: 'Save now' },
            discount: { en: '35% OFF' },
            category: { en: 'Seasonal' },
        },
    ],
    '/api/events': [
        {
            slug: 'cherry-blossom-festival',
            title: {
                en: 'Cherry Blossom Festival',
                fr: 'Festival des cerisiers',
            },
            price: 2490,
            date: '2026-04-01',
            location: { en: 'Kyoto', fr: 'Kyoto' },
            image: '/images/event-cherry.jpg',
        },
    ],
    '/api/events/cherry-blossom-festival': {
        slug: 'cherry-blossom-festival',
        title: { en: 'Cherry Blossom Festival', fr: 'Festival des cerisiers' },
        price: 2490,
        date: '2026-04-01',
        location: { en: 'Kyoto', fr: 'Kyoto' },
        description: {
            en: 'A three-day spring celebration with guided hanami walks and cultural performances.',
            fr: 'Une célébration printanière de trois jours avec des promenades hanami guidées et des spectacles culturels.',
        },
        schedule: [{ time: '09:00', activity: { en: 'Parade' } }],
        image: '/images/event-cherry.jpg',
    },
    '/api/categories': [
        {
            id: 1,
            key: 'beach',
            name: { en: 'Beach', fr: 'Plage' },
            entity_type: 'destinations',
        },
        {
            id: 2,
            key: 'city',
            name: { en: 'City', fr: 'Ville' },
            entity_type: 'destinations',
        },
        {
            id: 3,
            key: 'luxury',
            name: { en: 'Luxury', fr: 'Luxe' },
            entity_type: 'hotels',
        },
    ],
    '/api/cars/mercedes-e-class': {
        slug: 'mercedes-e-class',
        name: { en: 'Mercedes E-Class', fr: 'Mercedes' },
        category: { en: 'Luxury', fr: 'Luxe' },
        seats: 5,
        price: 120,
        image: '/images/mercedes.jpg',
    },
    '/api/site-settings': {
        phone: '+1234567890',
        phone2: '+0987654321',
        whatsapp: '+1234567890',
        companyName: 'BelAzurTravel',
        content: { nav: { settings: { header: [] } } },
    },
};

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
        const rawUrl =
            typeof input === 'string'
                ? input
                : input instanceof URL
                  ? input.toString()
                  : input.url;

        const parsedUrl = new URL(rawUrl, 'http://localhost');
        const clean = parsedUrl.pathname;

        if (clean.startsWith('/api/')) {
            if (fixtures[clean]) {
                return Promise.resolve(
                    new Response(JSON.stringify(fixtures[clean]), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }),
                );
            }

            // fallback to local backend if running
            const proxied = `http://127.0.0.1:8000${parsedUrl.pathname}${parsedUrl.search}`;
            return originalFetch.call(globalThis, proxied, init);
        }
    } catch {
        // fall through to original fetch
    }

    return originalFetch.call(globalThis, input, init);
};
