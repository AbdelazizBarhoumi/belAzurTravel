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

// The provider normalizes the string `Localization` block into float
// coordinates before the frontend ever sees them; these are the values the
// mock exposes so the map embed path can be exercised.
const mockHotel = vi.hoisted(() => ({
    data: {
        id: 'sunset-paradise-resort',
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
        coordinates: { latitude: 35.907306, longitude: 10.582870 },
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
    },
}));

vi.mock('@/hooks/usePublicData', () => ({
    useHotelById: (id?: string) => ({
        data: id
            ? {
                  ...mockHotel.data,
                  id,
                  name: mockHotel.data.name,
                  location: mockHotel.data.location,
                  description: mockHotel.data.description,
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

// The page renders two date pickers (sticky sidebar + rates section); both are
// driven by the same shared state so clicking either one sets the dates.
function clickSetDates() {
    fireEvent.click(screen.getAllByTestId('set-dates')[0]);
}

// Live availability only runs after an explicit button press, mirroring the
// real UX where no price/availability is shown until the user asks for it.
function clickCheckAvailability() {
    fireEvent.click(
        screen.getByRole('button', {
            name: /Vérifier la disponibilité/i,
        }),
    );
}

function setLiveHotel(hotel: unknown) {
    mockHotelSearch.data = [hotel];
}

const baseLiveHotel = {
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
            supplements: [],
        },
    ],
};

describe('HotelDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHotel.data = {
            ...mockHotel.data,
            coordinates: { latitude: 35.907306, longitude: 10.582870 },
        };
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
        expect(screen.getByText('Chambres')).toBeInTheDocument();
        expect(
            screen.getByAltText('Sunset Paradise Resort main image'),
        ).toHaveAttribute('src', '/main-hotel.jpg');
    });

    it('renders the practical info, boardings, options and note sections', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        expect(
            screen.getByText('Informations pratiques'),
        ).toBeInTheDocument();
        expect(screen.getByText('Arrivée')).toBeInTheDocument();
        expect(screen.getByText('14h')).toBeInTheDocument();
        expect(screen.getByText('Départ')).toBeInTheDocument();
        expect(screen.getByText('12h')).toBeInTheDocument();
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

    it('renders the map embed from normalized float coordinates', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        const iframe = screen.getByTitle(/Carte de/);
        expect(iframe).toHaveAttribute(
            'src',
            'https://www.google.com/maps?q=35.907306,10.58287&output=embed',
        );
        const link = screen
            .getByRole('link', { name: /Voir sur carte/ })
            .closest('a');
        expect(link).toHaveAttribute(
            'href',
            'https://www.google.com/maps?q=35.907306,10.58287',
        );
    });

    it('falls back to a placeholder and an address map link without coordinates', async () => {
        mockHotel.data = {
            ...mockHotel.data,
            coordinates: null as unknown as {
                latitude: number;
                longitude: number;
            },
        };

        renderPage('/hotels/sunset-paradise-resort');

        expect(
            screen.queryByTitle(/Carte de/),
        ).not.toBeInTheDocument();
        const link = screen
            .getByRole('link', { name: /Voir sur carte/ })
            .closest('a');
        expect(link).toHaveAttribute(
            'href',
            'https://www.google.com/maps?q=123%20Beach%20Road',
        );
    });

    it('re-searches live availability when dates are set and shows stay total, per-night and supplements', async () => {
        setLiveHotel({
            ...baseLiveHotel,
            rooms: [
                {
                    ...baseLiveHotel.rooms[0],
                    supplements: [
                        { Name: 'Insurance', Price: 40, Mandatory: true },
                    ],
                },
            ],
        });

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres');

        clickSetDates();
        clickCheckAvailability();

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
        expect(screen.getAllByText(/Insurance/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/\+40\s*TND/).length).toBeGreaterThan(0);
    });

    it('shows the unavailable notice when the searched dates have no availability', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres');

        clickSetDates();
        clickCheckAvailability();

        expect(
            await screen.findByText(
                /aucune disponibilité pour les dates sélectionnées/i,
            ),
        ).toBeInTheDocument();
    });

    it('opens the booking dialog with the provider offer context from the live search', async () => {
        setLiveHotel({
            ...baseLiveHotel,
            rooms: [
                {
                    ...baseLiveHotel.rooms[0],
                    supplements: [
                        { Name: 'Insurance', Price: 40, Mandatory: true },
                    ],
                },
            ],
        });

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres');

        clickSetDates();
        clickCheckAvailability();
        expect(
            (await screen.findAllByText('Prix en direct')).length,
        ).toBeGreaterThan(0);

        fireEvent.click(screen.getByTestId('reserve-rate'));

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

    it('renders every live room with its boarding name in the rates table', async () => {
        setLiveHotel({
            ...baseLiveHotel,
            rooms: [
                {
                    ...baseLiveHotel.rooms[0],
                    id: '9001',
                    name: 'Standard Double',
                    boarding_name: 'All inclusive',
                    boarding_id: 1,
                    price: 1500,
                    price_total: 1500,
                    price_per_night: 375,
                },
                {
                    ...baseLiveHotel.rooms[0],
                    id: '9002',
                    name: 'Junior Suite',
                    boarding_name: 'Demi-pension',
                    boarding_id: 2,
                    view: 'Garden view',
                    view_ids: [3],
                    price: 900,
                    price_total: 900,
                    price_per_night: 225,
                    token: 'live-token-2',
                },
            ],
        });

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres');

        clickSetDates();
        clickCheckAvailability();
        await screen.findByText('Junior Suite');

        expect(screen.getByText('Standard Double')).toBeInTheDocument();
        expect(screen.getByText('Junior Suite')).toBeInTheDocument();
        expect(screen.getByText('All inclusive')).toBeInTheDocument();
        expect(
            screen.getAllByText('Demi-pension').length,
        ).toBeGreaterThan(0);
    });

    it('renders promo, free-child and recommended badges from the live result', async () => {
        setLiveHotel({
            ...baseLiveHotel,
            promotion: {
                title: 'Early booking',
                description: '-29% on select stays',
                rate: '29.00',
            },
            free_child: [5],
            recommended: true,
        });

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres');

        clickSetDates();
        clickCheckAvailability();
        await screen.findByText('Promo Early booking');

        expect(screen.getByText('Enfant gratuit')).toBeInTheDocument();
        expect(screen.getByText('Recommandé')).toBeInTheDocument();
    });

    it('renders non-refundable and free-cancellation badges on live rooms', async () => {
        setLiveHotel({
            ...baseLiveHotel,
            rooms: [
                {
                    ...baseLiveHotel.rooms[0],
                    name: 'Refundable Suite',
                    not_refundable: true,
                    cancellation_deadline: '2026-09-05',
                },
            ],
        });

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres');

        clickSetDates();
        clickCheckAvailability();
        await screen.findByText('Non remboursable');

        expect(
            screen.getByText(/Annulation gratuite jusqu’au 05\/09\/2026/),
        ).toBeInTheDocument();
    });

    it('falls back to the provider room photo when no static image exists', async () => {
        setLiveHotel({
            ...baseLiveHotel,
            rooms: [
                {
                    ...baseLiveHotel.rooms[0],
                    name: 'Photo Suite',
                    image: '/proxy/photo-suite.jpg',
                },
            ],
        });

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres');

        clickSetDates();
        clickCheckAvailability();
        await screen.findByAltText('Photo Suite');

        expect(screen.getByAltText('Photo Suite')).toHaveAttribute(
            'src',
            '/proxy/photo-suite.jpg',
        );
    });

    it('uses the live hotel currency on room prices', async () => {
        setLiveHotel({
            ...baseLiveHotel,
            currency: 'EUR',
            rooms: [
                { ...baseLiveHotel.rooms[0], currency: 'EUR' },
            ],
        });

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres');

        clickSetDates();
        clickCheckAvailability();
        await screen.findAllByText(/1,500\s*EUR/);

        expect(screen.getAllByText(/1,500\s*EUR/).length).toBeGreaterThan(0);
        expect(screen.queryByText(/1,500\s*TND/)).not.toBeInTheDocument();
    });

    it('sends one room per selected occupancy when rooms count is increased', async () => {
        setLiveHotel(baseLiveHotel);

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres');

        clickSetDates();
        // Open the sidebar occupancy picker and increase rooms to 2.
        fireEvent.click(
            screen.getAllByLabelText(/Occupation/)[0],
        );
        fireEvent.click(screen.getByLabelText('increase rooms'));
        fireEvent.click(
            screen.getAllByLabelText(/Occupation/)[0],
        );

        clickCheckAvailability();

        const searchCall = mockHotelSearch.calls.find(
            (query) =>
                typeof query === 'object' &&
                query !== null &&
                (query as { check_in?: string }).check_in === '2026-09-01',
        ) as
            | {
                  rooms?: Array<{ adults: number; children: number[] }>;
              }
            | undefined;

        expect(searchCall).toBeDefined();
        expect(searchCall?.rooms).toEqual([
            { adults: 2, children: [] },
            { adults: 2, children: [] },
        ]);
    });

    it('does not pass stored availability constraints to the date picker', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        // Stored availability is no longer part of the catalog: the date
        // picker must not restrict days from the provider's stop-sale or
        // first-available metadata.
        expect(mockDateRangePickerProps.disabledRanges).toBeUndefined();
        expect(mockDateRangePickerProps.fromDate).toBeUndefined();
        expect(
            await screen.findByRole('button', {
                name: /Vérifier la disponibilité/i,
            }),
        ).toBeInTheDocument();
    });

    it('shows the unavailable notice and hides prices when the searched dates have no availability', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByText('Chambres');

        clickSetDates();
        clickCheckAvailability();

        expect(
            await screen.findByText(
                /aucune disponibilité pour les dates sélectionnées/i,
            ),
        ).toBeInTheDocument();
        expect(screen.queryByText(/1,500\s*TND/)).not.toBeInTheDocument();
    });
});
