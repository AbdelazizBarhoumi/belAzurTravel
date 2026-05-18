import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminBlog from '@/pages/admin/AdminBlog';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/api/admin.api', () => ({
    listAdminEntities: vi.fn(),
    saveAdminEntity: vi.fn().mockResolvedValue({}),
    deleteAdminEntity: vi.fn().mockResolvedValue({}),
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
        localStorage.setItem('role', 'admin');
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([] as never);
    });

    afterEach(() => {
        localStorage.removeItem('role');
        vi.clearAllMocks();
    });

    it('shows blog body and section controls in the add dialog', async () => {
        renderAdminBlogPage();

        fireEvent.click(
            screen.getByRole('button', { name: /add|ajouter/i }),
        );

        expect(await screen.findByText(/Core information/i)).toBeInTheDocument();
        expect(screen.getByText(/Summary and body/i)).toBeInTheDocument();
        expect(screen.getByText(/Content sections/i)).toBeInTheDocument();
        expect(screen.getByText(/Main body \(EN\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Add section/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /add section/i }));

        expect(await screen.findByText(/Section 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Section heading \(EN\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Section body \(EN\)/i)).toBeInTheDocument();
    });

    it('loads existing blog content in edit mode', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValueOnce([
            {
                id: '1',
                title_en: 'Spring Updates',
                title_fr: 'Mises à jour du printemps',
                title_ar: 'تحديثات الربيع',
                excerpt_en: 'Short summary',
                excerpt_fr: 'Résumé court',
                excerpt_ar: 'ملخص قصير',
                category_en: 'Travel',
                category_fr: 'Voyage',
                category_ar: 'السفر',
                date: 'May 14, 2026',
                image: '/images/hero-travel.jpg',
                content: {
                    body: {
                        en: 'Existing body',
                        fr: 'Corps existant',
                        ar: 'نص موجود',
                    },
                    sections: [
                        {
                            id: 'sec-1',
                            heading: {
                                en: 'Section heading',
                                fr: 'Titre de section',
                                ar: 'عنوان القسم',
                            },
                            body: {
                                en: 'Section body',
                                fr: 'Corps de section',
                                ar: 'نص القسم',
                            },
                        },
                    ],
                },
            },
        ] as never);

        renderAdminBlogPage();

        await waitFor(() => {
            expect(adminApi.listAdminEntities).toHaveBeenCalledWith('blog-posts');
        });

        expect(await screen.findByText('Spring Updates')).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', { name: /edit|modifier|éditer/i }),
        );

        expect(await screen.findByDisplayValue('Existing body')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Section heading')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Section body')).toBeInTheDocument();
    });
});

