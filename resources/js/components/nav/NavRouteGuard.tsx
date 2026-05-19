import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { NavSettings } from '@/lib/nav-config';
import { DEFAULT_NAV_SETTINGS } from '@/lib/nav-config';

interface NavRouteGuardProps {
    pageKey: string;
    children: ReactNode;
}

export function NavRouteGuard({ pageKey, children }: NavRouteGuardProps) {
    const { settings, loading } = useSiteSettings();

    // Get nav settings from database or defaults
    let navSettings: NavSettings = DEFAULT_NAV_SETTINGS;
    if (settings.content?.nav?.settings) {
        navSettings = settings.content.nav.settings;
    }

    // While loading, show nothing (prevent flash)
    if (loading) {
        return null;
    }

    // Check if page is enabled in header
    const isInHeader = navSettings.header.some(
        (entry) => entry.pageKey === pageKey && entry.enabled,
    );

    // Check if page is enabled in footer
    const isInFooter = navSettings.footer.some((column) =>
        column.pageKeys.includes(pageKey),
    );

    // If not enabled in either header or footer, block access
    if (!isInHeader && !isInFooter) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
