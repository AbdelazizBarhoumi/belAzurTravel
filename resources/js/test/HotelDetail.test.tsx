import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import HotelDetail from '@/pages/hotels/show';

afterEach(() => {
    cleanup();
});

const { mockHotelSearch, mockBookingDialogProps, mockDateRangePickerProps } =
    vi.hoisted(() => ({
        mockHotelSearch: {
            data: [] as unknown[],
            calls: [] as unknown[],
        },
        mockBookingDialogProps: { open: false, provider: undefined as unknown },
        mockDateRangePickerProps: {} as Record<string, unknown>,
    }));

vi.mock('@/hooks/usePublicData', () => ({
    useHotelById: (id?: string) => ({
        data: id
            ? {
                  id,
                  name: {
                      en: 'Sunset Paradise Resort',
                      fr: 'Sunset Paradise Resort',
                      ar: 'Sunset Paradise Resort',
                  },
                  city: { en: 'Santorini', fr: 'Santorin', ar: 'سانتوريني' },
                  country: { en: 'Greece', fr: 'Grèce', ar: 'اليونان' },
                  location: {
                      en: 'Santorini, Greece',
                      fr: 'Santorin, Grèce',
                      ar: 'سانتوريني، اليونان',
                  },
                  category_key: 'beach',
                  category: {
                      en: 'Beach Resort',
                      fr: 'Beach Resort',
                      ar: 'Beach Resort',
                  },
                  description: {
                      en: 'Luxury resort',
                      fr: 'Luxury resort',
                      ar: 'Luxury resort',
                  },
                  image: '/main-hotel.jpg',
                  gallery: ['/img1.jpg', '/main-hotel.jpg'],
                  stars: 5,
                  rating: 4.9,
                  reviews: 234,
                  whatsapp: '1234567890',
                  check_in_time: '14h',
                  check_out_time: '12h',
                  address: '123 Beach Road',
                  phone: '+216 71 000 000',
                  email: 'reservations@sunset.example',
                  options: [
                      { id: 1, title: 'Baby bed' },
                      { id: 2, title: 'Airport transfer' },
                  ],
                  boardings: [
                      {
                          id: 4,
                          code: 'DP',
                          name: 'Demi-pension',
                          description: 'Bed & half board',
                      },
                  ],
                  note: 'Séjour avec taxe de séjour à régler sur place.',
                  amenities: [{ en: 'Wi-Fi', fr: 'Wi-Fi', ar: 'Wi-Fi' }],
                  first_available_at: '2026-09-01',
                  stop_sale_ranges: [
                      { from: '2026-09-03', to: '2026-09-08' },
                  ],
                  rooms: [
                      {
                          id: 'room-1',
                          name: {
                              en: 'Deluxe Ocean View',
                              fr: 'Deluxe Ocean View',
                              ar: 'Deluxe Ocean View',
                          },
                          description: {
                              en: 'Room desc',
                              fr: 'Room desc',
                              ar: 'Room desc',
                          },
                          pricePerNight: 320,
                          capacity: 2,
                          size: 45,
                          features: null,
                          images: null,
                      },
                  ],
              }
            : null,
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

vi.mock('@/components/ui/DateRangePicker', () => ({
    DateRangePicker: (props: Record<string, unknown>) => {
        Object.assign(mockDateRangePickerProps, props);
        return (
            <button
                type="button"
                data-testid="set-dates"
                onClick={() =>
                    (
                        props.onChange as (value: unknown) => void
                    )({
                        from: new Date('2026-09-01T12:00:00'),
                        to: new Date('2026-09-05T12:00:00'),
                    })
                }
            >
                set-dates
            </button>
        );
    },
}));

vi.mock('@/components/forms/BookingDialog', () => ({
    BookingDialog: (props: { open?: boolean; provider?: unknown }) => {
        mockBookingDialogProps.open = Boolean(props.open);
        mockBookingDialogProps.provider = props.provider;
        return <div data-testid="booking-dialog" />;
    },
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

function renderPage(initialEntry: string) {
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter initialEntries={[initialEntry]}>
                        <Routes>
                            <Route
                                path="/hotels/:id"
                                element={<HotelDetail />}
                            />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('HotelDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHotelSearch.data = [];
        mockHotelSearch.calls = [];
        mockBookingDialogProps.open = false;
        mockBookingDialogProps.provider = undefined;
        Object.keys(mockDateRangePickerProps).forEach(
            (key) => delete mockDateRangePickerProps[key],
        );
    });

    it('renders hotel data from the API hook', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        expect(screen.getAllByText('Luxury resort').length).toBeGreaterThan(0);
        expect(
            screen.getAllByText('Sunset Paradise Resort').length,
        ).toBeGreaterThan(0);
        expect(screen.getByText('Chambres disponibles')).toBeInTheDocument();
        expect(
            screen.getByAltText('Sunset Paradise Resort main image'),
        ).toHaveAttribute('src', '/main-hotel.jpg');
    });

    it('renders the practical info, boardings, options and note sections', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        expect(screen.getByText(/Arrivée: 14h/)).toBeInTheDocument();
        expect(screen.getByText(/Départ: 12h/)).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.getByText('123 Beach Road')).toBeInTheDocument();
        expect(screen.getByText(/\+216 71 000 000/)).toBeInTheDocument();
        expect(
            screen.getByText(/reservations@sunset.example/),
        ).toBeInTheDocument();
        expect(screen.getByText('Demi-pension')).toBeInTheDocument();
        expect(screen.getByText('Bed & half board')).toBeInTheDocument();
        expect(screen.getByText('Baby bed')).toBeInTheDocument();
        expect(screen.getByText('Airport transfer')).toBeInTheDocument();
        expect(screen.getByText(/taxe de séjour/)).toBeInTheDocument();
    });

    it('does not crash when a room has null features', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        expect(
            screen.getAllByText('Deluxe Ocean View').length,
        ).toBeGreaterThan(0);
        expect(screen.queryByText('Wi-Fi')).not.toBeInTheDocument();
    });

    it('re-searches live availability when dates are set and shows stay total, per-night and supplements', async () => {
        mockHotelSearch.data = [
            {
                slug: 'sunset-paradise-resort',
                name: {
                    en: 'Sunset Paradise Resort',
                    fr: 'Sunset Paradise Resort',
                    ar: 'Sunset Paradise Resort',
                },
                location: {
                    en: 'Santorini, Greece',
                    fr: 'Santorin, Grèce',
                    ar: 'سانتوريني، اليونان',
                },
                stars: 5,
                rating: 4.9,
                reviews: 234,
                image: '/main-hotel.jpg',
                price: 1500,
                price_total: 1500,
                price_per_night: 375,
                base_price: 1300,
                markup_percentage: '15.38',
                currency: 'TND',
                nights: 4,
                available: true,
                provider: 'ostravel',
                rooms: [
                    {
                        id: '9001',
                        name: 'Deluxe Ocean View',
                        boarding: null,
                        boarding_name: 'All inclusive',
                        boarding_id: 2,
                        view: 'Sea view',
                        view_ids: [7],
                        price: 1500,
                        price_total: 1500,
                        price_per_night: 375,
                        base_price: 1300,
                        currency: 'TND',
                        nights: 4,
                        token: 'live-token-1',
                        source: 'OS-TRAVEL-DIRECT',
                        stop_reservation: false,
                        cancellation_policy: [],
                        supplements: [
                            { Name: 'Insurance', Price: 40, Mandatory: true },
                        ],
                    },
                ],
            },
        ];

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres disponibles');

        fireEvent.click(screen.getByTestId('set-dates'));

        expect(
            (await screen.findAllByText('Prix en direct')).length,
        ).toBeGreaterThan(0);

        const searchCall = mockHotelSearch.calls.find(
            (query) =>
                typeof query === 'object' &&
                query !== null &&
                (query as { check_in?: string }).check_in === '2026-09-01',
        ) as
            | {
                  hotel_slugs?: string[];
                  rooms?: Array<{ adults: number; children: number[] }>;
                  only_available?: boolean;
              }
            | undefined;

        expect(searchCall).toBeDefined();
        expect(searchCall?.hotel_slugs).toEqual(['sunset-paradise-resort']);
        expect(searchCall?.rooms).toEqual([{ adults: 2, children: [] }]);
        expect(searchCall?.only_available).toBe(true);

        const hasTotal = (text: string) =>
            text.replace(/[\s\u00A0,.]/g, '').includes('1500');
        const hasPerNight = (text: string) =>
            /375\s*TND\s*\/nuit/.test(text);

        expect(
            screen.getAllByText(hasTotal).length,
        ).toBeGreaterThan(0);
        expect(screen.getAllByText(hasPerNight).length).toBeGreaterThan(0);
        expect(screen.getByText('Insurance')).toBeInTheDocument();
        expect(screen.getByText(/\+40\s*TND/)).toBeInTheDocument();
    });

    it('shows the unavailable notice when the searched dates have no availability', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres disponibles');

        fireEvent.click(screen.getByTestId('set-dates'));

        expect(
            await screen.findByText(
                /aucune disponibilité pour les dates sélectionnées/i,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Sélectionner').closest('button'),
        ).toBeDisabled();
    });

    it('opens the booking dialog with the provider offer context from the live search', async () => {
        mockHotelSearch.data = [
            {
                slug: 'sunset-paradise-resort',
                name: {
                    en: 'Sunset Paradise Resort',
                    fr: 'Sunset Paradise Resort',
                    ar: 'Sunset Paradise Resort',
                },
                location: {
                    en: 'Santorini, Greece',
                    fr: 'Santorin, Grèce',
                    ar: 'سانتوريني، اليونان',
                },
                stars: 5,
                rating: 4.9,
                reviews: 234,
                image: '/main-hotel.jpg',
                price: 1500,
                price_total: 1500,
                price_per_night: 375,
                base_price: 1300,
                markup_percentage: '15.38',
                currency: 'TND',
                nights: 4,
                available: true,
                provider: 'ostravel',
                rooms: [
                    {
                        id: '9001',
                        name: 'Deluxe Ocean View',
                        boarding: null,
                        boarding_name: 'All inclusive',
                        boarding_id: 2,
                        view: 'Sea view',
                        view_ids: [7],
                        price: 1500,
                        price_total: 1500,
                        price_per_night: 375,
                        base_price: 1300,
                        currency: 'TND',
                        nights: 4,
                        token: 'live-token-1',
                        source: 'OS-TRAVEL-DIRECT',
                        stop_reservation: false,
                        cancellation_policy: [],
                        supplements: [
                            { Name: 'Insurance', Price: 40, Mandatory: true },
                        ],
                    },
                ],
            },
        ];

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres disponibles');

        fireEvent.click(screen.getByTestId('set-dates'));
        expect(
            (await screen.findAllByText('Prix en direct')).length,
        ).toBeGreaterThan(0);

        fireEvent.click(screen.getByText('Sélectionner'));

        expect(mockBookingDialogProps.open).toBe(true);
        const provider = mockBookingDialogProps.provider as {
            token?: string | null;
            source?: string | null;
            checkIn?: string;
            checkOut?: string;
            rooms?: Array<{
                id?: string;
                boardingId?: number;
                viewIds?: number[];
                supplements?: unknown[];
            }>;
            adults?: number;
            children?: number;
        };
        expect(provider.token).toBe('live-token-1');
        expect(provider.source).toBe('OS-TRAVEL-DIRECT');
        expect(provider.checkIn).toBe('2026-09-01');
        expect(provider.checkOut).toBe('2026-09-05');
        expect(provider.rooms?.[0]).toEqual({
            id: '9001',
            boardingId: 2,
            viewIds: [7],
            supplements: [{ name: 'Insurance', price: 40, perNight: true }],
        });
    });

    it('groups live rooms by boarding and defaults to the cheapest boarding tab', async () => {
        mockHotelSearch.data = [
            {
                slug: 'sunset-paradise-resort',
                name: {
                    en: 'Sunset Paradise Resort',
                    fr: 'Sunset Paradise Resort',
                    ar: 'Sunset Paradise Resort',
                },
                location: {
                    en: 'Santorini, Greece',
                    fr: 'Santorin, Grèce',
                    ar: 'سانتوريني، اليونان',
                },
                stars: 5,
                rating: 4.9,
                reviews: 234,
                image: '/main-hotel.jpg',
                price: 1500,
                price_total: 1500,
                price_per_night: 375,
                base_price: 1300,
                markup_percentage: '15.38',
                currency: 'TND',
                nights: 4,
                available: true,
                provider: 'ostravel',
                rooms: [
                    {
                        id: '9001',
                        name: 'Standard Double',
                        boarding: null,
                        boarding_name: 'All inclusive',
                        boarding_id: 1,
                        view: 'Sea view',
                        view_ids: [7],
                        price: 1500,
                        price_total: 1500,
                        price_per_night: 375,
                        base_price: 1300,
                        currency: 'TND',
                        nights: 4,
                        token: 'live-token-1',
                        source: 'OS-TRAVEL-DIRECT',
                        stop_reservation: false,
                        cancellation_policy: [],
                        supplements: [],
                    },
                    {
                        id: '9002',
                        name: 'Junior Suite',
                        boarding: null,
                        boarding_name: 'Demi-pension',
                        boarding_id: 2,
                        view: 'Garden view',
                        view_ids: [3],
                        price: 900,
                        price_total: 900,
                        price_per_night: 225,
                        base_price: 780,
                        currency: 'TND',
                        nights: 4,
                        token: 'live-token-2',
                        source: 'OS-TRAVEL-DIRECT',
                        stop_reservation: false,
                        cancellation_policy: [],
                        supplements: [],
                    },
                ],
            },
        ];

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres disponibles');

        fireEvent.click(screen.getByTestId('set-dates'));
        await screen.findByRole('button', { name: 'Demi-pension' });

        // Default tab is the cheapest boarding (Demi-pension at 900 < 1500).
        expect(screen.getByText('Junior Suite')).toBeInTheDocument();
        expect(screen.queryByText('Standard Double')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'All inclusive' }));

        expect(screen.getByText('Standard Double')).toBeInTheDocument();
        expect(screen.queryByText('Junior Suite')).not.toBeInTheDocument();
    });

    it('renders promo, free-child and recommended badges from the live result', async () => {
        mockHotelSearch.data = [
            {
                slug: 'sunset-paradise-resort',
                name: {
                    en: 'Sunset Paradise Resort',
                    fr: 'Sunset Paradise Resort',
                    ar: 'Sunset Paradise Resort',
                },
                location: {
                    en: 'Santorini, Greece',
                    fr: 'Santorin, Grèce',
                    ar: 'سانتوريني، اليونان',
                },
                stars: 5,
                rating: 4.9,
                reviews: 234,
                image: '/main-hotel.jpg',
                price: 1500,
                price_total: 1500,
                price_per_night: 375,
                base_price: 1300,
                markup_percentage: '15.38',
                currency: 'TND',
                nights: 4,
                available: true,
                provider: 'ostravel',
                promotion: {
                    title: 'Early booking',
                    description: '-29% on select stays',
                    rate: '29.00',
                },
                free_child: [5],
                recommended: true,
                rooms: [
                    {
                        id: '9001',
                        name: 'Deluxe Ocean View',
                        boarding: null,
                        boarding_name: 'All inclusive',
                        boarding_id: 2,
                        view: 'Sea view',
                        view_ids: [7],
                        price: 1500,
                        price_total: 1500,
                        price_per_night: 375,
                        base_price: 1300,
                        currency: 'TND',
                        nights: 4,
                        token: 'live-token-1',
                        source: 'OS-TRAVEL-DIRECT',
                        stop_reservation: false,
                        cancellation_policy: [],
                        supplements: [],
                    },
                ],
            },
        ];

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres disponibles');

        fireEvent.click(screen.getByTestId('set-dates'));
        await screen.findByText('Promo Early booking');

        expect(screen.getByText('Enfant gratuit')).toBeInTheDocument();
        expect(screen.getByText('Recommandé')).toBeInTheDocument();
    });

    it('renders non-refundable and free-cancellation badges on live rooms', async () => {
        mockHotelSearch.data = [
            {
                slug: 'sunset-paradise-resort',
                name: {
                    en: 'Sunset Paradise Resort',
                    fr: 'Sunset Paradise Resort',
                    ar: 'Sunset Paradise Resort',
                },
                location: {
                    en: 'Santorini, Greece',
                    fr: 'Santorin, Grèce',
                    ar: 'سانتوريني، اليونان',
                },
                stars: 5,
                rating: 4.9,
                reviews: 234,
                image: '/main-hotel.jpg',
                price: 1500,
                price_total: 1500,
                price_per_night: 375,
                base_price: 1300,
                markup_percentage: '15.38',
                currency: 'TND',
                nights: 4,
                available: true,
                provider: 'ostravel',
                rooms: [
                    {
                        id: '9001',
                        name: 'Refundable Suite',
                        boarding: null,
                        boarding_name: 'All inclusive',
                        boarding_id: 2,
                        view: 'Sea view',
                        view_ids: [7],
                        price: 1500,
                        price_total: 1500,
                        price_per_night: 375,
                        base_price: 1300,
                        currency: 'TND',
                        nights: 4,
                        token: 'live-token-1',
                        source: 'OS-TRAVEL-DIRECT',
                        stop_reservation: false,
                        cancellation_policy: [],
                        supplements: [],
                        not_refundable: true,
                        cancellation_deadline: '2026-09-05',
                    },
                ],
            },
        ];

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres disponibles');

        fireEvent.click(screen.getByTestId('set-dates'));
        await screen.findByText('Non remboursable');

        expect(
            screen.getByText(/Annulation gratuite jusqu’au 05\/09\/2026/),
        ).toBeInTheDocument();
    });

    it('falls back to the provider room photo when no static image exists', async () => {
        mockHotelSearch.data = [
            {
                slug: 'sunset-paradise-resort',
                name: {
                    en: 'Sunset Paradise Resort',
                    fr: 'Sunset Paradise Resort',
                    ar: 'Sunset Paradise Resort',
                },
                location: {
                    en: 'Santorini, Greece',
                    fr: 'Santorin, Grèce',
                    ar: 'سانتوريني، اليونان',
                },
                stars: 5,
                rating: 4.9,
                reviews: 234,
                image: '/main-hotel.jpg',
                price: 1500,
                price_total: 1500,
                price_per_night: 375,
                base_price: 1300,
                markup_percentage: '15.38',
                currency: 'TND',
                nights: 4,
                available: true,
                provider: 'ostravel',
                rooms: [
                    {
                        id: '9001',
                        name: 'Photo Suite',
                        boarding: null,
                        boarding_name: 'All inclusive',
                        boarding_id: 2,
                        view: 'Sea view',
                        view_ids: [7],
                        price: 1500,
                        price_total: 1500,
                        price_per_night: 375,
                        base_price: 1300,
                        currency: 'TND',
                        nights: 4,
                        token: 'live-token-1',
                        source: 'OS-TRAVEL-DIRECT',
                        stop_reservation: false,
                        cancellation_policy: [],
                        supplements: [],
                        image: '/proxy/photo-suite.jpg',
                    },
                ],
            },
        ];

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres disponibles');

        fireEvent.click(screen.getByTestId('set-dates'));
        await screen.findByAltText('Photo Suite');

        expect(screen.getByAltText('Photo Suite')).toHaveAttribute(
            'src',
            '/proxy/photo-suite.jpg',
        );
    });

    it('uses the live hotel currency on room prices', async () => {
        mockHotelSearch.data = [
            {
                slug: 'sunset-paradise-resort',
                name: {
                    en: 'Sunset Paradise Resort',
                    fr: 'Sunset Paradise Resort',
                    ar: 'Sunset Paradise Resort',
                },
                location: {
                    en: 'Santorini, Greece',
                    fr: 'Santorin, Grèce',
                    ar: 'سانتوريني، اليونان',
                },
                stars: 5,
                rating: 4.9,
                reviews: 234,
                image: '/main-hotel.jpg',
                price: 1500,
                price_total: 1500,
                price_per_night: 375,
                base_price: 1300,
                markup_percentage: '15.38',
                currency: 'EUR',
                nights: 4,
                available: true,
                provider: 'ostravel',
                rooms: [
                    {
                        id: '9001',
                        name: 'Deluxe Ocean View',
                        boarding: null,
                        boarding_name: 'All inclusive',
                        boarding_id: 2,
                        view: 'Sea view',
                        view_ids: [7],
                        price: 1500,
                        price_total: 1500,
                        price_per_night: 375,
                        base_price: 1300,
                        currency: 'EUR',
                        nights: 4,
                        token: 'live-token-1',
                        source: 'OS-TRAVEL-DIRECT',
                        stop_reservation: false,
                        cancellation_policy: [],
                        supplements: [],
                    },
                ],
            },
        ];

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres disponibles');

        fireEvent.click(screen.getByTestId('set-dates'));
        await screen.findAllByText(/1,500\s*EUR/);

        expect(screen.getAllByText(/1,500\s*EUR/).length).toBeGreaterThan(0);
        expect(screen.queryByText(/1,500\s*TND/)).not.toBeInTheDocument();
    });

    it('passes stop-sale ranges to the date picker to disable unavailable days', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        expect(
            (mockDateRangePickerProps.disabledRanges as unknown[] | undefined)
                ?.length,
        ).toBe(1);
        expect(mockDateRangePickerProps.disabledRanges).toEqual([
            {
                from: new Date('2026-09-03T00:00:00'),
                to: new Date('2026-09-08T00:00:00'),
            },
        ]);
        expect(mockDateRangePickerProps.fromDate).toEqual(
            new Date('2026-09-01T00:00:00'),
        );
    });

    it('shows the unavailable sticky state when the searched dates have no availability', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres disponibles');

        fireEvent.click(screen.getByTestId('set-dates'));

        expect(
            await screen.findAllByText(/Indisponible pour ces dates/),
        ).toHaveLength(2);
        expect(
            screen.queryByText(/1,500\s*TND/),
        ).not.toBeInTheDocument();
    });
});