import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiFetch } from '@/api/http';
import type { AuthUser, UserRole } from '@/auth';
import { storeAuthUser, storedRole } from '@/auth';

interface RoleGuardProps {
    role: UserRole | UserRole[];
    children: ReactNode;
}

export function RoleGuard({ role, children }: RoleGuardProps) {
    const location = useLocation();
    const allowed = Array.isArray(role) ? role : [role];
    const cachedRole = storedRole();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['auth', 'user'],
        queryFn: async () => {
            const user = await apiFetch<AuthUser>('/api/auth/user');
            storeAuthUser(user);
            return user;
        },
        retry: false,
        staleTime: 60_000,
    });

    const currentRole = data?.role ?? cachedRole;

    if (isLoading && currentRole && allowed.includes(currentRole)) {
        return <>{children}</>;
    }

    if (isLoading) {
        return null;
    }

    if (isError || !currentRole) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!allowed.includes(currentRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}
