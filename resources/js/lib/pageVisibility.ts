import type { NavSettings } from '@/lib/nav-config';

/**
 * Check if a page is enabled in nav settings header
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

/**
 * Check if a page is exposed in header OR footer
 * Returns true if the page is enabled in header or present in any footer column
 */
export function isPageExposed(
    pageKey: string,
    navSettings?: NavSettings,
): boolean {
    if (!navSettings) return false;

    const inHeader = navSettings.header?.some(
        (item) => item.pageKey === pageKey && item.enabled,
    );
    const inFooter = navSettings.footer?.some((col) =>
        col.pageKeys.includes(pageKey),
    );

    return !!inHeader || !!inFooter;
}
