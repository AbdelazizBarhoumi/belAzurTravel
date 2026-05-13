import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import PromoDetail from '@/pages/PromoDetail';

function renderPromoDetail() {
    return render(
        <LanguageProvider>
            <MemoryRouter initialEntries={['/promos/SPRING30']}>
                <Routes>
                    <Route path="/promos/:slug" element={<PromoDetail />} />
                </Routes>
            </MemoryRouter>
        </LanguageProvider>,
    );
}

describe('PromoDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('renders the promo banner, terms and booking CTA', () => {
        renderPromoDetail();

        expect(screen.getByRole('heading', { name: /Spring Flash Sale/i })).toBeInTheDocument();
        expect(screen.getByText(/30% OFF/i)).toBeInTheDocument();
        expect(screen.getByText(/Valid on selected routes only/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Start a booking/i })).toBeInTheDocument();
    });
});
