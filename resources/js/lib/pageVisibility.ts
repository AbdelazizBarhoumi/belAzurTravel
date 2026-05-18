import type { NavSettings } from '@/lib/nav-config';

/**
 * Check if a page is enabled in nav settings
 * Returns false if nav settings are not available
 */
export function isPageEnabled(
    pageKey: string,
    navSettings?: NavSettings,
): boolean {
    if (!navSettings?.header) {
        return false;
    }

    const entry = navSettings.header.find((item) => item.pageKey === pageKey);
    return entry?.enabled === true;
}
