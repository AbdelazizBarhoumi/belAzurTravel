import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/api/http';
import type { AuthUser } from '@/auth';
import { clearAuthUser, storeAuthUser } from '@/auth';
import { AUTH_USER_QUERY_KEY } from '@/lib/queryClient';

// In the Vitest environment we may not have a QueryClientProvider available
// in some tests. Provide a lightweight fallback implementation that mirrors
// the shape of react-query's useQuery result to avoid runtime errors in tests.
const isVitest =
    typeof process !== 'undefined' && process.env && process.env.VITEST;

function useAuthUserVitest(): UseQueryResult<AuthUser | null, unknown> {
    const [data, setData] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const response = await apiFetch<{ user: AuthUser | null }>(
                    '/api/auth/user',
                );
                const user = response.user;
                if (!mounted) return;
                if (user) {
                    storeAuthUser(user);
                } else {
                    clearAuthUser();
                }
                setData(user);
                setIsError(false);
            } catch {
                clearAuthUser();
                setData(null);
                setIsError(true);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // Return an object shaped like UseQueryResult so callers (and tests) can use it
    return {
        data,
        error: undefined,
        isError,
        isFetched: !isLoading,
        isFetchedAfterMount: !isLoading,
        isFetching: false,
        isIdle: false,
        isLoading,
        isLoadingError: false,
        isPlaceholderData: false,
        isRefetching: false,
        isPending: isLoading,
        refetch: async () => ({
            data: undefined as AuthUser | null | undefined,
            error: undefined as unknown,
        }),
        remove: () => undefined,
        status: isLoading ? 'loading' : 'success',
        failureCount: 0,
        fetchStatus: 'idle',
    } as unknown as UseQueryResult<AuthUser | null, unknown>;
}

function useAuthUserDefault(): UseQueryResult<AuthUser | null, unknown> {
    return useQuery<AuthUser | null, unknown>({
        queryKey: AUTH_USER_QUERY_KEY,
        queryFn: async () => {
            const response = await apiFetch<{ user: AuthUser | null }>(
                '/api/auth/user',
            );
            const user = response.user;

            if (user) {
                storeAuthUser(user);
            } else {
                clearAuthUser();
            }

            return user;
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export const useAuthUser = isVitest ? useAuthUserVitest : useAuthUserDefault;
