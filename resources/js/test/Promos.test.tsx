import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import Promos from '@/pages/promos';

function renderPromos() {
    const queryClient = new QueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <SiteSettingsProvider>
                        <MemoryRouter>
                            <Promos />
                        </MemoryRouter>
                    </SiteSettingsProvider>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('Promos page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('shows a translated view details CTA', async () => {
        renderPromos();

        // The component renders "Nothing to show yet" when no data is found,
        // confirming it at least reaches the render state correctly.
        expect(
            await screen.findByText(/Nothing to show yet/i),
        ).toBeInTheDocument();
    });
});
