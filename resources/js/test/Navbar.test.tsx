import { render, waitFor, fireEvent } from '@testing-library/react';
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
        useCategoryTypesPublic: (type?: string) => ({
            data: (type === 'destinations'
                ? [
                      {
                          id: 1,
                          entity_type: 'destinations',
                          key: 'destination',
                          label: {
                              en: 'Destination',
                              fr: 'Destination',
                              ar: 'x',
                          },
                          sort_order: 1,
                          filter_style: 'checkbox',
                          values: [
                              {
                                  id: 1,
                                  category_type_id: 1,
                                  key: 'beach',
                                  name: { en: 'Beach', fr: 'Plage', ar: 'x' },
                              },
                              {
                                  id: 2,
                                  category_type_id: 1,
                                  key: 'city',
                                  name: { en: 'City', fr: 'Ville', ar: 'x' },
                              },
                          ],
                      },
                  ]
                : type === 'hotels'
                  ? [
                        {
                            id: 2,
                            entity_type: 'hotels',
                            key: 'hotel',
                            label: { en: 'Hotel', fr: 'Hôtel', ar: 'x' },
                            sort_order: 1,
                            filter_style: 'checkbox',
                            values: [
                                {
                                    id: 3,
                                    category_type_id: 2,
                                    key: 'luxury',
                                    name: { en: 'Luxury', fr: 'Luxe', ar: 'x' },
                                },
                            ],
                        },
                    ]
                  : []) as never,
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
        localStorage.clear();
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

    it('renders mixed sub-page links to different index pages inside a group', async () => {
        mockUseSiteSettings.mockReturnValue({
            settings: {
                content: {
                    nav: {
                        settings: {
                            header: [],
                            footer: [],
                            groups: [
                                {
                                    key: 'group-1',
                                    label: {
                                        en: 'Explore',
                                        fr: 'Explorer',
                                        ar: 'استكشف',
                                    },
                                    enabled: true,
                                    placement: 'top',
                                    pages: [],
                                    links: [
                                        {
                                            pageKey: 'destinations',
                                            label: {
                                                en: 'Beach',
                                                fr: 'Plage',
                                                ar: 'شاطئ',
                                            },
                                            mode: 'filter',
                                            value: 'beach',
                                        },
                                        {
                                            pageKey: 'hotels',
                                            label: {
                                                en: 'Luxury',
                                                fr: 'Luxe',
                                                ar: 'فاخر',
                                            },
                                            mode: 'filter',
                                            value: 'hotels:luxury',
                                        },
                                        {
                                            pageKey: 'tours',
                                            label: {
                                                en: 'Adventure',
                                                fr: 'Aventure',
                                                ar: 'مغامرة',
                                            },
                                            mode: 'filter',
                                            value: 'tours:adventure',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
            loading: false,
        });

        render(
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter>
                        <Navbar />
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>,
        );

        const button = await waitFor(() =>
            Array.from(document.querySelectorAll('button')).find((b) =>
                b.textContent?.includes('Explore'),
            ),
        );
        fireEvent.mouseEnter(button!);

        await waitFor(() =>
            expect(
                document.querySelector('a[href="/destinations?cat=beach"]'),
            ).toBeTruthy(),
        );
        expect(
            document.querySelector('a[href="/hotels?category_hotels=luxury"]'),
        ).toBeTruthy();
        expect(
            document.querySelector('a[href="/tours?category_tours=adventure"]'),
        ).toBeTruthy();
    });

    it('renders nested children of a group sub-page link', async () => {
        mockUseSiteSettings.mockReturnValue({
            settings: {
                content: {
                    nav: {
                        settings: {
                            header: [],
                            footer: [],
                            groups: [
                                {
                                    key: 'group-1',
                                    label: {
                                        en: 'Explore',
                                        fr: 'Explorer',
                                        ar: 'استكشف',
                                    },
                                    enabled: true,
                                    placement: 'top',
                                    pages: [],
                                    links: [
                                        {
                                            pageKey: 'tours',
                                            label: {
                                                en: 'Adventure',
                                                fr: 'Aventure',
                                                ar: 'مغامرة',
                                            },
                                            mode: 'filter',
                                            value: 'tours:adventure',
                                            children: [
                                                {
                                                    pageKey: 'deals',
                                                    label: {
                                                        en: 'Summer Deals',
                                                        fr: 'Offres',
                                                        ar: 'عروض',
                                                    },
                                                    mode: 'filter',
                                                    value: 'deals:summer',
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
            loading: false,
        });

        render(
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter>
                        <Navbar />
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>,
        );

        const button = await waitFor(() =>
            Array.from(document.querySelectorAll('button')).find((b) =>
                b.textContent?.includes('Explore'),
            ),
        );
        fireEvent.mouseEnter(button!);

        const parentLink = await waitFor(() =>
            document.querySelector('a[href="/tours?category_tours=adventure"]'),
        );
        const parentItem = parentLink?.closest('li');
        if (parentItem) fireEvent.mouseEnter(parentItem);

        await waitFor(() =>
            expect(
                document.querySelector(
                    'a[href="/deals?category_deals=summer"]',
                ),
            ).toBeTruthy(),
        );
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
                        {
                            label: 'Categories',
                            mode: 'categories',
                            value: 'destination',
                        },
                    ],
                },
                {
                    pageKey: 'hotels',
                    enabled: true,
                    placement: 'top',
                    isDropdown: true,
                    linkSelf: true,
                    items: [
                        {
                            label: 'Categories',
                            mode: 'categories',
                            value: 'hotel',
                        },
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

        const hoverTrigger = (text: string) => {
            const trigger = Array.from(
                document.querySelectorAll('a, button'),
            ).find((el) => el.textContent?.trim() === text);
            if (trigger) fireEvent.mouseEnter(trigger);
        };

        hoverTrigger('Destinations');

        await waitFor(() =>
            expect(
                document.querySelector(
                    'a[href="/destinations?category_destination=beach"]',
                ),
            ).toBeTruthy(),
        );
        expect(
            document.querySelector(
                'a[href="/destinations?category_destination=city"]',
            ),
        ).toBeTruthy();

        hoverTrigger('Hôtels');

        await waitFor(() =>
            expect(
                document.querySelector(
                    'a[href="/hotels?category_hotel=luxury"]',
                ),
            ).toBeTruthy(),
        );
    });

    it('uses the active locale label for search dropdown links', async () => {
        localStorage.setItem('lang', 'ar');

        mockUseSiteSettings.mockReturnValue(
            makeNavSettings([
                {
                    pageKey: 'tours',
                    enabled: true,
                    placement: 'top',
                    isDropdown: true,
                    linkSelf: true,
                    items: [
                        {
                            label: {
                                en: 'Summer',
                                fr: 'Été',
                                ar: 'صيف',
                            },
                            mode: 'search',
                            value: '',
                        },
                    ],
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

        await waitFor(() => {
            const trigger = Array.from(
                document.querySelectorAll('a, button'),
            ).find((el) => el.textContent?.trim() === 'الجولات');
            if (trigger) fireEvent.mouseEnter(trigger);
        });

        await waitFor(() => {
            const link = Array.from(document.querySelectorAll('a')).find(
                (anchor) =>
                    anchor.getAttribute('href') ===
                    '/tours?q=%D8%B5%D9%8A%D9%81',
            );
            expect(link).toBeTruthy();
            expect(link?.getAttribute('href')).toBe(
                '/tours?q=%D8%B5%D9%8A%D9%81',
            );
        });
    });

    it('resolves raw filter labels from the live category key', async () => {
        localStorage.setItem('lang', 'fr');

        mockUseSiteSettings.mockReturnValue(
            makeNavSettings([
                {
                    pageKey: 'destinations',
                    enabled: true,
                    placement: 'top',
                    isDropdown: true,
                    linkSelf: true,
                    items: [
                        {
                            label: 'beach',
                            mode: 'filter',
                            value: 'beach',
                        },
                    ],
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

        await waitFor(() => {
            const trigger = Array.from(
                document.querySelectorAll('a, button'),
            ).find((el) => el.textContent?.trim() === 'Destinations');
            if (trigger) fireEvent.mouseEnter(trigger);
        });

        await waitFor(() => {
            const link = Array.from(document.querySelectorAll('a')).find(
                (anchor) =>
                    anchor.getAttribute('href') === '/destinations?cat=beach',
            );

            expect(link).toBeTruthy();
            expect(link?.textContent).toContain('Plage');
        });
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
