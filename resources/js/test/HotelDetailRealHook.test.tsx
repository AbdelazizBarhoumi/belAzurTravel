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
import HotelDetail from '@/pages/hotels/show';

afterEach(() => {
    cleanup();
});

vi.mock('@/hooks/usePublicData', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        useHotelById: (id?: string) => ({
            data: id
                ? {
                      id,
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
                      provider: 'ostravel',
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
    };
});

vi.mock('@/components/ui/DateRangePicker', () => {
    const dates: Array<{ from: string; to: string }> = [
        { from: '2026-09-01T12:00:00', to: '2026-09-05T12:00:00' },
        { from: '2026-10-01T12:00:00', to: '2026-10-05T12:00:00' },
    ];
    const state = { index: 0 };
    return {
        DateRangePicker: (props: Record<string, unknown>) => {
            return (
                <button
                    type="button"
                    data-testid="set-dates"
                    onClick={() => {
                        const next = dates[state.index % dates.length];
                        state.index += 1;
                        (props.onChange as (value: unknown) => void)({
                            from: new Date(next.from),
                            to: new Date(next.to),
                        });
                    }}
                >
                    set-dates
                </button>
            );
        },
    };
});

vi.mock('@/components/forms/BookingDialog', () => ({
    BookingDialog: () => <div data-testid="booking-dialog" />,
}));

const searchBody = vi.hoisted(() => ({ value: null as unknown }));

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

describe('HotelDetail real search hook flow', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        searchBody.value = null;
        queryClient.clear();

        fetchSpy = vi.fn(
            async (_input: RequestInfo | URL, init?: RequestInit) => {
                searchBody.value = init?.body ?? null;
                return new Response(
                    JSON.stringify({
                        data: [],
                        meta: {
                            current_page: 1,
                            last_page: 1,
                            total: 0,
                            per_page: 50,
                        },
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    },
                );
            },
        );

        vi.stubGlobal('fetch', fetchSpy);
    });

    it('fires the search request only after clicking the availability button', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findAllByText('Sunset Paradise Resort');

        fireEvent.click(screen.getAllByTestId('set-dates')[0]);

        // No search yet: dates set but button not pressed.
        expect(fetchSpy).not.toHaveBeenCalled();

        fireEvent.click(
            screen.getByRole('button', {
                name: /Vérifier la disponibilité/i,
            }),
        );

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalled();
        });

        const called = fetchSpy.mock.calls.find(([url]) =>
            String(url).includes('/api/hotels/search'),
        );
        expect(called).toBeDefined();

        const body = JSON.parse(String(searchBody.value ?? '{}'));
        expect(body.check_in).toBe('2026-09-01');
        expect(body.check_out).toBe('2026-09-05');
        expect(body.hotel_slugs).toEqual(['sunset-paradise-resort']);

        expect(
            await screen.findByText(
                /aucune disponibilité pour les dates sélectionnées/i,
            ),
        ).toBeInTheDocument();
    });

    it('re-fires when dates change after a search', async () => {
        renderPage('/hotels/sunset-paradise-resort');
        await screen.findAllByText('Sunset Paradise Resort');

        fireEvent.click(screen.getAllByTestId('set-dates')[0]);
        fireEvent.click(
            screen.getByRole('button', {
                name: /Vérifier la disponibilité/i,
            }),
        );

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalled();
        });

        // Change dates -> stale query should be cleared and no new search yet.
        fireEvent.click(screen.getAllByTestId('set-dates')[0]);
        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: /Vérifier la disponibilité/i,
                }),
            ).not.toBeDisabled();
        });
        fireEvent.click(
            screen.getByRole('button', {
                name: /Vérifier la disponibilité/i,
            }),
        );

        await new Promise((r) => setTimeout(r, 500));

        const searchCalls = fetchSpy.mock.calls.filter(([url]) =>
            String(url).includes('/api/hotels/search'),
        );
        console.log(
            'SEARCH CALLS:',
            searchCalls.map(([, init]) => init?.body),
        );
        console.log('TOTAL FETCH CALLS:', fetchSpy.mock.calls.length);

        await waitFor(
            () => {
                expect(
                    fetchSpy.mock.calls.filter(([url]) =>
                        String(url).includes('/api/hotels/search'),
                    ).length,
                ).toBe(2);
            },
            { timeout: 3000 },
        );
    });
});
