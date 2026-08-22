import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/api/http';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import type { AppNotification } from '@/components/ui/NotificationBell';
import { LanguageProvider } from '@/contexts/LanguageContext';

vi.mock('@/api/http', () => ({
    apiFetch: vi.fn(),
}));

const notifications: AppNotification[] = [
    {
        id: 'n-1',
        type: 'booking.created',
        data: {
            en: 'New booking received',
            fr: 'Nouvelle réservation reçue',
            ar: 'تم استلام حجز جديد',
        },
        read_at: null,
        created_at: new Date().toISOString(),
    },
    {
        id: 'n-2',
        type: 'booking.confirmed',
        data: {
            en: 'Booking confirmed',
            fr: 'Réservation confirmée',
            ar: 'تم تأكيد الحجز',
            url: '/admin/bookings/5',
        },
        read_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
];

describe('NotificationCenter', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.mocked(apiFetch).mockImplementation(async (url: string) => {
            if (url === '/api/notifications') {
                return notifications as never;
            }
            return {} as never;
        });
    });

    const renderCenter = () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter initialEntries={['/client/notifications']}>
                        <NotificationCenter panelLabel="Your notifications" />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>,
        );

        return queryClient;
    };

    it('renders the panel label and unread count', async () => {
        renderCenter();

        expect(
            await screen.findByText((content) =>
                content.includes('Your notifications'),
            ),
        ).toBeInTheDocument();
        expect(
            await screen.findByText((content) => content.includes('1 unread')),
        ).toBeInTheDocument();
    });

    it('renders each notification message', async () => {
        renderCenter();

        expect(
            await screen.findByText('New booking received'),
        ).toBeInTheDocument();
        expect(screen.getByText('Booking confirmed')).toBeInTheDocument();
    });

    it('links notifications to their target URL', async () => {
        renderCenter();

        await screen.findByText('Booking confirmed');
        const link = screen
            .getAllByRole('link', { name: 'Booking' })
            .find((el) => el.getAttribute('href') === '/admin/bookings/5');
        expect(link).toBeDefined();
        expect(link).toHaveAttribute('href', '/admin/bookings/5');
    });

    it('marks all notifications as read', async () => {
        renderCenter();

        await screen.findByText('New booking received');
        const button = screen.getByText('Mark all read');
        expect(button).not.toBeDisabled();

        fireEvent.click(button);
        await waitFor(() =>
            expect(apiFetch).toHaveBeenCalledWith(
                '/api/notifications/read-all',
                { method: 'PATCH' },
            ),
        );
    });

    it('filters to unread notifications only', async () => {
        renderCenter();

        await screen.findByText('New booking received');
        fireEvent.click(screen.getByText('Unread (1)'));

        expect(screen.getByText('New booking received')).toBeInTheDocument();
        expect(screen.queryByText('Booking confirmed')).not.toBeInTheDocument();
    });

    it('deletes a notification', async () => {
        renderCenter();

        await screen.findByText('New booking received');
        const deleteButton = screen
            .getByText('New booking received')
            .closest('div.group')
            ?.querySelectorAll('button');
        const trash = deleteButton?.[deleteButton.length - 1];
        expect(trash).toBeDefined();
        fireEvent.click(trash!);

        await waitFor(() =>
            expect(apiFetch).toHaveBeenCalledWith('/api/notifications/n-1', {
                method: 'DELETE',
            }),
        );
    });
});
