import type { NavSettings } from '@/lib/nav-config';

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

function normalizeDropdownItem(item: Record<string, unknown>): Record<string, unknown> {
    const { activeLang: _activeLang, ...rest } = item;

    if (Object.prototype.hasOwnProperty.call(rest, 'label')) {
        rest.label = normalizeLocalizedText(rest.label);
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

function normalizeNavSettingsForSave(nav: NavSettings): NavSettings {
    return {
        header: nav.header.map((entry) => ({
            ...entry,
            ...(entry.label ? { label: normalizeLocalizedText(entry.label) } : {}),
            items: entry.items.map((item) => normalizeDropdownItem(item as Record<string, unknown>) as any),
        })),
        footer: nav.footer.map((column) => ({ ...column })),
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

                        return normalizeDropdownItem(item as Record<string, unknown>);
                    });
                }

                return nextEntry;
            });
        }

        navContent.settings = settings;
    }

    next.nav = navContent;

    return next;
}

export function normalizeNavSettingsDraft(nav: NavSettings): NavSettings {
    return normalizeNavSettingsForSave(nav);
}
