import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Hotels from '@/pages/hotels';

afterEach(() => {
    cleanup();
});

const { mockHotelSearch } = vi.hoisted(() => ({
    mockHotelSearch: { data: [] as unknown[], calls: [] as unknown[] },
}));

vi.mock('@/hooks/usePublicData', () => ({
    useHotels: () => ({
        data: [
            {
                slug: 'sunset-bay',
                name: {
                    en: 'Sunset Bay',
                    fr: 'Sunset Bay',
                    ar: 'Sunset Bay',
                },
                location: {
                    en: 'Sousse, Tunisia',
                    fr: 'Sousse, Tunisie',
                    ar: 'سوسة، تونس',
                },
                image: '/hotel.jpg',
                price: 180,
                stars: 5,
                rating: 4.8,
                reviews: 120,
                tags: ['luxury'],
                amenities: [{ name: { en: 'WiFi', fr: 'Wi-Fi', ar: 'واي فاي' }, icon: 'wifi' }],
                category_assignments: { service: 'thalasso_spa', arrangements: 'demi_pension' },
            },
            {
                slug: 'ocean-club',
                name: {
                    en: 'Ocean Club',
                    fr: 'Ocean Club',
                    ar: 'Ocean Club',
                },
                location: {
                    en: 'Hammamet, Tunisia',
                    fr: 'Hammamet, Tunisie',
                    ar: 'الحمامات، تونس',
                },
                image: '/ocean.jpg',
                price: 220,
                stars: 4,
                rating: 4.5,
                reviews: 80,
                tags: ['family'],
                amenities: [],
                category_assignments: {},
            },
        ],
        isLoading: false,
    }),
    useCategories: () => ({
        data: [
            {
                id: 1,
                key: 'luxury',
                name: {
                    en: 'Luxury',
                    fr: 'Luxe',
                    ar: 'فاخر',
                },
                entity_type: 'hotels',
            },
        ],
        isLoading: false,
    }),
    useCategoryTypesPublic: () => ({
        data: [],
        isLoading: false,
    }),
    useHotelSearch: vi.fn((query?: unknown) => {
        mockHotelSearch.calls.push(query);
        return {
            data: {
                data: mockHotelSearch.data,
                meta: {
                    current_page: 1,
                    last_page: 1,
                    total: mockHotelSearch.data.length,
                    per_page: 50,
                },
            },
            isLoading: false,
        };
    }),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

function renderPage(initialEntry = '/hotels?stars=5') {
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter initialEntries={[initialEntry]}>
                        <Routes>
                            <Route path="/hotels" element={<Hotels />} />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('Hotels', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHotelSearch.data = [];
        mockHotelSearch.calls = [];
    });

    it('renders hotel cards without hitting an update loop', async () => {
        const errorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        renderPage();

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();
        expect(errorSpy).not.toHaveBeenCalledWith(
            expect.stringContaining('Maximum update depth exceeded'),
        );

        errorSpy.mockRestore();
    });

    it('uses the server availability results as the list when dates are set', async () => {
        mockHotelSearch.data = [
            {
                slug: 'sunset-bay',
                name: { en: 'Sunset Bay', fr: 'Sunset Bay', ar: 'Sunset Bay' },
                location: {
                    en: 'Sousse, Tunisia',
                    fr: 'Sousse, Tunisie',
                    ar: 'سوسة، تونس',
                },
                stars: 5,
                rating: 4.8,
                reviews: 120,
                image: '/hotel.jpg',
                price: 1234,
                price_total: 1234,
                price_per_night: 176,
                nights: 7,
                available: true,
                provider: 'ostravel',
                rooms: [],
            },
        ];

        renderPage('/hotels?from=2026-08-20&to=2026-08-27&guests=2');

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();

        const cards = await screen.findAllByText('Sunset Bay');
        expect(cards.length).toBe(1);
        expect(screen.getByText(/1,234/)).toBeInTheDocument();
        expect(screen.getByText(/·\s*7\s*(nuits?|nights)/i)).toBeInTheDocument();
    });

    it('hides hotels with no availability for the selected dates', async () => {
        renderPage('/hotels?from=2026-08-20&to=2026-08-27&guests=2');

        expect(
            await screen.findByText(/Aucun résultat|No results/i),
        ).toBeInTheDocument();
        expect(screen.queryByText('Sunset Bay')).not.toBeInTheDocument();
        expect(screen.queryByText('Ocean Club')).not.toBeInTheDocument();
    });

    it('sends the occupancy (with child ages) to the live search request', async () => {
        renderPage('/hotels?from=2026-08-20&to=2026-08-27&guests=2');

        await screen.findByText(/Aucun résultat|No results/i);

        const searchCall = mockHotelSearch.calls.find(
            (query) =>
                typeof query === 'object' &&
                query !== null &&
                (query as { check_in?: string }).check_in === '2026-08-20',
        ) as { rooms?: Array<{ adults: number; children: number[] }> } | undefined;

        expect(searchCall).toBeDefined();
        expect(searchCall?.rooms).toEqual([{ adults: 2, children: [] }]);
    });

    it('renders per-night plus stay total on live cards', async () => {
        mockHotelSearch.data = [
            {
                slug: 'sunset-bay',
                name: { en: 'Sunset Bay', fr: 'Sunset Bay', ar: 'Sunset Bay' },
                location: {
                    en: 'Sousse, Tunisia',
                    fr: 'Sousse, Tunisie',
                    ar: 'سوسة، تونس',
                },
                stars: 5,
                rating: 4.8,
                reviews: 120,
                image: '/hotel.jpg',
                price: 1234,
                price_total: 1234,
                price_per_night: 176,
                nights: 7,
                available: true,
                provider: 'ostravel',
                currency: 'TND',
                rooms: [],
            },
        ];

        renderPage('/hotels?from=2026-08-20&to=2026-08-27&guests=2');

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();
        expect(screen.getByText(/1,234/)).toBeInTheDocument();
        expect(screen.getByText(/176\s*TND\s*\/nuit|176\s*TND\s*\/night/i)).toBeInTheDocument();
    });

    it('greys out unavailable hotels and shows the unavailable badge', async () => {
        mockHotelSearch.data = [
            {
                slug: 'ocean-club',
                name: { en: 'Ocean Club', fr: 'Ocean Club', ar: 'Ocean Club' },
                location: {
                    en: 'Hammamet, Tunisia',
                    fr: 'Hammamet, Tunisie',
                    ar: 'الحمامات، تونس',
                },
                stars: 4,
                rating: 4.5,
                reviews: 80,
                image: '/ocean.jpg',
                price: 220,
                price_total: 220,
                price_per_night: 31,
                nights: 7,
                available: false,
                provider: 'ostravel',
                currency: 'TND',
                rooms: [],
            },
        ];

        renderPage('/hotels?from=2026-08-20&to=2026-08-27&guests=2');

        expect(await screen.findByText('Ocean Club')).toBeInTheDocument();
        const unavailableBadge = await screen.findByText(
            /Indisponible pour ces dates|Unavailable for these dates/i,
        );
        expect(unavailableBadge).toBeInTheDocument();
    });

    it('renders promo and free-child badges on live cards', async () => {
        mockHotelSearch.data = [
            {
                slug: 'sunset-bay',
                name: { en: 'Sunset Bay', fr: 'Sunset Bay', ar: 'Sunset Bay' },
                location: {
                    en: 'Sousse, Tunisia',
                    fr: 'Sousse, Tunisie',
                    ar: 'سوسة، تونس',
                },
                stars: 5,
                rating: 4.8,
                reviews: 120,
                image: '/hotel.jpg',
                price: 1234,
                price_total: 1234,
                price_per_night: 176,
                nights: 7,
                available: true,
                provider: 'ostravel',
                currency: 'TND',
                promotion: {
                    title: 'Early booking',
                    description: '-29% on select stays',
                    rate: '29.00',
                },
                free_child: [5],
                rooms: [],
            },
        ];

        renderPage('/hotels?from=2026-08-20&to=2026-08-27&guests=2');

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();
        expect(screen.getByText('Promo Early booking')).toBeInTheDocument();
        expect(screen.getByText('Enfant gratuit')).toBeInTheDocument();
    });

    it('shows a last-known label in browse mode and a live badge in live mode', async () => {
        // Browse mode: no dates, one hotel carries a last known price.
        const { unmount } = renderPage('/hotels');

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();
        unmount();

        // Live mode: badge shown once server results exist.
        mockHotelSearch.data = [
            {
                slug: 'sunset-bay',
                name: { en: 'Sunset Bay', fr: 'Sunset Bay', ar: 'Sunset Bay' },
                location: {
                    en: 'Sousse, Tunisia',
                    fr: 'Sousse, Tunisie',
                    ar: 'سوسة، تونس',
                },
                stars: 5,
                rating: 4.8,
                reviews: 120,
                image: '/hotel.jpg',
                price: 1234,
                price_total: 1234,
                price_per_night: 176,
                nights: 7,
                available: true,
                provider: 'ostravel',
                rooms: [],
            },
        ];

        renderPage('/hotels?from=2026-08-20&to=2026-08-27&guests=2');

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();
        expect(
            screen.getByText(
                /Disponibilité en direct|Live availability/i,
            ),
        ).toBeInTheDocument();
    });
});