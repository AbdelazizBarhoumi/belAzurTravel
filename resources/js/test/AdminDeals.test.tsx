import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { fetchCategories } from '@/api/categories.api';
import { fetchCategoryTypes } from '@/api/categoryTypes.api';
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

vi.mock('@/api/categories.api', () => ({
    fetchCategories: vi.fn(),
}));

vi.mock('@/api/categoryTypes.api', () => ({
    fetchCategoryTypes: vi.fn(),
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
        vi.mocked(fetchCategories).mockResolvedValue([
            {
                id: 1,
                entity_type: 'deals',
                key: 'summer',
                name: {
                    en: 'Summer',
                    fr: 'Été',
                    ar: 'صيف',
                },
            },
        ] as never);
        vi.mocked(fetchCategoryTypes).mockResolvedValue([
            {
                id: 1,
                entity_type: 'deals',
                key: 'category',
                label: { en: 'Category', fr: 'Catégorie', ar: 'الفئة' },
                sort_order: 0,
                filter_style: 'select',
                values: [
                    {
                        id: 1,
                        key: 'summer',
                        name: { en: 'Summer', fr: 'Été', ar: 'صيف' },
                    },
                ],
            },
        ] as never);
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
        fireEvent.change(screen.getByLabelText(/Description/i), {
            target: { value: 'English description' },
        });
        fireEvent.change(screen.getByLabelText(/Discount/i), {
            target: { value: '20%' },
        });
        fireEvent.change(screen.getByLabelText(/Expires/i), {
            target: { value: '2026-06-30' },
        });

        fireEvent.click(screen.getByRole('combobox'));
        fireEvent.click(await screen.findByRole('option', { name: 'Summer' }));

        fireEvent.click(screen.getByRole('button', { name: 'FR' }));
        fireEvent.change(screen.getByLabelText(/Title/i), {
            target: { value: 'Offre d’été' },
        });
        fireEvent.change(screen.getByLabelText(/Description/i), {
            target: { value: 'Description française' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'AR' }));
        fireEvent.change(screen.getByLabelText(/Title/i), {
            target: { value: 'عرض الصيف' },
        });
        fireEvent.change(screen.getByLabelText(/Description/i), {
            target: { value: 'وصف عربي' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'EN' }));

        const dialog = await screen.findByRole('dialog');
        fireEvent.click(within(dialog).getByText(/Save/i));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [entityType, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];
        expect(entityType).toBe('deals');
        expect(payload).toEqual(
            expect.objectContaining({
                title_en: 'Summer Deal',
                title_fr: 'Offre d’été',
                title_ar: 'عرض الصيف',
                description_en: 'English description',
                description_fr: 'Description française',
                description_ar: 'وصف عربي',
                discount_en: '20%',
                expires_en: '2026-06-30',
                category_key: 'summer',
                category: 'summer',
            }),
        );
    });

    it('preserves highlight arrays when editing an existing deal', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValueOnce([
            {
                id: 'deal-1',
                title_en: 'Existing Deal',
                title_fr: 'Offre existante',
                title_ar: 'عرض موجود',
                description_en: 'Description',
                description_fr: 'Description',
                description_ar: 'Description',
                discount_en: '15%',
                expires_en: '2026-12-31',
                category_key: 'summer',
                category_en: 'Summer',
                highlights_en: ['First highlight', 'Second highlight'],
                highlights_fr: ['Premier point', 'Deuxième point'],
                highlights_ar: ['النقطة الأولى', 'النقطة الثانية'],
                terms_en: ['Term A'],
                terms_fr: ['Condition A'],
                terms_ar: ['الشرط أ'],
            },
        ] as never);

        renderAdminDealsPage();

        fireEvent.click(await screen.findByRole('button', { name: /edit/i }));
        await screen.findByRole('dialog');

        expect(screen.getByRole('combobox')).toHaveTextContent('Summer');

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [entityType, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];
        expect(entityType).toBe('deals');
        expect(payload).toEqual(
            expect.objectContaining({
                highlights_en: ['First highlight', 'Second highlight'],
                terms_en: ['Term A'],
            }),
        );
    });
});
