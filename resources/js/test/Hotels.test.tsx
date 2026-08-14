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
    mockHotelSearch: { data: [] as unknown[] },
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
    useHotelSearch: vi.fn(() => ({
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
    })),
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
});
