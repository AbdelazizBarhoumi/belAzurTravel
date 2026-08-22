import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClientBookingRow } from '@/api/booking.api';
import { VoucherCard } from '@/components/booking/VoucherCard';
import { LanguageProvider } from '@/contexts/LanguageContext';

describe('VoucherCard', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
        window.print = vi.fn();
    });

    const confirmedBooking: ClientBookingRow = {
        id: '550e8400-e29b-41d4-a716-446655440077',
        booking_ref: 77,
        type: 'hotel',
        item_slug: 'seaside-paradise',
        item_id: 'hotel-9',
        items: [{ slug: 'seaside-paradise', qty: 1 }],
        start_date: '2026-09-10',
        end_date: '2026-09-13',
        total_amount: 1299,
        currency: 'TND',
        status: 'Confirmed',
        can_cancel: false,
        created_at: new Date().toISOString(),
        provider_booking_id: 'PX-991',
        provider_booking_reference: 'PX-991',
        provider_prebook: {
            total: 1299,
            currency: 'TND',
            breakdown: {
                check_in: '2026-09-10',
                check_out: '2026-09-13',
                nights: 3,
                voucher: { Num: 'VCH-2026-77' },
                rooms: [
                    {
                        id: 1,
                        boarding: 'Half board',
                        total: 1299,
                        currency: 'TND',
                        price_per_night: 433,
                    },
                ],
            },
        },
    };

    it('renders the booking, provider reference, and payload summary', () => {
        const queryClient = new QueryClient();

        render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <VoucherCard booking={confirmedBooking} />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>,
        );

        expect(screen.getByText('Voucher')).toBeInTheDocument();
        expect(
            screen.getByText('Your booking is confirmed.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Booking reference')).toBeInTheDocument();
        expect(
            screen.getByText('#550e8400-e29b-41d4-a716-446655440077'),
        ).toBeInTheDocument();
        expect(screen.getByText('Service')).toBeInTheDocument();
        expect(
            screen.getByText('hotel / seaside-paradise / hotel-9'),
        ).toBeInTheDocument();
        expect(screen.getByText('Provider reference')).toBeInTheDocument();
        expect(screen.getByText('PX-991')).toBeInTheDocument();
        expect(screen.getAllByText('Dates').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Total').length).toBeGreaterThan(0);
        expect(screen.getAllByText('1,299 TND').length).toBeGreaterThan(0);
        expect(screen.getByText('Service summary')).toBeInTheDocument();
        expect(screen.getByText('Room 1')).toBeInTheDocument();
        expect(screen.getByText('Half board')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('calls window.print when the print button is pressed', () => {
        const queryClient = new QueryClient();

        render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <VoucherCard booking={confirmedBooking} />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>,
        );

        fireEvent.click(screen.getByText('Print'));
        expect(window.print).toHaveBeenCalledTimes(1);
    });

    it('omits the provider reference and breakdown when absent', () => {
        const booking: ClientBookingRow = {
            ...confirmedBooking,
            provider_booking_id: null,
            provider_booking_reference: null,
            provider_prebook: null,
        };
        const queryClient = new QueryClient();

        render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <VoucherCard booking={booking} />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>,
        );

        expect(
            screen.getByText('#550e8400-e29b-41d4-a716-446655440077'),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Provider reference'),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Service summary')).not.toBeInTheDocument();
    });
});
