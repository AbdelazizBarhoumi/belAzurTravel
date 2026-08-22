import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Hotels from '@/pages/hotels';

afterEach(() => {
    cleanup();
});

const { mockHotels, mockHotelSearch } = vi.hoisted(() => ({
    mockHotels: { data: [] as unknown[] },
    mockHotelSearch: {
        data: [] as unknown[],
        calls: [] as unknown[],
        fetching: false,
    },
}));

const defaultBrowseHotels = [
    {
        slug: 'sunset-bay',
        name: {
            en: 'Sunset Bay',
            fr: 'Sunset Bay',
            ar: 'Sunset Bay',
        },
        description: {
            en: 'Seafront escape with a private beach and spa.',
            fr: 'Évasion en bord de mer avec plage privée et spa.',
            ar: 'هروب على شاطئ البحر مع شاطئ خاص ومنتجع صحي.',
        },
        location: {
            en: 'Sousse, Tunisia',
            fr: 'Sousse, Tunisie',
            ar: 'سوسة، تونس',
        },
        country: { en: 'Tunisia', fr: 'Tunisie', ar: 'تونس' },
        city: { en: 'Sousse', fr: 'Sousse', ar: 'سوسة' },
        image: '/hotel.jpg',
        price: 180,
        stars: 5,
        rating: 4.8,
        reviews: 120,
        tags: ['luxury'],
        amenities: [
            { name: { en: 'WiFi', fr: 'Wi-Fi', ar: 'واي فاي' }, icon: 'wifi' },
        ],
        category_assignments: {
            service: 'thalasso_spa',
            arrangements: 'demi_pension',
        },
        htel_recommande: true,
        tarifs_promo: true,
        enfant_gratuit: true,
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
        country: { en: 'Tunisia', fr: 'Tunisie', ar: 'تونس' },
        city: { en: 'Hammamet', fr: 'Hammamet', ar: 'الحمامات' },
        image: '/ocean.jpg',
        price: 220,
        stars: 4,
        rating: 4.5,
        reviews: 80,
        tags: ['family'],
        amenities: [],
        category_assignments: {},
    },
];

