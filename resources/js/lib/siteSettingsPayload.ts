import type { NavSettings, NavGroup, FilterLinkConfig } from '@/lib/nav-config';

export type LocalizedText = Record<'en' | 'fr' | 'ar', string>;

export function createLocalizedText(value = ''): LocalizedText {
    return {
        en: value,
        fr: value,
        ar: value,
    };
}

export function normalizeLocalizedText(value: unknown): LocalizedText {
    if (typeof value === 'string') {
        return createLocalizedText(value);
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return createLocalizedText('');
    }

    const text = value as Record<string, unknown>;

    return {
        en: typeof text.en === 'string' ? text.en : '',
        fr: typeof text.fr === 'string' ? text.fr : '',
        ar: typeof text.ar === 'string' ? text.ar : '',
    };
}

function normalizeDropdownItem(
    item: Record<string, unknown>,
): Record<string, unknown> {
    const { activeLang: _activeLang, ...rest } = item;

    if (Object.prototype.hasOwnProperty.call(rest, 'label')) {
        rest.label = normalizeLocalizedText(rest.label);
    }

    if (
        Object.prototype.hasOwnProperty.call(rest, 'pageKey') &&
        !rest.pageKey
    ) {
        delete rest.pageKey;
    }

    if (Array.isArray(rest.children)) {
        rest.children = rest.children.map((child) =>
            child && typeof child === 'object' && !Array.isArray(child)
                ? normalizeDropdownItem(child as Record<string, unknown>)
                : child,
        );
    }

    return rest;
}

function normalizeNavGroupForSave(
    group: Record<string, unknown>,
): Record<string, unknown> {
    const result: Record<string, unknown> = {
        ...group,
        label: normalizeLocalizedText(group.label),
    };
    // Handle backward compatibility: convert pageKeys to pages if needed
    if (Array.isArray(result.pageKeys) && !Array.isArray(result.pages)) {
        result.pages = result.pageKeys.map((pk: string) => ({
            pageKey: pk,
            isDropdown: false,
            linkSelf: true,
            items: [],
        }));
        delete result.pageKeys;
    }
    // Normalize pages array
    if (Array.isArray(result.pages)) {
        result.pages = result.pages.map((p: Record<string, unknown>) => {
            if (!p || typeof p !== 'object' || Array.isArray(p)) return p;
            const normalized: Record<string, unknown> = {
                ...p,
                isDropdown: !!p.isDropdown,
                linkSelf: p.linkSelf !== false,
            };
            if (p.label) {
                normalized.label = normalizeLocalizedText(p.label);
            }
            if (Array.isArray(p.items)) {
                normalized.items = p.items.map((item: unknown) => {
                    if (
                        !item ||
                        typeof item !== 'object' ||
                        Array.isArray(item)
                    )
                        return item;
                    return normalizeDropdownItem(
                        item as Record<string, unknown>,
                    );
                });
            } else {
                normalized.items = [];
            }
            return normalized;
        });
    } else {
        result.pages = [];
    }
    if (Array.isArray(result.links)) {
        result.links = result.links.map((link: unknown) => {
            if (!link || typeof link !== 'object' || Array.isArray(link))
                return link;
            return normalizeDropdownItem(link as Record<string, unknown>);
        });
    }
    if (Array.isArray(result.groups)) {
        result.groups = result.groups.map((g) =>
            g && typeof g === 'object' && !Array.isArray(g)
                ? normalizeNavGroupForSave(g as Record<string, unknown>)
                : g,
        );
    }
    return result;
}

function normalizeFilterLink(
    fl: Record<string, unknown> | undefined,
): FilterLinkConfig | undefined {
    if (!fl || typeof fl !== 'object' || Array.isArray(fl)) return undefined;
    const mode = fl.mode === 'search' || fl.mode === 'categories' ? fl.mode as FilterLinkConfig['mode'] : 'filter';
    const value = typeof fl.value === 'string' ? fl.value : '';
    const result: FilterLinkConfig = { mode, value };
    if (typeof fl.targetPageKey === 'string' && fl.targetPageKey) {
        result.targetPageKey = fl.targetPageKey;
    }
    return result;
}

