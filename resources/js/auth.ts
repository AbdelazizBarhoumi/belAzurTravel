import { buildRequestHeaders } from '@/api/requestHeaders';
import { AUTH_USER_QUERY_KEY, queryClient } from '@/lib/queryClient';

export type UserRole =
    | 'owner'
    | 'superadmin'
    | 'admin'
    | 'assistant'
    | 'client';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    email_verified_at: string | null;
    preferred_language?: 'fr' | 'ar' | 'en';
}

let currentAuthUser: AuthUser | null = null;

export function redirectAfterLogin(role: UserRole): string {
    if (['owner', 'superadmin', 'admin'].includes(role))
        return '/admin/dashboard';
    if (role === 'assistant') return '/unauthorized';
    return '/client/dashboard';
}

export function getAuthUser(): AuthUser | null {
    return currentAuthUser;
}

export function storeAuthUser(user: AuthUser): void {
    currentAuthUser = user;
    queryClient.setQueryData(AUTH_USER_QUERY_KEY, user);
}

export function clearAuthUser(): void {
    currentAuthUser = null;
    queryClient.setQueryData(AUTH_USER_QUERY_KEY, null);
}

/**
 * Logout: destroy server session and clear client state
 */
export async function logout(): Promise<void> {
    try {
        const csrfToken =
            document
                .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? '';

        // Call server to destroy session
        await fetch('/logout', {
            method: 'POST',
            credentials: 'include',
            headers: buildRequestHeaders({
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            }),
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always clear client state
        clearAuthUser();
    }
}
