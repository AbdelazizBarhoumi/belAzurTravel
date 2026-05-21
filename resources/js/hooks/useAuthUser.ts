import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/http';
import type { AuthUser } from '@/auth';
import { clearAuthUser, storeAuthUser } from '@/auth';
import { AUTH_USER_QUERY_KEY } from '@/lib/queryClient';

export function useAuthUser() {
    return useQuery({
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
