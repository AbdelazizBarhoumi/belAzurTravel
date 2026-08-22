import {
    keepPreviousData,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    approveAllOsTravelHotels,
    approveOsTravelHotel,
    getOsTravelDashboard,
    getOsTravelHotel,
    getOsTravelReferences,
    listOsTravelHotels,
    rejectOsTravelHotel,
    reopenOsTravelHotel,
    unapproveOsTravelHotel,
    updateOsTravelHotel,
    type OsTravelListFilters,
    type OsTravelPricePayload,
    type OsTravelStatus,
} from '@/api/osTravel.api';
import { useLanguage } from '@/contexts/LanguageContext';

export const osTravelKeys = {
    dashboard: ['admin', 'os-travel', 'dashboard'] as const,
    hotels: (filters: OsTravelListFilters) =>
        ['admin', 'os-travel', 'hotels', filters] as const,
    references: ['admin', 'os-travel', 'references'] as const,
    detail: (id: string) =>
        ['admin', 'os-travel', 'hotels', 'detail', id] as const,
};

export function useOsTravelDashboard() {
    return useQuery({
        queryKey: osTravelKeys.dashboard,
        queryFn: async () => (await getOsTravelDashboard()).data,
    });
}

export function useOsTravelHotels(filters: OsTravelListFilters) {
    return useQuery({
        queryKey: osTravelKeys.hotels(filters),
        queryFn: async () => (await listOsTravelHotels(filters)).data,
        // Keep the previous list visible while a new filter (e.g. a date range
        // triggering the live price probe) is fetching.
        placeholderData: keepPreviousData,
    });
}

export function useOsTravelReferences() {
    return useQuery({
        queryKey: osTravelKeys.references,
        queryFn: async () => (await getOsTravelReferences()).data,
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
        include_without_image?: boolean;
        status?: OsTravelStatus | '';
        city?: string;
        country_id?: string;
        city_id?: string;
        stars?: number;
        check_in?: string;
        check_out?: string;
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

    const unapprove = async (id: string) => {
        const result = await unapproveOsTravelHotel(id);
        invalidateAll();
        return result.data;
    };

    const reopen = async (id: string) => {
        const result = await reopenOsTravelHotel(id);
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

    return {
        savePrice,
        approve,
        approveAll,
        reject,
        unapprove,
        reopen,
        toErrorMessage,
    };
}
