import { AUTH_USER_QUERY_KEY, queryClient } from '@/lib/queryClient';

export type UserRole = 'admin' | 'assistant' | 'client';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    preferred_language?: 'fr' | 'ar' | 'en';
}

let currentAuthUser: AuthUser | null = null;

export function redirectAfterLogin(role: UserRole): string {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'assistant') return '/assistant/dashboard';
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
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always clear client state
        clearAuthUser();
    }
}
