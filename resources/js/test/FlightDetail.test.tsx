import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import FlightDetail from '@/pages/flights/show';

const mockFlight = {
    id: 'emirates-nyc-dxb',
    code: 'emirates-nyc-dxb',
    airline: { en: 'Emirates', fr: 'Emirates', ar: 'طيران الإمارات' },
    from: 'NYC',
    to: { en: 'Dubai', fr: 'Dubaï', ar: 'دبي' },
    departure: '10:00',
    arrival: '16:00',
    duration: { en: '14h', fr: '14h', ar: '١٤ ساعة' },
    stops: { en: 'Direct', fr: 'Direct', ar: 'مباشر' },
    price: 1200,
    details: {
        cabin: { en: 'Business', fr: 'Affaires', ar: 'الأعمال' },
        aircraft: {
            en: 'Boeing 777-300ER',
            fr: 'Boeing 777-300ER',
            ar: 'بوينج 777-300ER',
        },
        baggage: { en: '2 bags', fr: '2 bagages', ar: 'حقيبتان' },
    },
};

vi.mock('@/hooks/usePublicData', () => ({
    useFlightById: () => ({
        data: mockFlight,
        isLoading: false,
    }),
}));

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

        // Use getAllByText as the UI might have the same summary in multiple locations (e.g., card + aside)
        const summaryElements = screen.getAllByText(/Emirates · Direct/i);
        expect(summaryElements.length).toBeGreaterThan(0);

        // Use getAllByText as the UI might have the same aircraft in multiple locations
        const aircraftElements = screen.getAllByText(/Boeing 777-300ER/i);
        expect(aircraftElements.length).toBeGreaterThan(0);

        // Use getAllByText as these labels appear in both the main section and sticky booking card
        const cabinElements = screen.getAllByText(/Cabin/i);
        expect(cabinElements.length).toBeGreaterThan(0);

        const baggageElements = screen.getAllByText(/Baggage/i);
        expect(baggageElements.length).toBeGreaterThan(0);

        const acElements = screen.getAllByText(/Aircraft/i);
        expect(acElements.length).toBeGreaterThan(0);

        const bookButtons = screen.getAllByRole('button', {
            name: /Book this flight/i,
        });
        expect(bookButtons.length).toBeGreaterThan(0);
    });
});
