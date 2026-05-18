import { apiFetch } from './http';

export interface AdminBookingRow {
    id: number;
    user_id: number | null;
    type: string;
    items: unknown[];
    client?: { name?: string };
    created_at: string;
    total_amount: number;
    status: 'Pending' | 'Confirmed' | 'Cancelled';
}

export interface ClientBookingRow {
    id: number;
    type: string;
    item_slug?: string | null;
    item_id?: string | null;
    items: Array<{ slug?: string; id?: string; qty?: number }>;
    start_date?: string | null;
    end_date?: string | null;
    total_amount: number;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
    can_cancel?: boolean;
    cancel_reason?: string | null;
    created_at: string;
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

export async function getBooking(id: number) {
    return apiFetch(`/api/bookings/${id}`);
}

export async function getAdminBookings() {
    return apiFetch<AdminBookingRow[]>('/api/admin/bookings');
}

export async function getClientDashboard() {
    return apiFetch<ClientDashboardPayload>('/api/client/dashboard');
}

export async function getClientBookings() {
    return apiFetch<ClientBookingRow[]>('/api/client/bookings');
}

export async function getClientPayments() {
    return apiFetch<
        Array<{
            id: number;
            booking_id: number;
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

export async function confirmBooking(id: number) {
    return apiFetch(`/api/admin/bookings/${id}/confirm`, {
        method: 'POST',
    });
}

export async function cancelBooking(id: number) {
    return apiFetch(`/api/bookings/${id}/cancel`, {
        method: 'POST',
    });
}

export async function adminCancelBooking(id: number) {
    return apiFetch(`/api/admin/bookings/${id}/cancel`, {
        method: 'POST',
    });
}
