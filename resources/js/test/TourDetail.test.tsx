import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import TourDetail from '@/pages/TourDetail';

vi.mock('@/hooks/usePublicData', () => ({
    useTourDetailsBySlug: () => ({
        data: undefined,
        isLoading: true,
    }),
}));

function renderTourDetail(path = '/tours/greek-island-hopping') {
    return render(
        <LanguageProvider>
            <FavoritesProvider>
                <MemoryRouter initialEntries={[path]}>
                    <Routes>
                        <Route
                            path="/tours"
                            element={<div>Tours index page</div>}
                        />
                        <Route path="/tours/:slug" element={<TourDetail />} />
                    </Routes>
                </MemoryRouter>
            </FavoritesProvider>
        </LanguageProvider>,
    );
}

describe('TourDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('does not redirect to the tours index while loading', () => {
        renderTourDetail();

        expect(screen.queryByText(/Tours index page/i)).not.toBeInTheDocument();
    });
});
