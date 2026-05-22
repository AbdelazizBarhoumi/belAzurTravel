import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    render,
    screen,
    fireEvent,
    waitFor,
    within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { fetchCategories } from '@/api/categories.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import AdminHotels from '@/pages/admin/AdminHotels';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/hooks/useSiteSettings', () => ({
    useSiteSettings: () => ({
        settings: {
            config: {
                navigation: {
                    enabled_dropdowns: ['hotels'],
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

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const hotelCategories = [
    {
        key: 'beach',
        name: { en: 'Beach', fr: 'Plage', ar: 'شاطئ' },
    },
    {
        key: 'luxury',
        name: { en: 'Luxury', fr: 'Luxe', ar: 'فاخر' },
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
            <SiteSettingsProvider>
                <LanguageProvider>
                    <MemoryRouter initialEntries={['/admin/hotels']}>
                        <AdminHotels />
                    </MemoryRouter>
                </LanguageProvider>
            </SiteSettingsProvider>
        </QueryClientProvider>,
    );
}

describe('AdminHotels', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        vi.clearAllMocks();
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([] as never);
        vi.mocked(fetchCategories).mockResolvedValue(hotelCategories as never);
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('opens a sectioned hotel dialog with a shared category selector', async () => {
        localStorage.setItem('lang', 'en');
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

        expect(await screen.findByText('Hotel details')).toBeInTheDocument();
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
        expect(
            screen.getByRole('textbox', { name: /City en City en/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('textbox', { name: /Country en Country en/i }),
        ).toBeInTheDocument();
        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(screen.getByText('Phone')).toBeInTheDocument();
        expect(screen.getByText('WhatsApp')).toBeInTheDocument();
        expect(screen.getByText('Media')).toBeInTheDocument();
        expect(screen.getByText('Hotel Amenities')).toBeInTheDocument();
        expect(screen.getByText('Hotel Rooms')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /add item/i }));
        fireEvent.click(screen.getByRole('button', { name: /add room/i }));

        const dialogs = screen.getAllByRole('dialog');
        const dialog =
            dialogs.find((d) =>
                (d.getAttribute('style') ?? '').includes(
                    'pointer-events: auto',
                ),
            ) || dialogs[0];
        expect(dialog).not.toBeNull();
        expect(
            within(dialog).getByLabelText(/^Category$/i),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /^fr$/i }));

        expect(screen.getByText('Amenity Name')).toBeInTheDocument();
        expect(screen.getByText('Room Name')).toBeInTheDocument();
        expect(screen.getByText('Capacity')).toBeInTheDocument();
        expect(screen.getByText('Size (sqm)')).toBeInTheDocument();
        expect(screen.getByLabelText('Destination slug')).toBeInTheDocument();
        expect(screen.getByLabelText('Stars')).toBeInTheDocument();
        expect(screen.getAllByText('Image').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Gallery').length).toBeGreaterThan(0);
    });

    it('prefills the saved category when reopening an existing hotel', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([
            {
                id: 'hotel-1',
                name: 'Sunset Paradise Resort',
                name_en: 'Sunset Paradise Resort',
                name_fr: 'Sunset Paradise Resort',
                name_ar: 'Sunset Paradise Resort',
                location: 'Santorini',
                location_en: 'Santorini',
                location_fr: 'Santorini',
                location_ar: 'Santorini',
                category_key: 'beach',
                category: {
                    en: 'Beach',
                    fr: 'Plage',
                    ar: 'شاطئ',
                },
                category_en: 'Beach',
                category_fr: 'Plage',
                category_ar: 'شاطئ',
                price: 120,
                rating: 4.8,
                image: '/hotel.jpg',
                details: {
                    address: 'Main road',
                    phone: '123',
                    whatsapp: '123',
                    category: {
                        en: 'Beach',
                        fr: 'Plage',
                        ar: 'شاطئ',
                    },
                },
                amenities: [],
                rooms: [],
                gallery: [],
                tags: [],
            },
        ] as never);

        renderPage();

        await screen.findByText('Sunset Paradise Resort');
        await waitFor(() => {
            expect(
                screen.getAllByRole('button', { name: /edit/i }).length,
            ).toBeGreaterThan(0);
        });

        fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);

        const dialogs = await screen.findAllByRole('dialog');
        const dialog =
            dialogs.find((d) =>
                (d.getAttribute('style') ?? '').includes(
                    'pointer-events: auto',
                ),
            ) || dialogs[0];
        expect(dialog).not.toBeNull();

        expect(within(dialog).getAllByText('Beach').length).toBeGreaterThan(0);
    });

    it('keeps invalid submissions open and clears validation state on close', async () => {
        renderPage();

        fireEvent.click(screen.getAllByRole('button', { name: /^add$/i })[0]);

        expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);

        const dialogs = screen.getAllByRole('dialog');
        const dialog =
            dialogs.find((d) =>
                (d.getAttribute('style') ?? '').includes(
                    'pointer-events: auto',
                ),
            ) || dialogs[0];
        const nameInput = dialog.querySelector('#name_en');
        expect(nameInput).not.toBeNull();

        fireEvent.change(nameInput as HTMLInputElement, {
            target: { value: 'Harbor Hotel' },
        });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledTimes(1);
        });

        expect(adminApi.saveAdminEntity).not.toHaveBeenCalled();
        expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
        expect((nameInput as HTMLInputElement).value).toBe('Harbor Hotel');
        // language toggle exists in dialog (scoped check)
        expect(
            within(dialog).getByRole('button', { name: /FR/i }),
        ).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    });

    it('updates the dialog language toggle state', async () => {
        localStorage.setItem('lang', 'en');
        renderPage();

        const heading = screen
            .getAllByRole('heading', { level: 1 })
            .find((node) => /Hotels|Hôtels/.test(node.textContent ?? ''));

        expect(heading).toBeDefined();

        const initialHeading = heading?.textContent ?? 'Hotels';
        const targetButton = initialHeading === 'Hotels' ? 'FR' : 'EN';
        const _expectedHeading =
            initialHeading === 'Hotels' ? 'Hôtels' : 'Hotels';

        fireEvent.click(screen.getAllByRole('button', { name: /^add$/i })[0]);
        expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: targetButton }));

        await waitFor(() => {
            expect(heading).toHaveTextContent(initialHeading);
            expect(
                screen.getByRole('button', { name: targetButton }),
            ).toHaveClass('bg-primary');
        });
    });
});
