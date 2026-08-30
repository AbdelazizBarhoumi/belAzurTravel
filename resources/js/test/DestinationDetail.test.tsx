import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import DestinationDetail from '@/pages/destinations/show';
import type { DestinationItem, HotelItem, TourItem } from '@/types/public';

const mockUseDestinationBySlug = vi.fn();
const mockUseHotels = vi.fn();
const mockUseTours = vi.fn();

vi.mock('@/hooks/usePublicData', () => ({
    useDestinationBySlug: (...args: unknown[]) =>
        mockUseDestinationBySlug(...args),
    useHotels: (...args: unknown[]) => mockUseHotels(...args),
    useTours: (...args: unknown[]) => mockUseTours(...args),
}));

function makeDestination(
    overrides: Partial<DestinationItem> = {},
): DestinationItem {
    return {
        id: 1,
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
        highlights: [
            {
                en: 'White cliffs',
                fr: 'Falaises blanches',
                ar: 'المنحدرات البيضاء',
            },
        ],
        ...overrides,
    };
}

function makeHotel(overrides: Partial<HotelItem> = {}): HotelItem {
    return {
        slug: 'hotel-santorini',
        id: 'hotel-santorini',
        destinationSlug: 'santorini',
        name: {
            en: 'Santorini Bay Hotel',
            fr: 'Santorini Bay Hotel',
            ar: 'فندق سانتوريني باي',
        },
        location: { en: 'Santorini', fr: 'Santorin', ar: 'سانتوريني' },
        price: 320,
        base_price: null,
        rating: 4.6,
        stars: 4,
        reviews: 123,
        image: '/images/hotel.jpg',
        tags: ['beach'],
        amenities: [
            { name: { en: 'WiFi', fr: 'Wi-Fi', ar: 'واي فاي' }, icon: 'wifi' },
        ],
        ...overrides,
    };
}

function makeTour(overrides: Partial<TourItem> = {}): TourItem {
    return {
        slug: 'tour-santorini',
        name: {
            en: 'Santorini Sunset Tour',
            fr: 'Tour au coucher du soleil',
            ar: 'جولة الغروب',
        },
        location: { en: 'Santorini', fr: 'Santorin', ar: 'سانتوريني' },
        duration: { en: 'Half-day', fr: 'Demi-journée', ar: 'نصف يوم' },
        maxGroup: 12,
        price: 89,
        rating: 4.8,
        category_key: 'beach',
        image: '/images/tour.jpg',
        description: { en: 'Desc', fr: 'Desc', ar: 'Desc' },
        ...overrides,
    };
}

function renderDestinationDetail(path = '/destinations/santorini') {
    return render(
        <QueryClientProvider client={new QueryClient()}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter initialEntries={[path]}>
                        <Routes>
                            <Route
                                path="/destinations/:slug"
                                element={<DestinationDetail />}
                            />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('DestinationDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        mockUseDestinationBySlug.mockReturnValue({
            data: makeDestination(),
            isLoading: false,
        });
        mockUseHotels.mockReturnValue({ data: [makeHotel()] });
        mockUseTours.mockReturnValue({ data: [makeTour()] });
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('renders destination details, highlights and related content', async () => {
        renderDestinationDetail();

        const headings = await screen.findAllByRole('heading', {
            name: /Santorini/i,
        });
        expect(headings.length).toBeGreaterThan(0);
        expect(await screen.findByText(/Highlights/i)).toBeInTheDocument();
        expect(await screen.findByText(/Where to stay/i)).toBeInTheDocument();
        expect(await screen.findByText(/Suggested tours/i)).toBeInTheDocument();
    });

    it('shows a fallback message for unknown destinations', async () => {
        mockUseDestinationBySlug.mockReturnValue({
            data: null,
            isLoading: false,
        });

        renderDestinationDetail('/destinations/unknown');

        expect(
            await screen.findByText(/Destination not found/i),
        ).toBeInTheDocument();
        expect(
            await screen.findByRole('link', { name: /Back to destinations/i }),
        ).toBeInTheDocument();
    });

    it('renders even when optional metadata is missing', async () => {
        mockUseDestinationBySlug.mockReturnValue({
            data: makeDestination({
                slug: 'nameless',
                name: {
                    en: 'Nameless Coast',
                    fr: 'Côte sans nom',
                    ar: 'ساحل بلا اسم',
                },
                country: { en: 'Nowhere', fr: 'Nulle part', ar: 'لا مكان' },
                category: undefined,
                bestTime: undefined,
                language: undefined,
                currency: undefined,
                weather: undefined,
                about: undefined,
                highlights: undefined,
            }),
            isLoading: false,
        });

        renderDestinationDetail('/destinations/nameless');

        expect(
            (
                await screen.findAllByRole('heading', {
                    name: /Nameless Coast/i,
                })
            ).length,
        ).toBeGreaterThan(0);
        expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
    });
});
