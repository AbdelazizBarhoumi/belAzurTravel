import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    act,
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

const mockDateRangePickerProps: {
    onChange?: (range: { from?: Date; to?: Date } | undefined) => void;
} = {};

vi.mock('@/components/ui/DateRangePicker', () => ({
    DateRangePicker: (props: Record<string, unknown>) => {
        Object.assign(mockDateRangePickerProps, props);
        return <div data-testid="date-range-picker" />;
    },
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
    unapproveOsTravelHotel: vi.fn(),
    reopenOsTravelHotel: vi.fn(),
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
    live_reason: null,
    live_until: null,
    base_price: null,
    final_price: null,
    ...overrides,
});

const makeDetail = (
    row: osTravelApi.OsTravelHotelRow,
): osTravelApi.OsTravelHotelDetail => ({
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
                    approved: 1,
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
            data: makeRow({ status: 'approved', hotel_id: '99' }),
        } as never);
        vi.mocked(osTravelApi.approveAllOsTravelHotels).mockResolvedValue({
            data: {
                approved: ['1'],
                failed: [],
                skipped_no_image: [],
                approved_count: 1,
                failed_count: 0,
                skipped_no_image_count: 0,
            },
        } as never);
        vi.mocked(osTravelApi.rejectOsTravelHotel).mockResolvedValue({
            data: makeRow({ status: 'rejected' }),
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
    });

    afterEach(() => {
        cleanup();
        localStorage.removeItem('role');
        localStorage.removeItem('lang');
        vi.clearAllMocks();
        delete mockDateRangePickerProps.onChange;
    });

    it('renders the pending list with hotel names', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValueOnce({
            data: [
                makeRow(),
                makeRow({
                    id: '2',
                    external_id: '102',
                    name: 'Hotel No Live Price',
                    live_price: null,
                    live_status: null,
                }),
            ],
        } as never);

        renderAdminOsTravel();

        expect(await screen.findByText('Hotel Test')).toBeInTheDocument();
        expect(
            await screen.findByText('Hotel No Live Price'),
        ).toBeInTheDocument();
        expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    });

    it('shows the min price and the final price with markup', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValueOnce({
            data: [
                makeRow({
                    live_price: 200,
                    live_currency: 'TND',
                    base_price: 200,
                    final_price: 240,
                    markup_percentage: '20.00',
                }),
                makeRow({
                    id: '2',
                    external_id: '102',
                    name: 'Hotel No Live Price',
                    live_price: null,
                    base_price: null,
                    final_price: null,
                }),
            ],
        } as never);

        renderAdminOsTravel();

        expect(await screen.findByText('Hotel Test')).toBeInTheDocument();
        // Min price = raw provider price.
        expect(screen.getByText('200 TND')).toBeInTheDocument();
        // Final price = raw price + 20% markup.
        expect(screen.getByText('240 TND')).toBeInTheDocument();
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

    it('renders the description and boarding in the preview', async () => {
        vi.mocked(osTravelApi.getOsTravelHotel).mockResolvedValueOnce({
            data: makeDetail(makeRow()),
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[0]);

        expect(
            await screen.findByText('A lovely resort by the sea.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Half Board, All Inclusive'),
        ).toBeInTheDocument();
    });

    it('opens the preview dialog and saves markup + currency without approving', async () => {
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

        const markupInput = screen.getByLabelText('Markup (%)');
        fireEvent.change(markupInput, { target: { value: '15' } });

        fireEvent.click(screen.getByRole('button', { name: 'Save price' }));

        await waitFor(() => {
            expect(osTravelApi.updateOsTravelHotel).toHaveBeenCalledWith('1', {
                markup_percentage: 15,
                currency: 'TND',
            });
        });
    });

    it('approves a hotel with markup + currency', async () => {
        vi.mocked(osTravelApi.getOsTravelHotel).mockResolvedValueOnce({
            data: makeDetail(makeRow()),
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[0]);

        await screen.findByText('A lovely resort by the sea.');

        fireEvent.change(screen.getByLabelText('Markup (%)'), {
            target: { value: '15' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

        await waitFor(() => {
            expect(osTravelApi.approveOsTravelHotel).toHaveBeenCalledWith('1', {
                markup_percentage: 15,
                currency: 'TND',
            });
        });
    });

    it('shows the missing-image checkbox and runs bulk approve with opt-in flags', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValue({
            data: [
                makeRow(),
                makeRow({
                    id: '2',
                    external_id: '102',
                    name: 'No Image Hotel',
                    image: null,
                }),
            ],
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.click(screen.getByRole('button', { name: /Pending/i }));

        const approveAll = screen.getByRole('button', {
            name: 'Approve All',
        });
        await waitFor(() => expect(approveAll).not.toBeDisabled());
        fireEvent.click(approveAll);

        const warningCheckbox = screen.getByRole('checkbox', {
            name: 'Also approve 1 hotel(s) without pictures.',
        });
        expect(warningCheckbox).not.toBeChecked();

        fireEvent.click(warningCheckbox);
        expect(warningCheckbox).toBeChecked();

        fireEvent.click(screen.getByRole('button', { name: 'Approve All' }));

        await waitFor(() => {
            expect(osTravelApi.approveAllOsTravelHotels).toHaveBeenCalledWith({
                include_without_image: true,
                status: 'pending',
            });
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

    it('shows an approve button on a rejected hotel to undo the reject', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValue({
            data: [makeRow({ status: 'rejected' })],
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        expect(
            screen.getAllByRole('button', { name: 'Approve' }).length,
        ).toBeGreaterThan(0);
        expect(screen.queryAllByRole('button', { name: 'Reject' }).length).toBe(
            0,
        );
    });

    it('returns a rejected hotel to pending through the trash button', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValue({
            data: [makeRow({ status: 'rejected' })],
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.click(
            screen.getByRole('button', { name: 'Return to pending' }),
        );

        expect(
            await screen.findByText('Return this hotel to pending?'),
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', { name: 'Return to pending' }),
        );

        await waitFor(() => {
            expect(osTravelApi.reopenOsTravelHotel).toHaveBeenCalledWith('1');
        });
    });

    it('unapproves an approved hotel through the confirm dialog', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValue({
            data: [makeRow({ status: 'approved' })],
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.click(
            screen.getAllByRole('button', { name: 'Unapprove' })[0],
        );

        expect(
            await screen.findByText('Unapprove this hotel?'),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Unapprove' }));

        await waitFor(() => {
            expect(osTravelApi.unapproveOsTravelHotel).toHaveBeenCalledWith(
                '1',
            );
        });
    });

    it('lists the live-check price and status per row when a date filter is active', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValueOnce({
            data: [
                makeRow({
                    id: '7',
                    external_id: '107',
                    name: 'Live Hotel',
                    live_status: 'available',
                    live_price: 180,
                    live_currency: 'TND',
                    base_price: 180,
                    final_price: 216,
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
        // A hotel with no live price for the picked window shows "-" in the
        // live column alongside the reason badge.
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('explains a min-stay rejection in the live column', async () => {
        vi.mocked(osTravelApi.listOsTravelHotels).mockResolvedValue({
            data: [
                makeRow({
                    id: '10',
                    external_id: '110',
                    name: 'Min Stay Hotel',
                    live_status: 'min_stay',
                    live_price: null,
                    live_reason: 'Minimum stay of 5 nights required',
                }),
            ],
        } as never);

        renderAdminOsTravel();

        await screen.findByText('Min Stay Hotel');

        // Drive the (mocked) date filter.
        act(() => {
            mockDateRangePickerProps.onChange?.({
                from: new Date('2026-08-17T00:00:00'),
                to: new Date('2026-08-19T00:00:00'),
            });
        });

        expect(await screen.findByText('Needs at least')).toBeInTheDocument();
    });

    it('sends country and city filters to the hotels endpoint', async () => {
        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        const countrySelect = screen.getByRole('combobox', {
            name: /country/i,
        });
        fireEvent.click(countrySelect);
        fireEvent.click(await screen.findByRole('option', { name: 'Tunisia' }));

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

    it('sends the stars filter to the hotels endpoint', async () => {
        renderAdminOsTravel();

        await screen.findByText('Hotel Test');

        fireEvent.change(screen.getByRole('combobox', { name: /stars/i }), {
            target: { value: '4' },
        });

        await waitFor(() => {
            expect(osTravelApi.listOsTravelHotels).toHaveBeenCalledWith(
                expect.objectContaining({ stars: 4 }),
            );
        });
    });

    it('shows the orphaned badge from the dashboard', async () => {
        renderAdminOsTravel();

        expect(
            await screen.findByText('1 orphaned hotel(s)'),
        ).toBeInTheDocument();
    });
});
