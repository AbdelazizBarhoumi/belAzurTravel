import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '@/auth';
import { useAuthUser } from '@/hooks/useAuthUser';

interface RoleGuardProps {
    role: UserRole | UserRole[];
    children: ReactNode;
}

export function RoleGuard({ role, children }: RoleGuardProps) {
    const location = useLocation();
    const allowed = Array.isArray(role) ? role : [role];
    const { data, isPending, isFetching, isError } = useAuthUser();

    if (isPending || isFetching) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <h1 className="font-serif text-xl font-bold text-foreground">
                        Loading admin area
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Verifying your session and permissions…
                    </p>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Admins and above can access any guarded area
    if (['admin', 'superadmin', 'owner'].includes(data.role)) {
        return <>{children}</>;
    }

    if (!allowed.includes(data.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}
