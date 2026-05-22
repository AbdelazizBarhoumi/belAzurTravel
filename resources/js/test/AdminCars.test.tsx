import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { fetchCategories } from '@/api/categories.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminCars from '@/pages/admin/AdminCars';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/hooks/useSiteSettings', () => ({
    useSiteSettings: () => ({
        settings: {
            config: {
                navigation: {
                    enabled_dropdowns: ['cars'],
                },
            },
        },
        loading: false,
    }),
}));

vi.mock('@/api/admin.api', () => ({
    listAdminEntities: vi.fn(),
    saveAdminEntity: vi.fn().mockResolvedValue({}),
    deleteAdminEntity: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/api/categories.api', () => ({
    fetchCategories: vi.fn(),
}));

const carCategories = [
    {
        key: 'electric',
        name: { en: 'Electric', fr: 'Électrique', ar: 'كهربائي' },
    },
    {
        key: 'luxury',
        name: { en: 'Luxury', fr: 'Luxe', ar: 'فاخرة' },
    },
];

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <MemoryRouter initialEntries={['/admin/cars']}>
                    <AdminCars />
                </MemoryRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('AdminCars', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.clearAllMocks();
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([] as never);
        vi.mocked(fetchCategories).mockResolvedValue(carCategories as never);
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('opens the add dialog with a shared category selector', async () => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

        const dialog = await screen.findByRole('dialog');
        const categorySelect = within(dialog).getByRole('combobox');

        expect(categorySelect).toBeInTheDocument();
        expect(categorySelect).toHaveTextContent('Select');
    });

    it('preselects and localizes the saved category while editing', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: 'car-1',
                slug: 'tesla-model-3',
                name: 'Tesla Model 3',
                name_en: 'Tesla Model 3',
                name_fr: 'Tesla Model 3',
                name_ar: 'تسلا موديل 3',
                category_key: 'luxury',
                category: 'Luxury',
                category_en: 'Luxury',
                category_fr: 'Luxe',
                category_ar: 'فاخرة',
                fuel: 'Electric',
                fuel_en: 'Electric',
                fuel_fr: 'Électrique',
                fuel_ar: 'كهربائي',
                transmission: 'Automatic',
                transmission_en: 'Automatic',
                transmission_fr: 'Automatique',
                transmission_ar: 'أوتوماتيكي',
                price: 95,
                seats: 5,
                image: '/images/tesla.jpg',
                gallery: [],
                features: [],
                policy: [],
                details: {},
            },
        ] as never);

        renderPage();

        await screen.findByText('Tesla Model 3');
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        const dialog = await screen.findByRole('dialog');
        const categorySelect = within(dialog).getByRole('combobox');

        expect(categorySelect).toHaveTextContent('Luxury');

        fireEvent.click(screen.getByRole('button', { name: /^fr$/i }));

        expect(within(dialog).getByRole('combobox')).toHaveTextContent('Luxe');

        fireEvent.click(screen.getByRole('button', { name: /^ar$/i }));

        expect(within(dialog).getByRole('combobox')).toHaveTextContent('فاخرة');
    });
});
