import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveAdminEntity } from '@/api/admin.api';

describe('saveAdminEntity', () => {
    afterEach(() => {
        vi.restoreAllMocks();
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
});
