import type {
    AdminDestination,
    AdminHotel,
    AdminTour,
    AdminUser,
} from '@/hooks/useAdminStore';
import { apiFetch } from './http';

export type AdminEntity = AdminDestination | AdminHotel | AdminTour;
export type AdminRow = Record<string, string | number | boolean | null>;
export type AdminEntityType =
    | 'destinations'
    | 'hotels'
    | 'tours'
    | 'cars'
    | 'flights'
    | 'events'
    | 'deals'
    | 'promos'
    | 'blog-posts';

export function listAdminEntities<T = AdminRow>(type: AdminEntityType) {
    return apiFetch<unknown>(`/api/admin/${type}`).then((res) => {
        // Backend admin endpoints return { data: [...] } — unwrap when present.
        if (res && typeof res === 'object') {
            const payload = res as { data?: unknown };
            if (Array.isArray(payload.data)) {
                return payload.data as T[];
            }
        }
        return res as T[];
    });
}

export function saveAdminEntity<T extends { id?: string | number | null }>(
    type: AdminEntityType,
    entity: T,
) {
    const id = entity.id as string | undefined;
    const isFileLike = (value: unknown): value is File | Blob =>
        value instanceof File || value instanceof Blob;
    const isFileLikeArray = (value: unknown): value is Array<File | Blob> =>
        Array.isArray(value) && value.length > 0 && value.every(isFileLike);
    // If any file/blob is present, send multipart/form-data.
    const hasFile = Object.values(entity).some(
        (value) => isFileLike(value) || isFileLikeArray(value),
    );

    if (hasFile) {
        const fd = new FormData();
        if (id) {
            fd.append('_method', 'PUT');
        }
        Object.entries(entity).forEach(([k, v]) => {
            if (isFileLike(v)) {
                fd.append(k, v);
            } else if (isFileLikeArray(v)) {
                v.forEach((file) => fd.append(`${k}[]`, file));
            } else if (typeof v === 'object' && v !== null) {
                fd.append(k, JSON.stringify(v));
            } else if (v !== undefined && v !== null) {
                fd.append(k, String(v));
            }
        });

        return apiFetch<T>(`/api/admin/${type}${id ? `/${id}` : ''}`, {
            method: 'POST',
            body: fd,
        });
    }

    return apiFetch<T>(`/api/admin/${type}${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(entity),
    });
}

export function deleteAdminEntity(type: AdminEntityType, id: string) {
    return apiFetch(`/api/admin/${type}/${id}`, { method: 'DELETE' });
}

export function listAdminUsers() {
    return apiFetch<AdminUser[]>('/api/admin/users');
}

export function toggleAdminUser(id: string) {
    return apiFetch<AdminUser>(`/api/admin/users/${id}/toggle-active`, {
        method: 'POST',
    });
}

export function deleteAdminUser(id: string) {
    return apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
}
