import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import CarDetail from '@/pages/cars/show';

vi.mock('@/hooks/usePublicData', () => {
    const car = {
        slug: 'mercedes-e-class',
        name: { en: 'Mercedes E-Class', fr: 'Mercedes', ar: 'مرسيدس' },
        category: { en: 'Luxury', fr: 'Luxe', ar: 'فاخرة' },
        fuel: { en: 'Petrol', fr: 'Essence', ar: 'بنزين' },
        transmission: {
            en: 'Automatic',
            fr: 'Automatique',
            ar: 'أوتوماتيكي',
        },
        seats: 5,
        price: 120,
        image: '/images/mercedes.jpg',
        gallery: ['/images/mercedes.jpg'],
        description: {
            en: 'Premium sedan',
            fr: 'Berline premium',
            ar: 'سيدان فاخر',
        },
        features: [
            {
                en: 'Leather seats',
                fr: 'Leather seats',
                ar: 'Leather seats',
            },
        ],
        policy: [
            {
                en: 'Age 25+',
                fr: 'Age 25+',
                ar: 'Age 25+',
            },
        ],
    };

    return {
        useCarBySlug: (slug?: string) => ({
            data: slug === 'mercedes-e-class' ? car : null,
        }),
    };
});

const queryClient = new QueryClient();

function renderCarDetail(path = '/cars/mercedes-e-class') {
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <FavoritesProvider>
                    <MemoryRouter initialEntries={[path]}>
                        <Routes>
                            <Route path="/cars/:slug" element={<CarDetail />} />
                        </Routes>
                    </MemoryRouter>
                </FavoritesProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('CarDetail page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('renders the car gallery, specs and booking CTA', async () => {
        renderCarDetail();

        await screen.findByText(/Leather seats/i);
        await screen.findByText(/Age 25\+/i);
        expect(screen.getByText(/Features/i)).toBeInTheDocument();
        expect(screen.getByText(/Rental policy/i)).toBeInTheDocument();
        expect(
            screen.getAllByRole('button', { name: /Rent now/i }).length,
        ).toBeGreaterThan(0);
    });

    it('shows a fallback message for unknown cars', () => {
        renderCarDetail('/cars/unknown-car');

        // Multiple instances of the fallback may be rendered; assert at least one exists
        expect(screen.getAllByText(/Car not found/i).length).toBeGreaterThan(0);
        expect(
            screen.getByRole('link', { name: /All cars/i }),
        ).toBeInTheDocument();
    });
});
