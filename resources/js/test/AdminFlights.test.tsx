import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
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
                <MemoryRouter initialEntries={['/admin/flights']}>
                    <AdminFlights />
                </MemoryRouter>
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
        expect(screen.getByText('Airline (EN)')).toBeInTheDocument();
        expect(screen.getByText('Airline (FR)')).toBeInTheDocument();
        expect(screen.getByText('Airline (AR)')).toBeInTheDocument();
        expect(screen.getByText('Destination (EN)')).toBeInTheDocument();
        expect(screen.getByText('Destination (FR)')).toBeInTheDocument();
        expect(screen.getByText('Duration (EN)')).toBeInTheDocument();
        expect(screen.getByText('Duration (FR)')).toBeInTheDocument();
        expect(screen.getByText('Stops (EN)')).toBeInTheDocument();
        expect(screen.getByText('Stops (FR)')).toBeInTheDocument();
        expect(screen.getByText('Departure time')).toBeInTheDocument();
        expect(screen.getByText('Arrival time')).toBeInTheDocument();
        expect(screen.getByText('Travel date')).toBeInTheDocument();
        expect(screen.getByText('Seats')).toBeInTheDocument();
        expect(screen.getByText('Cabin (EN)')).toBeInTheDocument();
        expect(screen.getByText('Cabin (FR)')).toBeInTheDocument();
        expect(screen.getByText('Aircraft (EN)')).toBeInTheDocument();
        expect(screen.getByText('Aircraft (FR)')).toBeInTheDocument();
        expect(screen.getByText('Baggage (EN)')).toBeInTheDocument();
        expect(screen.getByText('Baggage (FR)')).toBeInTheDocument();
        expect(screen.getByText('Refund (EN)')).toBeInTheDocument();
        expect(screen.getByText('Refund (FR)')).toBeInTheDocument();
    });
});
