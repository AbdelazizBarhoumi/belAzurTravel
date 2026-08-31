import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    X,
    User,
    Heart,
    ChevronDown,
    ChevronRight,
    FileCheck,
    Phone,
    Star,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { redirectAfterLogin } from '@/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';
import {
    FacebookWhiteIcon,
    InstagramWhiteIcon,
    TwitterWhiteIcon,
    LinkedinWhiteIcon,
    YoutubeWhiteIcon,
    TiktokWhiteIcon,
    WhatsAppWhiteIcon,
} from '@/components/ui/SocialIconsWhite';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import {
    useCategoryTypesPublic,
    type PublicCategoryType,
} from '@/hooks/usePublicData';
import { useCategories } from '@/hooks/usePublicData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getLocalizedCategoryLabelByKey } from '@/lib/categoryLabels';
import {
    type DropdownItemConfig,
    type HeaderEntry,
    type NavGroup,
    type NavLink,
    getPage,
    buildItemHref,
    buildNavLinkHref,
    DEFAULT_NAV_SETTINGS,
    type NavSettings,
    type LocalizedText,
    getPagesInGroups,
} from '@/lib/nav-config';
import { getStaticFiltersForPage } from '@/lib/nav-static-filters';

const SOCIAL_ICONS: Record<
    string,
    React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
    facebook: FacebookWhiteIcon,
    instagram: InstagramWhiteIcon,
    twitter: TwitterWhiteIcon,
    linkedin: LinkedinWhiteIcon,
    youtube: YoutubeWhiteIcon,
    tiktok: TiktokWhiteIcon,
    whatsapp: WhatsAppWhiteIcon,
};

function useHoverDelay(delay = 250) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clear = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);
    const schedule = useCallback(
        (fn: () => void) => {
            clear();
            timerRef.current = setTimeout(fn, delay);
        },
        [clear, delay],
    );
    useEffect(() => () => clear(), [clear]);
    return { schedule, clear };
}

/** Render a dropdown item's content based on its displayMode */
function DropdownItemContent({
    item,
    label,
}: {
    item: DropdownItemConfig;
    label: string;
}) {
    const mode = item.displayMode ?? 'label';
    if (mode === 'svg' && item.svg) {
        return (
            <span
                className="inline-flex h-4 w-4 shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4"
                dangerouslySetInnerHTML={{ __html: item.svg }}
            />
        );
    }
    if (mode === 'both' && item.svg) {
        return (
            <span className="flex items-center gap-1.5">
                <span
                    className="inline-flex h-4 w-4 shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4"
                    dangerouslySetInnerHTML={{ __html: item.svg }}
                />
                {label}
            </span>
        );
    }
    return <>{label}</>;
}

/** Resolve categories dropdown items based on the selected value.
 *  value="static:stars" -> only stars options, value="colors" -> only that API category, value="" -> all */
function resolveCategoriesDropdownItems(
    pageKey: string,
    value: string | null | undefined,
    categoryTypes: PublicCategoryType[],
): DropdownItemConfig[] {
    const items: DropdownItemConfig[] = [];
    const safeValue = value ?? '';

    // Static filter group selected
    if (safeValue.startsWith('static:')) {
        const groupKey = safeValue.replace('static:', '');
        const group = getStaticFiltersForPage(pageKey).find(
            (g) => g.key === groupKey,
        );
        if (group) {
            for (const opt of group.options) {
                items.push({
                    label: opt.label,
                    mode: 'filter' as const,
                    value: `static:${group.key}:${opt.key}`,
                    pageKey,
                    svg: opt.svg,
                    displayMode: group.displayMode ?? 'label',
                });
            }
        }
        return items;
    }

    // Dynamic API category type selected
    if (safeValue) {
        const selectedType = categoryTypes.find((ct) => ct.key === safeValue);
        if (selectedType?.values) {
            for (const val of selectedType.values) {
                items.push({
                    label: val.name as unknown as LocalizedText,
                    mode: 'filter' as const,
                    value: `${selectedType.key}:${val.key}`,
                    pageKey,
                });
            }
        }
        return items;
    }

    // No specific value selected — show all static groups + dynamic categories
    const staticGroups = getStaticFiltersForPage(pageKey);
    for (const group of staticGroups) {
        for (const opt of group.options) {
            items.push({
                label: opt.label,
                mode: 'filter' as const,
                value: `static:${group.key}:${opt.key}`,
                pageKey,
                svg: opt.svg,
                displayMode: group.displayMode ?? 'label',
            });
        }
    }
    for (const ct of categoryTypes) {
        if (ct.values && ct.values.length > 0) {
            for (const val of ct.values) {
                items.push({
                    label: val.name as unknown as LocalizedText,
                    mode: 'filter' as const,
                    value: `${ct.key}:${val.key}`,
                    pageKey,
                });
            }
        }
    }

    return items;
}

