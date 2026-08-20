import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminPromos from '@/pages/admin/AdminPromos';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/api/admin.api', () => ({
    listAdminEntities: vi.fn(),
    saveAdminEntity: vi.fn(),
    deleteAdminEntity: vi.fn().mockResolvedValue({}),
}));

function renderAdminPromosPage() {
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
                <MemoryRouter initialEntries={['/admin/promos']}>
                    <AdminPromos />
                </MemoryRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('Admin promos editor', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([] as never);
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    const fillRequiredFields = async () => {
        const textboxes = screen.getAllByRole('textbox');
        fireEvent.change(textboxes[0], {
            target: { value: 'PROMO-2026' },
        });
        fireEvent.change(textboxes[1], {
            target: { value: 'Summer Promo' },
        });
        const discountInput = screen
            .getAllByRole('spinbutton')
            .find((el) => el.nextElementSibling?.textContent === '%');
        expect(discountInput).toBeDefined();
        fireEvent.change(discountInput as HTMLInputElement, {
            target: { value: '10' },
        });

        // Pick a date range so the `expires` field (a daterange) validates.
        fireEvent.click(screen.getByRole('button', { name: /choose dates/i }));
        const clickDay = (day: string) => {
            const dayButton = Array.from(
                document.querySelectorAll('button[name="day"]'),
            ).find((b) => (b.textContent ?? '').trim() === day);
            expect(dayButton).toBeDefined();
            fireEvent.click(dayButton as HTMLButtonElement);
        };
        clickDay('15');
        clickDay('20');
    };

    it('marks localized language tabs when the save request returns validation errors', async () => {
        vi.mocked(adminApi.saveAdminEntity).mockRejectedValueOnce({
            status: 422,
            data: {
                message: 'Validation failed',
                errors: {
                    title_fr: ['French title is required'],
                },
            },
        });

        renderAdminPromosPage();

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
        await screen.findByRole('dialog');

        await fillRequiredFields();

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        expect(screen.getByRole('button', { name: /^FR/i })).toHaveClass(
            'border-destructive',
        );
    });

    it('does not include gallery fields in the promo save payload', async () => {
        vi.mocked(adminApi.saveAdminEntity).mockResolvedValueOnce({} as never);

        renderAdminPromosPage();

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
        await screen.findByRole('dialog');

        await fillRequiredFields();

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [, payload] = vi.mocked(adminApi.saveAdminEntity).mock.calls[0];

        expect(payload).not.toHaveProperty('gallery');
        expect(payload).not.toHaveProperty('galleryPaths');
        expect(payload).not.toHaveProperty('galleryFiles');
    });
});
