import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/api/http';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { LanguageProvider } from '@/contexts/LanguageContext';

vi.mock('@/api/http', () => ({
    apiFetch: vi.fn(),
}));

describe('NotificationBell', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.mocked(apiFetch).mockImplementation(async (url: string) => {
            if (url.includes('/notifications?limit=10&include_count=1')) {
                return {
                    count: 2,
                    notifications: [
                        {
                            id: 'notif-1',
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
                            id: 'notif-2',
                            type: 'message.new',
                            data: null,
                            read_at: null,
                            created_at: new Date().toISOString(),
                        },
                    ],
                } as never;
            }

            return {} as never;
        });
    });

    it('falls back to the feed path when a notification has no URL', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter initialEntries={['/admin/dashboard']}>
                        <NotificationBell feedPath="/admin/notifications" />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>,
        );

        expect(
            await screen.findByText('New booking received'),
        ).toBeInTheDocument();

        expect(apiFetch).toHaveBeenCalledTimes(1);
        expect(apiFetch).toHaveBeenCalledWith(
            '/api/notifications?limit=10&include_count=1',
        );

        const link = screen.getByText('New booking received').closest('a');
        expect(link).toHaveAttribute('href', '/admin/notifications');
    });
});
