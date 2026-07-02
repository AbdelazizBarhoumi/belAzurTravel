// Definition of pages the admin can choose to surface in header / footer.
// The admin only checks pages — they cannot type new ones manually.

export interface PageDef {
    key: string;
    label: string;
    href: string;
    /** Query param a dropdown item with mode="filter" should use on this page */
    filterParam?: string;
    /** Whether this page can ever have a dropdown (overridden by config/site.php if provided) */
    canHaveDropdown?: boolean;
}

export const AVAILABLE_PAGES: PageDef[] = [
    {
        key: 'destinations',
        label: 'Destinations',
        href: '/destinations',
        filterParam: 'cat',
        canHaveDropdown: true,
    },
    {
        key: 'hotels',
        label: 'Hotels',
        href: '/hotels',
        filterParam: 'cat',
        canHaveDropdown: true,
    },
    {
        key: 'tours',
        label: 'Tours',
        href: '/tours',
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
    },
    { key: 'promos', label: 'Promos', href: '/promos', filterParam: 'type' },
    { key: 'team', label: 'Team', href: '/team' },
    { key: 'partners', label: 'Partners', href: '/partners' },
    { key: 'legal', label: 'Legal', href: '/legal' },
    { key: 'privacy-policy', label: 'Privacy Policy', href: '/privacy-policy' },
    { key: 'purchase-policy', label: 'Purchase Policy', href: '/purchase-policy' },
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
}

export type LocalizedText = Record<'en' | 'fr' | 'ar', string>;

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
}

export interface FooterColumn {
    title: string | Record<string, string>;
    pageKeys: string[];
}

export interface NavSettings {
    header: HeaderEntry[];
    footer: FooterColumn[];
}

export const DEFAULT_FOOTER_COLUMNS: {
    title: string;
    defaultKeys: string[];
}[] = [
    {
        title: 'Quick Links',
        defaultKeys: ['destinations', 'hotels', 'tours', 'deals'],
    },
    { title: 'Discover', defaultKeys: ['gallery', 'events', 'blog'] },
    { title: 'Support', defaultKeys: ['team', 'partners', 'legal', 'privacy-policy', 'purchase-policy', 'promos', 'contact'] },
];

export const DEFAULT_NAV_SETTINGS: NavSettings = {
    header: AVAILABLE_PAGES.map((p) => ({
        pageKey: p.key,
        enabled: [
            'destinations',
            'hotels',
            'tours',
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
        placement: [
            'blog',
            'contact',
        ].includes(p.key)
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
};

export function buildItemHref(
    pageKey: string,
    item: DropdownItemConfig,
    lang: 'en' | 'fr' | 'ar' = 'en',
): string {
    const page = getPage(pageKey);
    if (!page) return '#';
    if (item.mode === 'search') {
        const query = item.label[lang] ?? item.label.en ?? '';
        return `${page.href}?q=${encodeURIComponent(query)}`;
    }
    // Filter mode: value format is "typeKey:valueKey"
    if (item.mode === 'filter' && item.value.includes(':')) {
        const [typeKey, valueKey] = item.value.split(':');
        return `${page.href}?category_${typeKey}=${encodeURIComponent(valueKey)}`;
    }
    const param = page.filterParam || 'cat';
    return `${page.href}?${param}=${encodeURIComponent(item.value)}`;
}
