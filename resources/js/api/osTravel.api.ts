import { apiFetch } from './http';

export type OsTravelStatus =
    | 'pending'
    | 'approved'
    | 'published'
    | 'rejected'
    | 'orphaned';

export interface OsTravelSyncInfo {
    id: string;
    batch: string | null;
    status: string;
    started_at: string | null;
    finished_at: string | null;
    error: string | null;
    countries_count: number;
    cities_count: number;
    hotels_count: number;
    details_count: number;
    orphaned_count: number;
    reactivated_count: number;
}

export interface OsTravelDashboard {
    last_sync: OsTravelSyncInfo | null;
    counts: Record<OsTravelStatus, number> & { all?: number };
}

export interface OsTravelHotelRow {
    id: string;
    external_id: string;
    name: string;
    city_external_id: string;
    city_name: string;
    country_external_id: string | null;
    country_name: string | null;
    category_title: string;
    stars: number;
    image: string | null;
    status: OsTravelStatus;
    has_base_price: boolean;
    base_price: number | null;
    final_price: number | null;
    price_status: 'has_price' | 'no_availability' | 'provider_error' | 'never_refreshed' | null;
    last_price_attempt_at: string | null;
    first_available_at: string | null;
    min_nights: number | null;
    availability_status:
        | 'available'
        | 'stop_sale'
        | 'stop_reservation'
        | 'no_bookable_room'
        | 'not_returned'
        | null;
    markup_percentage: string | null;
    currency: string | null;
    hotel_id: string | null;
    hotel_slug: string | null;
    approved_by: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    last_synced_at: string | null;
    live_status:
        | 'available'
        | 'no_availability'
        | 'stop_reservation'
        | 'stop_sale'
        | 'no_bookable_room'
        | 'provider_error'
        | null;
    live_price: number | null;
    live_currency: string | null;
    live_reason: string | null;
    live_until: string | null;
}

export interface OsTravelMappedPreview {
    name: string;
    city: string;
    country: string;
    stars: number;
    category: string;
    image: string | null;
    gallery: string[];
    description: string;
    themes: string[];
    boarding: string[];
    address: string;
    phone: string;
    email: string;
    price: number | null;
    base_price: number | null;
    markup_percentage: number;
    currency: string;
    code: string;
}

export interface OsTravelHotelDetail extends OsTravelHotelRow {
    payload: Record<string, unknown>;
    mapped_preview: OsTravelMappedPreview;
}

export interface OsTravelApproveResult extends OsTravelHotelRow {
    hotel?: {
        id: string;
        slug: string;
        price: number;
        base_price: number;
        markup_percentage: string;
        currency: string;
    };
}

export interface OsTravelBulkApproveResult {
    published: OsTravelApproveResult[];
    failed: string[];
    skipped_no_price: string[];
    skipped_no_image: string[];
    skipped_over_cap: string[];
    published_count: number;
    failed_count: number;
    skipped_no_price_count: number;
    skipped_no_image_count: number;
    skipped_over_cap_count: number;
    cap: number;
}

export interface OsTravelPricePayload {
    base_price?: number | null;
    markup_percentage?: number | null;
    currency?: string | null;
}

export interface OsTravelListResponse {
    data: OsTravelHotelRow[];
}

export interface OsTravelReferenceItem {
    id: string;
    name: string | null;
}

export interface OsTravelCityReference extends OsTravelReferenceItem {
    country_id: string | null;
}

export interface OsTravelReferences {
    countries: OsTravelReferenceItem[];
    cities: OsTravelCityReference[];
}

export interface OsTravelReferencesResponse {
    data: OsTravelReferences;
}

export interface OsTravelDetailResponse {
    data: OsTravelHotelDetail;
}

export interface OsTravelRowResponse {
    data: OsTravelHotelRow;
}

export interface OsTravelRefreshResult {
    updated: number;
    omitted: number;
    omitted_ids: string[];
    failed_ids: string[];
}

export interface OsTravelHotelRefreshResponse extends OsTravelRowResponse {
    data: OsTravelHotelRow & { refresh: OsTravelRefreshResult };
}

export interface OsTravelApproveResponse {
    data: OsTravelApproveResult;
}

export async function getOsTravelDashboard() {
    return apiFetch<{ data: OsTravelDashboard }>('/api/admin/os-travel');
}