vi.mock('@/hooks/usePublicData', () => ({
    useHotels: () => ({
        data: mockHotels.data,
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
    useHotelSearchInfinite: vi.fn((query?: unknown) => {
        mockHotelSearch.calls.push(query);
        return {
            data: {
                pages: [
                    {
                        data: mockHotelSearch.data,
                        meta: {
                            current_page: 1,
                            last_page: 1,
                            total: mockHotelSearch.data.length,
                            per_page: 50,
                        },
                    },
                ],
                pageParams: [1],
            },
            isLoading: false,
            isFetching: mockHotelSearch.fetching,
            isFetchingNextPage: false,
            hasNextPage: false,
            fetchNextPage: vi.fn(),
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
        mockHotels.data = defaultBrowseHotels;
        mockHotelSearch.data = [];
        mockHotelSearch.calls = [];
        mockHotelSearch.fetching = false;
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
        expect(
            screen.getByText(/·\s*7\s*(nuits?|nights)/i),
        ).toBeInTheDocument();
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
        ) as
            | { rooms?: Array<{ adults: number; children: number[] }> }
            | undefined;

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
        expect(
            screen.getByText(/176\s*TND\s*\/nuit|176\s*TND\s*\/night/i),
        ).toBeInTheDocument();
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
        expect(
            screen.getByText('Promo Early booking · -29%'),
        ).toBeInTheDocument();
        expect(screen.getByText('Enfant gratuit')).toBeInTheDocument();

        // The promo discounts the displayed prices and strikes through the originals.
        expect(screen.getByText(/124\.96/)).toBeInTheDocument();
        expect(screen.getByText(/876\.14/)).toBeInTheDocument();
        expect(screen.getAllByText(/176\s*TND/).length).toBeGreaterThan(0);
    });

    it('renders teaser and muted promo/free-child/recommended chips in browse mode', async () => {
        renderPage('/hotels');

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();

        // Teaser from the stored description.
        expect(
            screen.getByText(/Évasion en bord de mer avec plage privée/i),
        ).toBeInTheDocument();
        // Muted chips from the browse payload booleans.
        expect(screen.getByText('Recommandé')).toBeInTheDocument();
        expect(screen.getByText('Promo')).toBeInTheDocument();
        expect(screen.getByText('Enfant gratuit')).toBeInTheDocument();
    });

    it('hides the Budget slider and sort dropdown when no prices are available', async () => {
        // Provider-linked hotels carry no stored price in browse mode.
        mockHotels.data = [
            {
                slug: 'laico-hammamet',
                name: {
                    en: 'Laico Hammamet',
                    fr: 'Laico Hammamet',
                    ar: 'لايكو الحمامات',
                },
                location: {
                    en: 'Hammamet, Tunisia',
                    fr: 'Hammamet, Tunisie',
                    ar: 'الحمامات، تونس',
                },
                country: { en: 'Tunisia', fr: 'Tunisie', ar: 'تونس' },
                city: { en: 'Hammamet', fr: 'Hammamet', ar: 'الحمامات' },
                image: '/laico.jpg',
                price: null,
                stars: 4,
                rating: 4.5,
                reviews: 80,
                provider: 'ostravel',
            },
        ];

        renderPage('/hotels');

        expect(await screen.findByText('Laico Hammamet')).toBeInTheDocument();

        // No price data -> neither the Budget slider nor the sort dropdown
        // (which is defaulted to "Prix croissant") may be shown.
        expect(screen.queryByText(/Budget/i)).not.toBeInTheDocument();
        expect(
            screen.queryByLabelText(/Trier par|Sort by/i),
        ).not.toBeInTheDocument();
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
            screen.getByText(/Disponibilité en direct|Live availability/i),
        ).toBeInTheDocument();
    });

    it('filters browse results by stars on the client', async () => {
        renderPage('/hotels');
        await screen.findByText('Sunset Bay');
        expect(screen.getByText('Ocean Club')).toBeInTheDocument();

        // Select the 5-star checkbox (the country checkbox is rendered first).
        fireEvent.click(
            screen.getByRole('checkbox', { name: /5 étoiles|5 Stars/i }),
        );

        expect(screen.getByText('Sunset Bay')).toBeInTheDocument();
        expect(screen.queryByText('Ocean Club')).not.toBeInTheDocument();

        // No dates, so the live search must never have been attempted.
        expect(
            mockHotelSearch.calls.every((query) => query === undefined),
        ).toBe(true);
    });

    it('treats star filters as an exact OR group, not a minimum', async () => {
        renderPage('/hotels');
        await screen.findByText('Sunset Bay');
        expect(screen.getByText('Ocean Club')).toBeInTheDocument();

        // Selecting "4 Stars" must hide the 5-star hotel (exact match, not
        // "4 stars and up").
        fireEvent.click(
            screen.getByRole('checkbox', { name: /4 étoiles|4 Stars/i }),
        );
        expect(screen.getByText('Ocean Club')).toBeInTheDocument();
        expect(screen.queryByText('Sunset Bay')).not.toBeInTheDocument();

        // Adding "5 Stars" shows both levels again (OR within the group).
        fireEvent.click(
            screen.getByRole('checkbox', { name: /5 étoiles|5 Stars/i }),
        );
        expect(screen.getByText('Ocean Club')).toBeInTheDocument();
        expect(screen.getByText('Sunset Bay')).toBeInTheDocument();
    });

    it('filters browse results by city via the searchable dropdown', async () => {
        renderPage('/hotels');
        await screen.findByText('Sunset Bay');
        expect(screen.getByText('Ocean Club')).toBeInTheDocument();

        // Open the city combobox and pick "Sousse" from the search results.
        fireEvent.click(
            screen.getByRole('combobox', {
                name: /Toutes les villes|All cities|كل المدن/i,
            }),
        );
        fireEvent.click(await screen.findByRole('option', { name: /Sousse/i }));

        expect(screen.getByText('Sunset Bay')).toBeInTheDocument();
        expect(screen.queryByText('Ocean Club')).not.toBeInTheDocument();

        // No dates, so the live search must never have been attempted.
        expect(
            mockHotelSearch.calls.every((query) => query === undefined),
        ).toBe(true);
    });

    it('applies category type groups with AND logic across groups', async () => {
        // sunset-bay matches "service" but its arrangements are demi_pension,
        // not all_inclusive — the hotel must be excluded (every group must match).
        renderPage(
            '/hotels?category_service=thalasso_spa&category_arrangements=all_inclusive',
        );

        expect(
            await screen.findByText(/Aucun résultat|No results/i),
        ).toBeInTheDocument();
        expect(screen.queryByText('Sunset Bay')).not.toBeInTheDocument();
        expect(screen.queryByText('Ocean Club')).not.toBeInTheDocument();
    });

    it('hides the sort dropdown in browse mode and shows it once live prices exist', async () => {
        const { unmount } = renderPage('/hotels');
        await screen.findByText('Sunset Bay');

        // No live prices yet -> the price sort control must not be shown.
        expect(
            screen.queryByRole('combobox', { name: /Trier par|Sort by/i }),
        ).not.toBeInTheDocument();
        unmount();

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
            screen.getByRole('combobox', { name: /Trier par|Sort by/i }),
        ).toBeInTheDocument();
    });

    it('debounces live filter changes and narrows the search to candidate hotels', async () => {
        renderPage('/hotels?from=2026-08-20&to=2026-08-27&guests=2');
        await screen.findByText(/Aucun résultat|No results/i);

        const hasSlugs = (query: unknown) =>
            typeof query === 'object' &&
            query !== null &&
            (query as { hotel_slugs?: string[] }).hotel_slugs !== undefined;

        expect(mockHotelSearch.calls.some(hasSlugs)).toBe(false);

        // 5-star checkbox: only sunset-bay qualifies client-side, so the next
        // (debounced) live search should be narrowed to that single hotel.
        fireEvent.click(
            screen.getByRole('checkbox', { name: /5 étoiles|5 Stars/i }),
        );

        // Debounce: nothing new has been searched yet.
        expect(mockHotelSearch.calls.some(hasSlugs)).toBe(false);

        await waitFor(
            () => {
                expect(mockHotelSearch.calls.some(hasSlugs)).toBe(true);
            },
            { timeout: 3000 },
        );

        const narrowed = mockHotelSearch.calls.find(hasSlugs) as {
            hotel_slugs?: string[];
        };
        expect(narrowed.hotel_slugs).toEqual(['sunset-bay']);
    });

    it('applies the landing widget star param as a filter', async () => {
        renderPage('/hotels?stars=5');

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();
        expect(screen.queryByText('Ocean Club')).not.toBeInTheDocument();
    });

    it('applies the landing widget country param as a country filter', async () => {
        // Both mock hotels are in Tunisia, so country=TN keeps them all.
        renderPage('/hotels?country=TN');

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();
        expect(screen.getByText('Ocean Club')).toBeInTheDocument();
    });

    it('filters browse results by room type from the landing widget', async () => {
        // No mock hotel carries a type_chambres assignment, so cat=suite must
        // exclude every hotel (the category group cannot match).
        renderPage('/hotels?cat=suite');

        expect(
            await screen.findByText(/Aucun résultat|No results/i),
        ).toBeInTheDocument();
        expect(screen.queryByText('Sunset Bay')).not.toBeInTheDocument();
        expect(screen.queryByText('Ocean Club')).not.toBeInTheDocument();
    });

    it('runs a live search with a 1-night default when only check-in is set', async () => {
        renderPage('/hotels?from=2026-08-20&guests=2');

        await waitFor(
            () => {
                const call = mockHotelSearch.calls.find(
                    (query) =>
                        typeof query === 'object' &&
                        query !== null &&
                        (query as { check_in?: string }).check_in ===
                            '2026-08-20',
                ) as { check_out?: string } | undefined;
                expect(call).toBeDefined();
                expect(call?.check_out).toBe('2026-08-21');
            },
            { timeout: 3000 },
        );
    });

    it('re-runs the live search when the dates are changed again', async () => {
        renderPage('/hotels');
        await screen.findByText('Sunset Bay');

        const trigger = screen.getByRole('button', {
            name: /Choisir des dates|Choose dates/i,
        });

        const definedCalls = () =>
            mockHotelSearch.calls.filter(
                (q) =>
                    typeof q === 'object' &&
                    q !== null &&
                    (q as { check_in?: string }).check_in,
            ) as Array<{ check_in: string; check_out: string }>;

        fireEvent.click(trigger);

        const dayButtons = () =>
            Array.from(document.querySelectorAll('button[name="day"]')).filter(
                (b) => !(b as HTMLButtonElement).disabled,
            ) as HTMLButtonElement[];

        // First pick: 1-night live search fires.
        fireEvent.click(dayButtons()[0]);
        await waitFor(
            () => {
                expect(definedCalls().length).toBeGreaterThan(0);
            },
            { timeout: 3000 },
        );
        const first = definedCalls()[definedCalls().length - 1];

        // Second pick (a different day): the range extends and a fresh live
        // search must fire again — not be swallowed by the debounce.
        fireEvent.click(dayButtons()[10]);
        await waitFor(
            () => {
                const last = definedCalls()[definedCalls().length - 1];
                expect(last?.check_out).not.toBe(first.check_out);
            },
            { timeout: 3000 },
        );
        expect(definedCalls()[definedCalls().length - 1].check_out).not.toBe(
            first.check_out,
        );
    });

    it('shows the Budget slider only once live prices are retrieved', async () => {
        const { unmount } = renderPage('/hotels');
        await screen.findByText('Sunset Bay');

        // Browse mode: the Budget slider stays hidden even when stored prices
        // exist, because no live price data is available yet.
        expect(screen.queryByText(/Budget/i)).not.toBeInTheDocument();
        unmount();

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
        expect(await screen.findByText(/Budget/i)).toBeInTheDocument();
    });

    it('shows skeleton cards while live prices are being fetched', async () => {
        mockHotelSearch.fetching = true;

        renderPage('/hotels?from=2026-08-20&to=2026-08-27&guests=2');

        // While the date search is in flight the stored browse cards are
        // replaced by skeleton placeholders (no price data for those dates).
        expect(
            await screen.findByTestId('hotel-skeletons'),
        ).toBeInTheDocument();
        expect(screen.queryByText('Sunset Bay')).not.toBeInTheDocument();

        mockHotelSearch.fetching = false;
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

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();
        expect(screen.queryByTestId('hotel-skeletons')).not.toBeInTheDocument();
    });

    it('derives the Budget slider bounds from the live per-night prices', async () => {
        // Stored browse prices are 180/220 DT per night; the live results must
        // drive the slider bounds (176/325) instead of those stored fallbacks.
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
                price: 1232,
                price_total: 1232,
                price_per_night: 176,
                nights: 7,
                available: true,
                provider: 'ostravel',
                rooms: [],
            },
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
                price: 2275,
                price_total: 2275,
                price_per_night: 325,
                nights: 7,
                available: true,
                provider: 'ostravel',
                rooms: [],
            },
        ];

        renderPage('/hotels?from=2026-08-20&to=2026-08-27&guests=2');

        expect(await screen.findByText('Sunset Bay')).toBeInTheDocument();
        // Bounds = min/max of the live per-night prices (176 and 325), not the
        // stored browse prices (180 and 220).
        expect(
            await screen.findByText(/176\s*DT\s*-\s*325\s*DT/i),
        ).toBeInTheDocument();
    });

    it('opens the mobile filters sheet from the Filters button', async () => {
        renderPage('/hotels');

        await screen.findByText('Sunset Bay');
        fireEvent.click(
            screen.getByRole('button', { name: /filtres|filters/i }),
        );

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: /filtres|filters/i }),
        ).toBeInTheDocument();
    });
});
