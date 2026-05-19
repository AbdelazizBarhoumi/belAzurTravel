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
}

export function clearAuthUser(): void {
    currentAuthUser = null;
}

/**
 * Logout: destroy server session and clear client state
 */
export async function logout(): Promise<void> {
    try {
        // Call server to destroy session
        await fetch('/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always clear client state
        clearAuthUser();
    }
}
