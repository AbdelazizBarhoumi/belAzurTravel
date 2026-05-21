import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGallery, deleteGalleryImage } from '@/api/gallery.api';
import { fetchCategories } from '@/api/categories.api';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import AdminGallery from '../pages/admin/AdminGallery';

const queryClient = new QueryClient();

// Mock the API and other dependencies
vi.mock('@/api/gallery.api', () => ({
    fetchGallery: vi.fn(),
    createGalleryImage: vi.fn(),
    updateGalleryImage: vi.fn(),
    deleteGalleryImage: vi.fn(),
}));

vi.mock('@/api/categories.api', () => ({
    fetchCategories: vi.fn(),
}));

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: vi.fn(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        lang: 'en',
        t: (key: string) => key,
    }),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('AdminGallery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (
            fetchCategories as unknown as {
                mockResolvedValue: (v: unknown) => void;
            }
        ).mockResolvedValue([]);
    });

    const renderWithProviders = (ui: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <SiteSettingsProvider>
                    <MemoryRouter>{ui}</MemoryRouter>
                </SiteSettingsProvider>
            </QueryClientProvider>,
        );
    };

    it('renders gallery items correctly', async () => {
        const mockGallery = [
            {
                id: 1,
                url: '/test.jpg',
                title: { en: 'Test Title' },
                category: 'Luxury',
            },
        ];
        // Cast to a minimal mocked shape to avoid using `any`
        (
            fetchGallery as unknown as {
                mockResolvedValue: (v: unknown) => void;
            }
        ).mockResolvedValue(mockGallery);

        renderWithProviders(<AdminGallery />);

        await waitFor(() => {
            expect(screen.getByText('Test Title')).toBeDefined();
            // Use getAllByText to find elements, then verify count
            const luxuryElements = screen.getAllByText('Luxury');
            expect(luxuryElements.length).toBeGreaterThan(0);
        });
    });

    it('calls delete API when delete button is clicked', async () => {
        const mockGallery = [
            {
                id: 1,
                url: '/test.jpg',
                title: { en: 'Test Title' },
                category: 'Luxury',
            },
        ];
        (
            fetchGallery as unknown as {
                mockResolvedValue: (v: unknown) => void;
            }
        ).mockResolvedValue(mockGallery);

        window.confirm = vi.fn(() => true);

        renderWithProviders(<AdminGallery />);

        await waitFor(() => {
            expect(screen.getByText('Test Title')).toBeDefined();
        });

        // Click the delete button in the grid view (first one found)
        const deleteButtons = screen.getAllByRole('button');
        // The delete button is identified by Trash2 icon which usually appears late in the button list
        // Based on the rendering in AdminGallery, delete button is the last in the card
        const deleteButton = deleteButtons[deleteButtons.length - 1];
        fireEvent.click(deleteButton);

        expect(deleteGalleryImage).toHaveBeenCalledWith(1);
    });
});
