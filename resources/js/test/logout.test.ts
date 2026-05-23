import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
    clearAuthUser,
    getAuthUser,
    logout,
    storeAuthUser,
    type AuthUser,
} from '@/auth';
import { AUTH_USER_QUERY_KEY, queryClient } from '@/lib/queryClient';

const fetchMock = vi.fn();

function setCsrfToken(token = 'test-csrf-token'): void {
    document.head.innerHTML = '';

    const meta = document.createElement('meta');
    meta.name = 'csrf-token';
    meta.content = token;
    document.head.appendChild(meta);
}

describe('logout', () => {
    beforeEach(() => {
        queryClient.clear();
        clearAuthUser();
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
        setCsrfToken();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('posts to the logout endpoint and clears shared auth state', async () => {
        const user: AuthUser = {
            id: 11,
            name: 'Nadia',
            email: 'nadia@example.com',
            role: 'admin',
            email_verified_at: null,
            preferred_language: 'fr',
        };

        storeAuthUser(user);
        fetchMock.mockResolvedValueOnce({ ok: true } as never);

        await logout();

        expect(fetchMock).toHaveBeenCalledWith('/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': 'test-csrf-token',
            },
        });
        expect(getAuthUser()).toBeNull();
        expect(queryClient.getQueryData(AUTH_USER_QUERY_KEY)).toBeNull();
    });

    it('still clears shared auth state if the logout request fails', async () => {
        const user: AuthUser = {
            id: 12,
            name: 'Youssef',
            email: 'youssef@example.com',
            role: 'client',
            email_verified_at: null,
        };

        storeAuthUser(user);
        fetchMock.mockRejectedValueOnce(new Error('network down'));

        await expect(logout()).resolves.toBeUndefined();

        expect(getAuthUser()).toBeNull();
        expect(queryClient.getQueryData(AUTH_USER_QUERY_KEY)).toBeNull();
    });
});
