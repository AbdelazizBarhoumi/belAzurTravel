import type {
    AdminDestination,
    AdminHotel,
    AdminTour,
    AdminTravel,
    AdminUser,
} from '@/hooks/useAdminStore';
import { apiFetch } from './http';

export type AdminEntity = AdminDestination | AdminHotel | AdminTour | AdminTravel;
export type AdminRow = Record<string, string | number | boolean | null>;
export type AdminEntityType =
    | 'destinations'
    | 'team'
    | 'partners'
    | 'hotels'
    | 'tours'
    | 'travels'
    | 'cars'
    | 'flights'
    | 'events'
    | 'deals'
    | 'promos'
    | 'blog-posts'
    | 'visas';

export function listAdminEntities<T = AdminRow>(type: AdminEntityType) {
    return apiFetch<unknown>(`/api/admin/${type}`).then((res) => {
        // Backend admin endpoints return { data: [...] } — unwrap when present.
        if (res && typeof res === 'object') {
            const payload = res as { data?: unknown };
            if (Array.isArray(payload.data)) {
                return payload.data as T[];
            }
        }
        return Array.isArray(res) ? res as T[] : [];
    });
}

export function saveAdminEntity<T extends { id?: string | number | null }>(
    type: AdminEntityType,
    entity: T,
) {
    const id = entity.id as string | undefined;
    const hasFileLikeValue = (data: unknown): boolean => {
        if (data instanceof File || data instanceof Blob) {
            return true;
        }

        if (Array.isArray(data)) {
            return data.some((value) => hasFileLikeValue(value));
        }

        if (data && typeof data === 'object') {
            return Object.values(data as Record<string, unknown>).some(
                (value) => hasFileLikeValue(value),
            );
        }

        return false;
    };

    if (!hasFileLikeValue(entity)) {
        return apiFetch<T>(`/api/admin/${type}${id ? `/${id}` : ''}`, {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(entity),
        });
    }

    const fd = new FormData();
    if (id) {
        fd.append('_method', 'PUT');
    }

    const appendToFormData = (data: unknown, parentKey?: string) => {
        if (data === null || data === undefined) return;

        if (data instanceof File || data instanceof Blob) {
            fd.append(parentKey || '', data);
        } else if (Array.isArray(data)) {
            const containsObjectItems = data.some((value) => {
                if (!value || typeof value !== 'object') {
                    return false;
                }

                return !(value instanceof File) && !(value instanceof Blob);
            });

            data.forEach((value, index) => {
                // Preserve item boundaries for arrays of objects so nested
                // payloads like hotel rooms do not collapse into ghost rows.
                const formKey = parentKey
                    ? containsObjectItems
                        ? `${parentKey}[${index}]`
                        : `${parentKey}[]`
                    : '[]';
                appendToFormData(value, formKey);
            });
        } else if (typeof data === 'object') {
            Object.entries(data).forEach(([key, value]) => {
                const formKey = parentKey ? `${parentKey}[${key}]` : key;
                appendToFormData(value, formKey);
            });
        } else if (typeof data === 'boolean') {
            fd.append(parentKey || '', data ? '1' : '0');
        } else {
            fd.append(parentKey || '', String(data));
        }
    };

    appendToFormData(entity);

    return apiFetch<T>(`/api/admin/${type}${id ? `/${id}` : ''}`, {
        method: 'POST',
        body: fd,
    });
}

export function deleteAdminEntity(type: AdminEntityType, id: string) {
    return apiFetch(`/api/admin/${type}/${id}`, { method: 'DELETE' });
}

export interface AdminUserListResponse {
    data: AdminUser[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

export function listAdminUsers(params?: {
    page?: number;
    search?: string;
    role?: string;
}) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);

    return apiFetch<AdminUserListResponse>(
        `/api/admin/users?${searchParams.toString()}`,
    );
}

export function updateAdminUser(id: string, data: Partial<AdminUser>) {
    return apiFetch<AdminUser>(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function toggleAdminUser(id: string) {
    return apiFetch<AdminUser>(`/api/admin/users/${id}/toggle-active`, {
        method: 'POST',
    });
}

export function deleteAdminUser(id: string) {
    return apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
}
