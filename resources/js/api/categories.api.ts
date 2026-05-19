import { apiFetch } from './http';

export interface Category {
    id: number;
    entity_type: string;
    key: string;
    name: {
        en: string;
        fr: string;
        ar: string;
    };
}

export async function fetchCategories(type?: string): Promise<Category[]> {
    const url = type
        ? `/api/admin/categories?type=${type}`
        : '/api/admin/categories';
    const res = await apiFetch<{ data: Category[] }>(url);
    return res.data;
}

export async function createCategory(data: {
    entity_type: string;
    name: Category['name'];
}): Promise<Category> {
    const res = await apiFetch<{ data: Category }>('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return res.data;
}

export async function updateCategory(
    id: number,
    name: Category['name'],
): Promise<Category> {
    const res = await apiFetch<{ data: Category }>(
        `/api/admin/categories/${id}`,
        {
            method: 'PUT',
            body: JSON.stringify({ name }),
        },
    );
    return res.data;
}

export async function deleteCategory(
    id: number,
    force = false,
): Promise<{
    message: string;
    requires_confirmation?: boolean;
    count?: number;
}> {
    const url = `/api/admin/categories/${id}${force ? '?force=true' : ''}`;
    return await apiFetch(url, {
        method: 'DELETE',
    });
}
