import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { SiteSettings } from '@/api/siteSettings.api';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Contact from '@/pages/general/Contact';

vi.mock('@/hooks/useSiteSettings', () => ({
    useSiteSettings: () => ({ settings: mockSettings, loading: false }),
}));

const mockSettings = {
    companyName: 'BelAzurTravel',
    email: 'hello@belazurtravel.com',
    phone: '+1234567890',
    phone2: '',
    whatsapp: '+1234567890',
    address: 'Sousse, Tunisia',
    plusCode: 'a2oSKMqSzvtJCCwJ6',
    mapLat: '35.8322935',
    mapLng: '10.6295205',
    mapEmbed: '',
    socialLinks: [
        { label: 'Facebook', href: 'https://facebook.com/belazurtravel' },
        { label: 'WhatsApp', href: 'https://wa.me/1234567890' },
    ],
    legalSections: [],
    footerLinks: [],
    hours: [],
    content: {},
} as unknown as SiteSettings;

describe('Contact page', () => {
    it('shows the main contact methods and location', () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <LanguageProvider>
                        <FavoritesProvider>
                            <Contact />
                        </FavoritesProvider>
                    </LanguageProvider>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        expect(
            screen.getAllByText(/Contact Us|Contactez-nous|اتصل بنا/i).length,
        ).toBeGreaterThan(0);
        expect(screen.getAllByText(/WhatsApp/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Facebook/i).length).toBeGreaterThan(0);
        expect(
            screen.getAllByText(/Our location|Notre emplacement/i).length,
        ).toBeGreaterThan(0);
    });
});
