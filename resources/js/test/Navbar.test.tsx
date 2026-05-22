import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Navbar } from '@/components/layout/Navbar';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import type * as PublicDataHooks from '@/hooks/usePublicData';

const mockUseSiteSettings = vi.fn();

const categoriesByType: Record<
    string,
    Array<{ key: string; name: Record<string, string> }>
> = {
    destinations: [
        { key: 'beach', name: { en: 'Beach', fr: 'Plage', ar: 'شاطئ' } },
        { key: 'city', name: { en: 'City', fr: 'Ville', ar: 'مدينة' } },
    ],
    hotels: [{ key: 'luxury', name: { en: 'Luxury', fr: 'Luxe', ar: 'فاخر' } }],
    tours: [
        {
            key: 'adventure',
            name: { en: 'Adventure', fr: 'Aventure', ar: 'مغامرة' },
        },
    ],
    cars: [{ key: 'suv', name: { en: 'SUV', fr: 'SUV', ar: 'دفع رباعي' } }],
    events: [
        {
            key: 'festival',
            name: { en: 'Festival', fr: 'Festival', ar: 'مهرجان' },
        },
    ],
    deals: [{ key: 'summer', name: { en: 'Summer', fr: 'Été', ar: 'صيف' } }],
    blog: [{ key: 'tips', name: { en: 'Tips', fr: 'Conseils', ar: 'نصائح' } }],
};

function makeNavSettings(header: Array<Record<string, unknown>>) {
    return {
        settings: {
            content: {
                nav: {
                    settings: {
                        header,
                        footer: [],
                    },
                },
            },
        },
        loading: false,
    };
}

function setDefaultNavSettings() {
    mockUseSiteSettings.mockReturnValue(
        makeNavSettings([
            {
                pageKey: 'destinations',
                enabled: true,
                placement: 'top',
                isDropdown: false,
                linkSelf: true,
                items: [],
            },
            {
                pageKey: 'tours',
                enabled: true,
                placement: 'top',
                isDropdown: false,
                linkSelf: true,
                items: [],
            },
            {
                pageKey: 'promos',
                enabled: true,
                placement: 'top',
                isDropdown: false,
                linkSelf: true,
                items: [],
            },
        ]),
    );
}

vi.mock('@/hooks/usePublicData', async () => {
    const actual = await vi.importActual<typeof PublicDataHooks>(
        '@/hooks/usePublicData',
    );

    return {
        ...actual,
        useCategories: (type?: string) => ({
            data: categoriesByType[type ?? ''] ?? [],
            isLoading: false,
            isFetched: true,
        }),
    };
});

vi.mock('@/hooks/useSiteSettings', () => ({
    useSiteSettings: () => mockUseSiteSettings(),
}));

describe('Navbar', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = '';
        setDefaultNavSettings();
    });

    it('renders top nav entries when enabled', async () => {
        render(
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter>
                        <Navbar />
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>,
        );

        await waitFor(() =>
            expect(document.querySelector('a[href="/tours"]')).toBeTruthy(),
        );
        expect(document.querySelector('a[href="/destinations"]')).toBeTruthy();
        expect(
            document.querySelector('a[href="/promos"]') ||
                document.querySelector('a[href="/deals"]'),
        ).toBeTruthy();
    });

    it('renders live categories inside dropdown menus', async () => {
        mockUseSiteSettings.mockReturnValue(
            makeNavSettings([
                {
                    pageKey: 'destinations',
                    enabled: true,
                    placement: 'top',
                    isDropdown: true,
                    linkSelf: true,
                    items: [
                        { label: 'Categories', mode: 'categories', value: '' },
                    ],
                },
                {
                    pageKey: 'hotels',
                    enabled: true,
                    placement: 'top',
                    isDropdown: true,
                    linkSelf: true,
                    items: [
                        { label: 'Categories', mode: 'categories', value: '' },
                    ],
                },
                {
                    pageKey: 'promos',
                    enabled: true,
                    placement: 'top',
                    isDropdown: false,
                    linkSelf: true,
                    items: [],
                },
            ]),
        );

        render(
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter>
                        <Navbar />
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>,
        );

        await waitFor(() =>
            expect(
                document.querySelector('a[href="/destinations?cat=beach"]'),
            ).toBeTruthy(),
        );
        expect(
            document.querySelector('a[href="/destinations?cat=city"]'),
        ).toBeTruthy();
        expect(
            document.querySelector('a[href="/hotels?cat=luxury"]'),
        ).toBeTruthy();
    });

    it('always renders the favorites heart button', async () => {
        render(
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter>
                        <Navbar />
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>,
        );

        await waitFor(() =>
            expect(document.querySelector('a[href="/favorites"]')).toBeTruthy(),
        );
    });

    it('hides a disabled nav entry', async () => {
        mockUseSiteSettings.mockReturnValue(
            makeNavSettings([
                {
                    pageKey: 'destinations',
                    enabled: true,
                    placement: 'top',
                    isDropdown: false,
                    linkSelf: true,
                    items: [],
                },
                {
                    pageKey: 'tours',
                    enabled: false,
                    placement: 'top',
                    isDropdown: false,
                    linkSelf: true,
                    items: [],
                },
                {
                    pageKey: 'promos',
                    enabled: true,
                    placement: 'top',
                    isDropdown: false,
                    linkSelf: true,
                    items: [],
                },
            ]),
        );

        render(
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter>
                        <Navbar />
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>,
        );

        await waitFor(() =>
            expect(document.querySelector('a[href="/tours"]')).toBeNull(),
        );

        expect(document.querySelector('a[href="/destinations"]')).toBeTruthy();
        expect(
            document.querySelector('a[href="/promos"]') ||
                document.querySelector('a[href="/deals"]'),
        ).toBeTruthy();
    });
});
