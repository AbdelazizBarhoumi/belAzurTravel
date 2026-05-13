import { useQuery } from '@tanstack/react-query';
import {
    findCarBySlug,
    findDealBySlug,
    findDestinationBySlug,
    findEventBySlug,
    findFlightById,
    findHotelById,
    findPromoByCode,
    findTourBySlug,
    findTourDetailBySlug,
    getCars,
    getDeals,
    getDestinations,
    getEvents,
    getFlights,
    getHotels,
    getPromos,
    getTours,
    searchDeals,
    type CarItem,
    type DealItem,
    type DestinationItem,
    type EventItem,
    type FlightItem,
    type HotelItem,
    type PromoItem,
    type TourDetailItem,
    type TourItem,
} from '@/api/catalog.api';
import type { Lang } from '@/i18n/translations';

function useSnapshotQuery<TData>(options: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<TData>;
    initialData: TData;
}) {
    return useQuery({
        queryKey: options.queryKey,
        queryFn: options.queryFn,
        initialData: options.initialData,
        staleTime: 1000 * 60 * 5,
    });
}

function useSnapshotNullableQuery<TData>(options: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<TData>;
    initialData: TData;
}) {
    return useQuery({
        queryKey: options.queryKey,
        queryFn: options.queryFn,
        initialData: options.initialData,
        staleTime: 1000 * 60 * 5,
    });
}

export function useDestinations() {
    return useSnapshotQuery<DestinationItem[]>({
        queryKey: ['destinations'],
        queryFn: async () => getDestinations(),
        initialData: getDestinations(),
    });
}

export function useDestinationBySlug(slug?: string) {
    const initialData = findDestinationBySlug(slug);

    return useSnapshotNullableQuery<DestinationItem | null>({
        queryKey: ['destinations', slug],
        queryFn: async () => findDestinationBySlug(slug),
        initialData,
    });
}

export function useHotels() {
    return useSnapshotQuery<HotelItem[]>({
        queryKey: ['hotels'],
        queryFn: async () => getHotels(),
        initialData: getHotels(),
    });
}

export function useHotelById(id?: string) {
    const initialData = findHotelById(id);

    return useSnapshotNullableQuery<HotelItem | null>({
        queryKey: ['hotels', id],
        queryFn: async () => findHotelById(id),
        initialData,
    });
}

export function useTours() {
    return useSnapshotQuery<TourItem[]>({
        queryKey: ['tours'],
        queryFn: async () => getTours(),
        initialData: getTours(),
    });
}

export function useTourBySlug(slug?: string) {
    const initialData = findTourBySlug(slug);

    return useSnapshotNullableQuery<TourItem | null>({
        queryKey: ['tours', slug],
        queryFn: async () => findTourBySlug(slug),
        initialData,
    });
}

export function useTourDetailsBySlug(slug?: string) {
    const initialData = findTourDetailBySlug(slug);

    return useSnapshotNullableQuery<TourDetailItem | null>({
        queryKey: ['tour-details', slug],
        queryFn: async () => findTourDetailBySlug(slug),
        initialData,
    });
}

export function useCars() {
    return useSnapshotQuery<CarItem[]>({
        queryKey: ['cars'],
        queryFn: async () => getCars(),
        initialData: getCars(),
    });
}

export function useCarBySlug(slug?: string) {
    const initialData = findCarBySlug(slug);

    return useSnapshotNullableQuery<CarItem | null>({
        queryKey: ['cars', slug],
        queryFn: async () => findCarBySlug(slug),
        initialData,
    });
}

export function useFlights() {
    return useSnapshotQuery<FlightItem[]>({
        queryKey: ['flights'],
        queryFn: async () => getFlights(),
        initialData: getFlights(),
    });
}

export function useFlightById(id?: string) {
    const initialData = findFlightById(id);

    return useSnapshotNullableQuery<FlightItem | null>({
        queryKey: ['flights', id],
        queryFn: async () => findFlightById(id),
        initialData,
    });
}

export function useEvents() {
    return useSnapshotQuery<EventItem[]>({
        queryKey: ['events'],
        queryFn: async () => getEvents(),
        initialData: getEvents(),
    });
}

export function useEventBySlug(slug?: string) {
    const initialData = findEventBySlug(slug);

    return useSnapshotNullableQuery<EventItem | null>({
        queryKey: ['events', slug],
        queryFn: async () => findEventBySlug(slug),
        initialData,
    });
}

export function useDeals() {
    return useSnapshotQuery<DealItem[]>({
        queryKey: ['deals'],
        queryFn: async () => getDeals(),
        initialData: getDeals(),
    });
}

export function useDealBySlug(slug?: string) {
    const initialData = findDealBySlug(slug);

    return useSnapshotNullableQuery<DealItem | null>({
        queryKey: ['deals', slug],
        queryFn: async () => findDealBySlug(slug),
        initialData,
    });
}

export function useSearchDeals(query: string, lang: Lang) {
    return useQuery({
        queryKey: ['deals', 'search', query, lang],
        queryFn: async () => searchDeals(query, lang),
        initialData: searchDeals(query, lang),
        staleTime: 1000 * 60 * 5,
    });
}

export function usePromos() {
    return useSnapshotQuery<PromoItem[]>({
        queryKey: ['promos'],
        queryFn: async () => getPromos(),
        initialData: getPromos(),
    });
}

export function usePromoByCode(code?: string) {
    const initialData = findPromoByCode(code);

    return useSnapshotNullableQuery<PromoItem | null>({
        queryKey: ['promos', code],
        queryFn: async () => findPromoByCode(code),
        initialData,
    });
}