export interface OsTravelListFilters {
    status?: OsTravelStatus | '';
    city?: string;
    country_id?: string;
    city_id?: string;
    stars?: number;
    check_in?: string;
    check_out?: string;
}

export async function listOsTravelHotels(filters?: OsTravelListFilters) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.country_id) params.append('country_id', filters.country_id);
    if (filters?.city_id) params.append('city_id', filters.city_id);
    if (filters?.stars) params.append('stars', String(filters.stars));
    if (filters?.check_in) params.append('check_in', filters.check_in);
    if (filters?.check_out) params.append('check_out', filters.check_out);
    const qs = params.toString();
    return apiFetch<OsTravelListResponse>(
        `/api/admin/os-travel/hotels${qs ? `?${qs}` : ''}`,
    );
}

export async function getOsTravelReferences() {
    return apiFetch<OsTravelReferencesResponse>('/api/admin/os-travel/references');
}

export async function getOsTravelHotel(id: string) {
    return apiFetch<OsTravelDetailResponse>(
        `/api/admin/os-travel/hotels/${id}`,
    );
}

export async function updateOsTravelHotel(
    id: string,
    data: OsTravelPricePayload,
) {
    return apiFetch<OsTravelRowResponse>(`/api/admin/os-travel/hotels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function approveOsTravelHotel(
    id: string,
    data: OsTravelPricePayload,
) {
    return apiFetch<OsTravelApproveResponse>(
        `/api/admin/os-travel/hotels/${id}/approve`,
        {
            method: 'POST',
            body: JSON.stringify(data),
        },
    );
}

export async function approveAllOsTravelHotels(data: {
    markup_percentage?: number | null;
    currency?: string | null;
    include_without_price?: boolean;
    include_without_image?: boolean;
    status?: OsTravelStatus | '';
    city?: string;
    country_id?: string;
    city_id?: string;
    stars?: number;
    check_in?: string;
    check_out?: string;
}) {
    return apiFetch<{ data: OsTravelBulkApproveResult }>(
        '/api/admin/os-travel/hotels/approve-all',
        {
            method: 'POST',
            body: JSON.stringify(data),
        },
    );
}

export async function rejectOsTravelHotel(id: string) {
    return apiFetch<OsTravelRowResponse>(
        `/api/admin/os-travel/hotels/${id}/reject`,
        { method: 'POST' },
    );
}

export async function unapproveOsTravelHotel(id: string) {
    return apiFetch<OsTravelRowResponse>(
        `/api/admin/os-travel/hotels/${id}/unapprove`,
        { method: 'POST' },
    );
}

export async function refreshOsTravelPrice(id: string) {
    return apiFetch<OsTravelHotelRefreshResponse>(
        `/api/admin/os-travel/hotels/${id}/refresh-price`,
        { method: 'POST' },
    );
}

export async function refreshOsTravelPrices(data?: {
    ids?: string[];
    check_in?: string;
    check_out?: string;
}) {
    return apiFetch<{ data: OsTravelRefreshResult }>(
        '/api/admin/os-travel/hotels/refresh-prices',
        {
            method: 'POST',
            body: JSON.stringify(data ?? {}),
        },
    );
}

export interface OsTravelSearchRoomRequest {
    adults?: number;
    children?: number[];
}

export interface OsTravelSearchRequest {
    check_in: string;
    check_out: string;
    hotel_slugs?: string[];
    rooms?: OsTravelSearchRoomRequest[];
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

export interface OsTravelSearchRoomResult {
    id: string;
    name: string;
    boarding: string | null;
    boarding_name: string | null;
    boarding_id?: number | null;
    view: string;
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
    image: string | null;
    description: string;
    features: string[];
    not_refundable: boolean;
    cancellation_deadline: string | null;
    retrocession: string | null;
}

export interface OsTravelSearchResult {
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
    promotion?: {
        title: string | null;
        description: string;
        rate: string | null;
    } | null;
    free_child?: number[];
    recommended?: boolean;
    short_description?: string | null;
    rooms: OsTravelSearchRoomResult[];
}

export async function searchOsTravelHotels(data: OsTravelSearchRequest) {
    return apiFetch<{ data: OsTravelSearchResult[] }>('/api/hotels/search', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
