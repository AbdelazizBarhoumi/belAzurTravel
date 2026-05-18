export type UserRole = 'admin' | 'assistant' | 'client';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    preferred_language?: 'fr' | 'ar' | 'en';
}

export function redirectAfterLogin(role: UserRole): string {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'assistant') return '/assistant/dashboard';
    return '/client/dashboard';
}

export function storedRole(): UserRole | null {
    const role = localStorage.getItem('role');
    return role === 'admin' || role === 'assistant' || role === 'client'
        ? role
        : null;
}

export function storeAuthUser(user: AuthUser): void {
    localStorage.setItem('role', user.role);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userId', String(user.id));
}

export function clearAuthUser(): void {
    localStorage.removeItem('role');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
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
