import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { fetchCategoryTypes } from '@/api/categoryTypes.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import AdminDestinations from '@/pages/admin/AdminDestinations';

vi.mock('@/api/categories.api', () => ({
    fetchCategories: vi.fn().mockResolvedValue([
        {
            id: 1,
            entity_type: 'destinations',
            key: 'beach',
            name: { en: 'Beach', fr: 'Plage', ar: 'شاطئ' },
        },
    ]),
}));

vi.mock('@/api/categoryTypes.api', () => ({
    fetchCategoryTypes: vi.fn().mockResolvedValue([
        {
            id: 1,
            entity_type: 'destinations',
            key: 'category',
            label: { en: 'Category', fr: 'Catégorie', ar: 'الفئة' },
            sort_order: 0,
            filter_style: 'select',
            values: [
                {
                    id: 1,
                    key: 'beach',
                    name: { en: 'Beach', fr: 'Plage', ar: 'شاطئ' },
                },
            ],
        },
    ]),
}));

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
                <SiteSettingsProvider>
                    <MemoryRouter initialEntries={['/admin/destinations']}>
                        <AdminDestinations />
                    </MemoryRouter>
                </SiteSettingsProvider>
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

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText('Image')).toBeInTheDocument();
        expect(within(dialog).getByText('Gallery')).toBeInTheDocument();
    });

    it('preselects the existing category when editing a destination', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: '1',
                name: 'Santorini',
                name_en: 'Santorini',
                name_fr: 'Santorini',
                name_ar: 'سانتوريني',
                country: 'Greece',
                country_en: 'Greece',
                country_fr: 'Greece',
                country_ar: 'اليونان',
                category_key: 'beach',
                category: 'Beach',
                category_en: 'Beach',
                category_fr: 'Plage',
                category_ar: 'شاطئ',
                price: 1299,
                rating: 4.9,
                image: '/storage/santorini.jpg',
                gallery: [],
                highlights: [],
            },
        ] as never);

        renderAdminDestinationsPage();

        fireEvent.click(await screen.findByRole('button', { name: /edit/i }));

        const dialog = await screen.findByRole('dialog');
        await waitFor(() => {
            const categorySelect = within(dialog)
                .getAllByRole('combobox')
                .find((box) => box.textContent?.includes('Beach'));
            expect(categorySelect).toBeTruthy();
            expect(categorySelect).toHaveTextContent('Beach');
        });
    });

    it('resolves a localized category label to the matching category key', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: '1',
                name: 'Santorini',
                name_en: 'Santorini',
                name_fr: 'Santorini',
                name_ar: 'سانتوريني',
                country: 'Greece',
                country_en: 'Greece',
                country_fr: 'Greece',
                country_ar: 'اليونان',
                category: 'Beach',
                category_en: 'Beach',
                category_fr: 'Plage',
                category_ar: 'شاطئ',
                price: 1299,
                rating: 4.9,
                image: '/storage/santorini.jpg',
                gallery: [],
                highlights: [],
            },
        ] as never);

        renderAdminDestinationsPage();

        fireEvent.click(await screen.findByRole('button', { name: /edit/i }));

        const dialog = await screen.findByRole('dialog');
        await waitFor(() => {
            const categorySelect = within(dialog)
                .getAllByRole('combobox')
                .find((box) => box.textContent?.includes('Beach'));
            expect(categorySelect).toBeTruthy();
            expect(categorySelect).toHaveTextContent('Beach');
        });
    });

    it.skip('closes the edit dialog after saving a destination', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: '1',
                name: 'Paris',
                name_en: 'Paris',
                name_fr: 'Paris',
                name_ar: 'باريس',
                country: 'France',
                country_en: 'France',
                country_fr: 'France',
                country_ar: 'فرنسا',
                category: 'City',
                category_key: 'city',
                category_en: 'City',
                category_fr: 'Ville',
                category_ar: 'مدينة',
                price: 999,
                rating: 4.8,
                image: '/storage/paris.jpg',
                gallery: [],
                highlights: [],
                description_en: 'A beautiful city',
                description_fr: 'Une belle ville',
                description_ar: 'مدينة جميلة',
                about_en: 'About Paris',
                about_fr: 'À propos de Paris',
                about_ar: 'عن باريس',
            },
        ] as never);

        renderAdminDestinationsPage();

        fireEvent.click(await screen.findByRole('button', { name: /edit/i }));

        const dialog = await screen.findByRole('dialog');
        const form = dialog.querySelector('form');
        expect(form).not.toBeNull();

        const textInputs = form!.querySelectorAll('input[type="text"]');
        expect(textInputs.length).toBeGreaterThan(1);
        fireEvent.change(textInputs[0], {
            target: { value: 'Paris Updated' },
        });
        fireEvent.change(textInputs[1], {
            target: { value: 'France' },
        });

        const numberInputs = form!.querySelectorAll('input[type="number"]');
        expect(numberInputs.length).toBeGreaterThan(0);
        fireEvent.change(numberInputs[0], {
            target: { value: '1099' },
        });

        fireEvent.submit(form as HTMLFormElement);

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
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

        fireEvent.mouseDown(
            screen.getByRole('combobox', { name: /Category/i }),
        );
        fireEvent.click(await screen.findByText('Beach'));

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

        fireEvent.change(screen.getByLabelText(/Image/i), {
            target: { files: [imageFile] },
        });
        fireEvent.change(screen.getByLabelText('Gallery'), {
            target: { files: [galleryFile] },
        });

        await waitFor(() => {
            expect(
                (screen.getByLabelText(/Image/i) as HTMLInputElement).files
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
