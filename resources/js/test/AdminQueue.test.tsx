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

const queuePayload = {
    counts: {
        bookings: 1,
        complaints: 1,
        refund_requests: 0,
        support: 0,
        total: 2,
    },
    bookings: [
        {
            id: 11,
            user_id: 3,
            type: 'hotel',
            items: [],
            start_date: '2026-09-15',
            end_date: '2026-09-20',
            client: { name: 'Sofia Ben Ali', email: 'sofia@example.com' },
            total_amount: 850,
            status: 'Pending',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 86_400_000).toISOString(),
            is_provider: false,
            audits: [],
        },
    ],
    complaints: [
        {
            id: 21,
            type: 'complaint',
            subject: { en: 'Noise at night', fr: 'Bruit la nuit' },
            description: { en: 'Loud music after midnight.' },
            booking_id: 11,
            status: 'new',
            priority: 'high',
            created_at: new Date().toISOString(),
            replies: [],
        },
    ],
    refund_requests: [],
    support: [],
};

describe('AdminQueue', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.mocked(apiFetch).mockImplementation(async (url: string) => {
            if (url === '/api/admin/queue') {
                return queuePayload as never;
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
        expect((await screen.findAllByText('1')).length).toBeGreaterThan(0);
    });

    it('lists pending bookings with client name and status', async () => {
        renderQueue();

        expect(await screen.findByText('Sofia Ben Ali')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('850 TND')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument();
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
