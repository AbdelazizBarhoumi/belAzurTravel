import { describe, expect, beforeEach, it } from 'vitest';
import {
    clearAuthUser,
    getAuthUser,
    storeAuthUser,
    type AuthUser,
} from '@/auth';
import { AUTH_USER_QUERY_KEY, queryClient } from '@/lib/queryClient';

describe('auth cache synchronization', () => {
    beforeEach(() => {
        queryClient.clear();
        clearAuthUser();
    });

    it('mirrors the shared auth user into the react-query cache', () => {
        const user: AuthUser = {
            id: 7,
            name: 'Leila',
            email: 'leila@example.com',
            role: 'assistant',
            preferred_language: 'en',
        };

        storeAuthUser(user);

        expect(getAuthUser()).toEqual(user);
        expect(queryClient.getQueryData(AUTH_USER_QUERY_KEY)).toEqual(user);
    });

    it('clears the shared auth cache on logout', () => {
        storeAuthUser({
            id: 8,
            name: 'Omar',
            email: 'omar@example.com',
            role: 'client',
        });

        clearAuthUser();

        expect(getAuthUser()).toBeNull();
        expect(queryClient.getQueryData(AUTH_USER_QUERY_KEY)).toBeNull();
    });
});
