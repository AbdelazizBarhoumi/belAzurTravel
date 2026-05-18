import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import HotelDetail from '@/pages/hotels/show';

vi.mock('@/hooks/usePublicData', () => ({
    useHotelById: (id?: string) => ({
        data: id
            ? {
                  id,
                  name: { en: 'Sunset Paradise Resort', fr: 'Sunset Paradise Resort', ar: 'Sunset Paradise Resort' },
                  city: { en: 'Santorini', fr: 'Santorin', ar: 'سانتوريني' },
                  country: { en: 'Greece', fr: 'Grèce', ar: 'اليونان' },
                  location: { en: 'Santorini, Greece', fr: 'Santorin, Grèce', ar: 'سانتوريني، اليونان' },
                  description: { en: 'Luxury resort', fr: 'Luxury resort', ar: 'Luxury resort' },
                  gallery: ['/img1.jpg'],
                  stars: 5,
                  rating: 4.9,
                  reviews: 234,
                  whatsapp: '1234567890',
                  amenities: [{ en: 'Wi-Fi', fr: 'Wi-Fi', ar: 'Wi-Fi' }],
                  rooms: [
                      {
                          id: 'room-1',
                          name: { en: 'Deluxe Ocean View', fr: 'Deluxe Ocean View', ar: 'Deluxe Ocean View' },
                          description: { en: 'Room desc', fr: 'Room desc', ar: 'Room desc' },
                          pricePerNight: 320,
                          capacity: 2,
                          size: 45,
                          features: [{ en: 'Wi-Fi', fr: 'Wi-Fi', ar: 'Wi-Fi' }],
                          images: ['/room.jpg'],
                      },
                  ],
              }
            : null,
        isLoading: false,
    }),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

function renderPage(initialEntry: string) {
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <MemoryRouter initialEntries={[initialEntry]}>
                    <Routes>
                        <Route path="/hotels/:id" element={<HotelDetail />} />
                    </Routes>
                </MemoryRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('HotelDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders hotel data from the API hook', async () => {
        renderPage('/hotels/sunset-paradise-resort');

        expect(await screen.findByText('Sunset Paradise Resort')).toBeInTheDocument();
        expect(screen.getByText('Luxury resort')).toBeInTheDocument();
        expect(screen.getByText('Chambres disponibles')).toBeInTheDocument();
    });
});
