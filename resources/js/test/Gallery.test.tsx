import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Gallery } from '@/components/media/Gallery';

vi.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        dir: 'ltr',
    }),
}));

describe('Gallery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a capped thumbnail strip with overflow on the last visible tile', () => {
        const images = [
            '/image-1.jpg',
            '/image-2.jpg',
            '/image-3.jpg',
            '/image-4.jpg',
            '/image-5.jpg',
            '/image-6.jpg',
        ];

        render(<Gallery images={images} hotelName="Event gallery" />);

        expect(
            screen.getByAltText('Event gallery main image'),
        ).toBeInTheDocument();
        expect(screen.getAllByAltText(/Event gallery thumbnail/i)).toHaveLength(
            5,
        );
        expect(screen.getByText('+1')).toBeInTheDocument();
        expect(
            screen.queryByAltText('Event gallery thumbnail 6'),
        ).not.toBeInTheDocument();
    });
});
