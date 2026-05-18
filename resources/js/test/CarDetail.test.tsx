import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import CarDetail from '@/pages/CarDetail';

const queryClient = new QueryClient();

function renderCarDetail(path = '/cars/mercedes-e-class') {
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter initialEntries={[path]}>
                        <Routes>
                            <Route path="/cars/:slug" element={<CarDetail />} />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('CarDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('renders the car gallery, specs and booking CTA', async () => {
        renderCarDetail();

        // Wait for API-backed data to populate; use findAllByRole
        const headings = await screen.findAllByRole('heading', { name: /Mercedes E-Class/i });
        expect(headings.length).toBeGreaterThan(0);
        expect(screen.getByText(/Features/i)).toBeInTheDocument();
        expect(screen.getByText(/Rental policy/i)).toBeInTheDocument();
        expect(
            screen.getAllByRole('button', { name: /Rent now/i }).length,
        ).toBeGreaterThan(0);
    });

    it('shows a fallback message for unknown cars', () => {
        renderCarDetail('/cars/unknown-car');

        // Multiple instances of the fallback may be rendered; assert at least one exists
        expect(screen.getAllByText(/Car not found/i).length).toBeGreaterThan(0);
        expect(
            screen.getByRole('link', { name: /All cars/i }),
        ).toBeInTheDocument();
    });
});
