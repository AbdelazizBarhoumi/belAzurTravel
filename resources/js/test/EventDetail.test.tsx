import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import EventDetail from '@/pages/events/show';

function renderEventDetail(path = '/events/cherry-blossom-festival') {
    const queryClient = new QueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter initialEntries={[path]}>
                        <Routes>
                            <Route path="/events/:slug" element={<EventDetail />} />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('EventDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('renders the event details, schedule and booking CTA', async () => {
        renderEventDetail();

        // Wrap in QueryClientProvider in callers where needed; here use findBy* to wait for async data
        expect(
            await screen.findByRole('heading', { name: /Cherry Blossom Festival/i }),
        ).toBeInTheDocument();
        expect(await screen.findByText(/About this event/i)).toBeInTheDocument();
        expect(await screen.findByText(/Schedule/i)).toBeInTheDocument();
        expect(await screen.findByText(/Package from/i)).toBeInTheDocument();
        expect(
            await screen.findByRole('button', { name: /Reserve a spot/i }),
        ).toBeInTheDocument();
    });

    it('shows a fallback message for unknown events', async () => {
        renderEventDetail('/events/unknown-event');

        expect(await screen.findByText(/Event not found/i)).toBeInTheDocument();
        expect(await screen.findByRole('link', { name: /All events/i })).toBeInTheDocument();
    });
});
