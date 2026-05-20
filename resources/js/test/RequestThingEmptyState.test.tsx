import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import { LanguageProvider } from '@/contexts/LanguageContext';

function renderWithProviders(variant: 'empty' | 'no-results') {
    const queryClient = new QueryClient();

    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <MemoryRouter>
                    <RequestThingEmptyState variant={variant} />
                </MemoryRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('RequestThingEmptyState', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        cleanup();
    });

    it('shows the request CTA for an empty list', () => {
        renderWithProviders('empty');

        expect(
            screen.getByText(/Nothing to show yet/i),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /Request it/i }),
        ).toBeInTheDocument();
    });

    it('shows the request CTA for no results', () => {
        renderWithProviders('no-results');

        expect(screen.getByText(/No results found/i)).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /Request it/i }),
        ).toBeInTheDocument();
    });
});
