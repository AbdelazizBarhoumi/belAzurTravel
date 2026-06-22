import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RoleGuard } from '@/components/ui/RoleGuard';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import Login from '@/pages/general/Login';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');

    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

vi.mock('@/hooks/useAuthUser', () => ({
    useAuthUser: vi.fn(),
}));

vi.mock('@/components/layout/BrandLogo', () => ({
    BrandLogo: () => <div data-testid="brand-logo" />,
}));

function renderWithRouter(ui: ReactElement, initialEntries = ['/']) {
    return render(
        <LanguageProvider>
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path="*" element={ui} />
                </Routes>
            </MemoryRouter>
        </LanguageProvider>,
    );
}

describe('auth guards', () => {
    beforeEach(() => {
        navigateMock.mockReset();
        localStorage.clear();
        vi.mocked(useAuthUser).mockReset();
    });

    it('keeps guests on the login page instead of redirecting from stale storage', async () => {
        vi.mocked(useAuthUser).mockReturnValue({
            data: undefined,
            isPending: false,
            isFetching: false,
            isError: true,
        } as never);

        renderWithRouter(<Login />, ['/login']);

        expect(
            await screen.findByRole('button', {
                name: /se connecter|sign in/i,
            }),
        ).toBeInTheDocument();
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('redirects signed-in users with the wrong role to unauthorized', async () => {
        vi.mocked(useAuthUser).mockReturnValue({
            data: {
                id: 1,
                name: 'Admin',
                email: 'admin@belazurtravel.com',
                role: 'client',
            },
            isPending: false,
            isFetching: false,
            isError: false,
        } as never);

        render(
            <LanguageProvider>
                <MemoryRouter initialEntries={['/admin/dashboard']}>
                    <Routes>
                        <Route
                            path="/admin/dashboard"
                            element={
                                <RoleGuard role="admin">
                                    <div>secret admin content</div>
                                </RoleGuard>
                            }
                        />
                        <Route
                            path="/unauthorized"
                            element={<div>unauthorized page</div>}
                        />
                    </Routes>
                </MemoryRouter>
            </LanguageProvider>,
        );

        expect(
            await screen.findByText(/unauthorized page/i),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(/secret admin content/i),
        ).not.toBeInTheDocument();
    });
});
