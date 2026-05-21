import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import AdminDeals from '@/pages/admin/AdminDeals';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/api/admin.api', () => ({
    listAdminEntities: vi.fn(),
    saveAdminEntity: vi.fn().mockResolvedValue({}),
    deleteAdminEntity: vi.fn().mockResolvedValue({}),
}));

function renderAdminDealsPage() {
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
                    <MemoryRouter initialEntries={['/admin/deals']}>
                        <AdminDeals />
                    </MemoryRouter>
                </SiteSettingsProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('Admin deals editor', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([] as never);
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('submits deal data with correctly mapped localized fields', async () => {
        vi.mocked(adminApi.saveAdminEntity).mockResolvedValueOnce({} as never);

        renderAdminDealsPage();

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
        await screen.findByRole('dialog');

        fireEvent.change(screen.getByLabelText(/Title/i), {
            target: { value: 'Summer Deal' },
        });
        fireEvent.change(screen.getByLabelText(/Discount/i), {
            target: { value: '20%' },
        });
        fireEvent.change(screen.getByLabelText(/Expires/i), {
            target: { value: '2026-06-30' },
        });
        fireEvent.change(screen.getByLabelText(/Category/i), {
            target: { value: 'Summer' },
        });

        fireEvent.click(screen.getByText(/Save/i));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [entityType, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];
        expect(entityType).toBe('deals');
        expect(payload).toEqual(
            expect.objectContaining({
                title_en: 'Summer Deal',
                discount_en: '20%',
                expires_en: '2026-06-30',
                category_en: 'Summer',
            }),
        );
    });
});
