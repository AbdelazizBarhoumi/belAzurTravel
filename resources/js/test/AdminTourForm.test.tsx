import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminTours from '@/pages/admin/AdminTours';

vi.mock('@/api/admin.api');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => ({ isAdmin: true, loading: false }),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

function renderComponent(component: React.ReactElement) {
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <BrowserRouter>{component}</BrowserRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('AdminTours', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('lang', 'en');
        vi.mocked(adminApi.listAdminEntities).mockResolvedValueOnce(
            [] as never,
        );
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('shows upload-driven media fields in the add dialog', async () => {
        renderComponent(<AdminTours />);

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('Main image')).toBeInTheDocument();
        expect(screen.getByLabelText('Gallery')).toBeInTheDocument();
    });

    it.skip('submits uploaded image and gallery files', async () => {
        vi.mocked(adminApi.saveAdminEntity).mockResolvedValueOnce({} as never);

        renderComponent(<AdminTours />);

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
        await screen.findByRole('dialog');

        fireEvent.change(screen.getByLabelText(/Name \(EN\)/i), {
            target: { value: 'Greek Island Hopping' },
        });
        fireEvent.change(screen.getByLabelText(/Location \(EN\)/i), {
            target: { value: 'Greece' },
        });
        fireEvent.change(screen.getByLabelText(/Description \(EN\)/i), {
            target: { value: 'A scenic island tour.' },
        });
        fireEvent.change(screen.getByLabelText(/Price \(USD\)/i), {
            target: { value: '2499' },
        });

        await waitFor(() => {
            expect(screen.getByDisplayValue('Greek Island Hopping')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Greece')).toBeInTheDocument();
            expect(screen.getByDisplayValue('A scenic island tour.')).toBeInTheDocument();
            expect(screen.getByDisplayValue('2499')).toBeInTheDocument();
        });

        const imageFile = new File(['image-bytes'], 'tour-main.jpg', {
            type: 'image/jpeg',
        });
        const galleryFile = new File(['gallery-bytes'], 'tour-gallery.jpg', {
            type: 'image/jpeg',
        });

        fireEvent.change(screen.getByLabelText('Main image'), {
            target: { files: [imageFile] },
        });
        fireEvent.change(screen.getByLabelText('Gallery'), {
            target: { files: [galleryFile] },
        });

        await waitFor(() => {
            expect((screen.getByLabelText('Main image') as HTMLInputElement).files?.length).toBe(1);
            expect((screen.getByLabelText('Gallery') as HTMLInputElement).files?.length).toBe(1);
        });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [entityType, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];
        expect(entityType).toBe('tours');
        expect(payload).toEqual(
            expect.objectContaining({
                image: imageFile,
                gallery: '',
                gallery_files: [galleryFile],
                name_en: 'Greek Island Hopping',
                location_en: 'Greece',
                description_en: 'A scenic island tour.',
                price: '2499',
            }),
        );
    });
});