function DesktopFlyoutItems({
    items,
    entry,
    lang,
    resolveDropdownItemLabel,
    hoveredPath,
    setHoveredPath,
    hover,
}: {
    items: DropdownItemConfig[];
    entry: HeaderEntry;
    lang: string;
    resolveDropdownItemLabel: (
        entry: HeaderEntry,
        item: DropdownItemConfig,
    ) => string;
    hoveredPath: string | null;
    setHoveredPath: (path: string | null) => void;
    hover: { schedule: (fn: () => void) => void; clear: () => void };
}) {
    const COL_SIZE = 10;
    const colCount = Math.ceil(items.length / COL_SIZE);

    return (
        <ul
            className="space-y-1 rounded-lg border border-border bg-card p-2"
            style={
                colCount > 1
                    ? { columnCount: colCount, minWidth: `${colCount * 14}rem` }
                    : undefined
            }
        >
            {items.map((item, idx) => {
                const itemPath = `${entry.pageKey}:${idx}`;
                const hasChildren =
                    item.children && item.children.length > 0;
                const isActive = hoveredPath?.startsWith(itemPath);

                return (
                    <li
                        key={idx}
                        className="relative break-inside-avoid"
                        onMouseEnter={() => {
                            hover.clear();
                            if (hasChildren) {
                                setHoveredPath(itemPath);
                            }
                        }}
                        onMouseLeave={() => {
                            if (hasChildren) {
                                hover.schedule(() => setHoveredPath(null));
                            }
                        }}
                    >
                        <Link
                            to={buildItemHref(
                                entry.pageKey,
                                item,
                                lang as 'en' | 'fr' | 'ar',
                            )}
                            className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <DropdownItemContent
                                item={item}
                                label={resolveDropdownItemLabel(entry, item)}
                            />
                            {hasChildren && (
                                <ChevronRight className="h-4 w-4 opacity-50" />
                            )}
                        </Link>
                        {hasChildren && isActive && (
                            <div
                                className="absolute left-[calc(100%+8px)] top-0"
                                onMouseEnter={() => {
                                    hover.clear();
                                    setHoveredPath(itemPath);
                                }}
                                onMouseLeave={() => {
                                    hover.schedule(() => setHoveredPath(null));
                                }}
                            >
                                <DesktopFlyoutItems
                                    items={item.children!}
                                    entry={entry}
                                    lang={lang}
                                    resolveDropdownItemLabel={
                                        resolveDropdownItemLabel
                                    }
                                    hoveredPath={hoveredPath}
                                    setHoveredPath={setHoveredPath}
                                    hover={hover}
                                />
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function MobileNestedItems({
    items,
    entry,
    onClose,
    resolveDropdownItemLabel,
    lang,
    depth = 0,
}: {
    items: DropdownItemConfig[];
    entry: HeaderEntry;
    onClose: () => void;
    resolveDropdownItemLabel: (
        entry: HeaderEntry,
        item: DropdownItemConfig,
    ) => string;
    lang: string;
    depth?: number;
}) {
    return (
        <>
            {items.map((item, idx) => {
                const hasChildren = item.children && item.children.length > 0;

                if (hasChildren) {
                    return (
                        <details key={idx} className="group/nested">
                            <summary className="flex cursor-pointer items-center justify-between py-1 text-sm text-muted-foreground">
                                <DropdownItemContent
                                    item={item}
                                    label={resolveDropdownItemLabel(
                                        entry,
                                        item,
                                    )}
                                />
                                <ChevronDown className="h-4 w-4 transition-transform group-open/nested:rotate-180" />
                            </summary>
                            <div className="flex flex-col gap-1 pb-1 pl-3">
                                <MobileNestedItems
                                    items={item.children!}
                                    entry={entry}
                                    onClose={onClose}
                                    resolveDropdownItemLabel={
                                        resolveDropdownItemLabel
                                    }
                                    lang={lang}
                                    depth={depth + 1}
                                />
                            </div>
                        </details>
                    );
                }

                return (
                    <Link
                        key={idx}
                        to={buildItemHref(
                            entry.pageKey,
                            item,
                            lang as 'en' | 'fr' | 'ar',
                        )}
                        onClick={onClose}
                        className="py-1 text-sm text-muted-foreground"
                    >
                        <DropdownItemContent
                            item={item}
                            label={resolveDropdownItemLabel(entry, item)}
                        />
                    </Link>
                );
            })}
        </>
    );
}

function DesktopGroupDropdown({
    group,
    lang,
    t,
    resolveLabel,
    resolveDropdownItemLabel,
    hoveredPath,
    setHoveredPath,
    hover,
    categoryTypesByPage,
}: {
    group: NavGroup;
    lang: string;
    t: (key: string) => string;
    resolveLabel: (label: string | LocalizedText | null | undefined) => string;
    resolveDropdownItemLabel: (
        entry: HeaderEntry,
        item: DropdownItemConfig,
    ) => string;
    hoveredPath: string | null;
    setHoveredPath: (path: string | null) => void;
    hover: { schedule: (fn: () => void) => void; clear: () => void };
    categoryTypesByPage: Record<string, PublicCategoryType[]>;
}) {
    const triggerPath = `group:${group.key}`;
    const isHovered =
        hoveredPath === triggerPath ||
        hoveredPath?.startsWith(triggerPath + ':');

    const resolveDropdownItems = (
        items: DropdownItemConfig[],
        pageKey: string,
    ): DropdownItemConfig[] => {
        const categoryTypes = categoryTypesByPage[pageKey] ?? [];

        const result = items.flatMap((item): DropdownItemConfig[] => {
            if (item.mode === 'categories') {
                return resolveCategoriesDropdownItems(
                    pageKey,
                    item.value,
                    categoryTypes,
                );
            }
            const resolvedChildren = item.children
                ? resolveDropdownItems(item.children, pageKey)
                : undefined;
            return [{ ...item, pageKey, children: resolvedChildren }];
        });

        const coveredValues = new Set(
            items
                .filter((i) => i.mode === 'categories' && i.value)
                .map((i) => i.value),
        );
        // Also skip types already referenced by explicit filter items
        for (const i of items) {
            if (i.mode === 'filter' && i.value.includes(':')) {
                coveredValues.add(i.value.split(':')[0]);
            }
        }
        // Strip 'static:' prefix so static types match dynamic ct.key
        for (const v of [...coveredValues]) {
            if (v.startsWith('static:')) coveredValues.add(v.slice(7));
        }
        if (!coveredValues.has('')) {
            for (const ct of categoryTypes) {
                if (coveredValues.has(ct.key)) continue;
                if (ct.values && ct.values.length > 0) {
                    for (const val of ct.values) {
                        result.push({
                            label: val.name as unknown as LocalizedText,
                            mode: 'filter' as const,
                            value: `${ct.key}:${val.key}`,
                            pageKey,
                        });
                    }
                }
            }
        }

        return result;
    };

    const resolveLinks = (links: DropdownItemConfig[]): DropdownItemConfig[] =>
        links.flatMap((link): DropdownItemConfig[] => {
            const pageKey = link.pageKey ?? '';
            if (link.mode === 'categories') {
                const categoryTypes = categoryTypesByPage[pageKey] ?? [];
                return resolveCategoriesDropdownItems(
                    pageKey,
                    link.value,
                    categoryTypes,
                );
            }
            const resolvedChildren = link.children
                ? resolveLinks(link.children)
                : undefined;
            return [{ ...link, children: resolvedChildren }];
        });

    return (
        <div
            className="relative"
            onMouseEnter={() => {
                hover.clear();
                setHoveredPath(triggerPath);
            }}
            onMouseLeave={() => {
                hover.schedule(() => setHoveredPath(null));
            }}
        >
            <button className="inline-flex h-10 items-center gap-1 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {resolveLabel(group.label) || group.key}
                <ChevronDown
                    className={`h-4 w-4 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-50'}`}
                />
            </button>
            {isHovered && (
                <div className="absolute left-0 top-full -mt-1 pt-1">
                    <ul className="min-w-56 space-y-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                        {group.pages.map((groupPage) => {
                            const page = getPage(groupPage.pageKey);
                            if (!page) return null;
                            const itemPath = `${triggerPath}:${groupPage.pageKey}`;
                            const isPageHovered =
                                hoveredPath === itemPath ||
                                hoveredPath?.startsWith(itemPath + ':');
                            const dropdownItems = groupPage.isDropdown
                                ? resolveDropdownItems(
                                      groupPage.items,
                                      groupPage.pageKey,
                                  )
                                : [];

                            if (
                                groupPage.isDropdown &&
                                dropdownItems.length > 0
                            ) {
                                return (
                                    <li
                                        key={groupPage.pageKey}
                                        className="relative"
                                        onMouseEnter={() => {
                                            hover.clear();
                                            setHoveredPath(itemPath);
                                        }}
                                        onMouseLeave={() => {
                                            hover.schedule(() =>
                                                setHoveredPath(null),
                                            );
                                        }}
                                    >
                                        {groupPage.linkSelf ? (
                                            <Link
                                                to={page.href}
                                                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            >
                                                <span>
                                                    {groupPage.label?.[lang] ||
                                                        groupPage.label?.en ||
                                                        t('nav.' + page.key)}
                                                </span>
                                                <ChevronDown
                                                    className={`h-4 w-4 transition-opacity ${isPageHovered ? 'opacity-100' : 'opacity-50'}`}
                                                />
                                            </Link>
                                        ) : (
                                            <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                                <span>
                                                    {groupPage.label?.[lang] ||
                                                        groupPage.label?.en ||
                                                        t('nav.' + page.key)}
                                                </span>
                                                <ChevronDown
                                                    className={`h-4 w-4 transition-opacity ${isPageHovered ? 'opacity-100' : 'opacity-50'}`}
                                                />
                                            </button>
                                        )}
                                        {isPageHovered && (
                                            <div className="absolute left-[calc(100%+8px)] top-0">
                                                <DesktopFlyoutItems
                                                    items={dropdownItems}
                                                    entry={
                                                        {
                                                            pageKey: itemPath,
                                                            label: groupPage.label,
                                                        } as HeaderEntry
                                                    }
                                                    lang={lang}
                                                    resolveDropdownItemLabel={
                                                        resolveDropdownItemLabel
                                                    }
                                                    hoveredPath={hoveredPath}
                                                    setHoveredPath={
                                                        setHoveredPath
                                                    }
                                                    hover={hover}
                                                />
                                            </div>
                                        )}
                                    </li>
                                );
                            }

                            return (
                                <li
                                    key={groupPage.pageKey}
                                    onMouseEnter={() => {
                                        hover.clear();
                                        setHoveredPath(triggerPath);
                                    }}
                                >
                                    <Link
                                        to={page.href}
                                        className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        {groupPage.label?.[lang] ||
                                            groupPage.label?.en ||
                                            t('nav.' + page.key)}
                                    </Link>
                                </li>
                            );
                        })}
                        {group.links?.map((link, linkIdx) => {
                            const linkPageKey = link.pageKey ?? '';
                            const page = getPage(linkPageKey);
                            if (!page) return null;
                            const resolvedLinks = resolveLinks([link]);

                            return resolvedLinks.map((resolved, subIdx) => {
                                const resolvedPageKey =
                                    resolved.pageKey ?? linkPageKey;
                                const resolvedPage = getPage(resolvedPageKey);
                                if (!resolvedPage) return null;
                                const linkPath = `${triggerPath}:link:${linkIdx}:${subIdx}`;
                                const isLinkHovered =
                                    hoveredPath === linkPath ||
                                    hoveredPath?.startsWith(linkPath + ':');
                                const children = resolved.children ?? [];

                                return (
                                    <li
                                        key={`${linkIdx}-${subIdx}`}
                                        className="relative"
                                        onMouseEnter={() => {
                                            hover.clear();
                                            setHoveredPath(linkPath);
                                        }}
                                        onMouseLeave={() => {
                                            if (children.length > 0)
                                                hover.schedule(() =>
                                                    setHoveredPath(null),
                                                );
                                        }}
                                    >
                                        <Link
                                            to={buildItemHref(
                                                resolvedPageKey,
                                                resolved,
                                                lang as 'en' | 'fr' | 'ar',
                                            )}
                                            className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        >
                                            <DropdownItemContent
                                                item={resolved}
                                                label={resolveDropdownItemLabel(
                                                    {
                                                        pageKey:
                                                            resolvedPageKey,
                                                    } as HeaderEntry,
                                                    resolved,
                                                )}
                                            />
                                            {children.length > 0 && (
                                                <ChevronRight className="h-4 w-4 opacity-50" />
                                            )}
                                        </Link>
                                        {children.length > 0 &&
                                            isLinkHovered && (
                                                <div
                                                    className="absolute left-[calc(100%+8px)] top-0"
                                                    onMouseEnter={() => {
                                                        hover.clear();
                                                        setHoveredPath(
                                                            linkPath,
                                                        );
                                                    }}
                                                    onMouseLeave={() => {
                                                        hover.schedule(() =>
                                                            setHoveredPath(
                                                                null,
                                                            ),
                                                        );
                                                    }}
                                                >
                                                    <DesktopFlyoutItems
                                                        items={children}
                                                        entry={
                                                            {
                                                                pageKey:
                                                                    linkPath,
                                                                label: resolved.label,
                                                            } as HeaderEntry
                                                        }
                                                        lang={lang}
                                                        resolveDropdownItemLabel={
                                                            resolveDropdownItemLabel
                                                        }
                                                        hoveredPath={
                                                            hoveredPath
                                                        }
                                                        setHoveredPath={
                                                            setHoveredPath
                                                        }
                                                        hover={hover}
                                                    />
                                                </div>
                                            )}
                                    </li>
                                );
                            });
                        })}
                        {group.groups
                            ?.filter((sg) => sg.enabled)
                            .map((subGroup) => {
                                const subGroupPath = `${triggerPath}:sub:${subGroup.key}`;
                                const isSubGroupHovered =
                                    hoveredPath === subGroupPath ||
                                    hoveredPath?.startsWith(subGroupPath + ':');

                                return (
                                    <li
                                        key={subGroup.key}
                                        className="relative"
                                        onMouseEnter={() => {
                                            hover.clear();
                                            setHoveredPath(subGroupPath);
                                        }}
                                        onMouseLeave={() => {
                                            hover.schedule(() =>
                                                setHoveredPath(null),
                                            );
                                        }}
                                    >
                                        <div className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                            <span>
                                                {resolveLabel(subGroup.label) ||
                                                    subGroup.key}
                                            </span>
                                            <ChevronRight className="h-4 w-4 opacity-50" />
                                        </div>
                                        {isSubGroupHovered && (
                                            <div
                                                className="absolute left-[calc(100%+8px)] top-0"
                                                onMouseEnter={() => {
                                                    hover.clear();
                                                    setHoveredPath(
                                                        subGroupPath,
                                                    );
                                                }}
                                                onMouseLeave={() => {
                                                    hover.schedule(() =>
                                                        setHoveredPath(null),
                                                    );
                                                }}
                                            >
                                                <ul className="min-w-48 space-y-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                                                    {subGroup.pages.map(
                                                        (groupPage) => {
                                                            const page =
                                                                getPage(
                                                                    groupPage.pageKey,
                                                                );
                                                            if (!page)
                                                                return null;
                                                            const pagePath = `${subGroupPath}:${groupPage.pageKey}`;
                                                            const isPageHovered =
                                                                hoveredPath ===
                                                                    pagePath ||
                                                                hoveredPath?.startsWith(
                                                                    pagePath +
                                                                        ':',
                                                                );
                                                            const dropdownItems =
                                                                groupPage.isDropdown
                                                                    ? resolveDropdownItems(
                                                                          groupPage.items,
                                                                          groupPage.pageKey,
                                                                      )
                                                                    : [];

                                                            if (
                                                                groupPage.isDropdown &&
                                                                dropdownItems.length >
                                                                    0
                                                            ) {
                                                                return (
                                                                    <li
                                                                        key={
                                                                            groupPage.pageKey
                                                                        }
                                                                        className="relative"
                                                                        onMouseEnter={() => {
                                                                            hover.clear();
                                                                            setHoveredPath(
                                                                                pagePath,
                                                                            );
                                                                        }}
                                                                        onMouseLeave={() => {
                                                                            hover.schedule(
                                                                                () =>
                                                                                    setHoveredPath(
                                                                                        null,
                                                                                    ),
                                                                            );
                                                                        }}
                                                                    >
                                                                        {groupPage.linkSelf ? (
                                                                            <Link
                                                                                to={
                                                                                    page.href
                                                                                }
                                                                                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                            >
                                                                                <span>
                                                                                    {groupPage
                                                                                        .label?.[
                                                                                        lang
                                                                                    ] ||
                                                                                        groupPage
                                                                                            .label
                                                                                            ?.en ||
                                                                                        t(
                                                                                            'nav.' +
                                                                                                page.key,
                                                                                        )}
                                                                                </span>
                                                                                <ChevronDown
                                                                                    className={`h-4 w-4 transition-opacity ${isPageHovered ? 'opacity-100' : 'opacity-50'}`}
                                                                                />
                                                                            </Link>
                                                                        ) : (
                                                                            <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                                                                <span>
                                                                                    {groupPage
                                                                                        .label?.[
                                                                                        lang
                                                                                    ] ||
                                                                                        groupPage
                                                                                            .label
                                                                                            ?.en ||
                                                                                        t(
                                                                                            'nav.' +
                                                                                                page.key,
                                                                                        )}
                                                                                </span>
                                                                                <ChevronDown
                                                                                    className={`h-4 w-4 transition-opacity ${isPageHovered ? 'opacity-100' : 'opacity-50'}`}
                                                                                />
                                                                            </button>
                                                                        )}
                                                                        {isPageHovered && (
                                                                            <div className="absolute left-[calc(100%+8px)] top-0">
                                                                                <DesktopFlyoutItems
                                                                                    items={
                                                                                        dropdownItems
                                                                                    }
                                                                                    entry={
                                                                                        {
                                                                                            pageKey:
                                                                                                pagePath,
                                                                                            label: groupPage.label,
                                                                                        } as HeaderEntry
                                                                                    }
                                                                                    lang={
                                                                                        lang
                                                                                    }
                                                                                    resolveDropdownItemLabel={
                                                                                        resolveDropdownItemLabel
                                                                                    }
                                                                                    hoveredPath={
                                                                                        hoveredPath
                                                                                    }
                                                                                    setHoveredPath={
                                                                                        setHoveredPath
                                                                                    }
                                                                                    hover={
                                                                                        hover
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </li>
                                                                );
                                                            }

                                                            return (
                                                                <li
                                                                    key={
                                                                        groupPage.pageKey
                                                                    }
                                                                    onMouseEnter={() => {
                                                                        hover.clear();
                                                                        setHoveredPath(
                                                                            subGroupPath,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Link
                                                                        to={
                                                                            page.href
                                                                        }
                                                                        className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                    >
                                                                        {groupPage
                                                                            .label?.[
                                                                            lang
                                                                        ] ||
                                                                            groupPage
                                                                                .label
                                                                                ?.en ||
                                                                            t(
                                                                                'nav.' +
                                                                                    page.key,
                                                                            )}
                                                                    </Link>
                                                                </li>
                                                            );
                                                        },
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                    </ul>
                </div>
            )}
        </div>
    );
}

function MobileGroupSection({
    group,
    lang,
    t,
    resolveLabel,
    resolveDropdownItemLabel,
    onClose,
    categoryTypesByPage,
}: {
    group: NavGroup;
    lang: string;
    t: (key: string) => string;
    resolveLabel: (label: string | LocalizedText | null | undefined) => string;
    resolveDropdownItemLabel: (
        entry: HeaderEntry,
        item: DropdownItemConfig,
    ) => string;
    onClose: () => void;
    categoryTypesByPage: Record<string, PublicCategoryType[]>;
}) {
    const resolveDropdownItems = (
        items: DropdownItemConfig[],
        pageKey: string,
    ): DropdownItemConfig[] => {
        const categoryTypes = categoryTypesByPage[pageKey] ?? [];

        const result = items.flatMap((item): DropdownItemConfig[] => {
            if (item.mode === 'categories') {
                return resolveCategoriesDropdownItems(
                    pageKey,
                    item.value,
                    categoryTypes,
                );
            }
            const resolvedChildren = item.children
                ? resolveDropdownItems(item.children, pageKey)
                : undefined;
            return [{ ...item, pageKey, children: resolvedChildren }];
        });

        const coveredValues = new Set(
            items
                .filter((i) => i.mode === 'categories' && i.value)
                .map((i) => i.value),
        );
        // Also skip types already referenced by explicit filter items
        for (const i of items) {
            if (i.mode === 'filter' && i.value.includes(':')) {
                coveredValues.add(i.value.split(':')[0]);
            }
        }
        // Strip 'static:' prefix so static types match dynamic ct.key
        for (const v of [...coveredValues]) {
            if (v.startsWith('static:')) coveredValues.add(v.slice(7));
        }
        if (!coveredValues.has('')) {
            for (const ct of categoryTypes) {
                if (coveredValues.has(ct.key)) continue;
                if (ct.values && ct.values.length > 0) {
                    for (const val of ct.values) {
                        result.push({
                            label: val.name as unknown as LocalizedText,
                            mode: 'filter' as const,
                            value: `${ct.key}:${val.key}`,
                            pageKey,
                        });
                    }
                }
            }
        }

        return result;
    };

    const resolveLinks = (links: DropdownItemConfig[]): DropdownItemConfig[] =>
        links.flatMap((link): DropdownItemConfig[] => {
            const pageKey = link.pageKey ?? '';
            if (link.mode === 'categories') {
                const categoryTypes = categoryTypesByPage[pageKey] ?? [];
                return resolveCategoriesDropdownItems(
                    pageKey,
                    link.value,
                    categoryTypes,
                );
            }
            const resolvedChildren = link.children
                ? resolveLinks(link.children)
                : undefined;
            return [{ ...link, children: resolvedChildren }];
        });

    return (
        <details className="group">
            <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-foreground">
                {resolveLabel(group.label) || group.key}
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-1 pb-2 pl-3">
                {group.pages.map((groupPage) => {
                    const page = getPage(groupPage.pageKey);
                    if (!page) return null;
                    const dropdownItems = groupPage.isDropdown
                        ? resolveDropdownItems(
                              groupPage.items,
                              groupPage.pageKey,
                          )
                        : [];

                    if (groupPage.isDropdown && dropdownItems.length > 0) {
                        return (
                            <details
                                key={groupPage.pageKey}
                                className="group/page"
                            >
                                <summary className="flex cursor-pointer items-center justify-between py-1 text-sm text-muted-foreground">
                                    {groupPage.label?.[lang] ||
                                        groupPage.label?.en ||
                                        t('nav.' + page.key)}
                                    <ChevronDown className="h-3 w-3 transition-transform group-open/page:rotate-180" />
                                </summary>
                                <div className="flex flex-col gap-0.5 pb-1 pl-3">
                                    {groupPage.linkSelf && (
                                        <Link
                                            to={page.href}
                                            onClick={onClose}
                                            className="py-1 text-xs text-primary"
                                        >
                                            {t('common.all')}
                                        </Link>
                                    )}
                                    <MobileNestedItems
                                        items={dropdownItems}
                                        entry={
                                            {
                                                pageKey: groupPage.pageKey,
                                                label: groupPage.label,
                                            } as HeaderEntry
                                        }
                                        onClose={onClose}
                                        resolveDropdownItemLabel={
                                            resolveDropdownItemLabel
                                        }
                                        lang={lang}
                                    />
                                </div>
                            </details>
                        );
                    }

                    return (
                        <Link
                            key={groupPage.pageKey}
                            to={page.href}
                            onClick={onClose}
                            className="py-1 text-sm text-muted-foreground"
                        >
                            {groupPage.label?.[lang] ||
                                groupPage.label?.en ||
                                t('nav.' + page.key)}
                        </Link>
                    );
                })}
                {group.links?.map((link, linkIdx) => {
                    const linkPageKey = link.pageKey ?? '';
                    const page = getPage(linkPageKey);
                    if (!page) return null;
                    const resolvedLinks = resolveLinks([link]);

                    return resolvedLinks.map((resolved, subIdx) => {
                        const resolvedPageKey = resolved.pageKey ?? linkPageKey;
                        const resolvedPage = getPage(resolvedPageKey);
                        if (!resolvedPage) return null;
                        const children = resolved.children ?? [];

                        if (children.length > 0) {
                            return (
                                <details
                                    key={`${linkIdx}-${subIdx}`}
                                    className="group/link"
                                >
                                    <summary className="flex cursor-pointer items-center justify-between py-1 text-sm text-muted-foreground">
                                        {resolveDropdownItemLabel(
                                            {
                                                pageKey: resolvedPageKey,
                                            } as HeaderEntry,
                                            resolved,
                                        )}
                                        <ChevronDown className="h-3 w-3 transition-transform group-open/link:rotate-180" />
                                    </summary>
                                    <div className="flex flex-col gap-0.5 pb-1 pl-3">
                                        <MobileNestedItems
                                            items={children}
                                            entry={
                                                {
                                                    pageKey: resolvedPageKey,
                                                    label: resolved.label,
                                                } as HeaderEntry
                                            }
                                            onClose={onClose}
                                            resolveDropdownItemLabel={
                                                resolveDropdownItemLabel
                                            }
                                            lang={lang}
                                        />
                                    </div>
                                </details>
                            );
                        }

                        return (
                            <Link
                                key={`${linkIdx}-${subIdx}`}
                                to={buildItemHref(
                                    resolvedPageKey,
                                    resolved,
                                    lang as 'en' | 'fr' | 'ar',
                                )}
                                onClick={onClose}
                                className="py-1 text-sm text-muted-foreground"
                            >
                                {resolveDropdownItemLabel(
                                    { pageKey: resolvedPageKey } as HeaderEntry,
                                    resolved,
                                )}
                            </Link>
                        );
                    });
                })}
                {group.groups
                    ?.filter((sg) => sg.enabled)
                    .map((subGroup) => (
                        <details key={subGroup.key} className="group/nested">
                            <summary className="flex cursor-pointer items-center justify-between py-1 text-xs font-semibold uppercase text-muted-foreground">
                                {resolveLabel(subGroup.label) || subGroup.key}
                                <ChevronDown className="h-3 w-3 transition-transform group-open/nested:rotate-180" />
                            </summary>
                            <div className="flex flex-col gap-0.5 pb-1 pl-3">
                                {subGroup.pages.map((groupPage) => {
                                    const page = getPage(groupPage.pageKey);
                                    if (!page) return null;
                                    return (
                                        <Link
                                            key={groupPage.pageKey}
                                            to={page.href}
                                            onClick={onClose}
                                            className="py-1 text-sm text-muted-foreground"
                                        >
                                            {groupPage.label?.[lang] ||
                                                groupPage.label?.en ||
                                                t('nav.' + page.key)}
                                        </Link>
                                    );
                                })}
                            </div>
                        </details>
                    ))}
            </div>
        </details>
    );
}

export function Navbar() {
    const [open, setOpen] = useState(false);
    const [openMoreSection, setOpenMoreSection] = useState<string | null>(null);
    const [topBarVisible, setTopBarVisible] = useState(true);
    const [hoveredPath, setHoveredPath] = useState<string | null>(null);
    const hover = useHoverDelay(150);
    const lastScrollY = useRef(0);
    const location = useLocation();
    const { t, lang } = useLanguage();
    const { data: user } = useAuthUser();

    const resolveLabel = (label: string | LocalizedText | null | undefined) => {
        if (!label) return '';
        if (typeof label === 'string') return label;
        return label[lang] ?? label.en ?? Object.values(label)[0] ?? '';
    };
    const resolvePageName = (
        entry: HeaderEntry,
        page: { key: string; label: string },
    ): string => resolveLabel(entry.label) || t('nav.' + page.key);
    const { settings, loading } = useSiteSettings();
    const { favorites } = useFavorites();

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;
            if (currentY > lastScrollY.current && currentY > 40) {
                setTopBarVisible(false);
            } else {
                setTopBarVisible(true);
            }
            lastScrollY.current = currentY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const { data: destinationCategories = [] } = useCategories('destinations');
    const { data: hotelCategories = [] } = useCategories('hotels');
    const { data: tourCategories = [] } = useCategories('tours');
    const { data: carCategories = [] } = useCategories('cars');
    const { data: eventCategories = [] } = useCategories('events');
    const { data: dealCategories = [] } = useCategories('deals');

    const { data: destinationCategoryTypes = [] } =
        useCategoryTypesPublic('destinations');
    const { data: hotelCategoryTypes = [] } = useCategoryTypesPublic('hotels');
    const { data: tourCategoryTypes = [] } = useCategoryTypesPublic('tours');
    const { data: carCategoryTypes = [] } = useCategoryTypesPublic('cars');
    const { data: eventCategoryTypes = [] } = useCategoryTypesPublic('events');
    const { data: dealCategoryTypes = [] } = useCategoryTypesPublic('deals');

    const isActiveSection = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    let navSettings: NavSettings = DEFAULT_NAV_SETTINGS;
    if (settings.content?.nav?.settings) {
        navSettings = settings.content.nav.settings;
    }

    const headerEntries = Array.isArray(navSettings.header)
        ? navSettings.header
        : [];
    const enabled = headerEntries.filter(
        (h) => h.enabled && getPage(h.pageKey),
    );
    const topbarEntries = enabled.filter((e) => e.placement === 'topbar');
    const topEntries = enabled.filter((e) => e.placement === 'top');
    const moreEntries = enabled.filter((e) => e.placement === 'more');

    const pagesInGroups = getPagesInGroups(navSettings.groups ?? []);
    const topEntriesFiltered = topEntries.filter(
        (e) => !pagesInGroups.has(e.pageKey),
    );
    const moreEntriesFiltered = moreEntries.filter(
        (e) => !pagesInGroups.has(e.pageKey),
    );

    const enabledGroups = (navSettings.groups ?? []).filter((g) => g.enabled);
    const topGroups = enabledGroups.filter((g) => g.placement === 'top');
    const moreGroups = enabledGroups.filter((g) => g.placement === 'more');

    const enabledLinks = (navSettings.links ?? []).filter((l) => l.enabled);
    const topLinks = enabledLinks.filter((l) => l.placement === 'top');
    const moreLinks = enabledLinks.filter((l) => l.placement === 'more');

    const categoriesByPage = useMemo(
        () => ({
            destinations: destinationCategories,
            hotels: hotelCategories,
            tours: tourCategories,
            cars: carCategories,
            events: eventCategories,
            deals: dealCategories,
        }),
        [
            destinationCategories,
            hotelCategories,
            tourCategories,
            carCategories,
            eventCategories,
            dealCategories,
        ],
    );

    const categoryTypesByPage = useMemo(
        () => ({
            destinations: destinationCategoryTypes,
            hotels: hotelCategoryTypes,
            tours: tourCategoryTypes,
            cars: carCategoryTypes,
            events: eventCategoryTypes,
            deals: dealCategoryTypes,
        }),
        [
            destinationCategoryTypes,
            hotelCategoryTypes,
            tourCategoryTypes,
            carCategoryTypes,
            eventCategoryTypes,
            dealCategoryTypes,
        ],
    );

    type CategoryPageKey = keyof typeof categoriesByPage;

    const resolveDropdownItemLabel = (
        entry: HeaderEntry,
        item: DropdownItemConfig,
    ): string => {
        const effectivePageKey = item.pageKey ?? entry.pageKey;
        if (item.mode === 'filter') {
            // Handle static filter format: "static:groupKey:optionKey"
            if (item.value.startsWith('static:')) {
                const parts = item.value.split(':');
                if (parts.length === 3) {
                    const [, groupKey, optionKey] = parts;
                    const group = getStaticFiltersForPage(
                        effectivePageKey,
                    ).find((g) => g.key === groupKey);
                    const opt = group?.options.find((o) => o.key === optionKey);
                    if (opt) {
                        return (
                            opt.label[lang as 'en' | 'fr' | 'ar'] ??
                            opt.label.en ??
                            optionKey
                        );
                    }
                }
            }
            // Handle dynamic format: "typeKey:valueKey"
            if (item.value.includes(':')) {
                const [typeKey, valueKey] = item.value.split(':');
                const categoryTypes =
                    categoryTypesByPage[
                        effectivePageKey as keyof typeof categoryTypesByPage
                    ] ?? [];
                const selectedType = categoryTypes.find(
                    (ct: PublicCategoryType) => ct.key === typeKey,
                );
                if (selectedType) {
                    const value = selectedType.values?.find(
                        (v) => v.key === valueKey,
                    );
                    if (value) {
                        return value.name[lang] ?? value.name.en ?? value.key;
                    }
                }
            }

            // Fallback to old format lookup
            const categories =
                categoriesByPage[effectivePageKey as CategoryPageKey] ?? [];
            const localizedCategoryLabel = getLocalizedCategoryLabelByKey(
                categories,
                item.value,
                lang,
            );

            if (localizedCategoryLabel) {
                return localizedCategoryLabel;
            }
        }

        return resolveLabel(item.label);
    };

    const resolveDropdownItems = (entry: HeaderEntry): DropdownItemConfig[] => {
        const categoryTypes =
            categoryTypesByPage[
                entry.pageKey as keyof typeof categoryTypesByPage
            ] ?? [];

        const result = entry.items.flatMap((item): DropdownItemConfig[] => {
            if (item.mode === 'categories') {
                return resolveCategoriesDropdownItems(
                    entry.pageKey,
                    item.value,
                    categoryTypes,
                );
            }

            const resolvedChildren = item.children
                ? resolveDropdownItems({ ...entry, items: item.children })
                : undefined;
            return [{ ...item, children: resolvedChildren }];
        });

        // Auto-append dynamic API categories if no "show all" item is present.
        // This ensures categories like "Formule repas" and "Équipements &
        // Ambiance" appear alongside the admin-configured static groups.
        const coveredValues = new Set(
            entry.items
                .filter((i) => i.mode === 'categories' && i.value)
                .map((i) => i.value),
        );
        // Also skip types already referenced by explicit filter items
        for (const i of entry.items) {
            if (i.mode === 'filter' && i.value.includes(':')) {
                coveredValues.add(i.value.split(':')[0]);
            }
        }
        // Strip 'static:' prefix so static types match dynamic ct.key
        for (const v of [...coveredValues]) {
            if (v.startsWith('static:')) coveredValues.add(v.slice(7));
        }
        if (!coveredValues.has('')) {
            for (const ct of categoryTypes) {
                if (coveredValues.has(ct.key)) continue;
                if (ct.values && ct.values.length > 0) {
                    for (const val of ct.values) {
                        result.push({
                            label: val.name as unknown as LocalizedText,
                            mode: 'filter' as const,
                            value: `${ct.key}:${val.key}`,
                            pageKey: entry.pageKey,
                        });
                    }
                }
            }
        }

        return result;
    };

    if (loading) {
        return (
            <header className="fixed left-0 right-0 top-0 z-50 bg-foreground text-primary-foreground shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="h-7 w-40 animate-pulse rounded" />
                    <div className="hidden items-center gap-2 lg:flex">
                        <div className="h-8 w-20 animate-pulse rounded" />
                        <div className="h-8 w-20 animate-pulse rounded" />
                        <div className="h-8 w-20 animate-pulse rounded" />
                        <div className="h-8 w-20 animate-pulse rounded" />
                    </div>
                    <div className="hidden items-center gap-2 md:flex">
                        <div className="h-8 w-8 animate-pulse rounded-full" />
                        <div className="h-8 w-20 animate-pulse rounded bg-muted/70" />
                        <div className="h-8 w-28 animate-pulse rounded bg-muted/70" />
                    </div>
                    <div className="h-6 w-6 animate-pulse rounded bg-muted/70 lg:hidden" />
                </div>
            </header>
        );
    }

    const accountLabel = user
        ? ['admin', 'superadmin', 'owner'].includes(user.role)
            ? t('nav.dashboard')
            : t('nav.profile')
        : t('nav.signin');

    const accountLink = user ? redirectAfterLogin(user.role) : '/login';

    return (
        <header className={`fixed left-0 right-0 top-0 z-50 bg-card shadow-sm`}>
            {/* Top Bar - Social, Phone, Blog, Sign In - hidden on mobile, hides on scroll */}
            <div
                className={`hidden overflow-hidden border-b border-primary-foreground/10 bg-foreground text-primary-foreground transition-all duration-300 ease-in-out lg:block ${
                    topBarVisible
                        ? 'max-h-10 opacity-100'
                        : 'max-h-0 border-b-0 opacity-0'
                }`}
            >
                <div className="container mx-auto flex h-8 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        {settings.socialLinks?.map((link, i) => {
                            const Icon =
                                SOCIAL_ICONS[link.label.toLowerCase()] || null;
                            if (!Icon) return null;
                            return (
                                <a
                                    key={i}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-6 w-6 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </a>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-primary-foreground">
                        {settings.phone && (
                            <a
                                href={`tel:${settings.phone.replace(/\D/g, '')}`}
                                className="flex items-center gap-1.5 transition-colors hover:text-secondary"
                            >
                                <Phone className="h-3 w-3" />
                                {settings.phone}
                            </a>
                        )}
                        {settings.phone2 && (
                            <a
                                href={`tel:${settings.phone2.replace(/\D/g, '')}`}
                                className="flex items-center gap-1.5 transition-colors hover:text-secondary"
                            >
                                <Phone className="h-3 w-3" />
                                {settings.phone2}
                            </a>
                        )}
                        {topbarEntries.map((entry) => {
                            const page = getPage(entry.pageKey);
                            if (!page) return null;
                            const displayName =
                                entry.label?.[lang] ??
                                entry.label?.en ??
                                t('nav.' + page.key);
                            return (
                                <Link
                                    key={entry.pageKey}
                                    to={page.href}
                                    className="font-medium transition-colors hover:text-secondary"
                                >
                                    {displayName}
                                </Link>
                            );
                        })}
                        <Link to={accountLink}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1 px-2 text-xs text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                            >
                                <User className="h-3 w-3" /> {accountLabel}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Nav - Logo, Links, Language, Favorites, User, Mobile Toggle */}
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="flex shrink-0 items-center gap-2">
                    <BrandLogo imageClassName="h-12 w-auto" />
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-1 lg:flex">
                    {topEntriesFiltered.map((entry) => {
                        const page = getPage(entry.pageKey);
                        if (!page) return null;
                        const dropdownItems = resolveDropdownItems(entry);

                        if (entry.isDropdown) {
                            const triggerPath = entry.pageKey;
                            const isDropdownHovered =
                                hoveredPath === triggerPath ||
                                hoveredPath?.startsWith(triggerPath + ':');

                            return (
                                <div
                                    key={entry.pageKey}
                                    className="relative"
                                    onMouseEnter={() => {
                                        hover.clear();
                                        setHoveredPath(triggerPath);
                                    }}
                                    onMouseLeave={() => {
                                        hover.schedule(() =>
                                            setHoveredPath(null),
                                        );
                                    }}
                                >
                                    {entry.linkSelf ? (
                                        <Link
                                            to={page.href}
                                            className="inline-flex h-10 items-center gap-1 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                                        >
                                            {resolvePageName(entry, page)}
                                            <ChevronDown
                                                className={`h-4 w-4 transition-opacity ${isDropdownHovered ? 'opacity-100' : 'opacity-50'}`}
                                            />
                                        </Link>
                                    ) : (
                                        <button className="inline-flex h-10 items-center gap-1 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                                            {resolvePageName(entry, page)}
                                            <ChevronDown
                                                className={`h-4 w-4 transition-opacity ${isDropdownHovered ? 'opacity-100' : 'opacity-50'}`}
                                            />
                                        </button>
                                    )}
                                    {isDropdownHovered && (
                                        <div className="absolute left-0 top-full -mt-1 pt-1">
                                            <DesktopFlyoutItems
                                                items={dropdownItems}
                                                entry={entry}
                                                lang={lang}
                                                resolveDropdownItemLabel={
                                                    resolveDropdownItemLabel
                                                }
                                                hoveredPath={hoveredPath}
                                                setHoveredPath={setHoveredPath}
                                                hover={hover}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        if (entry.pageKey === 'visa') {
                            return (
                                <Link key={entry.pageKey} to={page.href}>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                                    >
                                        <FileCheck className="h-4 w-4" />{' '}
                                        {resolvePageName(entry, page)}
                                    </Button>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={entry.pageKey}
                                to={page.href}
                                className={`inline-flex h-10 items-center px-3 text-sm font-medium transition-colors ${isActiveSection(page.href) ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                            >
                                {resolvePageName(entry, page)}
                            </Link>
                        );
                    })}

                    {topGroups.map((group) => (
                        <DesktopGroupDropdown
                            key={group.key}
                            group={group}
                            lang={lang}
                            t={t}
                            resolveLabel={resolveLabel}
                            resolveDropdownItemLabel={resolveDropdownItemLabel}
                            hoveredPath={hoveredPath}
                            setHoveredPath={setHoveredPath}
                            hover={hover}
                            categoryTypesByPage={categoryTypesByPage}
                        />
                    ))}

                    {topLinks.map((link) => {
                        const href = buildNavLinkHref(link, lang);
                        return (
                            <Link
                                key={link.key}
                                to={href}
                                className={`inline-flex h-10 items-center px-3 text-sm font-medium transition-colors ${isActiveSection(getPage(link.targetPageKey)?.href ?? '') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                            >
                                {link.label || link.key}
                            </Link>
                        );
                    })}

                    {(moreEntriesFiltered.length > 0 ||
                        moreGroups.length > 0 ||
                        moreLinks.length > 0) && (
                        <div
                            className="relative"
                            onMouseEnter={() => {
                                hover.clear();
                                setHoveredPath('__more__');
                            }}
                            onMouseLeave={() => {
                                hover.schedule(() => setHoveredPath(null));
                            }}
                        >
                            <button className="inline-flex h-10 items-center gap-1 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                                {t('nav.more') || 'More'}
                                <ChevronDown
                                    className={`h-4 w-4 transition-opacity ${hoveredPath === '__more__' ? 'opacity-100' : 'opacity-50'}`}
                                />
                            </button>
                            {hoveredPath === '__more__' && (
                                <div className="absolute left-0 top-full -mt-1 pt-1">
                                    <ul className="min-w-56 space-y-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                                        {moreEntriesFiltered.map((entry) => {
                                            const page = getPage(entry.pageKey);
                                            if (!page) return null;
                                            const dropdownItems =
                                                resolveDropdownItems(entry);
                                            const isExpanded =
                                                openMoreSection ===
                                                entry.pageKey;

                                            return (
                                                <li key={entry.pageKey}>
                                                    {entry.isDropdown &&
                                                    dropdownItems.length > 0 ? (
                                                        <div className="rounded-md border border-border/60 bg-background/40 shadow-lg">
                                                            <button
                                                                type="button"
                                                                aria-expanded={
                                                                    isExpanded
                                                                }
                                                                onClick={() =>
                                                                    setOpenMoreSection(
                                                                        isExpanded
                                                                            ? null
                                                                            : entry.pageKey,
                                                                    )
                                                                }
                                                                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                            >
                                                                <span>
                                                                    {resolvePageName(
                                                                        entry,
                                                                        page,
                                                                    )}
                                                                </span>
                                                                <ChevronDown
                                                                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : 'opacity-60'}`}
                                                                />
                                                            </button>
                                                            {isExpanded && (
                                                                <div className="px-2 pb-2">
                                                                    {entry.linkSelf && (
                                                                        <Link
                                                                            to={
                                                                                page.href
                                                                            }
                                                                            className="mb-1 block rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
                                                                        >
                                                                            {t(
                                                                                'common.all',
                                                                            )}{' '}
                                                                            →
                                                                        </Link>
                                                                    )}
                                                                    <MobileNestedItems
                                                                        items={
                                                                            dropdownItems
                                                                        }
                                                                        entry={
                                                                            entry
                                                                        }
                                                                        onClose={() => {
                                                                            setOpenMoreSection(
                                                                                null,
                                                                            );
                                                                            setHoveredPath(
                                                                                null,
                                                                            );
                                                                        }}
                                                                        resolveDropdownItemLabel={
                                                                            resolveDropdownItemLabel
                                                                        }
                                                                        lang={
                                                                            lang
                                                                        }
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : entry.pageKey ===
                                                      'visa' ? (
                                                        <Link
                                                            to={page.href}
                                                            className="block rounded-md px-3 py-2"
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="w-full gap-1.5 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                                                            >
                                                                <FileCheck className="h-4 w-4" />{' '}
                                                                {resolvePageName(
                                                                    entry,
                                                                    page,
                                                                )}
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            to={page.href}
                                                            className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                        >
                                                            {resolvePageName(
                                                                entry,
                                                                page,
                                                            )}
                                                        </Link>
                                                    )}
                                                </li>
                                            );
                                        })}
                                        {moreGroups.map((group) => (
                                            <li
                                                key={group.key}
                                                className="mt-1 border-t border-border/60 pt-1"
                                            >
                                                <div className="px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
                                                    {resolveLabel(
                                                        group.label,
                                                    ) || group.key}
                                                </div>
                                                <ul className="space-y-0.5">
                                                    {group.pages.map(
                                                        (groupPage) => {
                                                            const page =
                                                                getPage(
                                                                    groupPage.pageKey,
                                                                );
                                                            if (!page)
                                                                return null;
                                                            return (
                                                                <li
                                                                    key={
                                                                        groupPage.pageKey
                                                                    }
                                                                >
                                                                    <Link
                                                                        to={
                                                                            page.href
                                                                        }
                                                                        className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                    >
                                                                        {groupPage
                                                                            .label?.[
                                                                            lang
                                                                        ] ||
                                                                            groupPage
                                                                                .label
                                                                                ?.en ||
                                                                            t(
                                                                                'nav.' +
                                                                                    page.key,
                                                                            )}
                                                                    </Link>
                                                                </li>
                                                            );
                                                        },
                                                    )}
                                                    {group.links?.map(
                                                        (link, linkIdx) => {
                                                            const page =
                                                                getPage(
                                                                    link.pageKey ??
                                                                        '',
                                                                );
                                                            if (!page)
                                                                return null;
                                                            return (
                                                                <li
                                                                    key={`link-${linkIdx}`}
                                                                >
                                                                    <Link
                                                                        to={buildItemHref(
                                                                            link.pageKey ??
                                                                                '',
                                                                            link,
                                                                            lang as
                                                                                | 'en'
                                                                                | 'fr'
                                                                                | 'ar',
                                                                        )}
                                                                        className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                    >
                                                                        {resolveDropdownItemLabel(
                                                                            {
                                                                                pageKey:
                                                                                    link.pageKey ??
                                                                                    '',
                                                                            } as HeaderEntry,
                                                                            link,
                                                                        )}
                                                                    </Link>
                                                                </li>
                                                            );
                                                        },
                                                    )}
                                                </ul>
                                            </li>
                                        ))}
                                        {moreLinks.length > 0 && (
                                            <li className="mt-1 border-t border-border/60 pt-1">
                                                <ul className="space-y-0.5">
                                                    {moreLinks.map((link) => {
                                                        const href =
                                                            buildNavLinkHref(
                                                                link,
                                                                lang,
                                                            );
                                                        return (
                                                            <li key={link.key}>
                                                                <Link
                                                                    to={href}
                                                                    className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                >
                                                                    {link.label ||
                                                                        link.key}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="hidden items-center gap-2 md:flex">
                    <Link to="/promos?special=true">
                        <Button
                            size="sm"
                            className="relative gap-1.5 bg-secondary text-white shadow-md shadow-secondary/30 transition-all hover:bg-secondary/80 hover:shadow-lg hover:shadow-secondary/40"
                        >
                            <Star className="h-4 w-4 fill-current" />
                            <span className="hidden xl:inline">
                                {t('admin.promos.special') || 'Special Offers'}
                            </span>
                        </Button>
                    </Link>
                    <Link to="/favorites">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="relative gap-1.5"
                        >
                            <Heart className="h-4 w-4" />
                            {favorites.length > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                                    {favorites.length}
                                </span>
                            )}
                        </Button>
                    </Link>
                </div>

                {/* Mobile toggle */}
                <button
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                    aria-controls="mobile-navigation"
                    className="text-foreground lg:hidden"
                    onClick={() => setOpen(!open)}
                >
                    {open ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Menu className="h-6 w-6" />
                    )}
                </button>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        id="mobile-navigation"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="max-h-[80vh] overflow-hidden overflow-y-auto border-t border-border bg-card lg:hidden"
                    >
                        <div className="container mx-auto flex flex-col gap-1 px-4 py-4">
                            {/* Top entries shown first */}
                            {topEntriesFiltered.map((entry) => {
                                const page = getPage(entry.pageKey);
                                if (!page) return null;
                                const dropdownItems =
                                    resolveDropdownItems(entry);

                                if (entry.isDropdown) {
                                    return (
                                        <details
                                            key={entry.pageKey}
                                            className="group"
                                        >
                                            <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-foreground">
                                                {resolvePageName(entry, page)}
                                                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                            </summary>
                                            <div className="flex flex-col gap-1 pb-2 pl-3">
                                                {entry.linkSelf && (
                                                    <Link
                                                        to={page.href}
                                                        onClick={() =>
                                                            setOpen(false)
                                                        }
                                                        className="py-1 text-sm text-primary"
                                                    >
                                                        {t('common.all')}
                                                    </Link>
                                                )}
                                                <MobileNestedItems
                                                    items={dropdownItems}
                                                    entry={entry}
                                                    onClose={() =>
                                                        setOpen(false)
                                                    }
                                                    resolveDropdownItemLabel={
                                                        resolveDropdownItemLabel
                                                    }
                                                    lang={lang}
                                                />
                                            </div>
                                        </details>
                                    );
                                }

                                if (entry.pageKey === 'visa') {
                                    return (
                                        <Link
                                            key={entry.pageKey}
                                            to={page.href}
                                            onClick={() => setOpen(false)}
                                        >
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full gap-1.5 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                                            >
                                                <FileCheck className="h-4 w-4" />{' '}
                                                {resolvePageName(entry, page)}
                                            </Button>
                                        </Link>
                                    );
                                }

                                return (
                                    <Link
                                        key={entry.pageKey}
                                        to={page.href}
                                        onClick={() => setOpen(false)}
                                        className="py-2 text-sm font-medium text-foreground"
                                    >
                                        {resolvePageName(entry, page)}
                                    </Link>
                                );
                            })}

                            {/* Top groups */}
                            {topGroups.map((group) => (
                                <MobileGroupSection
                                    key={group.key}
                                    group={group}
                                    lang={lang}
                                    t={t}
                                    resolveLabel={resolveLabel}
                                    resolveDropdownItemLabel={
                                        resolveDropdownItemLabel
                                    }
                                    onClose={() => setOpen(false)}
                                    categoryTypesByPage={categoryTypesByPage}
                                />
                            ))}

                            {/* Top standalone links */}
                            {topLinks.map((link) => {
                                const href = buildNavLinkHref(link, lang);
                                return (
                                    <Link
                                        key={link.key}
                                        to={href}
                                        onClick={() => setOpen(false)}
                                        className="py-2 text-sm font-medium text-foreground"
                                    >
                                        {link.label || link.key}
                                    </Link>
                                );
                            })}

                            {/* More entries grouped under a single "More" collapsible on mobile */}
                            {(moreEntriesFiltered.length > 0 ||
                                moreGroups.length > 0 ||
                                moreLinks.length > 0) && (
                                <details className="group/main">
                                    <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-foreground">
                                        {t('nav.more')}
                                        <ChevronDown className="h-4 w-4 transition-transform group-open/main:rotate-180" />
                                    </summary>
                                    <div className="flex flex-col gap-2 pb-2 pl-3">
                                        {moreEntriesFiltered.map((entry) => {
                                            const page = getPage(entry.pageKey);
                                            if (!page) return null;
                                            const dropdownItems =
                                                resolveDropdownItems(entry);

                                            if (
                                                entry.isDropdown &&
                                                dropdownItems.length > 0
                                            ) {
                                                return (
                                                    <details
                                                        key={entry.pageKey}
                                                        className="group/sub"
                                                    >
                                                        <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-foreground">
                                                            {resolvePageName(
                                                                entry,
                                                                page,
                                                            )}
                                                            <ChevronDown className="h-4 w-4 transition-transform group-open/sub:rotate-180" />
                                                        </summary>
                                                        <div className="flex flex-col gap-1 pb-2 pl-3">
                                                            {entry.linkSelf && (
                                                                <Link
                                                                    to={
                                                                        page.href
                                                                    }
                                                                    onClick={() =>
                                                                        setOpen(
                                                                            false,
                                                                        )
                                                                    }
                                                                    className="py-1 text-sm text-primary"
                                                                >
                                                                    {t(
                                                                        'common.all',
                                                                    )}
                                                                </Link>
                                                            )}
                                                            <MobileNestedItems
                                                                items={
                                                                    dropdownItems
                                                                }
                                                                entry={entry}
                                                                onClose={() =>
                                                                    setOpen(
                                                                        false,
                                                                    )
                                                                }
                                                                resolveDropdownItemLabel={
                                                                    resolveDropdownItemLabel
                                                                }
                                                                lang={lang}
                                                            />
                                                        </div>
                                                    </details>
                                                );
                                            }

                                            if (entry.pageKey === 'visa') {
                                                return (
                                                    <Link
                                                        key={entry.pageKey}
                                                        to={page.href}
                                                        onClick={() =>
                                                            setOpen(false)
                                                        }
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="w-full gap-1.5 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                                                        >
                                                            <FileCheck className="h-4 w-4" />{' '}
                                                            {resolvePageName(
                                                                entry,
                                                                page,
                                                            )}
                                                        </Button>
                                                    </Link>
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={entry.pageKey}
                                                    to={page.href}
                                                    onClick={() =>
                                                        setOpen(false)
                                                    }
                                                    className="py-1 text-sm text-muted-foreground"
                                                >
                                                    {resolvePageName(
                                                        entry,
                                                        page,
                                                    )}
                                                </Link>
                                            );
                                        })}
                                        {moreGroups.map((group) => (
                                            <div
                                                key={group.key}
                                                className="mt-2 border-t border-border/60 pt-2"
                                            >
                                                <div className="px-1 py-1 text-xs font-semibold uppercase text-muted-foreground">
                                                    {resolveLabel(
                                                        group.label,
                                                    ) || group.key}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {group.pages.map(
                                                        (groupPage) => {
                                                            const page =
                                                                getPage(
                                                                    groupPage.pageKey,
                                                                );
                                                            if (!page)
                                                                return null;
                                                            return (
                                                                <Link
                                                                    key={
                                                                        groupPage.pageKey
                                                                    }
                                                                    to={
                                                                        page.href
                                                                    }
                                                                    onClick={() =>
                                                                        setOpen(
                                                                            false,
                                                                        )
                                                                    }
                                                                    className="py-1 text-sm text-muted-foreground"
                                                                >
                                                                    {groupPage
                                                                        .label?.[
                                                                        lang
                                                                    ] ||
                                                                        groupPage
                                                                            .label
                                                                            ?.en ||
                                                                        t(
                                                                            'nav.' +
                                                                                page.key,
                                                                        )}
                                                                </Link>
                                                            );
                                                        },
                                                    )}
                                                    {group.links?.map(
                                                        (link, linkIdx) => {
                                                            const page =
                                                                getPage(
                                                                    link.pageKey ??
                                                                        '',
                                                                );
                                                            if (!page)
                                                                return null;
                                                            return (
                                                                <Link
                                                                    key={`link-${linkIdx}`}
                                                                    to={buildItemHref(
                                                                        link.pageKey ??
                                                                            '',
                                                                        link,
                                                                        lang as
                                                                            | 'en'
                                                                            | 'fr'
                                                                            | 'ar',
                                                                    )}
                                                                    onClick={() =>
                                                                        setOpen(
                                                                            false,
                                                                        )
                                                                    }
                                                                    className="py-1 text-sm text-muted-foreground"
                                                                >
                                                                    {resolveDropdownItemLabel(
                                                                        {
                                                                            pageKey:
                                                                                link.pageKey ??
                                                                                '',
                                                                        } as HeaderEntry,
                                                                        link,
                                                                    )}
                                                                </Link>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {moreLinks.length > 0 && (
                                            <div className="mt-2 border-t border-border/60 pt-2">
                                                <div className="flex flex-col gap-1">
                                                    {moreLinks.map((link) => {
                                                        const href =
                                                            buildNavLinkHref(
                                                                link,
                                                                lang,
                                                            );
                                                        return (
                                                            <Link
                                                                key={link.key}
                                                                to={href}
                                                                onClick={() =>
                                                                    setOpen(
                                                                        false,
                                                                    )
                                                                }
                                                                className="py-1 text-sm text-muted-foreground"
                                                            >
                                                                {link.label ||
                                                                    link.key}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            )}

                            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                                <Link
                                    to="/promos?special=true"
                                    onClick={() => setOpen(false)}
                                >
                                    <Button
                                        size="sm"
                                        className="gap-1.5 bg-secondary text-white shadow-md shadow-secondary/30 transition-all hover:bg-secondary/80 hover:shadow-lg hover:shadow-secondary/40"
                                    >
                                        <Star className="h-4 w-4 fill-current" />
                                        {t('admin.promos.special') ||
                                            'Special Offers'}
                                    </Button>
                                </Link>
                                <Link
                                    to="/favorites"
                                    onClick={() => setOpen(false)}
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                    >
                                        <Heart className="h-4 w-4" />{' '}
                                        {favorites.length}
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Link
                                    to={accountLink}
                                    className="flex-1"
                                    onClick={() => setOpen(false)}
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        {accountLabel}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
