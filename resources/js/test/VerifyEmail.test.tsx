import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import VerifyEmail from '@/pages/auth/VerifyEmail';

const { navigateMock, refetchMock, logoutMock, fetchMock, toastMock } =
    vi.hoisted(() => ({
        navigateMock: vi.fn(),
        refetchMock: vi.fn(),
        logoutMock: vi.fn(),
        fetchMock: vi.fn(),
        toastMock: {
            success: vi.fn(),
            error: vi.fn(),
            info: vi.fn(),
        },
    }));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');

    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

vi.mock('sonner', () => ({
    toast: toastMock,
}));

vi.mock('@/auth', () => ({
    logout: logoutMock,
    redirectAfterLogin: (role: string) =>
        role === 'admin' || role === 'owner' || role === 'superadmin'
            ? '/admin/dashboard'
            : role === 'assistant'
              ? '/unauthorized'
              : '/client/dashboard',
}));

vi.mock('@/hooks/useAuthUser', () => ({
    useAuthUser: () => ({
        data: {
            id: 5,
            name: 'Fatima',
            email: 'fatima@example.com',
            role: 'client',
            email_verified_at: null,
        },
        refetch: refetchMock,
    }),
}));

vi.mock('@/components/layout/BrandLogo', () => ({
    BrandLogo: () => <div data-testid="brand-logo" />,
}));

describe('VerifyEmail', () => {
    beforeEach(() => {
        navigateMock.mockReset();
        refetchMock.mockReset();
        logoutMock.mockReset();
        fetchMock.mockReset();
        toastMock.success.mockReset();
        toastMock.error.mockReset();
        toastMock.info.mockReset();

        vi.stubGlobal('fetch', fetchMock);

        document.head.innerHTML = '';
        const meta = document.createElement('meta');
        meta.name = 'csrf-token';
        meta.content = 'verify-csrf-token';
        document.head.appendChild(meta);
    });

    it('resends the verification email and shows a success toast', async () => {
        const user = userEvent.setup();
        fetchMock.mockResolvedValueOnce({ ok: true } as never);

        render(
            <LanguageProvider>
                <MemoryRouter>
                    <VerifyEmail />
                </MemoryRouter>
            </LanguageProvider>,
        );

        await user.click(
            screen.getByRole('button', {
                name: /resend verification email/i,
            }),
        );

        expect(fetchMock).toHaveBeenCalledWith(
            '/email/verification-notification',
            expect.objectContaining({ method: 'POST' }),
        );

        const [, requestOptions] = fetchMock.mock.calls[0] as [
            string,
            RequestInit,
        ];
        const headers = requestOptions.headers as Headers;
        expect(headers.get('Accept')).toBe('application/json');
        expect(headers.get('Content-Type')).toBe('application/json');
        expect(headers.get('X-CSRF-TOKEN')).toBe('verify-csrf-token');
        await waitFor(() =>
            expect(toastMock.success).toHaveBeenCalledWith(
                'Verification link sent!',
            ),
        );
    });

    it('navigates to the dashboard after verification is confirmed', async () => {
        const user = userEvent.setup();
        refetchMock.mockResolvedValueOnce({
            data: { email_verified_at: new Date().toISOString() },
        } as never);

        render(
            <LanguageProvider>
                <MemoryRouter>
                    <VerifyEmail />
                </MemoryRouter>
            </LanguageProvider>,
        );

        const verifyButton = screen.getAllByRole('button', {
            name: /i've verified my email/i,
        })[0];

        await user.click(verifyButton);

        await waitFor(() =>
            expect(toastMock.success).toHaveBeenCalledWith('Email verified!'),
        );
        expect(navigateMock).toHaveBeenCalledWith('/client/dashboard', {
            replace: true,
        });
    });

    it('logs out and returns to login', async () => {
        const user = userEvent.setup();
        logoutMock.mockResolvedValueOnce(undefined);

        render(
            <LanguageProvider>
                <MemoryRouter>
                    <VerifyEmail />
                </MemoryRouter>
            </LanguageProvider>,
        );

        const signOutButton = screen.getAllByRole('button', {
            name: /sign out/i,
        })[0];

        await user.click(signOutButton);

        expect(logoutMock).toHaveBeenCalledTimes(1);
        expect(navigateMock).toHaveBeenCalledWith('/login', {
            replace: true,
        });
    });
});
