import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BlogListing } from '@/components/BlogListing';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Cars from '@/pages/Cars';
import Flights from '@/pages/Flights';
import Promos from '@/pages/Promos';

function renderWithProviders(ui: ReactElement) {
    const queryClient = new QueryClient();

    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter>{ui}</MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('list page filtering', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        cleanup();
    });

    it('filters cars by search term', () => {
        renderWithProviders(<Cars />);

        fireEvent.change(screen.getByRole('searchbox'), {
            target: { value: 'Tesla' },
        });

        expect(screen.getByText(/Tesla Model 3/i)).toBeInTheDocument();
        expect(screen.queryByText(/Mercedes E-Class/i)).not.toBeInTheDocument();
    });

    it('filters flights by search term', () => {
        renderWithProviders(<Flights />);

        fireEvent.change(screen.getByRole('searchbox'), {
            target: { value: 'Paris' },
        });

        expect(screen.getByText(/Air France/i)).toBeInTheDocument();
        expect(screen.queryByText(/Emirates/i)).not.toBeInTheDocument();
    });

    it('filters promos by code search', () => {
        renderWithProviders(<Promos />);

        fireEvent.change(screen.getByRole('searchbox'), {
            target: { value: 'GROUP10' },
        });

        expect(screen.getByText(/GROUP10/i)).toBeInTheDocument();
        expect(screen.queryByText(/SPRING30/i)).not.toBeInTheDocument();
    });

    it('filters blog posts by search term', () => {
        renderWithProviders(<BlogListing />);

        const searchInputs = screen.getAllByRole('searchbox');
        fireEvent.change(searchInputs[searchInputs.length - 1], {
            target: { value: 'budget' },
        });

        expect(
            screen.getByText(/Budget Travel in Europe/i),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(/Sustainable Travel Matters in 2026/i),
        ).not.toBeInTheDocument();
    });
});
