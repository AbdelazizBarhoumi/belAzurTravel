import { apiFetch } from './http';

export interface PaymentInitResponse {
    formUrl: string;
    orderId: string;
}

export async function initiatePayment(
    bookingId: number,
): Promise<PaymentInitResponse> {
    return apiFetch<PaymentInitResponse>(
        `/api/bookings/${bookingId}/pay`,
        {
            method: 'POST',
        },
    );
}

export async function retryPayment(
    bookingId: number,
): Promise<PaymentInitResponse> {
    return apiFetch<PaymentInitResponse>(
        `/api/bookings/${bookingId}/retry-payment`,
        {
            method: 'POST',
        },
    );
}
