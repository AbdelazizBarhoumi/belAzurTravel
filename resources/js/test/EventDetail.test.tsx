import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import EventDetail from '@/pages/EventDetail';

function renderEventDetail(path = '/events/cherry-blossom-festival') {
    return render(
        <LanguageProvider>
            <FavoritesProvider>
                <MemoryRouter initialEntries={[path]}>
                    <Routes>
                        <Route path="/events/:slug" element={<EventDetail />} />
                    </Routes>
                </MemoryRouter>
            </FavoritesProvider>
        </LanguageProvider>,
    );
}

describe('EventDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('renders the event details, schedule and booking CTA', () => {
        renderEventDetail();

        expect(
            screen.getByRole('heading', { name: /Cherry Blossom Festival/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/About this event/i)).toBeInTheDocument();
        expect(screen.getByText(/Schedule/i)).toBeInTheDocument();
        expect(screen.getByText(/Package from/i)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Reserve a spot/i }),
        ).toBeInTheDocument();
    });

    it('shows a fallback message for unknown events', () => {
        renderEventDetail('/events/unknown-event');

        expect(screen.getByText(/Event not found/i)).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /All events/i }),
        ).toBeInTheDocument();
    });
});
