import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import AdminEvents from '@/pages/admin/AdminEvents';

vi.mock('@/hooks/usePublicData', () => ({
    useCategories: () => ({
        data: [
            {
                key: 'cultural',
                name: { en: 'Cultural', fr: 'Culturel', ar: 'ثقافي' },
                entity_type: 'events',
            },
        ],
        isLoading: false,
        isPending: false,
        isError: false,
        isFetching: false,
    }),
}));

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/components/forms/EntityMediaInputs', () => ({
    EntityMediaInputs: ({
        setField,
    }: {
        setField?: (key: string, value: unknown) => void;
    }) => (
        <div data-testid="mock-entity-media-inputs">
            <label htmlFor="mock-main-image">Mock main image</label>
            <input
                id="mock-main-image"
                type="file"
                aria-label="Mock main image"
                onChange={(event) => {
                    setField?.('imageFile', event.target.files?.[0] ?? null);
                    setField?.('imagePath', '');
                }}
            />
            <label htmlFor="mock-gallery-files">Mock gallery files</label>
            <input
                id="mock-gallery-files"
                type="file"
                aria-label="Mock gallery files"
                multiple
                onChange={(event) => {
                    setField?.(
                        'galleryFiles',
                        Array.from(event.target.files ?? []),
                    );
                }}
            />
        </div>
    ),
}));

vi.mock('@/api/admin.api');

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <SiteSettingsProvider>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminEvents />
                    </MemoryRouter>
                </LanguageProvider>
            </SiteSettingsProvider>
        </QueryClientProvider>,
    );
}

describe('AdminEvents', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.clearAllMocks();
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            writable: true,
            value: vi.fn(() => 'blob:mock-event-image'),
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            writable: true,
            value: vi.fn(),
        });
        vi.mocked(adminApi.saveAdminEntity).mockResolvedValue({} as never);
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: '1',
                category_key: 'cultural',
                image: '/images/event.jpg',
                title_en: 'Cherry Blossom Festival',
                title_fr: 'Festival des fleurs de cerisier',
                title_ar: 'مهرجان أزهار الكرز',
                location_en: 'Tokyo',
                location_fr: 'Tokyo',
                location_ar: 'طوكيو',
                date_en: '2026-04-10',
                date_fr: '2026-04-10',
                date_ar: '2026-04-10',
                price: 120,
            },
        ] as never);
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('renders an image column and thumbnail in the events table', async () => {
        renderPage();

        expect(
            await screen.findByRole('columnheader', { name: 'Image' }),
        ).toBeInTheDocument();
        expect(
            await screen.findByRole('columnheader', { name: 'Category' }),
        ).toBeInTheDocument();
        expect(
            await screen.findByRole('img', {
                name: 'Cherry Blossom Festival',
            }),
        ).toHaveAttribute('src', '/images/event.jpg');

        expect(await screen.findByText('Cultural')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /add/i }));

        expect(screen.getAllByText('Category').length).toBeGreaterThan(0);
        expect(await screen.findByText('About')).toBeInTheDocument();
        expect(await screen.findByText('Attendees')).toBeInTheDocument();
    });

    it('does not send an empty gallery_files field when editing with a new main image', async () => {
        const { container } = renderPage();

        await screen.findByRole('img', {
            name: 'Cherry Blossom Festival',
        });

        const editButton = container.querySelector('tbody button');
        expect(editButton).not.toBeNull();

        fireEvent.click(editButton as HTMLElement);

        await screen.findByRole('button', { name: /save/i });

        const mainImageInput = screen.getByLabelText(
            'Mock main image',
        ) as HTMLInputElement;

        const newMainImage = new File(['main-image'], 'main-image.png', {
            type: 'image/png',
        });

        fireEvent.change(mainImageInput, {
            target: { files: [newMainImage] },
        });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(adminApi.saveAdminEntity).toHaveBeenCalledTimes(1);

        const [, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];
        expect(payload).toBeDefined();
        expect(payload as Record<string, unknown>).not.toHaveProperty(
            'gallery_files',
        );
    });
});
