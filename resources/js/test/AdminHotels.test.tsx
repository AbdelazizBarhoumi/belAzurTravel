import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import AdminHotels from '@/pages/admin/AdminHotels';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/api/admin.api');

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

function renderPage() {
    return render(
        <QueryClientProvider client={queryClient}>
            <SiteSettingsProvider>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminHotels />
                    </MemoryRouter>
                </LanguageProvider>
            </SiteSettingsProvider>
        </QueryClientProvider>,
    );
}

describe('AdminHotels', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([] as never);
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('opens a sectioned hotel dialog with backend-driven fields', async () => {
        localStorage.setItem('lang', 'en');
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: /add/i }));

        expect(
            await screen.findByText('Core hotel details'),
        ).toBeInTheDocument();
        expect(
            screen.getAllByRole('button', { name: 'EN' }).length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByRole('button', { name: 'FR' }).length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByRole('button', { name: 'AR' }).length,
        ).toBeGreaterThan(0);
        expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Location').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Description').length).toBeGreaterThan(0);
        expect(screen.getByText('Pricing and structure')).toBeInTheDocument();
        expect(screen.getByText('Contact and profile')).toBeInTheDocument();
        expect(screen.getByText('Contact and profile')).toBeInTheDocument();
        expect(screen.getByText('Media and amenities')).toBeInTheDocument();
        expect(screen.getByText('Amenity Name')).toBeInTheDocument();
        expect(screen.getByText('Room Name')).toBeInTheDocument();
        expect(screen.getByText('Capacity')).toBeInTheDocument();
        expect(screen.getByText('Size (sqm)')).toBeInTheDocument();
        expect(screen.getByLabelText('Destination slug')).toBeInTheDocument();
        expect(screen.getByLabelText('Stars')).toBeInTheDocument();
        expect(screen.getByLabelText('Hotel image')).toBeInTheDocument();
        expect(screen.getByLabelText('Gallery images')).toBeInTheDocument();
        expect(
            screen.getByLabelText('Amenities (one per line)'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Rooms (JSON)')).toBeInTheDocument();
    });

    it('syncs the hotel page language with the dialog language toggle', async () => {
        localStorage.setItem('lang', 'en');
        renderPage();

        const heading = screen.getByRole('heading', {
            name: /Hotels|Hôtels/,
        });
        const initialHeading = heading.textContent ?? 'Hotels';
        const targetButton = initialHeading === 'Hotels' ? 'FR' : 'EN';
        const expectedHeading = initialHeading === 'Hotels' ? 'Hôtels' : 'Hotels';

        fireEvent.click(screen.getByRole('button', { name: /add/i }));
        await screen.findByRole('dialog');

        fireEvent.click(screen.getByRole('button', { name: targetButton }));

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: expectedHeading }),
            ).toBeInTheDocument();
        });
    });
});
