import { render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import CarDetail from '@/pages/CarDetail';

function renderCarDetail(path = '/cars/mercedes-e-class') {
    return render(
        <LanguageProvider>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/cars/:slug" element={<CarDetail />} />
                </Routes>
            </MemoryRouter>
        </LanguageProvider>,
    );
}

describe('CarDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('renders the car gallery, specs and booking CTA', () => {
        renderCarDetail();

        expect(screen.getByRole('heading', { name: /Mercedes E-Class/i })).toBeInTheDocument();
        expect(screen.getByText(/Features/i)).toBeInTheDocument();
        expect(screen.getByText(/Rental policy/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reserve now/i })).toBeInTheDocument();
    });

    it('shows a fallback message for unknown cars', () => {
        renderCarDetail('/cars/unknown-car');

        expect(screen.getByText(/Car not found/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /All cars/i })).toBeInTheDocument();
    });
});