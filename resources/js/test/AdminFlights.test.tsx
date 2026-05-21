import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import AdminFlights from '@/pages/admin/AdminFlights';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/api/admin.api', () => ({
    listAdminEntities: vi.fn().mockResolvedValue([]),
    saveAdminEntity: vi.fn().mockResolvedValue({}),
    deleteAdminEntity: vi.fn().mockResolvedValue({}),
}));

function renderAdminFlights() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <SiteSettingsProvider>
                    <MemoryRouter initialEntries={['/admin/flights']}>
                        <AdminFlights />
                    </MemoryRouter>
                </SiteSettingsProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('AdminFlights page', () => {
    beforeEach(() => {
        localStorage.setItem('role', 'admin');
    });

    afterEach(() => {
        localStorage.removeItem('role');
        vi.clearAllMocks();
    });

    it('exposes full flight sections in the add dialog', async () => {
        renderAdminFlights();

        fireEvent.click(screen.getByRole('button', { name: /add|ajouter/i }));

        expect(await screen.findByText('Core details')).toBeInTheDocument();
        expect(screen.getByText('Route and airline')).toBeInTheDocument();
        expect(screen.getByText('Schedule')).toBeInTheDocument();
        expect(
            screen.getByText('Cabin and service details'),
        ).toBeInTheDocument();
        expect(
            screen.getAllByText((content) => content.includes('Airline'))
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Destination'))
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Duration'))
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Stops')).length,
        ).toBeGreaterThan(0);
        expect(screen.getByText('Departure time')).toBeInTheDocument();
        expect(screen.getByText('Arrival time')).toBeInTheDocument();
        expect(screen.getByText('Travel date')).toBeInTheDocument();
        expect(screen.getByText('Seats')).toBeInTheDocument();
        expect(
            screen.getAllByText((content) => content.includes('Cabin')).length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Aircraft'))
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Baggage'))
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Refund')).length,
        ).toBeGreaterThan(0);
    });
});
