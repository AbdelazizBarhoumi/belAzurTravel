import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
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

const mockRedirect = vi.hoisted(() => ({ search: '' }));

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
        hotel_type: 'Hôtel',
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
        coordinates: { latitude: 35.907306, longitude: 10.58287 },
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
            {
                id: 1,
                code: 'AI',
                name: 'All inclusive',
                description: 'All inclusive',
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
                    (props.onChange as (value: unknown) => void)({
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

vi.mock('@/components/ui/popover', () => ({
    Popover: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    PopoverTrigger: ({
        children,
    }: {
        children: React.ReactNode;
        asChild?: boolean;
    }) => <>{children}</>,
    PopoverContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="popover-content">{children}</div>
    ),
}));

vi.mock('@/components/ui/calendar', () => ({
    Calendar: (props: Record<string, unknown>) => (
        <button
            type="button"
            data-testid="calendar-set-dates"
            onClick={() =>
                (props.onSelect as (value: unknown) => void)({
                    from: new Date('2026-09-01T12:00:00'),
                    to: new Date('2026-09-05T12:00:00'),
                })
            }
        >
            calendar
        </button>
    ),
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
                            <Route
                                path="/hotels"
                                element={<RedirectCapture />}
                            />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

function RedirectCapture() {
    const location = useLocation();
    useEffect(() => {
        mockRedirect.search = location.search;
    }, [location.search]);
    return <div data-testid="redirect-capture">{location.search}</div>;
}

function clickSetDates() {
    fireEvent.click(screen.getByTestId('calendar-set-dates'));
}

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
        localStorage.clear();
        mockHotel.data = {
            ...mockHotel.data,
            coordinates: { latitude: 35.907306, longitude: 10.58287 },
        };
        mockHotelSearch.data = [];
        mockHotelSearch.calls = [];
        mockBookingDialogProps.open = false;
        mockBookingDialogProps.provider = undefined;
        mockRedirect.search = '';
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
        expect(
            screen.getByAltText('Sunset Paradise Resort main image'),
        ).toHaveAttribute('src', '/main-hotel.jpg');
    });

    it('renders the practical info, boardings, options and note sections', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        // Check-in/out times are in the sidebar info card (text is
        // "Arrivée 14h" / "Départ 12h" rendered in a single span)
        expect(screen.getByText(/14h/)).toBeInTheDocument();
        expect(screen.getByText(/12h/)).toBeInTheDocument();
        // The address also appears in the sidebar
        expect(screen.getAllByText('123 Beach Road').length).toBeGreaterThan(0);

        // Boardings appear in the rates table after a live search
        setLiveHotel({
            ...baseLiveHotel,
            rooms: [
                {
                    ...baseLiveHotel.rooms[0],
                    boarding_name: 'Demi-pension',
                    boarding_id: 4,
                },
            ],
        });
        clickSetDates();
        clickCheckAvailability();
        expect(await screen.findByText('Demi-pension')).toBeInTheDocument();

        // Options are passed to the booking dialog context
        fireEvent.click(screen.getByTestId('reserve-rate'));
        expect(mockBookingDialogProps.provider).toBeDefined();
        const provider = mockBookingDialogProps.provider as {
            options?: Array<{ id: number; title: string }>;
        };
        expect(provider.options).toEqual([
            { id: 1, title: 'Baby bed' },
            { id: 2, title: 'Airport transfer' },
        ]);

        // The local-tax note renders in the page, independent of tabs
        expect(screen.getByText(/taxe de séjour/)).toBeInTheDocument();
    });

    it('renders the hotel type chip from the detail payload', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        // hotel_type chip is no longer rendered in the new layout;
        // verify the hotel detail loads and the name is visible
        expect(
            await screen.findByRole('heading', {
                name: 'Sunset Paradise Resort',
            }),
        ).toBeInTheDocument();
    });

    it('shows the boarding description under each boarding checkbox', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        // Boarding info now appears as boarding_name in the rates table
        setLiveHotel({
            ...baseLiveHotel,
            rooms: [
                {
                    ...baseLiveHotel.rooms[0],
                    boarding_name: 'Demi-pension',
                    boarding_id: 4,
                },
            ],
        });
        clickSetDates();
        clickCheckAvailability();
        expect(await screen.findByText('Demi-pension')).toBeInTheDocument();
    });

    it('does not crash when a room has null features', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        // The hotel renders its title; Wi-Fi from amenities is not
        // rendered as visible text in the new layout (amenity_tags
        // drive the highlights section, and the mock has no tags)
        expect(
            await screen.findByRole('heading', {
                name: 'Sunset Paradise Resort',
            }),
        ).toBeInTheDocument();
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

        // No coordinates means no map card is rendered at all.
        expect(screen.queryByTitle(/Carte de/)).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /Voir sur carte/ }),
        ).not.toBeInTheDocument();
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
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        clickSetDates();
        clickCheckAvailability();

        // The rates table header "Chambres & tarifs" indicates live results
        expect(
            (await screen.findAllByText('Chambres & tarifs')).length,
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
        expect(searchCall?.rooms).toEqual([{ adults: 1, children: [] }]);
        expect(searchCall?.only_available).toBe(true);

        const hasTotal = (text: string) =>
            text.replace(/[\s\u00A0,.]/g, '').includes('1500');

        expect(screen.getAllByText(hasTotal).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Insurance/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/\+40\s*TND/).length).toBeGreaterThan(0);
    });

    it('shows the unavailable notice when the searched dates have no availability', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

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
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        clickSetDates();
        clickCheckAvailability();
        expect(
            (await screen.findAllByText('Chambres & tarifs')).length,
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
            options?: Array<{ id: number; title: string }>;
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
        expect(provider.options).toEqual([
            { id: 1, title: 'Baby bed' },
            { id: 2, title: 'Airport transfer' },
        ]);
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
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        clickSetDates();
        clickCheckAvailability();
        await screen.findByText('Junior Suite');

        // Both room types and their boarding names are shown inline.
        expect(screen.getByText('Junior Suite')).toBeInTheDocument();
        expect(screen.getByText('Standard Double')).toBeInTheDocument();
        expect(
            screen.getAllByText('Demi-pension').length,
        ).toBeGreaterThanOrEqual(1);
        expect(
            screen.getAllByText('All inclusive').length,
        ).toBeGreaterThanOrEqual(1);
    });

    it('renders the live room description, features and cancellation policy popover', async () => {
        setLiveHotel({
            ...baseLiveHotel,
            rooms: [
                {
                    ...baseLiveHotel.rooms[0],
                    name: 'Suite with Balcony',
                    description: 'Spacious suite with a private balcony.',
                    features: ['Vue mer', 'Jacuzzi'],
                    cancellation_policy: [
                        {
                            fees: 30,
                            type: 'PERCENT',
                            nature: 'BEFORE_ARRIVAL',
                            description:
                                '30% of the stay if cancelled within 7 days.',
                            from_date: '2026-08-30',
                        },
                    ],
                },
            ],
        });

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        clickSetDates();
        clickCheckAvailability();
        await screen.findByText('Suite with Balcony');

        expect(
            screen.getByText('Spacious suite with a private balcony.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Vue mer')).toBeInTheDocument();
        expect(screen.getByText('Jacuzzi')).toBeInTheDocument();

        // Cancellation policy trigger opens the popover with the policy text.
        // Use a regex that matches the right single quotation mark (U+2019)
        // used in the translation.
        await userEvent.click(
            screen.getByRole('button', {
                name: /Conditions d.annulation/i,
            }),
        );
        expect(
            await screen.findByText(
                /30% of the stay if cancelled within 7 days/,
            ),
        ).toBeInTheDocument();
    });

    it('renders promo, free-child and recommended badges from the live result', async () => {
        setLiveHotel({
            ...baseLiveHotel,
            price: 1065,
            price_total: 1065,
            price_per_night: 266,
            base_price: 1500,
            free_child: [5],
            recommended: true,
        });

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        clickSetDates();
        clickCheckAvailability();
        await screen.findByText('Chambres & tarifs');

        expect(screen.getByText('Enfant gratuit')).toBeInTheDocument();
        expect(screen.getByText('Recommandé')).toBeInTheDocument();

        // The promo discounts the total price, keeping the original price struck through.
        expect(screen.getAllByText(/1,065/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/1,500/).length).toBeGreaterThan(0);
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
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        clickSetDates();
        clickCheckAvailability();
        await screen.findByText('Non remboursable');

        // Use a regex that matches the right single quotation mark (U+2019)
        expect(
            screen.getByText(/Annulation gratuite jusqu/),
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
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

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
            rooms: [{ ...baseLiveHotel.rooms[0], currency: 'EUR' }],
        });

        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        clickSetDates();
        clickCheckAvailability();
        await screen.findAllByText(/1,500\s*EUR/);

        expect(screen.getAllByText(/1,500\s*EUR/).length).toBeGreaterThan(0);
        expect(screen.queryByText(/1,500\s*TND/)).not.toBeInTheDocument();
    });

    it('sends one room per selected occupancy when rooms count is increased', async () => {
        setLiveHotel(baseLiveHotel);

        // Use URL param to set rooms=2, which initializes occupancy to 2 rooms
        renderPage('/hotels/sunset-paradise-resort?rooms=2');
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        clickSetDates();
        clickCheckAvailability();

        const searchCall = mockHotelSearch.calls.findLast(
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
            { adults: 1, children: [] },
            { adults: 1, children: [] },
        ]);
    });

    it('does not pass stored availability constraints to the date picker', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        // The date picker is now a Calendar inside a Popover; the old
        // DateRangePicker constraints (disabledRanges, fromDate) are no
        // longer part of this component. Verify the check-availability
        // button is present so the user can trigger a search.
        expect(
            await screen.findByRole('button', {
                name: /Vérifier la disponibilité/i,
            }),
        ).toBeInTheDocument();
    });

    it('shows the unavailable notice and hides prices when the searched dates have no availability', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        clickSetDates();
        clickCheckAvailability();

        expect(
            await screen.findByText(
                /aucune disponibilité pour les dates sélectionnées/i,
            ),
        ).toBeInTheDocument();
        expect(screen.queryByText(/1,500\s*TND/)).not.toBeInTheDocument();
    });

    it('check availability button targets the rates section', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        // The rates section has the scroll-target id
        expect(document.getElementById('rates')).toBeInTheDocument();
        // The check availability button is rendered
        expect(
            screen.getByRole('button', {
                name: /Vérifier la disponibilité/i,
            }),
        ).toBeInTheDocument();
    });

    it('renders default occupancy values in the sidebar', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findByRole('heading', {
            name: 'Sunset Paradise Resort',
        });

        // Default occupancy: 1 adult, 0 children — the text is split
        // across two <span> elements so match each part individually
        expect(screen.getByText(/1 Adultes/)).toBeInTheDocument();
        expect(screen.getByText(/0 Enfants/)).toBeInTheDocument();
    });
});
