// Definition of pages the admin can choose to surface in header / footer.
// The admin only checks pages — they cannot type new ones manually.

import { getStaticFilterGroup } from './nav-static-filters';

export interface PageDef {
    key: string;
    label: string;
    href: string;
    /** Query param a dropdown item with mode="filter" should use on this page */
    filterParam?: string;
    /** Whether this page can ever have a dropdown (overridden by config/site.php if provided) */
    canHaveDropdown?: boolean;
    /** Keys of static filter groups from nav-static-filters.ts that apply to this page */
    staticFilters?: string[];
}

export const AVAILABLE_PAGES: PageDef[] = [
    {
        key: 'destinations',
        label: 'Destinations',
        href: '/destinations',
        filterParam: 'cat',
        canHaveDropdown: true,
        staticFilters: ['sort'],
    },
    {
        key: 'hotels',
        label: 'Hotels',
        href: '/hotels',
        filterParam: 'cat',
        canHaveDropdown: true,
        staticFilters: ['stars', 'type_chambres', 'arrangements', 'service'],
    },
    {
        key: 'tours',
        label: 'Tours',
        href: '/tours',
        filterParam: 'cat',
        canHaveDropdown: true,
    },
    {
        key: 'travels',
        label: 'International Travel',
        href: '/travels',
        filterParam: 'cat',
        canHaveDropdown: true,
    },
    {
        key: 'deals',
        label: 'Deals',
        href: '/deals',
        filterParam: 'cat',
        canHaveDropdown: true,
    },
    {
        key: 'gallery',
        label: 'Gallery',
        href: '/gallery',
        filterParam: 'cat',
        canHaveDropdown: true,
    },
    {
        key: 'events',
        label: 'Events',
        href: '/events',
        filterParam: 'cat',
        canHaveDropdown: true,
    },
    {
        key: 'blog',
        label: 'Blog',
        href: '/blog',
        filterParam: 'cat',
        canHaveDropdown: true,
    },
    {
        key: 'cars',
        label: 'Cars',
        href: '/cars',
        filterParam: 'type',
        canHaveDropdown: true,
    },
    {
        key: 'flights',
        label: 'Flights',
        href: '/flights',
        filterParam: 'airline',
        canHaveDropdown: true,
        staticFilters: ['trip_type'],
    },
    {
        key: 'promos',
        label: 'Promos',
        href: '/promos',
        filterParam: 'type',
        staticFilters: ['promo_type'],
    },
    { key: 'team', label: 'Team', href: '/team' },
    { key: 'partners', label: 'Partners', href: '/partners' },
    { key: 'legal', label: 'Legal', href: '/legal' },
    { key: 'privacy-policy', label: 'Privacy Policy', href: '/privacy-policy' },
    {
        key: 'purchase-policy',
        label: 'Purchase Policy',
        href: '/purchase-policy',
    },
    { key: 'visa', label: 'Visa', href: '/visa' },
    { key: 'contact', label: 'Contact', href: '/contact' },
];

export function getPage(key: string): PageDef | undefined {
    return AVAILABLE_PAGES.find((p) => p.key === key);
}

export function getFooterPage(key: string): PageDef | undefined {
    return AVAILABLE_PAGES.find((p) => p.key === key);
}

export type DropdownItemMode = 'filter' | 'search' | 'categories';

export interface DropdownItemConfig {
    label: LocalizedText;
    mode: DropdownItemMode;
    /** filter -> "typeKey:valueKey"; search -> the q= keyword; categories -> category type key */
    value: string;
    /** Nested sub-items (optional, enables 2-level nesting) */
    children?: DropdownItemConfig[];
    /** Target index page. Used by group sub-page links; children fall back to the parent's pageKey when omitted. */
    pageKey?: string;
    /** Optional inline SVG string for static filter items */
    svg?: string;
    /** How to display: "label" (text only), "svg" (icon only), "both" (icon + text) */
    displayMode?: 'label' | 'svg' | 'both';
}

