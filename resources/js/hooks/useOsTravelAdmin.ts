import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    approveAllOsTravelHotels,
    approveOsTravelHotel,
    getOsTravelDashboard,
    getOsTravelHotel,
    getOsTravelReferences,
    getOsTravelRefreshStatus,
    listOsTravelHotels,
    refreshOsTravelPrice,
    refreshOsTravelPrices,
    rejectOsTravelHotel,
    updateOsTravelHotel,
    type OsTravelListFilters,
    type OsTravelPricePayload,
    type OsTravelRefreshRequest,
} from '@/api/osTravel.api';
import { useLanguage } from '@/contexts/LanguageContext';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let refreshPollMs = 5000;

/**
 * Test-only override for the refresh status poll interval. Set it to 0 in
 * tests so the polling loop resolves without real timers.
 */
export const __setRefreshPollMs = (ms: number): void => {
    refreshPollMs = ms;
};

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

    const refreshPrice = async (id: string) => {
        const result = await refreshOsTravelPrice(id);
        invalidateAll();
        return result.data;
    };

    const refreshPrices = async (data?: {
        ids?: string[];
        check_in?: string;
        check_out?: string;
    }): Promise<OsTravelRefreshRequest> => {
        // Enqueue the refresh, then poll its status until it reaches a
        // terminal state. The actual work runs on the scheduler so a large
        // catalog never blocks the admin's HTTP request.
        const created = await refreshOsTravelPrices(data);
        let req = created.data;

        const startedAt = Date.now();
        const timeoutMs = 10 * 60 * 1000;
        while (req.status === 'pending' || req.status === 'processing') {
            if (Date.now() - startedAt > timeoutMs) {
                throw Object.assign(
                    new Error(t('osTravel.refreshTimeout')),
                    { status: 500, data: { message: t('osTravel.refreshTimeout') } },
                );
            }

            await delay(refreshPollMs);
            const status = await getOsTravelRefreshStatus(req.id);
            req = status.data ?? req;
        }

        if (req.status === 'failed') {
            const message = req.error || t('osTravel.refreshFailed');
            throw Object.assign(new Error(message), {
                status: 500,
                data: { message },
            });
        }

        invalidateAll();

        return req;
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

    return { savePrice, approve, approveAll, reject, refreshPrice, refreshPrices, toErrorMessage };
}
