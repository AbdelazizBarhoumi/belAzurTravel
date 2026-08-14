import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as osTravelApi from '@/api/osTravel.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { __setRefreshPollMs } from '@/hooks/useOsTravelAdmin';
import AdminOsTravel from '@/pages/admin/AdminOsTravel';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/api/osTravel.api', () => ({
    getOsTravelDashboard: vi.fn(),
    listOsTravelHotels: vi.fn(),
    getOsTravelHotel: vi.fn(),
    getOsTravelReferences: vi.fn(),
    updateOsTravelHotel: vi.fn(),
    approveOsTravelHotel: vi.fn(),
    approveAllOsTravelHotels: vi.fn(),
    rejectOsTravelHotel: vi.fn(),
    refreshOsTravelPrice: vi.fn(),
    refreshOsTravelPrices: vi.fn(),
    getOsTravelRefreshStatus: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const makeRow = (
    overrides: Partial<osTravelApi.OsTravelHotelRow> = {},
): osTravelApi.OsTravelHotelRow => ({
    id: '1',
    external_id: '101',
    name: 'Hotel Test',
    city_external_id: '501',
    city_name: 'Sousse',
    country_external_id: '219',
    country_name: 'Tunisie',
    category_title: 'Resort',
    stars: 5,
    image: 'http://cdn.test/h.jpg',
    status: 'pending',
    has_base_price: true,
    base_price: 200,
    price_status: 'has_price',
    last_price_attempt_at: null,
    markup_percentage: '20.00',
    currency: 'TND',
    hotel_id: null,
    hotel_slug: null,
    approved_by: null,
    approved_at: null,
    rejected_at: null,
    last_synced_at: '2026-08-01 10:00:00',
    live_status: null,
    live_price: null,
    live_currency: null,
    ...overrides,
});

const makeDetail = (row: osTravelApi.OsTravelHotelRow) => ({
    ...row,
    payload: {},
    mapped_preview: {
        name: row.name,
        city: row.city_name,
        country: 'Tunisia',
        stars: row.stars,
        category: row.category_title,
        image: row.image,
        gallery: ['http://cdn.test/g1.jpg', 'http://cdn.test/g2.jpg'],
        description: 'A lovely resort by the sea.',
        themes: [],
        boarding: ['Half Board', 'All Inclusive'],
        address: '1 Avenue Habib Bourguiba',
        phone: '+216 000 000',
        email: 'hotel@example.com',
        price: row.base_price !== null ? 240 : null,
        base_price: row.base_price,
        markup_percentage: 20,
        currency: row.currency ?? 'TND',
        code: `ostravel-${row.external_id}`,
    },
});