export type LocalizedText = Record<'en' | 'fr' | 'ar', string>;

/** Config for a standalone filtered link in the header (links to a page with a specific filter/search). */
export interface FilterLinkConfig {
    /** Which page to link to (defaults to the entry's pageKey). */
    targetPageKey?: string;
    /** How the value is interpreted. */
    mode: DropdownItemMode;
    /** filter -> "typeKey:valueKey" or "static:groupKey:optionKey" or "param=value"; search -> keyword */
    value: string;
}

export interface HeaderEntry {
    pageKey: string;
    enabled: boolean;
    isDropdown: boolean;
    /** When isDropdown=true: does clicking the trigger itself navigate to the page index, or only open the menu on hover? */
    linkSelf: boolean;
    /** "topbar" = shown in the upper info bar. "top" = own button in main nav. "more" = grouped under the global "+ More" dropdown. */
    placement: 'topbar' | 'top' | 'more';
    items: DropdownItemConfig[];
    /** Admin-customizable display name (en/fr/ar). Falls back to translation key if unset. */
    label?: LocalizedText;
    /** When set, the entry links to a filtered URL instead of the page root. Forces a simple link (no dropdown). */
    filterLink?: FilterLinkConfig;
}

export interface FooterColumn {
    title: string | Record<string, string>;
    pageKeys: string[];
}

export interface GroupPageEntry {
    pageKey: string;
    label?: LocalizedText;
    isDropdown: boolean;
    linkSelf: boolean;
    items: DropdownItemConfig[];
}

/** A mixed sub-page link inside a group. Each link targets its own index page + filter/search. */
export interface NavGroupLink extends DropdownItemConfig {
    pageKey: string;
}

export interface NavGroup {
    key: string;
    label: LocalizedText;
    enabled: boolean;
    placement: 'topbar' | 'top' | 'more';
    pages: GroupPageEntry[];
    /** Mixed sub-page links — each may point to a different index page. */
    links?: NavGroupLink[];
    groups?: NavGroup[];
}

export interface NavSettings {
    header: HeaderEntry[];
    footer: FooterColumn[];
    groups: NavGroup[];
}

export const DEFAULT_FOOTER_COLUMNS: {
    title: string;
    defaultKeys: string[];
}[] = [
    {
        title: 'Quick Links',
        defaultKeys: ['destinations', 'hotels', 'tours', 'travels', 'deals'],
    },
    { title: 'Discover', defaultKeys: ['gallery', 'events', 'blog'] },
    {
        title: 'Support',
        defaultKeys: [
            'team',
            'partners',
            'legal',
            'privacy-policy',
            'purchase-policy',
            'promos',
            'contact',
        ],
    },
];

export const DEFAULT_NAV_SETTINGS: NavSettings = {
    header: AVAILABLE_PAGES.map((p) => ({
        pageKey: p.key,
        enabled: [
            'destinations',
            'hotels',
            'tours',
            'travels',
            'deals',
            'blog',
            'cars',
            'flights',
            'promos',
            'team',
            'partners',
            'legal',
            'privacy-policy',
            'purchase-policy',
            'visa',
            'contact',
        ].includes(p.key),
        isDropdown: ['destinations', 'hotels'].includes(p.key),
        linkSelf: true,
        placement: ['blog', 'contact'].includes(p.key)
            ? 'topbar'
            : [
                    'cars',
                    'flights',
                    'promos',
                    'team',
                    'partners',
                    'legal',
                    'privacy-policy',
                    'purchase-policy',
                ].includes(p.key)
              ? 'more'
              : 'top',
        items: [
            'destinations',
            'hotels',
            'tours',
            'travels',
            'deals',
            'blog',
            'cars',
            'events',
        ].includes(p.key)
            ? [
                  {
                      label: {
                          en: 'Categories',
                          fr: 'Categories',
                          ar: 'Categories',
                      },
                      mode: 'categories',
                      value: '',
                  },
              ]
            : [],
    })),
    footer: DEFAULT_FOOTER_COLUMNS.map((c) => ({
        title: c.title,
        pageKeys: c.defaultKeys,
    })),
    groups: [],
};

