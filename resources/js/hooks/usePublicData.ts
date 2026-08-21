import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
    type TravelDetailItem,
    type TravelItem,
    type BlogPostItem,
} from '@/api/entities.api';
import { normalizeCarDetailEntries } from '@/api/entities.api';
import { apiFetch } from '@/api/http';
import type { Lang } from '@/i18n/translations';
import { fetchAllCategories } from '@/lib/categoryCache';

export type HotelDetailLookupData = {
    id: string;
    name: Record<string, string>;
    city?: Record<string, string>;
    country?: Record<string, string>;
    location: Record<string, string>;
    category_key?: string;
    category?: Record<string, string>;
    stars: number;
    rating: number;
    reviews: number;
    description?: Record<string, string>;
    about?: Record<string, string>;
    images?: string[];
    gallery?: string[];
    image?: string;
    price?: number;
    currency?: string;
    source?: 'ostravel' | 'manual';
    provider?: 'ostravel' | 'manual';
    address?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    coordinates?: { latitude: number; longitude: number } | null;
    check_in_time?: string;
    check_out_time?: string;
    hotel_type?: string;
    note?: string;
    options?: Array<{ id: number; title: string }>;
    boardings?: Array<{
        id: number;
        code: string;
        name: string;
        description: string;
    }>;
    facilities?: Array<{ title: string; category: string }>;
    amenity_tags?: Array<{ id: number; title: string; image: string }>;
    amenities?: Array<string | Record<string, string>>;
    rooms?: Array<{
        id: string;
        name: Record<string, string>;
        description?: Record<string, string> | null;
        pricePerNight: number;
        capacity: number;
        size: number;
        features?: Array<Record<string, string> | null> | null;
        images?: string[] | null;
    }>;
};

