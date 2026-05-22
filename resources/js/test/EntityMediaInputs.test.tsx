import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';

vi.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
    }),
}));

describe('EntityMediaInputs', () => {
    beforeEach(() => {
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            writable: true,
            value: vi.fn(() => 'blob:mock-media'),
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            writable: true,
            value: vi.fn(),
        });
    });

    it('calls the legacy image handler once with the selected file', () => {
        const onImageChange = vi.fn();

        const { container } = render(
            <EntityMediaInputs
                imagePath=""
                imageFile={null}
                galleryPaths={[]}
                galleryFiles={[]}
                onImageChange={onImageChange}
                onGalleryChange={vi.fn()}
            />,
        );

        const mainImageInput = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement | null;

        expect(mainImageInput).toBeTruthy();

        const file = new File(['event-image'], 'event.jpg', {
            type: 'image/jpeg',
        });

        fireEvent.change(mainImageInput as HTMLInputElement, {
            target: { files: [file] },
        });

        expect(onImageChange).toHaveBeenCalledTimes(1);
        expect(onImageChange).toHaveBeenCalledWith('', file);
        expect(onImageChange).not.toHaveBeenCalledWith('', null);
    });

    it('renders existing gallery previews from aliased image arrays', () => {
        const { container } = render(
            <EntityMediaInputs
                values={{
                    images: ['storage/uploads/cars/gallery-1.jpg'],
                }}
                galleryPaths={[]}
                galleryFiles={[]}
                onImageChange={vi.fn()}
                onGalleryChange={vi.fn()}
            />,
        );

        expect(container.querySelector('img[alt="Gallery"]')).toHaveAttribute(
            'src',
            '/storage/uploads/cars/gallery-1.jpg',
        );
    });

    it('renders a single gallery preview after selecting files', () => {
        const onGalleryChange = vi.fn();

        const { container } = render(
            <EntityMediaInputs
                showImage={false}
                galleryPaths={[]}
                galleryFiles={[]}
                onImageChange={vi.fn()}
                onGalleryChange={onGalleryChange}
            />,
        );

        const fileInput = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement | null;

        expect(fileInput).toBeTruthy();

        const file = new File(['gallery-image'], 'gallery.jpg', {
            type: 'image/jpeg',
        });

        fireEvent.change(fileInput as HTMLInputElement, {
            target: { files: [file] },
        });

        expect(onGalleryChange).toHaveBeenCalledTimes(1);
        expect(container.querySelectorAll('img[alt="Gallery"]')).toHaveLength(
            1,
        );
    });
});
