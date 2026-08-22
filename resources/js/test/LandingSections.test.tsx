import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LandingSections } from '@/components/sections/LandingSections';
import { useSiteSettings } from '@/hooks/useSiteSettings';

vi.mock('@/hooks/useSiteSettings', () => ({
    useSiteSettings: vi.fn(),
}));

vi.mock('@/components/sections/landing/BlogSection', () => ({
    BlogSection: () => <div data-testid="section-blog">blog</div>,
}));

vi.mock('@/components/sections/landing/CarsSection', () => ({
    CarsSection: () => <div data-testid="section-cars">cars</div>,
}));

vi.mock('@/components/sections/landing/DealsSection', () => ({
    DealsSection: () => <div data-testid="section-deals">deals</div>,
}));

vi.mock('@/components/sections/landing/DestinationsSection', () => ({
    DestinationsSection: () => (
        <div data-testid="section-destinations">destinations</div>
    ),
}));

vi.mock('@/components/sections/landing/EventsSection', () => ({
    EventsSection: () => <div data-testid="section-events">events</div>,
}));

vi.mock('@/components/sections/landing/FlightsSection', () => ({
    FlightsSection: () => <div data-testid="section-flights">flights</div>,
}));

vi.mock('@/components/sections/landing/HotelsSection', () => ({
    HotelsSection: () => <div data-testid="section-hotels">hotels</div>,
}));

vi.mock('@/components/sections/landing/LocationSection', () => ({
    LocationSection: () => <div data-testid="section-location">location</div>,
}));

vi.mock('@/components/sections/landing/OrganizedSection', () => ({
    OrganizedSection: () => (
        <div data-testid="section-organized">organized</div>
    ),
}));

vi.mock('@/components/sections/landing/ToursSection', () => ({
    ToursSection: () => <div data-testid="section-tours">tours</div>,
}));

vi.mock('@/components/sections/landing/VisaSection', () => ({
    VisaSection: () => <div data-testid="section-visas">visas</div>,
}));

describe('LandingSections', () => {
    it('renders location and other enabled supported sections even with a partial saved order', () => {
        vi.mocked(useSiteSettings).mockReturnValue({
            settings: {
                content: {
                    landing_sections: {
                        order: ['blog'],
                        sections: {
                            blog: { enabled: true, style: 'carousel' },
                            destinations: { enabled: true, style: 'grid' },
                            tours: { enabled: false, style: 'cards' },
                        },
                    },
                },
            },
        } as never);

        const { container } = render(<LandingSections />);

        expect(screen.getByTestId('section-blog')).toBeInTheDocument();
        expect(screen.getByTestId('section-destinations')).toBeInTheDocument();
        expect(screen.getByTestId('section-location')).toBeInTheDocument();
        expect(screen.queryByTestId('section-tours')).not.toBeInTheDocument();

        const renderedSectionIds = Array.from(
            container.querySelectorAll('[data-testid^="section-"]'),
        ).map((element) => element.getAttribute('data-testid'));

        expect(renderedSectionIds[0]).toBe('section-blog');
        expect(renderedSectionIds.at(-1)).toBe('section-location');
    });
});
