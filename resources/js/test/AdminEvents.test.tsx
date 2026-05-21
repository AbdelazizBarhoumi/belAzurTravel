import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import AdminEvents from '@/pages/admin/AdminEvents';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/api/admin.api');

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <SiteSettingsProvider>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminEvents />
                    </MemoryRouter>
                </LanguageProvider>
            </SiteSettingsProvider>
        </QueryClientProvider>,
    );
}

describe('AdminEvents', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.clearAllMocks();
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: '1',
                image: '/images/event.jpg',
                title_en: 'Cherry Blossom Festival',
                location_en: 'Tokyo',
                date_en: '2026-04-10',
                price: 120,
            },
        ] as never);
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('renders an image column and thumbnail in the events table', async () => {
        renderPage();

        expect(
            await screen.findByRole('columnheader', { name: 'Image' }),
        ).toBeInTheDocument();
        expect(
            await screen.findByRole('img', {
                name: 'Cherry Blossom Festival',
            }),
        ).toHaveAttribute('src', '/images/event.jpg');
    });
});
