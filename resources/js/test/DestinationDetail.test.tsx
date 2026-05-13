import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import DestinationDetail from '@/pages/DestinationDetail';

const queryClient = new QueryClient();

function renderDestinationDetail(path = '/destinations/santorini') {
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter initialEntries={[path]}>
                        <Routes>
                            <Route
                                path="/destinations/:slug"
                                element={<DestinationDetail />}
                            />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('DestinationDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('renders destination details, highlights and related content', () => {
        renderDestinationDetail();

        expect(
            screen.getAllByRole('heading', { name: /Santorini/i }).length,
        ).toBeGreaterThan(0);
        expect(screen.getByText(/Highlights/i)).toBeInTheDocument();
        expect(screen.getByText(/Where to stay/i)).toBeInTheDocument();
        expect(screen.getByText(/Suggested tours/i)).toBeInTheDocument();
    });

    it('shows a fallback message for unknown destinations', () => {
        renderDestinationDetail('/destinations/unknown');

        expect(screen.getByText(/Destination not found/i)).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /Back to destinations/i }),
        ).toBeInTheDocument();
    });
});
