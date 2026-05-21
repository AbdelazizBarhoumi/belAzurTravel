import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { fetchCategories } from '@/api/categories.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminBlog from '@/pages/admin/AdminBlog';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/hooks/useSiteSettings', () => ({
    useSiteSettings: () => ({
        settings: {
            config: {
                navigation: {
                    enabled_dropdowns: ['blog'],
                },
            },
        },
        loading: false,
    }),
}));

vi.mock('@/api/admin.api', () => ({
    listAdminEntities: vi.fn(),
    saveAdminEntity: vi.fn().mockResolvedValue({}),
    deleteAdminEntity: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/api/categories.api', () => ({
    fetchCategories: vi.fn(),
}));

function renderAdminBlogPage() {
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
                <MemoryRouter initialEntries={['/admin/blog']}>
                    <AdminBlog />
                </MemoryRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('Admin blog editor', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([] as never);
        vi.mocked(fetchCategories).mockResolvedValue([
            {
                id: 1,
                entity_type: 'blog',
                key: 'travel-tips',
                name: {
                    en: 'Travel Tips',
                    fr: 'Conseils de voyage',
                    ar: 'نصائح السفر',
                },
            },
        ] as never);
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('shows the main image upload control in the add dialog', async () => {
        renderAdminBlogPage();

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('Main image')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });
    });

    it('renders a blog image thumbnail in the table', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: 1,
                title_en: 'Spring Updates',
                title_fr: 'Mises à jour du printemps',
                title_ar: 'تحديثات الربيع',
                excerpt_en: 'Short summary',
                excerpt_fr: 'Résumé court',
                excerpt_ar: 'ملخص قصير',
                category_en: 'Travel',
                category_fr: 'Voyage',
                category_ar: 'السفر',
                category_key: 'seasonal-spring',
                date: 'May 14, 2026',
                image: '/images/hero-travel.jpg',
                content: { body: { en: '', fr: '', ar: '' }, sections: [] },
            },
        ] as never);

        renderAdminBlogPage();

        expect(
            await screen.findByAltText('Spring Updates'),
        ).toBeInTheDocument();
        expect(screen.getByText('Travel')).toBeInTheDocument();
    });

    it('formats blog dates in the table instead of showing raw ISO timestamps', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: 1,
                title_en: 'Spring Updates',
                title_fr: 'Mises à jour du printemps',
                title_ar: 'تحديثات الربيع',
                excerpt_en: 'Short summary',
                excerpt_fr: 'Résumé court',
                excerpt_ar: 'ملخص قصير',
                category_en: 'Travel',
                category_fr: 'Voyage',
                category_ar: 'السفر',
                category_key: 'seasonal-spring',
                date: '2026-05-20T00:00:00.000000Z',
                image: '/images/hero-travel.jpg',
                content: { body: { en: '', fr: '', ar: '' }, sections: [] },
            },
        ] as never);

        renderAdminBlogPage();

        expect(await screen.findByText('May 20, 2026')).toBeInTheDocument();
        expect(
            screen.queryByText('2026-05-20T00:00:00.000000Z'),
        ).not.toBeInTheDocument();
    });

    it.skip('submits an uploaded blog image', async () => {
        renderAdminBlogPage();

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
        await screen.findByRole('dialog');

        fireEvent.change(screen.getByLabelText(/Title \(EN\)/i), {
            target: { value: 'Spring Updates' },
        });
        fireEvent.change(screen.getByLabelText(/Title \(FR\)/i), {
            target: { value: 'Mises à jour du printemps' },
        });
        fireEvent.change(screen.getByLabelText(/Title \(AR\)/i), {
            target: { value: 'تحديثات الربيع' },
        });

        await waitFor(() => {
            expect(
                screen.getByDisplayValue('Spring Updates'),
            ).toBeInTheDocument();
            expect(
                screen.getByDisplayValue('Mises à jour du printemps'),
            ).toBeInTheDocument();
            expect(
                screen.getByDisplayValue('تحديثات الربيع'),
            ).toBeInTheDocument();
        });

        const imageFile = new File(['blog-image'], 'blog.jpg', {
            type: 'image/jpeg',
        });
        fireEvent.change(screen.getByLabelText('Main image'), {
            target: { files: [imageFile] },
        });

        await waitFor(() => {
            expect(
                (screen.getByLabelText('Main image') as HTMLInputElement).files
                    ?.length,
            ).toBe(1);
        });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [entityType, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];
        expect(entityType).toBe('blog-posts');
        expect(payload).toEqual(
            expect.objectContaining({
                image: imageFile,
                title_en: 'Spring Updates',
                title_fr: 'Mises à jour du printemps',
                title_ar: 'تحديثات الربيع',
            }),
        );
    });
});