async function fetchEntity<TData>(
    type: string,
    identifier?: string,
): Promise<TData> {
    return apiFetch<TData>(`/api/${type}${identifier ? `/${identifier}` : ''}`);
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

export function useDestinations(enabled = true) {
    return useEntityQuery<DestinationItem[]>({
        queryKey: ['destinations'],
        queryFn: () => fetchEntity('destinations'),
        enabled,
    });
}

export function useDestinationBySlug(slug?: string) {
    return useEntityQuery<DestinationItem | null>({
        queryKey: ['destinations', slug],
        queryFn: () => fetchEntity('destinations', slug),
        enabled: Boolean(slug),
    });
}

export function useHotels(enabled = true) {
    return useEntityQuery<HotelItem[]>({
        queryKey: ['hotels'],
        queryFn: () => fetchEntity('hotels'),
        enabled,
    });
}

export function useHotelById(id?: string) {
    return useEntityQuery<HotelDetailLookupData | null>({
        queryKey: ['hotels', id],
        queryFn: () => fetchEntity('hotels', id),
        enabled: Boolean(id),
    });
}

export function useTours(enabled = true) {
    return useEntityQuery<TourItem[]>({
        queryKey: ['tours'],
        queryFn: () => fetchEntity('tours'),
        enabled,
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

export function useTravels() {
    return useEntityQuery<TravelItem[]>({
        queryKey: ['travels'],
        queryFn: () => fetchEntity('travels'),
    });
}

export function useTravelBySlug(slug?: string) {
    return useEntityQuery<TravelItem | null>({
        queryKey: ['travels', slug],
        queryFn: () => fetchEntity('travels', slug),
        enabled: Boolean(slug),
    });
}

export function useTravelDetailsBySlug(slug?: string) {
    return useEntityQuery<TravelDetailItem | null>({
        queryKey: ['travel-details', slug],
        queryFn: () => fetchEntity('travels', slug),
        enabled: Boolean(slug),
    });
}

export function useCars(enabled = true) {
    return useEntityQuery<CarItem[]>({
        queryKey: ['cars'],
        queryFn: () =>
            fetchEntity<CarItem[]>('cars').then((cars) =>
                cars.map((car) => ({
                    ...car,
                    features: normalizeCarDetailEntries(car.features),
                    policy: normalizeCarDetailEntries(car.policy),
                })),
            ),
        enabled,
    });
}

export function useCarBySlug(slug?: string) {
    return useEntityQuery<CarItem | null>({
        queryKey: ['cars', slug],
        queryFn: () =>
            fetchEntity<CarItem | null>('cars', slug).then((car) =>
                car
                    ? {
                          ...car,
                          features: normalizeCarDetailEntries(car.features),
                          policy: normalizeCarDetailEntries(car.policy),
                      }
                    : null,
            ),
        enabled: Boolean(slug),
    });
}

export function useFlights(enabled = true) {
    return useEntityQuery<FlightItem[]>({
        queryKey: ['flights'],
        queryFn: () => fetchEntity('flights'),
        enabled,
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

export interface VisaItem {
    id: number;
    code: string;
    name: Record<string, string>;
    flag: string;
    processing: Record<string, string>;
    price: number;
}

export function useVisas() {
    return useEntityQuery<{ data: VisaItem[] }>({
        queryKey: ['visas'],
        queryFn: () => fetchEntity('visas'),
    });
}

export type PublicCategory = {
    id: number | string;
    key: string;
    name: Record<string, string>;
    entity_type: string;
};

export function useCategories(type?: string) {
    const normalizedType = type?.toLowerCase();
    return useQuery({
        queryKey: ['categories', normalizedType ?? 'all'],
        queryFn: async () => {
            return await fetchAllCategories(async () => {
                const resp = await apiFetch<{ data: PublicCategory[] }>(
                    '/api/categories',
                );
                return resp.data;
            });
        },
        select: (categories) => {
            if (!Array.isArray(categories)) return [];
            if (!normalizedType) {
                return categories;
            }

            return categories.filter(
                (category) =>
                    category.entity_type.toLowerCase() === normalizedType,
            );
        },
    });
}

export type PublicCategoryType = {
    id: number;
    entity_type: string;
    key: string;
    label: Record<string, string>;
    sort_order: number;
    filter_style: string;
    values: {
        id: number;
        category_type_id: number;
        key: string;
        name: Record<string, string>;
        color?: string;
    }[];
};

export function useCategoryTypesPublic(entityType?: string) {
    return useQuery({
        queryKey: ['category-types-public', entityType ?? 'all'],
        queryFn: async () => {
            const url = entityType
                ? `/api/categories/types?entity_type=${entityType}`
                : '/api/categories/types';
            const resp = await apiFetch<{ data: PublicCategoryType[] }>(url);
            return resp.data;
        },
        select: (data) => (Array.isArray(data) ? data : []),
    });
}

export function useBlogPostBySlug(slug?: string) {
    return useEntityQuery<BlogPostItem | null>({
        queryKey: ['blog-posts', slug],
        queryFn: () => fetchEntity('blog-posts', slug),
        enabled: Boolean(slug),
    });
}

export interface HotelSearchQuery {
    check_in: string;
    check_out: string;
    hotel_slugs?: string[];
    rooms?: Array<{ adults?: number; children?: number[] }>;
    only_available?: boolean;
    city_id?: string;
    stars?: number;
    category_ids?: number[];
    boarding_ids?: number[];
    price_min?: number;
    price_max?: number;
    sort?: 'price_asc' | 'price_desc' | 'stars_desc';
    page?: number;
    per_page?: number;
}

export interface HotelSearchMeta {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    min_price: number | null;
    max_price: number | null;
}

export interface HotelSearchResult {
    id: string;
    slug: string;
    name: Record<string, string>;
    location: Record<string, string>;
    category_key?: string;
    category?: Record<string, string>;
    stars: number;
    rating: number;
    reviews: number;
    image: string;
    price: number;
    price_total: number;
    price_per_night: number;
    base_price: number;
    markup_percentage: string;
    currency: string;
    nights: number;
    available: boolean;
    provider: string;
    unavailable_reason: string | null;
    first_available_at: string | null;
    min_nights: number | null;
    source?: string;
    promotion?: {
        title: string | null;
        description: string;
        rate: string | null;
    } | null;
    free_child?: number[];
    recommended?: boolean;
    short_description?: string | null;
    rooms: Array<{
        id: string;
        name: string;
        boarding: string | null;
        boarding_name: string | null;
        boarding_id?: number | null;
        view_ids?: number[];
        price: number;
        price_total: number;
        price_per_night: number;
        base_price: number;
        currency: string;
        nights: number;
        token: string | null;
        source: string | null;
        stop_reservation: boolean;
        min_stay: number;
        on_request: boolean;
        quantity: number | null;
        stop_sales: { from: string; to: string } | null;
        cancellation_policy: Array<{
            fees: number;
            type: string | null;
            nature: string | null;
            description: string | null;
            from_date: string | null;
        }>;
        supplements: unknown[];
        image?: string | null;
        description?: string;
        features?: string[];
        not_refundable?: boolean;
        cancellation_deadline?: string | null;
        retrocession?: string | null;
    }>;
}

export function useHotelSearch(query?: HotelSearchQuery) {
    return useQuery<{
        data: HotelSearchResult[];
        meta: HotelSearchMeta;
    }>({
        queryKey: ['hotels', 'search', query],
        queryFn: async () => {
            const resp = await apiFetch<{
                data: HotelSearchResult[];
                meta: HotelSearchMeta;
            }>('/api/hotels/search', {
                method: 'POST',
                body: JSON.stringify(query),
            });
            return resp;
        },
        enabled: Boolean(query && query.check_in && query.check_out),
        staleTime: 1000 * 60 * 5,
    });
}

export type HotelSearchInfiniteQuery = Omit<HotelSearchQuery, 'page' | 'per_page'>;

export function useHotelSearchInfinite(baseQuery?: HotelSearchInfiniteQuery) {
    return useInfiniteQuery<{
        data: HotelSearchResult[];
        meta: HotelSearchMeta;
    }>({
        queryKey: ['hotels', 'search', 'infinite', baseQuery],
        queryFn: async ({ pageParam }) => {
            const resp = await apiFetch<{
                data: HotelSearchResult[];
                meta: HotelSearchMeta;
            }>('/api/hotels/search', {
                method: 'POST',
                body: JSON.stringify({
                    ...baseQuery,
                    page: pageParam,
                    per_page: 50,
                }),
            });
            return resp;
        },
        getNextPageParam: (lastPage) =>
            lastPage.meta.current_page < lastPage.meta.last_page
                ? lastPage.meta.current_page + 1
                : undefined,
        enabled: Boolean(baseQuery && baseQuery.check_in && baseQuery.check_out),
        staleTime: 1000 * 60 * 5,
        initialPageParam: 1,
    });
}
