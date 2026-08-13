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
import AdminOsTravel from '@/pages/admin/AdminOsTravel';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/api/osTravel.api', () => ({
    getOsTravelDashboard: vi.fn(),
    listOsTravelHotels: vi.fn(),
    getOsTravelHotel: vi.fn(),
    updateOsTravelHotel: vi.fn(),
    approveOsTravelHotel: vi.fn(),
    approveAllOsTravelHotels: vi.fn(),
    rejectOsTravelHotel: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

const makeRow = (
    overrides: Partial<osTravelApi.OsTravelHotelRow> = {},
): osTravelApi.OsTravelHotelRow => ({
    id: '1',
    external_id: '101',
    name: 'Hotel Test',
    city_external_id: '501',
    city_name: 'Sousse',
    category_title: 'Resort',
    stars: 5,
    image: 'http://cdn.test/h.jpg',
    status: 'pending',
    has_base_price: true,
    base_price: 200,
    markup_percentage: '20.00',
    currency: 'TND',
    hotel_id: null,
    hotel_slug: null,
    approved_by: null,
    approved_at: null,
    rejected_at: null,
    last_synced_at: '2026-08-01 10:00:00',
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
    });

    afterEach(() => {
        cleanup();
        localStorage.removeItem('role');
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('renders pending list with the missing-price flag', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValueOnce({
            data: [
                makeRow(),
                makeRow({
                    id: '2',
                    external_id: '102',
                    name: 'Hotel No Price',
                    has_base_price: false,
                    base_price: null,
                }),
            ],
        } as never);

        renderAdminOsTravel();

        expect(await screen.findByText('Hotel Test')).toBeInTheDocument();
        expect(await screen.findByText('Hotel No Price')).toBeInTheDocument();
        expect(screen.getAllByText('Missing price').length).toBeGreaterThan(0);
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
});
