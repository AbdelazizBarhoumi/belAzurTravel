import { useQuery } from '@tanstack/react-query';
import {
    type CarItem,
    type DealItem,
    type DestinationItem,
    type EventItem,
    type FlightItem,
    type HotelItem,
    type PromoItem,
    type TourDetailItem,
    type TourItem,
    type BlogPostItem,
} from '@/api/entities.api';
import { apiFetch } from '@/api/http';
import type { Lang } from '@/i18n/translations';

export type HotelDetailLookupData = {
    id: string;
    name: Record<string, string>;
    city?: Record<string, string>;
    country?: Record<string, string>;
    location: Record<string, string>;
    address?: string;
    stars: number;
    rating: number;
    reviews: number;
    phone?: string;
    whatsapp?: string;
    description?: Record<string, string>;
    about?: Record<string, string>;
    images?: string[];
    gallery?: string[];
    image?: string;
    price?: number;
    amenities?: Array<string | Record<string, string>>;
    rooms?: Array<{
        id: string;
        name: Record<string, string>;
        description: Record<string, string>;
        pricePerNight: number;
        capacity: number;
        size: number;
        features: Array<Record<string, string>>;
        images: string[];
    }>;
};

async function fetchEntity<TData>(
    type: string,
    identifier?: string,
): Promise<TData> {
    return apiFetch<TData>(
        `/api/${type}${identifier ? `/${identifier}` : ''}`,
    );
}

function useEntityQuery<TData>(options: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<TData>;
    enabled?: boolean;
}) {
    return useQuery({
        queryKey: options.queryKey,
        queryFn: options.queryFn,
        enabled: options.enabled,
        staleTime: 1000 * 60 * 5,
    });
}

export function useDestinations() {
    return useEntityQuery<DestinationItem[]>({
        queryKey: ['destinations'],
        queryFn: () => fetchEntity('destinations'),
    });
}

export function useDestinationBySlug(slug?: string) {
    return useEntityQuery<DestinationItem | null>({
        queryKey: ['destinations', slug],
        queryFn: () => fetchEntity('destinations', slug),
        enabled: Boolean(slug),
    });
}

export function useHotels() {
    return useEntityQuery<HotelItem[]>({
        queryKey: ['hotels'],
        queryFn: () => fetchEntity('hotels'),
    });
}

export function useHotelById(id?: string) {
    return useEntityQuery<HotelDetailLookupData | null>({
        queryKey: ['hotels', id],
        queryFn: () => fetchEntity('hotels', id),
        enabled: Boolean(id),
    });
}

export function useTours() {
    return useEntityQuery<TourItem[]>({
        queryKey: ['tours'],
        queryFn: () => fetchEntity('tours'),
    });
}

export function useTourBySlug(slug?: string) {
    return useEntityQuery<TourItem | null>({
        queryKey: ['tours', slug],
        queryFn: () => fetchEntity('tours', slug),
        enabled: Boolean(slug),
    });
}

export function useTourDetailsBySlug(slug?: string) {
    return useEntityQuery<TourDetailItem | null>({
        queryKey: ['tour-details', slug],
        queryFn: () => fetchEntity('tours', slug),
        enabled: Boolean(slug),
    });
}

export function useCars() {
    return useEntityQuery<CarItem[]>({
        queryKey: ['cars'],
        queryFn: () => fetchEntity('cars'),
    });
}

export function useCarBySlug(slug?: string) {
    return useEntityQuery<CarItem | null>({
        queryKey: ['cars', slug],
        queryFn: () => fetchEntity('cars', slug),
        enabled: Boolean(slug),
    });
}

export function useFlights() {
    return useEntityQuery<FlightItem[]>({
        queryKey: ['flights'],
        queryFn: () => fetchEntity('flights'),
    });
}

export function useFlightById(id?: string) {
    return useEntityQuery<FlightItem | null>({
        queryKey: ['flights', id],
        queryFn: () => fetchEntity('flights', id),
        enabled: Boolean(id),
    });
}

export function useEvents() {
    return useEntityQuery<EventItem[]>({
        queryKey: ['events'],
        queryFn: () => fetchEntity('events'),
    });
}

export function useEventBySlug(slug?: string) {
    return useEntityQuery<EventItem | null>({
        queryKey: ['events', slug],
        queryFn: () => fetchEntity('events', slug),
        enabled: Boolean(slug),
    });
}

export function useDeals() {
    return useEntityQuery<DealItem[]>({
        queryKey: ['deals'],
        queryFn: () => fetchEntity('deals'),
    });
}

export function useDealBySlug(slug?: string) {
    return useEntityQuery<DealItem | null>({
        queryKey: ['deals', slug],
        queryFn: () => fetchEntity('deals', slug),
        enabled: Boolean(slug),
    });
}

export function useSearchDeals(query: string, lang: Lang) {
    return useQuery({
        queryKey: ['deals', 'search', query, lang],
        queryFn: async () => {
            const deals = await fetchEntity<DealItem[]>('deals');
            const normalizedQuery = query.trim().toLowerCase();

            if (!normalizedQuery) {
                return deals;
            }

            return deals.filter((deal) =>
                [
                    deal.title?.[lang],
                    deal.description?.[lang],
                    deal.discount?.[lang],
                    deal.category?.[lang],
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(normalizedQuery),
            );
        },
        staleTime: 1000 * 60 * 5,
    });
}

export function usePromos() {
    return useEntityQuery<PromoItem[]>({
        queryKey: ['promos'],
        queryFn: () => fetchEntity('promos'),
    });
}

export function usePromoByCode(code?: string) {
    return useEntityQuery<PromoItem | null>({
        queryKey: ['promos', code],
        queryFn: () => fetchEntity('promos', code),
        enabled: Boolean(code),
    });
}

export function useBlogPosts() {
    return useEntityQuery<BlogPostItem[]>({
        queryKey: ['blog-posts'],
        queryFn: () => fetchEntity('blog-posts'),
    });
}

export function useBlogPostBySlug(slug?: string) {
    return useEntityQuery<BlogPostItem | null>({
        queryKey: ['blog-posts', slug],
        queryFn: () => fetchEntity('blog-posts', slug),
        enabled: Boolean(slug),
    });
}

