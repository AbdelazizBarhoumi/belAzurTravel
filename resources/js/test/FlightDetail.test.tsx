import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import FlightDetail from '@/pages/flights/show';

function renderFlightDetail() {
    const queryClient = new QueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter
                        initialEntries={['/flights/emirates-nyc-dxb']}
                    >
                        <Routes>
                            <Route
                                path="/flights/:id"
                                element={<FlightDetail />}
                            />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('FlightDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('renders the integrated flight summary with localized labels', () => {
        renderFlightDetail();

        expect(
            screen.getByRole('heading', { name: /Emirates/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/Emirates · Direct/i)).toBeInTheDocument();
        expect(screen.getByText(/Boeing 777-300ER/i)).toBeInTheDocument();
        expect(screen.getByText(/Cabin/i)).toBeInTheDocument();
        expect(screen.getByText(/Baggage/i)).toBeInTheDocument();
        expect(screen.getByText(/Aircraft/i)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Book this flight/i }),
        ).toBeInTheDocument();
    });
});
