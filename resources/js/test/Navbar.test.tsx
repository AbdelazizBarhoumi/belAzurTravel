import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type * as SiteSettingsApi from '@/api/siteSettings.api';
import { Navbar } from '@/components/layout/Navbar';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

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
