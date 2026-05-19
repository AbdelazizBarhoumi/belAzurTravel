import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/api/http';
import { storeAuthUser } from '@/auth';
import { useAuthUser } from '@/hooks/useAuthUser';

vi.mock('@/api/http', () => ({
    apiFetch: vi.fn(),
}));

vi.mock('@/auth', async () => {
    const actual = await vi.importActual<typeof import('@/auth')>(
        '@/auth',
    );

    return {
        ...actual,
        storeAuthUser: vi.fn(),
    };
});

interface AuthQuerySnapshot {
    data: unknown;
    isPending: boolean;
    isFetching: boolean;
    isError: boolean;
}

interface HookProbeProps {
    onResult: (snapshot: AuthQuerySnapshot) => void;
}

function HookProbe({ onResult }: HookProbeProps): JSX.Element | null {
    const result = useAuthUser();

    useEffect(() => {
        onResult(result);
    }, [onResult, result]);

    return null;
}

function renderWithQueryClient(onResult: (snapshot: AuthQuerySnapshot) => void) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <HookProbe onResult={onResult} />
        </QueryClientProvider>,
    );
}

describe('useAuthUser', () => {
    beforeEach(() => {
        vi.mocked(apiFetch).mockReset();
        vi.mocked(storeAuthUser).mockReset();
    });

    it('treats guest responses as anonymous users', async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce({ user: null } as never);

        let latest: AuthQuerySnapshot | undefined;

        renderWithQueryClient((snapshot) => {
            latest = snapshot;
        });

        await waitFor(() => expect(latest?.isPending).toBe(false));

        expect(latest?.isError).toBe(false);
        expect(latest?.data).toBeNull();
        expect(vi.mocked(storeAuthUser)).not.toHaveBeenCalled();
    });

    it('stores authenticated users in the shared auth cache', async () => {
        const user = {
            id: 42,
            name: 'Amina',
            email: 'amina@example.com',
            role: 'admin',
            preferred_language: 'fr',
        } as const;

        vi.mocked(apiFetch).mockResolvedValueOnce({ user } as never);

        let latest: AuthQuerySnapshot | undefined;

        renderWithQueryClient((snapshot) => {
            latest = snapshot;
        });

        await waitFor(() => expect(latest?.isPending).toBe(false));

        expect(latest?.data).toEqual(user);
        expect(vi.mocked(storeAuthUser)).toHaveBeenCalledWith(user);
    });
});
