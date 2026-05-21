import { apiFetch } from './http';

export interface GalleryImage {
    id: number;
    url: string;
    title?: Record<string, string>;
    caption?: Record<string, string>;
    category?: string;
}

export async function fetchGallery(): Promise<GalleryImage[]> {
    return apiFetch<GalleryImage[]>('/api/gallery');
}

export async function createGalleryImage(
    data: Partial<GalleryImage> | FormData,
): Promise<GalleryImage> {
    if (data instanceof FormData) {
        return apiFetch<GalleryImage>('/api/admin/gallery', {
            method: 'POST',
            body: data,
        });
    }

    return apiFetch<GalleryImage>('/api/admin/gallery', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateGalleryImage(
    id: number,
    data: Partial<GalleryImage> | FormData,
): Promise<GalleryImage> {
    if (data instanceof FormData) {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        data.forEach((value, key) => {
            formData.append(key, value);
        });

        return apiFetch<GalleryImage>(`/api/admin/gallery/${id}`, {
            method: 'POST',
            body: formData,
        });
    }

    return apiFetch<GalleryImage>(`/api/admin/gallery/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteGalleryImage(id: number): Promise<void> {
    return apiFetch<void>(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
    });
}
