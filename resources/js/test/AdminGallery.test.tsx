import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCategories } from '@/api/categories.api';
import { fetchGallery, deleteGalleryImage } from '@/api/gallery.api';
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

    afterEach(() => {
        queryClient.clear();
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

        // Deletion is gated behind a confirm dialog, so confirm it first.
        await screen.findByRole('button', { name: 'Delete' });
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(deleteGalleryImage).toHaveBeenCalledWith(1);
        });
    });

    it('marks localized language tabs when gallery validation fails', async () => {
        const mockGallery: never[] = [];
        (
            fetchGallery as unknown as {
                mockResolvedValue: (v: unknown) => void;
            }
        ).mockResolvedValue(mockGallery);

        renderWithProviders(<AdminGallery />);

        // The header action uses the real translation for "Add Image".
        fireEvent.click(
            screen.getByRole('button', { name: /add image/i }),
        );

        await screen.findByRole('dialog');

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^FR/i })).toHaveClass(
                'border-destructive',
            );
            expect(screen.getByRole('button', { name: /^AR/i })).toHaveClass(
                'border-destructive',
            );
        });
    });
});
