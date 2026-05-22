import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import TourDetail from '@/pages/tours/show';

const mockUseTourDetailsBySlug = vi.fn((..._args: unknown[]) => ({
    data: undefined,
    isLoading: true,
}));

vi.mock('@/hooks/usePublicData', () => ({
    useTourDetailsBySlug: (...args: unknown[]) =>
        mockUseTourDetailsBySlug(...args),
}));

function renderTourDetail(path = '/tours/greek-island-hopping') {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter initialEntries={[path]}>
                        <Routes>
                            <Route
                                path="/tours"
                                element={<div>Tours index page</div>}
                            />
                            <Route
                                path="/tours/:slug"
                                element={<TourDetail />}
                            />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('TourDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        mockUseTourDetailsBySlug.mockReturnValue({
            data: undefined,
            isLoading: true,
        });
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('does not redirect to the tours index while loading', () => {
        renderTourDetail();

        expect(screen.queryByText(/Tours index page/i)).not.toBeInTheDocument();
    });

    it('renders hero main image first when API provides images', () => {
        mockUseTourDetailsBySlug.mockReturnValue({
            isLoading: false,
            data: {
                slug: 'greek-island-hopping',
                name: { en: 'Greek Island Hopping', fr: '', ar: '' },
                description: { en: 'Explore Greece', fr: '', ar: '' },
                location: [{ en: 'Greece', fr: '', ar: '' }],
                type: { en: 'Adventure', fr: '', ar: '' },
                durationDays: 7,
                durationNights: 6,
                maxGroup: 12,
                rating: 4.8,
                price: 1999,
                image: '/storage/uploads/tours/main.jpg',
                images: [
                    '/storage/uploads/tours/gallery-1.jpg',
                    '/storage/uploads/tours/gallery-2.jpg',
                ],
                itinerary: [],
                inclusions: [],
                excludes: [],
            },
        });

        const { container } = renderTourDetail();

        const heroImage = container.querySelector(
            'img[src="/storage/uploads/tours/main.jpg"]',
        );

        expect(heroImage).not.toBeNull();
    });
});
