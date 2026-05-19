import { useQuery } from '@tanstack/react-query';
import * as api from '@/api/booking.api';

export { api };

export function useAdminBookings() {
    return useQuery({
        queryKey: ['admin-bookings'],
        queryFn: () => api.getAdminBookings(),
        staleTime: 60_000,
        refetchOnMount: false,
    });
}

export function useBooking(id?: number) {
    return useQuery({
        queryKey: ['booking', id],
        queryFn: () => api.getBooking(id as number),
        enabled: !!id,
    });
}
