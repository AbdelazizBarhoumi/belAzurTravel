import { apiFetch } from './http';

export interface CategoryType {
    id: number;
    entity_type: string;
    key: string;
    label: { en: string; fr: string; ar: string };
    sort_order: number;
    values: CategoryTypeValue[];
}

export interface CategoryTypeValue {
    id: number;
    category_type_id: number;
    key: string;
    name: { en: string; fr: string; ar: string };
}

// --- Category Types ---

export async function fetchCategoryTypes(
    entityType?: string,
): Promise<CategoryType[]> {
    const url = entityType
        ? `/api/admin/category-types?type=${entityType}`
        : '/api/admin/category-types';
    const res = await apiFetch<{ data: CategoryType[] }>(url);
    return res.data;
}

export async function createCategoryType(data: {
    entity_type: string;
    label: { en: string; fr: string; ar: string };
    sort_order?: number;
}): Promise<CategoryType> {
    const res = await apiFetch<{ data: CategoryType }>(
        '/api/admin/category-types',
        {
            method: 'POST',
            body: JSON.stringify(data),
        },
    );
    return res.data;
}

export async function updateCategoryType(
    id: number,
    data: {
        label: { en: string; fr: string; ar: string };
        sort_order?: number;
    },
): Promise<CategoryType> {
    const res = await apiFetch<{ data: CategoryType }>(
        `/api/admin/category-types/${id}`,
        {
            method: 'PUT',
            body: JSON.stringify(data),
        },
    );
    return res.data;
}

export async function deleteCategoryType(
    id: number,
    force = false,
): Promise<{
    message: string;
    requires_confirmation?: boolean;
    count?: number;
    affected_items?: { name: string; slug: string }[];
}> {
    const url = `/api/admin/category-types/${id}${force ? '?force=true' : ''}`;
    return await apiFetch(url, { method: 'DELETE' });
}

// --- Category Values ---

export async function fetchCategoryValues(
    typeId: number,
): Promise<CategoryTypeValue[]> {
    const res = await apiFetch<{ data: CategoryTypeValue[] }>(
        `/api/admin/category-types/${typeId}/values`,
    );
    return res.data;
}

export async function createCategoryValue(
    typeId: number,
    name: { en: string; fr: string; ar: string },
): Promise<CategoryTypeValue> {
    const res = await apiFetch<{ data: CategoryTypeValue }>(
        `/api/admin/category-types/${typeId}/values`,
        {
            method: 'POST',
            body: JSON.stringify({ name }),
        },
    );
    return res.data;
}

export async function updateCategoryValue(
    typeId: number,
    valueId: number,
    name: { en: string; fr: string; ar: string },
): Promise<CategoryTypeValue> {
    const res = await apiFetch<{ data: CategoryTypeValue }>(
        `/api/admin/category-types/${typeId}/values/${valueId}`,
        {
            method: 'PUT',
            body: JSON.stringify({ name }),
        },
    );
    return res.data;
}

export async function deleteCategoryValue(
    typeId: number,
    valueId: number,
    force = false,
): Promise<{
    message: string;
    requires_confirmation?: boolean;
    count?: number;
    affected_items?: { name: string; slug: string }[];
}> {
    const url = `/api/admin/category-types/${typeId}/values/${valueId}${force ? '?force=true' : ''}`;
    return await apiFetch(url, { method: 'DELETE' });
}

// --- Public nested endpoint ---

export async function fetchCategoryTypesNested(
    entityType?: string,
): Promise<CategoryType[]> {
    const url = entityType
        ? `/api/categories/types?entity_type=${entityType}`
        : '/api/categories/types';
    const res = await apiFetch<{ data: CategoryType[] }>(url);
    return res.data;
}
