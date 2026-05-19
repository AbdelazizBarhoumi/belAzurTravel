// Definition of pages the admin can choose to surface in header / footer.
// The admin only checks pages — they cannot type new ones manually.

export interface PageDef {
    key: string;
    label: string;
    href: string;
    /** Query param a dropdown item with mode="filter" should use on this page */
    filterParam?: string;
}

export const AVAILABLE_PAGES: PageDef[] = [
    {
        key: 'destinations',
        label: 'Destinations',
        href: '/destinations',
        filterParam: 'cat',
    },
    { key: 'hotels', label: 'Hotels', href: '/hotels', filterParam: 'cat' },
    { key: 'tours', label: 'Tours', href: '/tours', filterParam: 'cat' },
    { key: 'deals', label: 'Deals', href: '/deals', filterParam: 'cat' },
    { key: 'gallery', label: 'Gallery', href: '/gallery', filterParam: 'cat' },
    { key: 'events', label: 'Events', href: '/events', filterParam: 'cat' },
    { key: 'blog', label: 'Blog', href: '/blog', filterParam: 'cat' },
    { key: 'cars', label: 'Cars', href: '/cars', filterParam: 'type' },
    {
        key: 'flights',
        label: 'Flights',
        href: '/flights',
        filterParam: 'airline',
    },
    { key: 'promos', label: 'Promos', href: '/promos' },
    { key: 'team', label: 'Team', href: '/team' },
    { key: 'legal', label: 'Legal', href: '/legal' },
    { key: 'favorites', label: 'Favorites', href: '/favorites' },
    { key: 'design-trip', label: 'Design Trip', href: '/design-trip' },
];

export function getPage(key: string): PageDef | undefined {
    return AVAILABLE_PAGES.find((p) => p.key === key);
}

export function getFooterPage(key: string): PageDef | undefined {
    return AVAILABLE_PAGES.find((p) => p.key === key);
}

export type DropdownItemMode = 'filter' | 'search';

export interface DropdownItemConfig {
    label: string | Record<string, string>;
    mode: DropdownItemMode;
    /** filter -> value of filterParam; search -> the q= keyword */
    value: string;
}

export interface HeaderEntry {
    pageKey: string;
    enabled: boolean;
    isDropdown: boolean;
    /** When isDropdown=true: does clicking the trigger itself navigate to the page index, or only open the menu on hover? */
    linkSelf: boolean;
    /** "top" = own button in nav. "more" = grouped under the global "+ More" dropdown. */
    placement: 'top' | 'more';
    items: DropdownItemConfig[];
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
    { title: 'Support', defaultKeys: ['team', 'legal', 'promos'] },
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
            'legal',
        ].includes(p.key),
        isDropdown: p.key === 'destinations' || p.key === 'hotels',
        linkSelf: true,
        placement: ['cars', 'flights', 'promos', 'team', 'legal'].includes(
            p.key,
        )
            ? 'more'
            : 'top',
        items:
            p.key === 'destinations'
                ? [
                      { label: 'Beach', mode: 'filter', value: 'Beach' },
                      { label: 'City', mode: 'filter', value: 'City' },
                      { label: 'Nature', mode: 'filter', value: 'Nature' },
                      { label: 'Luxury', mode: 'filter', value: 'Luxury' },
                  ]
                : p.key === 'hotels'
                  ? [
                        { label: 'Luxury', mode: 'filter', value: 'Luxury' },
                        {
                            label: 'Boutique',
                            mode: 'filter',
                            value: 'Boutique',
                        },
                        { label: 'Resorts', mode: 'filter', value: 'Resorts' },
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
): string {
    const page = getPage(pageKey);
    if (!page) return '#';
    if (item.mode === 'search') {
        return `${page.href}?q=${encodeURIComponent(item.value)}`;
    }
    const param = page.filterParam || 'cat';
    return `${page.href}?${param}=${encodeURIComponent(item.value)}`;
}
