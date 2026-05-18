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
            description: { en: 'Ionian escape', fr: 'Ionian escape', ar: 'Ionian escape' },
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
        description: { en: 'Ionian escape', fr: 'Ionian escape', ar: 'Ionian escape' },
        about: { en: 'About', fr: 'About', ar: 'About' },
        highlights: [{ en: 'One' }, { en: 'Two' }],
        bestTime: { en: 'Spring' },
    },
    '/api/cars': [
        {
            slug: 'mercedes-e-class',
            name: { en: 'Mercedes E-Class', fr: 'Mercedes', ar: 'مرسيدس' },
            category: { en: 'Luxury', fr: 'Luxe', ar: 'فاخرة' },
            fuel: { en: 'Petrol', fr: 'Essence', ar: 'بنزين' },
            transmission: { en: 'Automatic', fr: 'Automatique', ar: 'أوتوماتيكي' },
            seats: 5,
            price: 120,
            image: '/images/mercedes.jpg',
            features: [{ en: 'Leather seats' }],
            policy: [{ en: 'Age 25+' }],
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
            cabin: { en: 'Economy', fr: 'Économique', ar: 'اقتصادي' },
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
    ],
    '/api/promos/SPRING30': {
        code: 'SPRING30',
        title: { en: 'Spring Promo' },
        description: { en: '20% off' },
        discount: { en: '20% OFF' },
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
};

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
        const url =
            typeof input === 'string'
                ? input
                : input instanceof URL
                  ? input.toString()
                  : input.url;

        if (typeof url === 'string' && url.startsWith('/api/')) {
            // strip origin/query params
            const clean = url.split('?')[0];

            if (fixtures[clean]) {
                return Promise.resolve(
                    new Response(JSON.stringify(fixtures[clean]), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }),
                );
            }

            // fallback to local backend if running
            const proxied = `http://127.0.0.1:8000${url}`;
            return originalFetch.call(globalThis, proxied, init);
        }
    } catch {
        // fall through to original fetch
    }

    return originalFetch.call(globalThis, input, init);
};