export function buildItemHref(
    pageKey: string,
    item: DropdownItemConfig,
    lang: 'en' | 'fr' | 'ar' = 'en',
): string {
    const effectivePageKey = item.pageKey ?? pageKey;
    const page = getPage(effectivePageKey);
    if (!page) return '#';
    if (item.mode === 'search') {
        const query = item.label[lang] ?? item.label.en ?? '';
        return `${page.href}?q=${encodeURIComponent(query)}`;
    }
    // Filter mode: value format is "typeKey:valueKey"
    if (
        item.mode === 'filter' &&
        item.value.includes(':') &&
        !item.value.startsWith('static:')
    ) {
        const [typeKey, valueKey] = item.value.split(':');
        return `${page.href}?category_${typeKey}=${encodeURIComponent(valueKey)}`;
    }
    // Static filter: value format is "static:groupKey:optionKey" -> look up href from config
    if (item.mode === 'filter' && item.value.startsWith('static:')) {
        const parts = item.value.split(':');
        if (parts.length === 3) {
            const [, groupKey, optionKey] = parts;
            const group = getStaticFilterGroup(effectivePageKey, groupKey);
            const opt = group?.options.find((o) => o.key === optionKey);
            if (opt) {
                return `${page.href}?${opt.href}`;
            }
        }
    }
    // Static filter: value format is "param=value" (direct query string)
    if (item.mode === 'filter' && item.value.includes('=')) {
        const [param, val] = item.value.split('=');
        return `${page.href}?${param}=${encodeURIComponent(val)}`;
    }
    const param = page.filterParam || 'cat';
    return `${page.href}?${param}=${encodeURIComponent(item.value)}`;
}

/** Build a href for a standalone filtered link. Wraps buildItemHref with the FilterLinkConfig shape. */
export function buildFilterLinkHref(
    entry: HeaderEntry,
    lang: 'en' | 'fr' | 'ar' = 'en',
): string {
    if (!entry.filterLink) return getPage(entry.pageKey)?.href ?? '#';
    const fl = entry.filterLink;
    const targetKey = fl.targetPageKey ?? entry.pageKey;
    const dummyItem: DropdownItemConfig = {
        label: entry.label ?? { en: '', fr: '', ar: '' },
        mode: fl.mode,
        value: fl.value,
        pageKey: targetKey,
    };
    return buildItemHref(targetKey, dummyItem, lang);
}

export function createFilterLink(): FilterLinkConfig {
    return {
        mode: 'filter',
        value: '',
    };
}

export function createGroupLink(pageKey = ''): NavGroupLink {
    const label: LocalizedText = { en: '', fr: '', ar: '' };
    return {
        pageKey,
        label,
        mode: 'filter',
        value: '',
    };
}

export function getNextGroupKey(groups: NavGroup[]): string {
    let maxNum = 0;
    const findMax = (list: NavGroup[]) => {
        for (const g of list) {
            const match = g.key.match(/^group-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
            if (g.groups?.length) findMax(g.groups);
        }
    };
    findMax(groups);
    return `group-${maxNum + 1}`;
}

export function getPagesInGroups(groups: NavGroup[]): Set<string> {
    const result = new Set<string>();
    for (const g of groups) {
        for (const p of g.pages) {
            result.add(p.pageKey);
        }
        if (g.groups?.length) {
            for (const pk of getPagesInGroups(g.groups)) {
                result.add(pk);
            }
        }
    }
    return result;
}

export function createGroupPageEntry(pageKey: string): GroupPageEntry {
    return {
        pageKey,
        isDropdown: false,
        linkSelf: true,
        items: [],
    };
}
