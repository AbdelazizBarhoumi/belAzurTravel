import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import DestinationDetail from '@/pages/DestinationDetail';

function renderDestinationDetail(path = '/destinations/santorini') {
    return render(
        <LanguageProvider>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/destinations/:slug" element={<DestinationDetail />} />
                </Routes>
            </MemoryRouter>
        </LanguageProvider>,
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

        expect(screen.getByRole('heading', { name: /Santorini/i })).toBeInTheDocument();
        expect(screen.getByText(/Highlights/i)).toBeInTheDocument();
        expect(screen.getByText(/Where to stay/i)).toBeInTheDocument();
        expect(screen.getByText(/Suggested tours/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Plan a trip/i })).toBeInTheDocument();
    });

    it('shows a fallback message for unknown destinations', () => {
        renderDestinationDetail('/destinations/unknown');

        expect(screen.getByText(/Destination not found/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Back to destinations/i })).toBeInTheDocument();
    });
});