import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminDestinations from '@/pages/admin/AdminDestinations';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/api/admin.api', () => ({
    listAdminEntities: vi.fn(),
    saveAdminEntity: vi.fn().mockResolvedValue({}),
    deleteAdminEntity: vi.fn().mockResolvedValue({}),
}));

function renderAdminDestinationsPage() {
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
                <MemoryRouter initialEntries={['/admin/destinations']}>
                    <AdminDestinations />
                </MemoryRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('Admin destinations editor', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([] as never);
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('shows upload-based media controls in the add dialog', async () => {
        renderAdminDestinationsPage();

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('Main image')).toBeInTheDocument();
        expect(screen.getByLabelText('Gallery')).toBeInTheDocument();
    });

    it.skip('submits uploaded destination media as files', async () => {
        vi.mocked(adminApi.saveAdminEntity).mockResolvedValueOnce({} as never);

        renderAdminDestinationsPage();

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
        await screen.findByRole('dialog');

        fireEvent.change(screen.getByLabelText(/Name/i), {
            target: { value: 'Santorini' },
        });
        fireEvent.change(screen.getByLabelText(/Country/i), {
            target: { value: 'Greece' },
        });
        fireEvent.change(screen.getByLabelText(/Price/i), {
            target: { value: '1299' },
        });
        fireEvent.change(screen.getByLabelText(/Rating/i), {
            target: { value: '4.9' },
        });

        const categorySelect = screen.getByLabelText(/Category/i);
        fireEvent.change(categorySelect, { target: { value: 'Beach' } });

        await waitFor(() => {
            expect(screen.getByDisplayValue('Santorini')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Greece')).toBeInTheDocument();
            expect(screen.getByDisplayValue('1299')).toBeInTheDocument();
            expect(screen.getByDisplayValue('4.9')).toBeInTheDocument();
        });

        const imageFile = new File(['destination-image'], 'destination.jpg', {
            type: 'image/jpeg',
        });
        const galleryFile = new File(['destination-gallery'], 'gallery.jpg', {
            type: 'image/jpeg',
        });

        fireEvent.change(screen.getByLabelText('Main image'), {
            target: { files: [imageFile] },
        });
        fireEvent.change(screen.getByLabelText('Gallery'), {
            target: { files: [galleryFile] },
        });

        await waitFor(() => {
            expect(
                (screen.getByLabelText('Main image') as HTMLInputElement).files
                    ?.length,
            ).toBe(1);
            expect(
                (screen.getByLabelText('Gallery') as HTMLInputElement).files
                    ?.length,
            ).toBe(1);
        });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [entityType, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];
        expect(entityType).toBe('destinations');
        expect(payload).toEqual(
            expect.objectContaining({
                image: imageFile,
                gallery_files: [galleryFile],
                name_en: 'Santorini',
                country_en: 'Greece',
                category_en: 'Beach',
                price: '1299',
                rating: '4.9',
            }),
        );
    });
});
