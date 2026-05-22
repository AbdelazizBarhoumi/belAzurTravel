import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import DealDetail from '@/pages/deals/show';

const mockUseDealBySlug = vi.fn();

vi.mock('@/hooks/usePublicData', () => ({
    useDealBySlug: (...args: unknown[]) => mockUseDealBySlug(...args),
}));

function renderDealDetail(path = '/deals/summer-deal') {
    return render(
        <QueryClientProvider client={new QueryClient()}>
            <LanguageProvider>
                <MemoryRouter initialEntries={[path]}>
                    <Routes>
                        <Route path="/deals/:slug" element={<DealDetail />} />
                    </Routes>
                </MemoryRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('DealDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        mockUseDealBySlug.mockReturnValue({
            data: {
                slug: 'summer-deal',
                title: { en: 'Summer Deal', fr: 'Offre Été', ar: 'عرض الصيف' },
                description: { en: 'Desc', fr: 'Desc', ar: 'وصف' },
                discount: { en: '35% OFF', fr: '35% RÉD.', ar: '35% خصم' },
                expires: {
                    en: 'Aug 31, 2026',
                    fr: '31 août 2026',
                    ar: '31 أغسطس 2026',
                },
                category: { en: 'Seasonal', fr: 'Saisonnière', ar: 'موسمية' },
                highlights: {
                    en: ['Cheap', 'Flexible'],
                    fr: ['Bon marché', 'Flexible'],
                    ar: ['رخيص', 'مرن'],
                },
                terms: {
                    en: ['Apply'],
                    fr: ['Appliquer'],
                    ar: ['تطبق'],
                },
            },
            isLoading: false,
        });
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('renders deal highlights and terms from locale bucket payloads', async () => {
        renderDealDetail();

        expect(await screen.findByText(/Highlights/i)).toBeInTheDocument();
        expect(await screen.findByText('Cheap')).toBeInTheDocument();
        expect(await screen.findByText('Flexible')).toBeInTheDocument();
        expect(await screen.findByText(/Terms/i)).toBeInTheDocument();
        expect(await screen.findByText('Apply')).toBeInTheDocument();
    });
});
