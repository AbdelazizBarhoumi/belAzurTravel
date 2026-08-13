import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Hotels from '@/pages/hotels';

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
    useHotelSearch: () => ({
        data: [],
        isLoading: false,
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
});
