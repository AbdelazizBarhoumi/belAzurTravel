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
            email: 'nadia@belazurtravel.com',
            role: 'admin',
            email_verified_at: null,
            preferred_language: 'fr',
        };

        storeAuthUser(user);
        fetchMock.mockResolvedValueOnce({ ok: true } as never);

        await logout();

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(new URL(url, 'http://localhost').pathname).toBe('/logout');
        expect(init.method).toBe('POST');
        expect(init.credentials).toBe('include');

        const headers = new Headers(init.headers as HeadersInit);
        expect(headers.get('Accept')).toBe('application/json');
        expect(headers.get('Content-Type')).toBe('application/json');
        expect(headers.get('X-CSRF-TOKEN')).toBe('test-csrf-token');
        expect(getAuthUser()).toBeNull();
        expect(queryClient.getQueryData(AUTH_USER_QUERY_KEY)).toBeNull();
    });

    it('still clears shared auth state if the logout request fails', async () => {
        const user: AuthUser = {
            id: 12,
            name: 'Youssef',
            email: 'youssef@belazurtravel.com',
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
