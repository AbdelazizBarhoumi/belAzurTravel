import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/api/http';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ClientDashboard from '@/pages/dashboards/Client';

vi.mock('@/api/http', () => ({
    apiFetch: vi.fn(),
}));

vi.mock('@/components/layout/BrandLogo', () => ({
    BrandLogo: () => <div data-testid="brand-logo" />,
}));

const now = new Date();

const bookings = [
    {
        id: 1,
        type: 'hotel',
        item_slug: 'azur-hotel',
        items: [{ slug: 'azur-hotel', qty: 1 }],
        start_date: '2026-10-01',
        end_date: '2026-10-05',
        total_amount: 1200,
        currency: 'TND',
        status: 'Pending',
        can_cancel: true,
        expires_at: new Date(now.getTime() + 86_400_000).toISOString(),
        created_at: now.toISOString(),
    },
    {
        id: 2,
        type: 'hotel',
        item_slug: 'seaside-paradise',
        items: [{ slug: 'seaside-paradise', qty: 1 }],
        start_date: '2026-09-10',
        end_date: '2026-09-13',
        total_amount: 1299,
        currency: 'TND',
        status: 'Confirmed',
        can_cancel: false,
        created_at: now.toISOString(),
        provider_booking_id: 'PX-991',
        provider_booking_reference: 'PX-991',
        provider_prebook: {
            total: 1299,
            currency: 'TND',
            breakdown: {
                check_in: '2026-09-10',
                check_out: '2026-09-13',
                nights: 3,
                voucher: { Num: 'VCH-2026-2' },
                rooms: [
                    {
                        id: 1,
                        boarding: 'Half board',
                        total: 1299,
                        currency: 'TND',
                    },
                ],
            },
        },
    },
    {
        id: 3,
        type: 'tour',
        items: [],
        total_amount: 400,
        currency: 'TND',
        status: 'Rejected',
        can_cancel: false,
        reject_reason: 'Room type unavailable at the provider',
        rejected_at: now.toISOString(),
        created_at: now.toISOString(),
    },
    {
        id: 4,
        type: 'tour',
        items: [],
        total_amount: 250,
        currency: 'TND',
        status: 'Cancelled',
        can_cancel: false,
        cancel_reason: 'Requested by client',
        cancelled_at: now.toISOString(),
        created_at: now.toISOString(),
    },
];

describe('ClientDashboard booking cards', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.mocked(apiFetch).mockImplementation(async (url: string) => {
            if (url === '/api/auth/user') {
                return {
                    user: {
                        name: 'Jane Doe',
                        email: 'jane@example.com',
                        role: 'client',
                    },
                } as never;
            }
            if (url === '/api/client/dashboard') {
                return {
                    stats: {
                        upcomingTrips: 1,
                        totalBookings: 4,
                        payments: 0,
                        unreadNotifications: 0,
                    },
                    bookings,
                    notifications: [],
                } as never;
            }
            if (url === '/api/destinations') {
                return [] as never;
            }
            if (url.includes('/notifications')) {
                return { count: 0, notifications: [] } as never;
            }
            return {} as never;
        });
    });

    const renderDashboard = () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <FavoritesProvider>
                        <MemoryRouter initialEntries={['/client/dashboard']}>
                            <ClientDashboard />
                        </MemoryRouter>
                    </FavoritesProvider>
                </LanguageProvider>
            </QueryClientProvider>,
        );
    };

    it('renders every booking status label', async () => {
        renderDashboard();

        expect(await screen.findByText('#1')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
        expect(screen.getByText('Rejected')).toBeInTheDocument();
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('shows the decision window for a pending booking', async () => {
        renderDashboard();

        await screen.findByText('#1');
        expect(
            screen.getByText((content) =>
                content.includes('Decision expected by'),
            ),
        ).toBeInTheDocument();
    });

    it('shows the rejection reason', async () => {
        renderDashboard();

        await screen.findByText('#3');
        expect(
            screen.getByText((content) => content.includes('Rejection reason')),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Room type unavailable at the provider'),
        ).toBeInTheDocument();
    });

    it('shows the cancellation reason', async () => {
        renderDashboard();

        await screen.findByText('#4');
        expect(
            screen.getByText((content) =>
                content.includes('Cancellation reason'),
            ),
        ).toBeInTheDocument();
        expect(screen.getByText('Requested by client')).toBeInTheDocument();
    });

    it('renders a voucher for a confirmed booking', async () => {
        renderDashboard();

        await screen.findAllByText('#2');
        expect(screen.getAllByText('Voucher').length).toBeGreaterThan(0);
        expect(screen.getByText('PX-991')).toBeInTheDocument();
        expect(screen.getAllByText('1,299 TND').length).toBeGreaterThan(0);
    });
});