function normalizeNavSettingsForSave(nav: NavSettings): NavSettings {
    const groups = Array.isArray(nav.groups)
        ? nav.groups.map(
              (g) =>
                  normalizeNavGroupForSave(
                      g as unknown as Record<string, unknown>,
                  ) as unknown as NavGroup,
          )
        : [];

    return {
        header: nav.header.map((entry) => ({
            ...entry,
            ...(entry.label
                ? { label: normalizeLocalizedText(entry.label) }
                : {}),
            ...(entry.filterLink
                ? { filterLink: normalizeFilterLink(entry.filterLink as unknown as Record<string, unknown>) }
                : { filterLink: undefined }),
            items: entry.items.map(
                (item) =>
                    normalizeDropdownItem(
                        item as unknown as Record<string, unknown>,
                    ) as unknown as (typeof entry.items)[number],
            ),
        })),
        footer: nav.footer.map((column) => ({ ...column })),
        groups,
    };
}

export function normalizeSiteSettingsContentForSave(
    content: unknown,
): Record<string, unknown> {
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
        return {};
    }

    const next = { ...(content as Record<string, unknown>) };
    const nav = next.nav;

    if (!nav || typeof nav !== 'object' || Array.isArray(nav)) {
        return next;
    }

    const navContent = { ...(nav as Record<string, unknown>) };

    if (Array.isArray(navContent.simpleLinks)) {
        navContent.simpleLinks = navContent.simpleLinks.map((entry) => {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
                return entry;
            }

            const link = { ...(entry as Record<string, unknown>) };
            delete link.activeLang;

            if (Object.prototype.hasOwnProperty.call(link, 'label')) {
                link.label = normalizeLocalizedText(link.label);
            }

            if (Array.isArray(link.items)) {
                link.items = link.items.map((item) => {
                    if (
                        !item ||
                        typeof item !== 'object' ||
                        Array.isArray(item)
                    ) {
                        return item;
                    }

                    const nextItem = { ...(item as Record<string, unknown>) };
                    delete nextItem.activeLang;

                    if (
                        Object.prototype.hasOwnProperty.call(nextItem, 'label')
                    ) {
                        nextItem.label = normalizeLocalizedText(nextItem.label);
                    }

                    return nextItem;
                });
            }

            return link;
        });
    }

    if (
        navContent.settings &&
        typeof navContent.settings === 'object' &&
        !Array.isArray(navContent.settings)
    ) {
        const settings = {
            ...(navContent.settings as Record<string, unknown>),
        };

        if (Array.isArray(settings.header)) {
            settings.header = settings.header.map((entry) => {
                if (
                    !entry ||
                    typeof entry !== 'object' ||
                    Array.isArray(entry)
                ) {
                    return entry;
                }

                const nextEntry = { ...(entry as Record<string, unknown>) };

                if (
                    Object.prototype.hasOwnProperty.call(nextEntry, 'label') &&
                    nextEntry.label
                ) {
                    nextEntry.label = normalizeLocalizedText(nextEntry.label);
                }

                if (Array.isArray(nextEntry.items)) {
                    nextEntry.items = nextEntry.items.map((item) => {
                        if (
                            !item ||
                            typeof item !== 'object' ||
                            Array.isArray(item)
                        ) {
                            return item;
                        }

                        return normalizeDropdownItem(
                            item as Record<string, unknown>,
                        );
                    });
                }

                if (
                    Object.prototype.hasOwnProperty.call(nextEntry, 'filterLink')
                ) {
                    nextEntry.filterLink = normalizeFilterLink(
                        nextEntry.filterLink as Record<string, unknown>,
                    );
                } else {
                    nextEntry.filterLink = undefined;
                }

                return nextEntry;
            });
        }

        if (Array.isArray(settings.groups)) {
            settings.groups = settings.groups.map((g) => {
                if (!g || typeof g !== 'object' || Array.isArray(g)) {
                    return g;
                }
                return normalizeNavGroupForSave(g as Record<string, unknown>);
            });
        } else {
            settings.groups = [];
        }

        navContent.settings = settings;
    }

    next.nav = navContent;

    return next;
}

export function normalizeNavSettingsDraft(nav: NavSettings): NavSettings {
    return normalizeNavSettingsForSave(nav);
}
