import { apiFetch } from './http';

export interface AdminBookingRow {
    id: string;
    booking_ref: number;
    user_id: number | null;
    type: string;
    items: unknown[];
    client?: { name?: string };
    start_date?: string | null;
    end_date?: string | null;
    created_at: string;
    total_amount: number;
    is_request?: boolean;
    status:
        | 'Pending'
        | 'Approved'
        | 'Confirmed'
        | 'Rejected'
        | 'Cancelled'
        | 'Expired'
        | 'Completed';
    details?: {
        room_name?: string | null;
        boarding_name?: string | null;
        image?: string | null;
        price_per_night?: number | null;
        nights?: number | null;
        currency?: string | null;
        base_price?: number | null;
        final_price?: number | null;
        promo_rate?: string | null;
        not_refundable?: boolean;
        free_cancellation_until?: string | null;
        cancellation_policy?: Array<{
            fees?: number | string;
            type?: string | null;
            nature?: string | null;
            description?: string | null;
            from_date?: string | null;
        }> | null;
        supplements?: Array<{
            name: string;
            price: number;
            perNight?: boolean;
        }> | null;
        room_size?: number | null;
        room_capacity?: number | null;
        room_features?: string[] | null;
    } | null;
}

export interface ClientBookingRow {
    id: string;
    booking_ref: number;
    type: string;
    item_slug?: string | null;
    item_id?: string | null;
    items: Array<{ slug?: string; id?: string; qty?: number }>;
    start_date?: string | null;
    end_date?: string | null;
    total_amount: number;
    currency?: string;
    is_request?: boolean;
    status:
        | 'Pending'
        | 'Approved'
        | 'Confirmed'
        | 'Rejected'
        | 'Cancelled'
        | 'Expired'
        | 'Completed';
    can_cancel?: boolean;
    cancel_reason?: string | null;
    cancel_closed_reason?: string | null;
    reject_reason?: string | null;
    rejected_at?: string | null;
    confirmed_at?: string | null;
    cancelled_at?: string | null;
    expires_at?: string | null;
    created_at: string;
    provider_booking_id?: string | null;
    provider_booking_reference?: string | null;
    provider_prebook?: {
        total?: number;
        currency?: string;
        breakdown?: {
            check_in?: string | null;
            check_out?: string | null;
            nights?: number;
            total?: number;
            currency?: string;
            voucher?: {
                Num?: string | null;
            } | null;
            rooms?: Array<{
                id?: number | null;
                boarding?: string | null;
                total?: number;
                currency?: string;
                price_per_night?: number;
            }>;
            cancellation_policy?: Array<{
                fees?: number | string;
                type?: string | null;
                nature?: string | null;
                description?: string | null;
                from_date?: string | null;
            }>;
        } | null;
    } | null;
    details?: {
        room_name?: string | null;
        boarding_name?: string | null;
        image?: string | null;
        price_per_night?: number | null;
        nights?: number | null;
        currency?: string | null;
        base_price?: number | null;
        final_price?: number | null;
        promo_rate?: string | null;
        not_refundable?: boolean;
        free_cancellation_until?: string | null;
        cancellation_policy?: Array<{
            fees?: number | string;
            type?: string | null;
            nature?: string | null;
            description?: string | null;
            from_date?: string | null;
        }> | null;
        supplements?: Array<{
            name: string;
            price: number;
            perNight?: boolean;
        }> | null;
        room_size?: number | null;
        room_capacity?: number | null;
        room_features?: string[] | null;
    } | null;
}

/**
 * Single-booking payload returned by GET /api/bookings/{id}. Superset of
 * `ClientBookingRow` with the extra fields only the detail endpoint exposes.
 */
export interface BookingDetailRow extends ClientBookingRow {
    client?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    guests?: Array<{ name?: string }> | null;
    notes?: string | null;
    promo_code?: string | null;
    amount?: number;
    details?: {
        room_name?: string | null;
        boarding_name?: string | null;
        image?: string | null;
        price_per_night?: number | null;
        nights?: number | null;
        currency?: string | null;
        base_price?: number | null;
        final_price?: number | null;
        promo_rate?: string | null;
        not_refundable?: boolean;
        free_cancellation_until?: string | null;
        cancellation_policy?: Array<{
            fees?: number | string;
            type?: string | null;
            nature?: string | null;
            description?: string | null;
            from_date?: string | null;
        }> | null;
        supplements?: Array<{
            name: string;
            price: number;
            perNight?: boolean;
        }> | null;
        room_size?: number | null;
        room_capacity?: number | null;
        room_features?: string[] | null;
    } | null;
}

export interface ClientDashboardPayload {
    stats: {
        upcomingTrips: number;
        totalBookings: number;
        payments: number;
        unreadNotifications: number;
    };
    bookings: ClientBookingRow[];
    notifications: Array<{
        id: string;
        data: Record<string, unknown>;
        read_at?: string | null;
        created_at?: string | null;
    }>;
}

export async function createBooking(payload: Record<string, unknown>) {
    return apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getBooking(id: string) {
    return apiFetch<BookingDetailRow>(`/api/bookings/${id}`);
}

export async function getAdminBookings() {
    return apiFetch<AdminBookingRow[]>('/api/admin/bookings');
}

export async function getClientDashboard() {
    return apiFetch<ClientDashboardPayload>('/api/client/dashboard');
}

export async function getClientPayments() {
    return apiFetch<
        Array<{
            id: string;
            booking_id: string;
            booking_ref?: number;
            amount: number;
            currency: string;
            status: string;
            paid_at?: string | null;
            reference?: string | null;
        }>
    >('/api/client/payments');
}

export async function createSupportInquiry(payload: {
    subject: string;
    message: string;
}) {
    return apiFetch('/api/client/support', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function updateClientProfile(payload: {
    name: string;
    email: string;
}) {
    return apiFetch('/api/client/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function updateClientLanguage(language: string) {
    return apiFetch('/api/user/language', {
        method: 'PATCH',
        body: JSON.stringify({ language }),
    });
}

export async function approveBooking(id: string) {
    return apiFetch(`/api/admin/bookings/${id}/approve`, {
        method: 'POST',
    });
}

export async function rejectBooking(id: string, reason: string) {
    return apiFetch(`/api/admin/bookings/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
}

export async function cancelBooking(id: string) {
    return apiFetch(`/api/bookings/${id}/cancel`, {
        method: 'POST',
    });
}

export async function adminCancelBooking(id: string) {
    return apiFetch(`/api/admin/bookings/${id}/cancel`, {
        method: 'POST',
    });
}
