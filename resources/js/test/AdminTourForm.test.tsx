import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
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
            <SiteSettingsProvider>
                <LanguageProvider>
                    <BrowserRouter>{component}</BrowserRouter>
                </LanguageProvider>
            </SiteSettingsProvider>
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
        queryClient.clear();
        vi.clearAllMocks();
    });

    it('shows upload-driven media fields in the add dialog', async () => {
        renderComponent(<AdminTours />);

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(
            within(dialog).getByText(/main image and gallery\./i),
        ).toBeInTheDocument();
    });

    it('keeps the tour page language independent from the dialog toggle', async () => {
        renderComponent(<AdminTours />);

        const heading = screen
            .getAllByRole('heading', { level: 1 })
            .find((node) => /Tours|Circuit & Excursions/.test(node.textContent ?? ''));

        expect(heading).toBeDefined();

        const initialHeading = heading?.textContent ?? 'Tours';
        const targetButton = initialHeading === 'Tours' ? 'FR' : 'EN';
        const expectedHeading =
            initialHeading === 'Tours' ? 'Circuit & Excursions' : 'Tours';

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
        const dialog = await screen.findByRole('dialog');

        fireEvent.click(
            within(dialog).getByRole('button', { name: targetButton }),
        );

        expect(within(dialog).queryByLabelText(/slug/i)).toBeNull();

        await waitFor(() => {
            expect(heading).toBeInTheDocument();
            expect(
                screen.getByRole('button', { name: targetButton }),
            ).toHaveClass('bg-primary');
        });

        expect(screen.queryByRole('heading', { name: expectedHeading })).toBe(
            null,
        );
    });

    it('shows existing gallery images when editing a tour with images payload', async () => {
        vi.mocked(adminApi.saveAdminEntity).mockResolvedValueOnce({} as never);
        vi.mocked(adminApi.listAdminEntities).mockReset();
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: '1',
                slug: 'greek-island-hopping',
                name_en: 'Greek Island Hopping',
                name_fr: 'Îles Grecques en Liberté',
                name_ar: 'جولة الجزر اليونانية',
                location_en: 'Greece',
                location_fr: 'Grèce',
                location_ar: 'اليونان',
                duration_en: '7 days',
                duration_fr: '7 jours',
                duration_ar: '7 أيام',
                image: '/storage/uploads/tours/main.jpg',
                images: ['storage/uploads/tours/gallery-1.jpg'],
                price: 2499,
                rating: 4.8,
                duration_days: 7,
                duration_nights: 6,
                max_group: 16,
                itinerary: [],
                includes: [],
                excludes: [],
            } as never,
        ]);

        const { container } = renderComponent(<AdminTours />);

        await waitFor(() => {
            expect(
                container.querySelectorAll('tbody button').length,
            ).toBeGreaterThan(0);
        });
        fireEvent.click(container.querySelector('tbody button') as Element);

        const dialog = await screen.findByRole('dialog');

        expect(screen.getByAltText('Gallery')).toHaveAttribute(
            'src',
            '/storage/uploads/tours/gallery-1.jpg',
        );

        fireEvent.click(within(dialog).getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];
        expect(payload).toEqual(
            expect.objectContaining({
                images: ['storage/uploads/tours/gallery-1.jpg'],
            }),
        );
    });

    it('submits updated gallery images after removing an existing image', async () => {
        vi.mocked(adminApi.saveAdminEntity).mockResolvedValueOnce({} as never);
        vi.mocked(adminApi.listAdminEntities).mockReset();
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: '1',
                slug: 'greek-island-hopping',
                name_en: 'Greek Island Hopping',
                name_fr: 'Îles Grecques en Liberté',
                name_ar: 'جولة الجزر اليونانية',
                location_en: 'Greece',
                location_fr: 'Grèce',
                location_ar: 'اليونان',
                duration_en: '7 days',
                duration_fr: '7 jours',
                duration_ar: '7 أيام',
                image: '/storage/uploads/tours/main.jpg',
                images: [
                    'storage/uploads/tours/gallery-1.jpg',
                    'storage/uploads/tours/gallery-2.jpg',
                ],
                price: 2499,
                rating: 4.8,
                duration_days: 7,
                duration_nights: 6,
                max_group: 16,
                itinerary: [],
                includes: [],
                excludes: [],
            } as never,
        ]);

        const { container } = renderComponent(<AdminTours />);

        await waitFor(() => {
            expect(
                container.querySelectorAll('tbody button').length,
            ).toBeGreaterThan(0);
        });

        fireEvent.click(container.querySelector('tbody button') as Element);

        const dialog = await screen.findByRole('dialog');

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: /remove gallery image 1/i,
            }),
        );

        fireEvent.click(within(dialog).getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];
        expect(payload).toEqual(
            expect.objectContaining({
                images: ['/storage/uploads/tours/gallery-2.jpg'],
            }),
        );
        expect(payload).not.toHaveProperty('gallery');
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
        fireEvent.change(screen.getByLabelText(/Price \(TND\)/i), {
            target: { value: '2499' },
        });

        await waitFor(() => {
            expect(
                screen.getByDisplayValue('Greek Island Hopping'),
            ).toBeInTheDocument();
            expect(screen.getByDisplayValue('Greece')).toBeInTheDocument();
            expect(
                screen.getByDisplayValue('A scenic island tour.'),
            ).toBeInTheDocument();
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
