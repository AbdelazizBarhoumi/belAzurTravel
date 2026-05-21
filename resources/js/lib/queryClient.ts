import { QueryClient } from '@tanstack/react-query';

export const AUTH_USER_QUERY_KEY = ['auth', 'user'] as const;

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Conservative defaults to avoid accidental request storms.
            // Individual screens can opt into shorter stale times if needed.
            staleTime: 15 * 60 * 1000, // 15 minutes for most queries
            gcTime: 30 * 60 * 1000, // 30 minutes for cache retention
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
        },
    },
});
