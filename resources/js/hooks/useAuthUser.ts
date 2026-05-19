import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/http';
import type { AuthUser } from '@/auth';
import { storeAuthUser } from '@/auth';

export function useAuthUser() {
    return useQuery({
        queryKey: ['auth', 'user'],
        queryFn: async () => {
            const response = await apiFetch<{ user: AuthUser | null }>(
                '/api/auth/user',
            );
            const user = response.user;

            if (user) {
                storeAuthUser(user);
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