function renderAdminOsTravel() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <SiteSettingsProvider>
                    <MemoryRouter initialEntries={['/admin/os-travel']}>
                        <AdminOsTravel />
                    </MemoryRouter>
                </SiteSettingsProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('AdminOsTravel page', () => {
    beforeEach(() => {
        localStorage.setItem('role', 'admin');
        localStorage.setItem('lang', 'en');
        vi.mocked(osTravelApi.getOsTravelDashboard).mockResolvedValue({
            data: {
                last_sync: {
                    id: '9',
                    batch: 'batch-9',
                    status: 'success',
                    started_at: '2026-08-01 09:00:00',
                    finished_at: '2026-08-01 09:05:00',
                    error: null,
                    countries_count: 2,
                    cities_count: 3,
                    hotels_count: 4,
                    details_count: 4,
                    orphaned_count: 1,
                    reactivated_count: 2,
                },
                counts: {
                    pending: 2,
                    approved: 0,
                    published: 1,
                    rejected: 1,
                    orphaned: 1,
                },
            },
        } as never);
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValue({
            data: [makeRow()],
        } as never);
        vi.mocked(osTravelApi.updateOsTravelHotel).mockResolvedValue({
            data: makeRow(),
        } as never);
        vi.mocked(osTravelApi.approveOsTravelHotel).mockResolvedValue({
            data: makeRow({ status: 'published', hotel_id: '99' }),
        } as never);
        vi.mocked(osTravelApi.approveAllOsTravelHotels).mockResolvedValue({
            data: {
                published: [makeRow({ status: 'published' })],
                skipped_no_price: [],
                skipped_over_cap: [],
                published_count: 1,
                skipped_no_price_count: 0,
                skipped_over_cap_count: 0,
                cap: 50,
            },
        } as never);
        vi.mocked(osTravelApi.rejectOsTravelHotel).mockResolvedValue({
            data: makeRow({ status: 'rejected' }),
        } as never);
        vi.mocked(osTravelApi.refreshOsTravelPrice).mockResolvedValue({
            data: {
                ...makeRow(),
                refresh: { updated: 1, omitted: 0 },
            },
        } as never);
        vi.mocked(osTravelApi.refreshOsTravelPrices).mockResolvedValue({
            data: {
                id: '42',
                status: 'pending',
                started_at: null,
                finished_at: null,
                updated: 0,
                omitted: 0,
                error: null,
            },
            already_running: false,
        } as never);
        vi.mocked(osTravelApi.getOsTravelRefreshStatus).mockResolvedValue({
            data: {
                id: '42',
                status: 'completed',
                started_at: '2026-08-14T10:00:00Z',
                finished_at: '2026-08-14T10:01:00Z',
                updated: 1,
                omitted: 0,
                omitted_ids: [],
                failed_ids: [],
                error: null,
            },
        } as never);
        vi.mocked(osTravelApi.getOsTravelReferences).mockResolvedValue({
            data: {
                countries: [
                    { id: '219', name: 'Tunisie' },
                    { id: '220', name: 'Turquie' },
                ],
                cities: [
                    { id: '12', name: 'Kelibia', country_id: '219' },
                    { id: '501', name: 'Sousse', country_id: '219' },
                ],
            },
        } as never);

        __setRefreshPollMs(0);
    });

    afterEach(() => {
        cleanup();
        localStorage.removeItem('role');
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('renders pending list with the missing-price reason', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValueOnce({
            data: [
                makeRow(),
                makeRow({
                    id: '2',
                    external_id: '102',
                    name: 'Hotel No Price',
                    has_base_price: false,
                    base_price: null,
                    price_status: 'no_availability',
                }),
            ],
        } as never);

        renderAdminOsTravel();

        expect(await screen.findByText('Hotel Test')).toBeInTheDocument();
        expect(await screen.findByText('Hotel No Price')).toBeInTheDocument();
        expect(
            screen.getAllByText('No availability at refresh').length,
        ).toBeGreaterThan(0);
        expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    });

    it('shows the reactivated indicator from the dashboard', async () => {
        renderAdminOsTravel();

        expect(await screen.findByText(/reactivated/i)).toBeInTheDocument();
    });

    it('renders the empty state when there are no hotels', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValueOnce({
            data: [],
        } as never);

        renderAdminOsTravel();

        expect(
            await screen.findByText('No hotels to display.'),
        ).toBeInTheDocument();
    });

    it('opens the preview dialog and saves the price without approving', async () => {
        vi.mocked(osTravelApi.getOsTravelHotel).mockResolvedValueOnce({
            data: makeDetail(makeRow()),
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        const previewButtons = screen.getAllByRole('button', {
            name: 'Preview',
        });
        fireEvent.click(previewButtons[0]);

        expect(
            await screen.findByText('A lovely resort by the sea.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Half Board, All Inclusive'),
        ).toBeInTheDocument();
        expect(screen.getByText('Final price')).toBeInTheDocument();

        const basePriceInput = screen.getByLabelText('Base price');
        fireEvent.change(basePriceInput, { target: { value: '250' } });

        expect(screen.getByText('300 TND')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Save price' }));

        await waitFor(() => {
            expect(osTravelApi.updateOsTravelHotel).toHaveBeenCalledWith('1', {
                base_price: 250,
                markup_percentage: 20,
                currency: 'TND',
            });
        });
    });

    it('approves a hotel with base price + markup + currency', async () => {
        vi.mocked(osTravelApi.getOsTravelHotel).mockResolvedValueOnce({
            data: makeDetail(
                makeRow({ has_base_price: false, base_price: null }),
            ),
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[0]);

        await screen.findByText('A lovely resort by the sea.');
        await screen.findByText('Final price');

        fireEvent.change(screen.getByLabelText('Base price'), {
            target: { value: '150' },
        });
        fireEvent.change(screen.getByLabelText('Markup (%)'), {
            target: { value: '15' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

        await waitFor(() => {
            expect(osTravelApi.approveOsTravelHotel).toHaveBeenCalledWith('1', {
                base_price: 150,
                markup_percentage: 15,
                currency: 'TND',
            });
        });
    });

    it('shows a pre-flight skipped count and runs bulk approve', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValueOnce({
            data: [
                makeRow(),
                makeRow({
                    id: '2',
                    external_id: '102',
                    name: 'No Price Hotel',
                    has_base_price: false,
                    base_price: null,
                }),
            ],
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.click(screen.getByRole('button', { name: 'Approve All' }));

        expect(
            await screen.findByText(
                '1 hotel(s) will be skipped for missing price.',
            ),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Approve All' }));

        await waitFor(() => {
            expect(osTravelApi.approveAllOsTravelHotels).toHaveBeenCalled();
        });
    });

    it('rejects a hotel through the confirm dialog', async () => {
        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0]);

        expect(
            await screen.findByText('Reject this hotel?'),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

        await waitFor(() => {
            expect(osTravelApi.rejectOsTravelHotel).toHaveBeenCalledWith('1');
        });
    });

    it('refreshes all staged prices through the bulk button', async () => {
        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.click(
            screen.getByRole('button', { name: 'Refresh prices' }),
        );

        await waitFor(() => {
            expect(osTravelApi.refreshOsTravelPrices).toHaveBeenCalledWith(
                undefined,
            );
        });

        // The polling loop observes the completed status and finishes.
        await waitFor(() => {
            expect(osTravelApi.getOsTravelRefreshStatus).toHaveBeenCalledWith(
                '42',
            );
        });
    });

    it('refreshes a single hotel price from the row action', async () => {
        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.click(
            screen.getByRole('button', { name: 'Refresh price' }),
        );

        await waitFor(() => {
            expect(osTravelApi.refreshOsTravelPrice).toHaveBeenCalledWith('1');
        });
    });

    it('fetches a live price in the preview and hydrates the form', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValueOnce({
            data: [
                makeRow({
                    id: '5',
                    external_id: '105',
                    name: 'Fetch Me',
                    has_base_price: false,
                    base_price: null,
                }),
            ],
        } as never);
        vi.mocked(osTravelApi.getOsTravelHotel).mockResolvedValueOnce({
            data: makeDetail(
                makeRow({
                    id: '5',
                    external_id: '105',
                    name: 'Fetch Me',
                    has_base_price: false,
                    base_price: null,
                }),
            ),
        } as never);
        vi.mocked(osTravelApi.refreshOsTravelPrice).mockResolvedValueOnce({
            data: {
                ...makeRow({
                    id: '5',
                    external_id: '105',
                    name: 'Fetch Me',
                    has_base_price: true,
                    base_price: 340,
                }),
                refresh: { updated: 1, omitted: 0 },
            },
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Fetch Me');

        fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[0]);

        expect(
            await screen.findByText('A lovely resort by the sea.'),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Fetch price' }));

        await waitFor(() => {
            expect(osTravelApi.refreshOsTravelPrice).toHaveBeenCalledWith('5');
        });

        expect(await screen.findByDisplayValue('340')).toBeInTheDocument();
    });

    it('lists the live-check status per row when a date filter is active', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValueOnce({
            data: [
                makeRow({
                    id: '7',
                    external_id: '107',
                    name: 'Live Hotel',
                    live_status: 'available',
                    live_price: 180,
                    live_currency: 'TND',
                }),
                makeRow({
                    id: '8',
                    external_id: '108',
                    name: 'Live Off',
                    live_status: 'no_availability',
                    live_price: null,
                }),
            ],
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Live Hotel');

        expect(screen.getByText('180 TND')).toBeInTheDocument();
        expect(
            screen.getAllByText('No availability on these dates').length,
        ).toBeGreaterThan(0);
    });

    it('sends country and city filters to the hotels endpoint', async () => {
        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        const countrySelect = screen.getByRole('combobox', {
            name: /country/i,
        });
        fireEvent.click(countrySelect);
        fireEvent.click(
            await screen.findByRole('option', { name: 'Tunisie' }),
        );

        await waitFor(() => {
            expect(osTravelApi.listOsTravelHotels).toHaveBeenCalledWith(
                expect.objectContaining({ country_id: '219' }),
            );
        });

        const citySelect = screen.getByRole('combobox', { name: /city/i });
        fireEvent.click(citySelect);
        fireEvent.click(await screen.findByRole('option', { name: 'Kelibia' }));

        await waitFor(() => {
            expect(osTravelApi.listOsTravelHotels).toHaveBeenCalledWith(
                expect.objectContaining({ city_id: '12' }),
            );
        });
    });
});
