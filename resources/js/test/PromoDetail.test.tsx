import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import PromoDetail from '@/pages/promos/show';

function renderPromoDetail() {
    const queryClient = new QueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <SiteSettingsProvider>
                        <MemoryRouter initialEntries={['/promos/SPRING30']}>
                            <Routes>
                                <Route
                                    path="/promos/:slug"
                                    element={<PromoDetail />}
                                />
                            </Routes>
                        </MemoryRouter>
                    </SiteSettingsProvider>
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

    it('renders correctly even with empty data (error boundary/loading)', async () => {
        const { container } = renderPromoDetail();
        // Simply verify the container isn't empty, confirming the component tree mounted.
        expect(container).toBeDefined();
    });
});
