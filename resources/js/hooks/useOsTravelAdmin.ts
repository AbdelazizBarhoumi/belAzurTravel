import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    approveAllOsTravelHotels,
    approveOsTravelHotel,
    getOsTravelDashboard,
    getOsTravelHotel,
    listOsTravelHotels,
    rejectOsTravelHotel,
    updateOsTravelHotel,
    type OsTravelPricePayload,
    type OsTravelStatus,
} from '@/api/osTravel.api';
import { useLanguage } from '@/contexts/LanguageContext';

export const osTravelKeys = {
    dashboard: ['admin', 'os-travel', 'dashboard'] as const,
    hotels: (status: OsTravelStatus | '', city: string) =>
        ['admin', 'os-travel', 'hotels', status, city] as const,
    detail: (id: string) =>
        ['admin', 'os-travel', 'hotels', 'detail', id] as const,
};

export function useOsTravelDashboard() {
    return useQuery({
        queryKey: osTravelKeys.dashboard,
        queryFn: async () => (await getOsTravelDashboard()).data,
    });
}

export function useOsTravelHotels(status: OsTravelStatus | '', city: string) {
    return useQuery({
        queryKey: osTravelKeys.hotels(status, city),
        queryFn: async () =>
            (
                await listOsTravelHotels({
                    status: status || undefined,
                    city: city || undefined,
                })
            ).data,
    });
}

export function useOsTravelHotelDetail(id: string | null) {
    return useQuery({
        queryKey: osTravelKeys.detail(id ?? ''),
        queryFn: async () => (await getOsTravelHotel(id as string)).data,
        enabled: id !== null,
    });
}

export function useOsTravelAdmin() {
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'os-travel'] });
    };

    const savePrice = async (id: string, data: OsTravelPricePayload) => {
        const result = await updateOsTravelHotel(id, data);
        invalidateAll();
        return result.data;
    };

    const approve = async (id: string, data: OsTravelPricePayload) => {
        const result = await approveOsTravelHotel(id, data);
        invalidateAll();
        return result.data;
    };

    const approveAll = async (data: {
        markup_percentage?: number | null;
        currency?: string | null;
    }) => {
        const result = await approveAllOsTravelHotels(data);
        invalidateAll();
        return result.data;
    };

    const reject = async (id: string) => {
        const result = await rejectOsTravelHotel(id);
        invalidateAll();
        return result.data;
    };

    const toErrorMessage = (err: unknown, fallbackKey: string): string => {
        const e = err as {
            status?: number;
            data?: { message?: string; errors?: Record<string, string[]> };
        };
        if (e?.status === 422 && e.data?.errors) {
            const first = Object.values(e.data.errors)[0]?.[0];
            if (first) return first;
        }
        if (e?.data?.message) return e.data.message;
        return t(fallbackKey);
    };

    return { savePrice, approve, approveAll, reject, toErrorMessage };
}
