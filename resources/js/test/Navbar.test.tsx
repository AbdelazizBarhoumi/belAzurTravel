import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type * as SiteSettingsApi from '@/api/siteSettings.api';
import { Navbar } from '@/components/layout/Navbar';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import type * as PublicDataHooks from '@/hooks/usePublicData';

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

// Mock the site settings API module
vi.mock('@/api/siteSettings.api', async () => {
    const actual = await vi.importActual<typeof SiteSettingsApi>(
        '@/api/siteSettings.api',
    );
    return {
        ...actual,
        fetchSiteSettings: async () => ({
            ...(actual?.defaultSiteSettings ?? {}),
            content: {
                nav: {
                    settings: {
                        header: [
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
                        ],
                        footer: [],
                    },
                },
            },
        }),
    };
});

describe('Navbar', () => {
    beforeEach(() => {
        // reset DOM
        document.documentElement.innerHTML = '';
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

        // Wait for fetchSiteSettings to resolve
        await waitFor(() =>
            expect(
                screen.queryByText(
                    /Rechercher|Hôtels|Hôtels|Destinations|Circuits|Offres/i,
                ),
            ).toBeDefined(),
        );

        // Wait for anchor links to be rendered with expected hrefs
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
        render(
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter>
                        <Navbar />
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>,
        );

        await waitFor(() => expect(screen.getByText('Beach')).toBeTruthy());
        expect(screen.getByText('City')).toBeTruthy();
        expect(screen.getByText('Luxury')).toBeTruthy();
    });

    it('hides a disabled nav entry', async () => {
        // Re-mock to disable tours
        vi.doMock('@/api/siteSettings.api', async () => {
            const actual = await vi.importActual<typeof SiteSettingsApi>(
                '@/api/siteSettings.api',
            );
            return {
                ...actual,
                fetchSiteSettings: async () => ({
                    ...(actual?.defaultSiteSettings ?? {}),
                    content: {
                        nav: {
                            settings: {
                                header: [
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
                                ],
                                footer: [],
                            },
                        },
                    },
                }),
            };
        });

        // Need to import Navbar fresh so module mocks take effect
        const { Navbar: FreshNavbar } =
            await import('@/components/layout/Navbar');

        render(
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter>
                        <FreshNavbar />
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>,
        );

        // Tours link should not be present
        await waitFor(() =>
            expect(document.querySelector('a[href="/tours"]')).toBeNull(),
        );

        // Destinations and promos links remain
        expect(document.querySelector('a[href="/destinations"]')).toBeTruthy();
        expect(
            document.querySelector('a[href="/promos"]') ||
                document.querySelector('a[href="/deals"]'),
        ).toBeTruthy();
    });
});
