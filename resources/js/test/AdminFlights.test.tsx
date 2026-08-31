import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '@/api/admin.api';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import AdminFlights from '@/pages/admin/AdminFlights';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/api/admin.api', () => ({
    listAdminEntities: vi.fn().mockResolvedValue([]),
    saveAdminEntity: vi.fn().mockResolvedValue({}),
    deleteAdminEntity: vi.fn().mockResolvedValue({}),
}));

function renderAdminFlights() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <SiteSettingsProvider>
                    <MemoryRouter initialEntries={['/admin/flights']}>
                        <AdminFlights />
                    </MemoryRouter>
                </SiteSettingsProvider>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('AdminFlights page', () => {
    beforeEach(() => {
        localStorage.setItem('role', 'admin');
        localStorage.setItem('lang', 'en');
        vi.mocked(adminApi.listAdminEntities).mockResolvedValue([] as never);
    });

    afterEach(() => {
        localStorage.removeItem('role');
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('exposes full flight sections in the add dialog', async () => {
        renderAdminFlights();

        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(
            (
                await screen.findAllByText(
                    (content) =>
                        content.includes('Airline') ||
                        content.includes('Compagnie'),
                )
            ).length,
        ).toBeGreaterThan(0);
        expect(screen.getByText('Route and airline')).toBeInTheDocument();
        expect(screen.getByText('Schedule')).toBeInTheDocument();
        expect(
            screen.getByText('Cabin and service details'),
        ).toBeInTheDocument();
        expect(
            screen.getAllByText((content) => content.includes('Airline'))
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Destination'))
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Duration'))
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Stops')).length,
        ).toBeGreaterThan(0);
        expect(screen.getByText('Departure time')).toBeInTheDocument();
        expect(screen.getByText('Arrival time')).toBeInTheDocument();
        expect(screen.getByText('Travel date')).toBeInTheDocument();
        expect(screen.getByText('Seats')).toBeInTheDocument();
        expect(
            screen.getAllByText((content) => content.includes('Cabin')).length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Aircraft'))
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Baggage'))
                .length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText((content) => content.includes('Refund')).length,
        ).toBeGreaterThan(0);
    });

    it('preserves gallery arrays when editing an existing flight', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValueOnce([
            {
                id: 'flight-1',
                code: 'flight-1',
                trip_type: 'round-trip',
                airline_en: 'Existing Airline',
                airline_fr: 'Compagnie existante',
                airline_ar: 'شركة موجودة',
                airline: {
                    en: 'Existing Airline',
                    fr: 'Compagnie existante',
                    ar: 'شركة موجودة',
                },
                from: 'NYC',
                to_en: 'Paris',
                to_fr: 'Paris',
                to_ar: 'باريس',
                to: {
                    en: 'Paris',
                    fr: 'Paris',
                    ar: 'باريس',
                },
                duration_en: '7h 30m',
                duration_fr: '7h 30m',
                duration_ar: '٧ ساعات و ٣٠ دقيقة',
                duration: {
                    en: '7h 30m',
                    fr: '7h 30m',
                    ar: '٧ ساعات و ٣٠ دقيقة',
                },
                price: 750,
                stops_en: 'Direct',
                stops_fr: 'Direct',
                stops_ar: 'مباشر',
                stops: {
                    en: 'Direct',
                    fr: 'Direct',
                    ar: 'مباشر',
                },
                departure: '14:00',
                arrival: '22:30+1',
                date: '2026-06-01',
                seats: 250,
                cabin_en: 'Business',
                cabin_fr: 'Affaires',
                cabin_ar: 'الفئة الأولى',
                cabin: {
                    en: 'Business',
                    fr: 'Affaires',
                    ar: 'الفئة الأولى',
                },
                aircraft_en: 'Boeing 777',
                aircraft_fr: 'Boeing 777',
                aircraft_ar: 'بوينج 777',
                baggage_en: '2 bags',
                baggage_fr: '2 bagages',
                baggage_ar: 'حقيبتان',
                refund_en: 'Refundable',
                refund_fr: 'Remboursable',
                refund_ar: 'قابل للاسترداد',
                gallery: ['uploads/flights/a.jpg', 'uploads/flights/b.jpg'],
                details: {
                    gallery: ['uploads/flights/a.jpg', 'uploads/flights/b.jpg'],
                    date: '2026-06-01',
                    seats: 250,
                    cabin: {
                        en: 'Business',
                        fr: 'Affaires',
                        ar: 'الفئة الأولى',
                    },
                    aircraft: {
                        en: 'Boeing 777',
                        fr: 'Boeing 777',
                        ar: 'بوينج 777',
                    },
                    baggage: {
                        en: '2 bags',
                        fr: '2 bagages',
                        ar: 'حقيبتان',
                    },
                    refund: {
                        en: 'Refundable',
                        fr: 'Remboursable',
                        ar: 'قابل للاسترداد',
                    },
                },
            },
        ] as never);

        vi.mocked(adminApi.saveAdminEntity).mockResolvedValueOnce({} as never);

        renderAdminFlights();

        const flightCode = await screen.findByText('flight-1');
        const row = flightCode.closest('tr');
        expect(row).not.toBeNull();

        fireEvent.click(within(row as HTMLElement).getAllByRole('button')[0]);
        await screen.findByRole('dialog');

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [entityType, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];
        expect(entityType).toBe('flights');
        expect(payload).toEqual(
            expect.objectContaining({
                gallery: ['uploads/flights/a.jpg', 'uploads/flights/b.jpg'],
            }),
        );
    });

    it('strips nested localized objects from the edit payload', async () => {
        vi.mocked(adminApi.listAdminEntities).mockResolvedValueOnce([
            {
                id: 'flight-2',
                code: 'flight-2',
                trip_type: 'round-trip',
                airline_en: 'Airline Two',
                airline_fr: 'Compagnie Deux',
                airline_ar: 'شركة ثانية',
                airline: {
                    en: 'Airline Two',
                    fr: 'Compagnie Deux',
                    ar: 'شركة ثانية',
                },
                from: 'CDG',
                to_en: 'Dubai',
                to_fr: 'Dubaï',
                to_ar: 'دبي',
                to: {
                    en: 'Dubai',
                    fr: 'Dubaï',
                    ar: 'دبي',
                },
                duration_en: '6h 15m',
                duration_fr: '6h 15m',
                duration_ar: '٦ ساعات و ١٥ دقيقة',
                duration: {
                    en: '6h 15m',
                    fr: '6h 15m',
                    ar: '٦ ساعات و ١٥ دقيقة',
                },
                price: 600,
                stops_en: 'Nonstop',
                stops_fr: 'Sans escale',
                stops_ar: 'مباشر',
                stops: {
                    en: 'Nonstop',
                    fr: 'Sans escale',
                    ar: 'مباشر',
                },
                departure: '09:15',
                arrival: '15:30',
                date: '2026-06-10',
                seats: 180,
                cabin_en: 'Economy+',
                cabin_fr: 'Économie+',
                cabin_ar: 'اقتصادية+',
                cabin: {
                    en: 'Economy+',
                    fr: 'Économie+',
                    ar: 'اقتصادية+',
                },
                aircraft_en: 'Airbus A321',
                aircraft_fr: 'Airbus A321',
                aircraft_ar: 'إيرباص A321',
                baggage_en: '1 checked bag',
                baggage_fr: '1 bagage en soute',
                baggage_ar: 'حقيبة مسجلة واحدة',
                refund_en: 'Refundable with fee',
                refund_fr: 'Remboursable avec frais',
                refund_ar: 'قابل للاسترداد مع رسوم',
                gallery: ['uploads/flights/c.jpg'],
                details: {
                    gallery: ['uploads/flights/c.jpg'],
                    date: '2026-06-10',
                    seats: 180,
                    cabin: {
                        en: 'Economy+',
                        fr: 'Économie+',
                        ar: 'اقتصادية+',
                    },
                    aircraft: {
                        en: 'Airbus A321',
                        fr: 'Airbus A321',
                        ar: 'إيرباص A321',
                    },
                    baggage: {
                        en: '1 checked bag',
                        fr: '1 bagage en soute',
                        ar: 'حقيبة مسجلة واحدة',
                    },
                    refund: {
                        en: 'Refundable with fee',
                        fr: 'Remboursable avec frais',
                        ar: 'قابل للاسترداد مع رسوم',
                    },
                },
            },
        ] as never);

        vi.mocked(adminApi.saveAdminEntity).mockResolvedValueOnce({} as never);

        renderAdminFlights();

        const flightCode = await screen.findByText('flight-2');
        const row = flightCode.closest('tr');
        expect(row).not.toBeNull();

        fireEvent.click(within(row as HTMLElement).getAllByRole('button')[0]);
        await screen.findByRole('dialog');

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(adminApi.saveAdminEntity).toHaveBeenCalled();
        });

        const [, payload] =
            vi.mocked(adminApi.saveAdminEntity).mock.calls[0] ?? [];

        expect(payload).toEqual(
            expect.objectContaining({
                airline_en: 'Airline Two',
                to_en: 'Dubai',
                duration_en: '6h 15m',
                stops_en: 'Nonstop',
                cabin_en: 'Economy+',
                aircraft_en: 'Airbus A321',
                baggage_en: '1 checked bag',
                refund_en: 'Refundable with fee',
            }),
        );

        expect(payload).not.toHaveProperty('airline');
        expect(payload).not.toHaveProperty('to');
        expect(payload).not.toHaveProperty('duration');
        expect(payload).not.toHaveProperty('stops');
        expect(payload).not.toHaveProperty('cabin');
        expect(payload).not.toHaveProperty('aircraft');
        expect(payload).not.toHaveProperty('baggage');
        expect(payload).not.toHaveProperty('refund');
    });
});
