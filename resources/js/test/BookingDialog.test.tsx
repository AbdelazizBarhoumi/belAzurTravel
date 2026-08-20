import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingDialog } from '@/components/forms/BookingDialog';
import { LanguageProvider } from '@/contexts/LanguageContext';

const { submitMock, paymentMock } = vi.hoisted(() => ({
    submitMock: vi.fn(),
    paymentMock: vi.fn(),
}));

vi.mock('@/hooks/useAuthUser', () => ({
    useAuthUser: () => ({
        data: {
            id: 1,
            name: 'Client User',
            email: 'client@example.com',
            role: 'client',
        },
        isPending: false,
        isFetching: false,
        isError: false,
    }),
}));

vi.mock('@/hooks/useBooking', () => ({
    api: {
        createBooking: submitMock,
    },
}));

vi.mock('@/api/payment.api', () => ({
    initiatePayment: paymentMock,
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

const providerOffer = {
    token: 'token-123',
    source: 'OS-TRAVEL-DIRECT',
    rooms: [
        {
            id: '501',
            boardingId: 4,
            viewIds: [1],
            supplements: [],
        },
    ],
    adults: 2,
    children: 1,
    childrenAges: [6],
    checkIn: '2026-09-01',
    checkOut: '2026-09-05',
    options: [
        { id: 1, title: 'Baby bed' },
        { id: 2, title: 'Airport transfer' },
    ],
};

function renderDialog(overrides: Partial<React.ComponentProps<typeof BookingDialog>> = {}) {
    return render(
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <MemoryRouter>
                    <BookingDialog
                        open
                        onOpenChange={() => undefined}
                        type="hotel"
                        itemSlug="sunset-bay"
                        itemName="Sunset Bay - Chambre Double Standard"
                        amount={1200}
                        provider={providerOffer}
                        {...overrides}
                    />
                </MemoryRouter>
            </LanguageProvider>
        </QueryClientProvider>,
    );
}

describe('BookingDialog passenger form', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        submitMock.mockResolvedValue({
            id: 1,
            status: 'Pending',
            total_amount: 1234,
            provider_prebook: { currency: 'TND' },
        });
        paymentMock.mockResolvedValue({ formUrl: 'https://pay.example', orderId: 'ord-1' });
    });

    it('builds a passenger row per adult and child with the searched ages', async () => {
        renderDialog();

        // 2 adults + 1 child = 3 numbered passenger rows.
        expect(
            await screen.findAllByText(/Passager\s+\d|Passenger\s+\d/),
        ).toHaveLength(3);
        expect(screen.getAllByLabelText(/Prénom|First name/).length).toBe(3);

        // The child block carries an editable age prefilled from the search.
        expect(screen.getAllByLabelText(/Âge|Age/).length).toBe(1);
    });

    it('submits a provider payload with the expected OS-TRAVEL pax shape', async () => {
        renderDialog();

        await screen.findAllByLabelText(/Prénom|First name/);
        const setField = (index: number, field: string, value: string) =>
            fireEvent.change(
                document.getElementById(`pax-${index}-${field}`) as HTMLInputElement,
                { target: { value } },
            );

        setField(0, 'firstName', 'John');
        setField(0, 'lastName', 'Doe');
        setField(1, 'firstName', 'Jane');
        setField(1, 'lastName', 'Roe');
        setField(2, 'firstName', 'Tim');
        setField(2, 'lastName', 'Roe');

        fireEvent.submit(document.querySelector('form') as HTMLFormElement);

        await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));

        const payload = submitMock.mock.calls[0][0] as {
            provider: {
                pax: {
                    adults: Array<{
                        Civility: string;
                        Name: string;
                        Surname: string;
                        Holder: boolean;
                    }>;
                    children: Array<{ Name: string; Surname: string; Age: number }>;
                };
                search: { check_in: string; check_out: string };
                rooms: Array<{ id: number; boarding_id: number; view_ids: number[] }>;
                options: number[];
            };
            start_date: string;
            end_date: string;
        };

        expect(payload.start_date).toBe('2026-09-01');
        expect(payload.end_date).toBe('2026-09-05');
        expect(payload.provider.options).toEqual([]);
        expect(payload.provider.pax.adults).toEqual([
            { Civility: 'Mr', Name: 'John', Surname: 'Doe', Holder: true },
            { Civility: 'Mr', Name: 'Jane', Surname: 'Roe', Holder: false },
        ]);
        expect(payload.provider.pax.children).toEqual([
            { Name: 'Tim', Surname: 'Roe', Age: 6 },
        ]);
        expect(payload.provider.rooms).toEqual([
            { id: 501, boarding_id: 4, view_ids: [1], supplements: [] },
        ]);
        expect(payload.provider.search).toEqual({
            check_in: '2026-09-01',
            check_out: '2026-09-05',
        });
    });

    it('renders the booking preferences as toggles and submits the selected ids', async () => {
        renderDialog();

        expect(await screen.findByText('Baby bed')).toBeInTheDocument();
        expect(screen.getByText('Airport transfer')).toBeInTheDocument();

        // Toggle "Baby bed" on and submit.
        fireEvent.click(screen.getByText('Baby bed'));
        fireEvent.submit(document.querySelector('form') as HTMLFormElement);

        await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));

        const payload = submitMock.mock.calls[0][0] as {
            provider: { options: number[] };
        };
        expect(payload.provider.options).toEqual([1]);
    });

    it('shows the submitted booking summary and never starts payment', async () => {
        renderDialog();

        await screen.findByText(/Request Booking|Demander la réservation/);
        fireEvent.submit(document.querySelector('form') as HTMLFormElement);

        // Every reservation goes through admin approval now — the dialog
        // surfaces the submitted request with its provider-prebook total and
        // never redirects to a payment session.
        expect(
            await screen.findByText(/Request submitted|Demande envoyée/),
        ).toBeInTheDocument();
        expect(screen.getByText(/1,234/)).toBeInTheDocument();
        expect(screen.getByText(/Done|Terminé/)).toBeInTheDocument();
        expect(paymentMock).not.toHaveBeenCalled();
    });

    it('keeps the dates locked to the searched offer', async () => {
        renderDialog();

        expect(screen.getByText(/verrouillées|locked/i)).toBeInTheDocument();
    });
});
