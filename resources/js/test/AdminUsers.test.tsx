import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { listAdminUsers } from '@/api/admin.api';
import { useAuthUser } from '@/hooks/useAuthUser';
import AdminUsers from '../pages/admin/AdminUsers';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

vi.mock('@/api/admin.api', () => ({
    listAdminUsers: vi.fn(),
    updateAdminUser: vi.fn(),
    toggleAdminUser: vi.fn(),
    deleteAdminUser: vi.fn(),
}));

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: vi.fn(),
}));

vi.mock('@/hooks/useAuthUser', () => ({
    useAuthUser: vi.fn(),
}));

vi.mock('@/components/layout/AdminLayout', () => ({
    AdminLayout: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

vi.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('AdminUsers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthUser).mockReturnValue({
            data: {
                id: 1,
                name: 'Owner',
                email: 'owner@belazurtravel.com',
                role: 'owner',
            },
            isPending: false,
            isFetching: false,
            isError: false,
        } as never);

        vi.mocked(listAdminUsers).mockResolvedValue({
            data: [
                {
                    id: '1',
                    name: 'Owner',
                    email: 'owner@belazurtravel.com',
                    role: 'owner',
                    active: true,
                    joined: '2026-05-22',
                },
                {
                    id: '2',
                    name: 'Admin Two',
                    email: 'admin2@belazurtravel.com',
                    role: 'admin',
                    active: true,
                    joined: '2026-05-22',
                },
            ],
            meta: {
                current_page: 1,
                last_page: 1,
                total: 2,
                per_page: 10,
            },
        });
    });

    afterEach(() => {
        queryClient.clear();
    });

    it('disables all actions for the signed-in user row', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <AdminUsers />
                </MemoryRouter>
            </QueryClientProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText('Owner')).toBeInTheDocument();
        });

        const ownerRow = screen.getByText('Owner').closest('tr');
        expect(ownerRow).not.toBeNull();

        const rowButtons = within(ownerRow as HTMLElement).getAllByRole(
            'button',
        );
        expect(rowButtons).toHaveLength(3);
        rowButtons.forEach((button) => {
            expect(button).toBeDisabled();
        });
    });
});
