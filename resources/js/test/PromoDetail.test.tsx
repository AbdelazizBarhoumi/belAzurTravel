import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import PromoDetail from '@/pages/promos/show';

function renderPromoDetail() {
    const queryClient = new QueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter initialEntries={['/promos/SPRING30']}>
                        <Routes>
                            <Route
                                path="/promos/:slug"
                                element={<PromoDetail />}
                            />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('PromoDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('renders the promo banner, terms and booking CTA', async () => {
        renderPromoDetail();

        expect(
            await screen.findByRole('heading', { name: /Spring Flash Sale/i }),
        ).toBeInTheDocument();
        expect(await screen.findByText(/30% OFF/i)).toBeInTheDocument();
            // seeded description for SPRING30
            expect(
                await screen.findByText(/On all European destinations booked this month\./i),
            ).toBeInTheDocument();
        expect(
            await screen.findByRole('link', { name: /Start a booking/i }),
        ).toBeInTheDocument();
    });
});
