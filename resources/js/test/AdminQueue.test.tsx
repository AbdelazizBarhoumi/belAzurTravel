import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/api/http';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminQueue from '@/pages/admin/AdminQueue';

vi.mock('@/api/http', () => ({
    apiFetch: vi.fn(),
}));

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/components/layout/AdminLayout', () => ({
    AdminLayout: ({
        title,
        children,
    }: {
        title: string;
        children: React.ReactNode;
    }) => (
        <div>
            <h1>{title}</h1>
            {children}
        </div>
    ),
}));

const mockBookings = [
    {
        id: '550e8400-e29b-41d4-a716-446655440055',
        booking_ref: 55,
        user_id: 3,
        type: 'hotel',
        items: [],
        start_date: '2026-09-15',
        end_date: '2026-09-20',
        client: { name: 'Sofia Ben Ali' },
        total_amount: 850,
        status: 'Pending',
        created_at: new Date().toISOString(),
    },
];

const mockComplaints = [
    {
        id: 21,
        type: 'complaint',
        subject: { en: 'Noise at night', fr: 'Bruit la nuit' },
        description: { en: 'Loud music after midnight.' },
        booking_id: '550e8400-e29b-41d4-a716-446655440055',
        booking: {
            id: '550e8400-e29b-41d4-a716-446655440055',
            booking_ref: 55,
            type: 'hotel',
            total_amount: 850,
            status: 'Pending',
        },
        status: 'pending',
        priority: 'high',
        created_at: new Date().toISOString(),
        replies: [],
    },
];

describe('AdminQueue', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.mocked(apiFetch).mockImplementation(async (url: string) => {
            if (url === '/api/admin/queue') {
                return {
                    counts: {
                        bookings: 0,
                        complaints: 0,
                        refund_requests: 0,
                        support: 0,
                        total: 0,
                    },
                    bookings: [],
                    complaints: [],
                    refund_requests: [],
                    support: [],
                } as never;
            }
            if (url === '/api/admin/bookings') {
                return mockBookings as never;
            }
            if (url.startsWith('/api/admin/complaints')) {
                return mockComplaints as never;
            }
            return {} as never;
        });
    });

    const renderQueue = () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter initialEntries={['/admin/queue']}>
                        <AdminQueue />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>,
        );
    };

    it('renders the section tabs with counts', async () => {
        renderQueue();

        expect(await screen.findByText('Bookings')).toBeInTheDocument();
        expect(screen.getByText('Complaints')).toBeInTheDocument();
        expect(screen.getByText('Refunds')).toBeInTheDocument();
        expect(screen.getByText('Support')).toBeInTheDocument();
    });

    it('lists bookings with client name and status', async () => {
        renderQueue();

        expect(await screen.findByText('Sofia Ben Ali')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('switches to the complaints section', async () => {
        renderQueue();

        await screen.findByText('Sofia Ben Ali');
        fireEvent.click(screen.getByText('Complaints'));

        expect(await screen.findByText('Noise at night')).toBeInTheDocument();
    });

    it('shows the empty state when a section has no items', async () => {
        renderQueue();

        await screen.findByText('Sofia Ben Ali');
        fireEvent.click(screen.getByText('Support'));

        expect(
            await screen.findByText('Nothing to handle here.'),
        ).toBeInTheDocument();
    });
});
