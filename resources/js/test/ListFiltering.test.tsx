import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BlogListing } from '@/components/sections/blog/BlogListing';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Cars from '@/pages/cars';
import Flights from '@/pages/flights';
import Promos from '@/pages/promos';

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

    it('filters cars by search term', async () => {
        renderWithProviders(<Cars />);

        // wait for initial data to load
        await screen.findByText(/Mercedes E-Class/i);

        fireEvent.change(screen.getByRole('searchbox'), {
            target: { value: 'Tesla' },
        });

        expect(await screen.findByText(/Tesla Model 3/i)).toBeInTheDocument();
        expect(screen.queryByText(/Mercedes E-Class/i)).not.toBeInTheDocument();
    });

    it('filters flights by search term', async () => {
        renderWithProviders(<Flights />);

        // wait for flights to load
        await screen.findByText(/Air France/i);

        fireEvent.change(screen.getByRole('searchbox'), {
            target: { value: 'Paris' },
        });

        expect(await screen.findByText(/Air France/i)).toBeInTheDocument();
        expect(screen.queryByText(/Emirates/i)).not.toBeInTheDocument();
    });

    it('filters promos by code search', async () => {
        renderWithProviders(<Promos />);

        // wait for promos to load
        await screen.findByText(/SPRING30/i);

        fireEvent.change(screen.getByRole('searchbox'), {
            target: { value: 'GROUP10' },
        });

        expect(await screen.findByText(/GROUP10/i)).toBeInTheDocument();
        expect(screen.queryByText(/SPRING30/i)).not.toBeInTheDocument();
    });

    it('filters blog posts by search term', async () => {
        renderWithProviders(<BlogListing />);

        // wait for blog posts to load
        await screen.findByText(/Budget Travel in Europe/i);

        const searchInputs = screen.getAllByRole('searchbox');
        fireEvent.change(searchInputs[searchInputs.length - 1], {
            target: { value: 'budget' },
        });

        expect(
            await screen.findByText(/Budget Travel in Europe/i),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(/Sustainable Travel Matters in 2026/i),
        ).not.toBeInTheDocument();
    });
});
