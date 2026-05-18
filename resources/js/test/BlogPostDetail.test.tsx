import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import * as hooks from '@/hooks/usePublicData';
import BlogPostDetail from '@/pages/BlogPostDetail';

vi.mock('@/hooks/usePublicData', () => ({
    useBlogPostBySlug: vi.fn(),
}));

function renderBlogDetail() {
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
                <MemoryRouter initialEntries={['/blog/spring-updates']}>
                    <Routes>
                        <Route path="/blog/:slug" element={<BlogPostDetail />} />
                    </Routes>
                </MemoryRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('BlogPostDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.mocked(hooks.useBlogPostBySlug).mockReturnValue({
            data: {
                slug: 'spring-updates',
                title: {
                    en: 'Spring Updates',
                    fr: 'Mises à jour du printemps',
                    ar: 'تحديثات الربيع',
                },
                excerpt: {
                    en: 'A quick summary',
                    fr: 'Un résumé rapide',
                    ar: 'ملخص سريع',
                },
                date: 'May 14, 2026',
                category: { en: 'Travel', fr: 'Voyage', ar: 'السفر' },
                image: '/images/hero-travel.jpg',
                content: {
                    body: {
                        en: 'Intro paragraph\nSecond paragraph',
                        fr: 'Paragraphe d’introduction',
                        ar: 'فقرة تمهيدية',
                    },
                    sections: [
                        {
                            id: 'sec-1',
                            heading: {
                                en: 'What changed',
                                fr: 'Ce qui a changé',
                                ar: 'ما الذي تغير',
                            },
                            body: {
                                en: 'Section details',
                                fr: 'Détails de la section',
                                ar: 'تفاصيل القسم',
                            },
                        },
                    ],
                },
            },
            isLoading: false,
        } as never);
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('renders the article body and structured sections', () => {
        renderBlogDetail();

        expect(
            screen.getByRole('heading', { name: /Spring Updates/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/Intro paragraph/i)).toBeInTheDocument();
        expect(screen.getByText(/Second paragraph/i)).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: /What changed/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/Section details/i)).toBeInTheDocument();
        expect(screen.getByText(/Travel/i)).toBeInTheDocument();
    });
});


