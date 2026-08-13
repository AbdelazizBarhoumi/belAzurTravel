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
    counts: Record<OsTravelStatus, number>;
}

export interface OsTravelHotelRow {
    id: string;
    external_id: string;
    name: string;
    city_external_id: string;
    city_name: string;
    category_title: string;
    stars: number;
    image: string | null;
    status: OsTravelStatus;
    has_base_price: boolean;
    base_price: number | null;
    markup_percentage: string | null;
    currency: string | null;
    hotel_id: string | null;
    hotel_slug: string | null;
    approved_by: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    last_synced_at: string | null;
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
    skipped_no_price: string[];
    skipped_over_cap: string[];
    published_count: number;
    skipped_no_price_count: number;
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

export interface OsTravelDetailResponse {
    data: OsTravelHotelDetail;
}

export interface OsTravelRowResponse {
    data: OsTravelHotelRow;
}

export interface OsTravelApproveResponse {
    data: OsTravelApproveResult;
}

export async function getOsTravelDashboard() {
    return apiFetch<{ data: OsTravelDashboard }>('/api/admin/os-travel');
}

export async function listOsTravelHotels(filters?: {
    status?: OsTravelStatus | '';
    city?: string;
}) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.city) params.append('city', filters.city);
    const qs = params.toString();
    return apiFetch<OsTravelListResponse>(
        `/api/admin/os-travel/hotels${qs ? `?${qs}` : ''}`,
    );
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
