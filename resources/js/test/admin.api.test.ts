import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveAdminEntity } from '@/api/admin.api';

describe('saveAdminEntity', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('serializes boolean fields in multipart requests as 1/0', async () => {
        const originalFetch = globalThis.fetch;
        const fetchSpy = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });
        globalThis.fetch = fetchSpy as typeof fetch;

        try {
            const activeFile = new File(['x'], 'test.txt', {
                type: 'text/plain',
            });

            await saveAdminEntity('promos', {
                id: '1',
                active: true,
                galleryFiles: [activeFile],
            } as never);

            const [, requestInit] = fetchSpy.mock.calls[0] ?? [];
            const body = requestInit?.body as FormData | undefined;

            expect(body).toBeInstanceOf(FormData);
            expect(body?.get('active')).toBe('1');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    it('uses method spoofing for multipart destination updates', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ data: {} }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const mainImage = new File(['main'], 'main.png', { type: 'image/png' });
        const galleryImageOne = new File(['g1'], 'g1.png', {
            type: 'image/png',
        });
        const galleryImageTwo = new File(['g2'], 'g2.png', {
            type: 'image/png',
        });

        await saveAdminEntity('destinations', {
            id: '42',
            name: 'Lisbon',
            country: 'Portugal',
            category: 'City',
            price: 700,
            rating: 4.6,
            image: mainImage,
            gallery_files: [galleryImageOne, galleryImageTwo],
            description: 'Sunny coastal city',
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(new URL(url).pathname).toBe('/api/admin/destinations/42');
        expect(init.method).toBe('POST');
        expect(init.body).toBeInstanceOf(FormData);

        const formData = init.body as FormData;
        expect(formData.get('_method')).toBe('PUT');
        expect(formData.get('name')).toBe('Lisbon');
        expect(formData.get('country')).toBe('Portugal');
        expect(formData.get('category')).toBe('City');
        expect(formData.get('description')).toBe('Sunny coastal city');
        expect(formData.get('image')).toBe(mainImage);

        const galleryEntries = formData.getAll('gallery_files[]');
        expect(galleryEntries).toHaveLength(2);
        expect(galleryEntries[0]).toBe(galleryImageOne);
        expect(galleryEntries[1]).toBe(galleryImageTwo);
    });

    it('serializes primitive arrays as repeated multipart fields', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ data: {} }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const mainImage = new File(['main'], 'main.jpg', {
            type: 'image/jpeg',
        });

        await saveAdminEntity('tours', {
            id: '7',
            images: [
                'storage/uploads/tours/gallery-1.jpg',
                '/storage/uploads/tours/gallery-2.jpg',
            ],
            includes: ['Hotel pickup', 'Breakfast'],
            image: mainImage,
        } as never);

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe('POST');
        expect(init.body).toBeInstanceOf(FormData);

        const formData = init.body as FormData;
        expect(formData.get('_method')).toBe('PUT');
        expect(formData.get('images[]')).toBe(
            'storage/uploads/tours/gallery-1.jpg',
        );
        expect(formData.getAll('images[]')).toEqual([
            'storage/uploads/tours/gallery-1.jpg',
            '/storage/uploads/tours/gallery-2.jpg',
        ]);
        expect(formData.getAll('includes[]')).toEqual([
            'Hotel pickup',
            'Breakfast',
        ]);
        expect(formData.get('images')).toBeNull();
    });
});
