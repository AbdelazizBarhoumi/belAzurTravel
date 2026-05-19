import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
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
            <LanguageProvider>
                <MemoryRouter>
                    <AdminHotels />
                </MemoryRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('AdminHotels', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([] as never);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('opens a sectioned hotel dialog with backend-driven fields', async () => {
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
        expect(screen.getByLabelText('Name (EN)')).toBeInTheDocument();
        expect(screen.getByLabelText('Location (EN)')).toBeInTheDocument();
        expect(screen.getByLabelText('Description (EN)')).toBeInTheDocument();
        expect(screen.getByText('Pricing and structure')).toBeInTheDocument();
        expect(screen.getByText('Contact and profile')).toBeInTheDocument();
        expect(screen.getByText('Contact and profile')).toBeInTheDocument();
        expect(screen.getByText('Media and amenities')).toBeInTheDocument();
        expect(screen.getByLabelText('Destination slug')).toBeInTheDocument();
        expect(screen.getByLabelText('Stars')).toBeInTheDocument();
        expect(screen.getByLabelText('Hotel image')).toBeInTheDocument();
        expect(screen.getByLabelText('Gallery images')).toBeInTheDocument();
        expect(
            screen.getByLabelText('Gallery URLs (one per line)'),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText('Amenities (one per line)'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Rooms (JSON)')).toBeInTheDocument();
    });
});
