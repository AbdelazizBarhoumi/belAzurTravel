import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminSiteSettingsLandingSections from '@/pages/admin/site-settings/AdminSiteSettingsLandingSections';

const mockLandingSectionsSettings = {
    content: {
        landing_sections: {
            order: ['blog'],
            sections: {
                blog: { enabled: true, style: 'carousel' },
                tours: { enabled: false, style: 'grid' },
            },
        },
    },
    landingVideo: null,
};

vi.mock('@/hooks/useSiteSettings', () => ({
    useSiteSettings: () => ({
        loading: false,
        settings: mockLandingSectionsSettings,
    }),
}));

vi.mock('@/components/layout/AdminLayout', () => ({
    AdminLayout: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
}));

vi.mock('@/components/admin/HeroImagesManager', () => ({
    HeroImagesManager: () => <div data-testid="hero-images-manager" />,
}));

describe('AdminSiteSettingsLandingSections', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('restores the location section when the saved order is partial', () => {
        render(
            <MemoryRouter>
                <LanguageProvider>
                    <AdminSiteSettingsLandingSections />
                </LanguageProvider>
            </MemoryRouter>,
        );

        expect(screen.getByText('Emplacement')).toBeInTheDocument();
        expect(screen.getByText('Blog')).toBeInTheDocument();
        expect(screen.getByText('Circuit & Excursions')).toBeInTheDocument();
        expect(screen.getByText('Nos Points Forts')).toBeInTheDocument();
    });
});
