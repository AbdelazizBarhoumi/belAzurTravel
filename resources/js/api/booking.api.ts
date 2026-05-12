export async function createBooking(payload: Record<string, unknown>) {
    const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        if (res.status === 401 || res.status === 419) {
            // not authenticated: redirect to login
            window.location.href = '/login';
            throw new Error('Authentication required');
        }

        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create booking');
    }

    return res.json();
}

export async function getBooking(id: number) {
    const res = await fetch(`/api/bookings/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Not found');
    return res.json();
}

export async function getAdminBookings() {
    const res = await fetch('/api/admin/bookings', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load bookings');
    return res.json();
}

export async function confirmBooking(id: number) {
    const res = await fetch(`/api/admin/bookings/${id}/confirm`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to confirm');
    return res.json();
}

export async function cancelBooking(id: number) {
    const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to cancel');
    return res.json();
}
