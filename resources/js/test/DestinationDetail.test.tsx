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

    it('renders destination details, highlights and related content', async () => {
        renderDestinationDetail();

        const headings = await screen.findAllByRole('heading', { name: /Santorini/i });
        expect(headings.length).toBeGreaterThan(0);
        expect(await screen.findByText(/Highlights/i)).toBeInTheDocument();
        expect(await screen.findByText(/Where to stay/i)).toBeInTheDocument();
        expect(await screen.findByText(/Suggested tours/i)).toBeInTheDocument();
    });

    it('shows a fallback message for unknown destinations', async () => {
        renderDestinationDetail('/destinations/unknown');

        expect(await screen.findByText(/Destination not found/i)).toBeInTheDocument();
        expect(await screen.findByRole('link', { name: /Back to destinations/i })).toBeInTheDocument();
    });
});
