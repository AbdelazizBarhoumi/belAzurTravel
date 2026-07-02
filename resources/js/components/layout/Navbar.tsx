import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Heart, ChevronDown, ChevronRight, FileCheck, Phone } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { redirectAfterLogin } from '@/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import {
    FacebookWhiteIcon,
    InstagramWhiteIcon,
    TwitterWhiteIcon,
    LinkedinWhiteIcon,
    YoutubeWhiteIcon,
    TiktokWhiteIcon,
} from '@/components/ui/SocialIconsWhite';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useCategories, type PublicCategory } from '@/hooks/usePublicData';
import { useCategoryTypes, type CategoryType } from '@/hooks/useCategoryTypes';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getLocalizedCategoryLabelByKey } from '@/lib/categoryLabels';
import {
    type DropdownItemConfig,
    type HeaderEntry,
    getPage,
    buildItemHref,
    DEFAULT_NAV_SETTINGS,
    type NavSettings,
    type LocalizedText,
} from '@/lib/nav-config';

const SOCIAL_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    facebook: FacebookWhiteIcon,
    instagram: InstagramWhiteIcon,
    twitter: TwitterWhiteIcon,
    linkedin: LinkedinWhiteIcon,
    youtube: YoutubeWhiteIcon,
    tiktok: TiktokWhiteIcon,
};

function useHoverDelay(delay = 250) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clear = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);
    const schedule = useCallback((fn: () => void) => {
        clear();
        timerRef.current = setTimeout(fn, delay);
    }, [clear, delay]);
    useEffect(() => () => clear(), [clear]);
    return { schedule, clear };
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
    resolveDropdownItemLabel: (entry: HeaderEntry, item: DropdownItemConfig) => string;
    hoveredPath: string | null;
    setHoveredPath: (path: string | null) => void;
    hover: { schedule: (fn: () => void) => void; clear: () => void };
}) {
    return (
        <ul className="min-w-56 space-y-1 rounded-lg border border-border bg-card p-2 shadow-lg">
            {items.map((item, idx) => {
                const itemPath = `${entry.pageKey}:${idx}`;
                const hasChildren = item.children && item.children.length > 0;
                const isActive = hoveredPath?.startsWith(itemPath);

                return (
                    <li
                        key={idx}
                        className="relative"
                        onMouseEnter={() => {
                            if (hasChildren) {
                                hover.clear();
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
                            to={buildItemHref(entry.pageKey, item, lang)}
                            className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <span>{resolveDropdownItemLabel(entry, item)}</span>
                            {hasChildren && <ChevronRight className="h-4 w-4 opacity-50" />}
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
                                    resolveDropdownItemLabel={resolveDropdownItemLabel}
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
    depth = 0,
}: {
    items: DropdownItemConfig[];
    entry: HeaderEntry;
    onClose: () => void;
    resolveDropdownItemLabel: (entry: HeaderEntry, item: DropdownItemConfig) => string;
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
                                {resolveDropdownItemLabel(entry, item)}
                                <ChevronDown className="h-4 w-4 transition-transform group-open/nested:rotate-180" />
                            </summary>
                            <div className="flex flex-col gap-1 pb-1 pl-3">
                                <MobileNestedItems
                                    items={item.children!}
                                    entry={entry}
                                    onClose={onClose}
                                    resolveDropdownItemLabel={resolveDropdownItemLabel}
                                    depth={depth + 1}
                                />
                            </div>
                        </details>
                    );
                }

                return (
                    <Link
                        key={idx}
                        to={buildItemHref(entry.pageKey, item, 'en')}
                        onClick={onClose}
                        className="py-1 text-sm text-muted-foreground"
                    >
                        {resolveDropdownItemLabel(entry, item)}
                    </Link>
                );
            })}
        </>
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
    const isHome = location.pathname === '/';
    const { t, lang } = useLanguage();
    const { data: user } = useAuthUser();

    const resolveLabel = (label: string | LocalizedText | null | undefined) => {
        if (!label) return '';
        if (typeof label === 'string') return label;
        return label[lang] ?? label.en ?? Object.values(label)[0] ?? '';
    };
    const resolvePageName = (entry: HeaderEntry, page: { key: string; label: string }): string =>
        resolveLabel(entry.label) || t('nav.' + page.key);
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

    const { data: destinationCategoryTypes = [] } = useCategoryTypes('destinations');
    const { data: hotelCategoryTypes = [] } = useCategoryTypes('hotels');
    const { data: tourCategoryTypes = [] } = useCategoryTypes('tours');
    const { data: carCategoryTypes = [] } = useCategoryTypes('cars');
    const { data: eventCategoryTypes = [] } = useCategoryTypes('events');
    const { data: dealCategoryTypes = [] } = useCategoryTypes('deals');

    const isActiveSection = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    let navSettings: NavSettings = DEFAULT_NAV_SETTINGS;
    if (settings.content?.nav?.settings) {
        navSettings = settings.content.nav.settings;
    }

    const enabled = navSettings.header.filter(
        (h) => h.enabled && getPage(h.pageKey),
    );
    const topbarEntries = enabled.filter((e) => e.placement === 'topbar');
    const topEntries = enabled.filter((e) => e.placement === 'top');
    const moreEntries = enabled.filter((e) => e.placement === 'more');

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
        if (item.mode === 'filter') {
            // Handle new format: "typeKey:valueKey"
            if (item.value.includes(':')) {
                const [typeKey, valueKey] = item.value.split(':');
                const categoryTypes =
                    categoryTypesByPage[entry.pageKey as keyof typeof categoryTypesByPage] ?? [];
                const selectedType = categoryTypes.find(
                    (ct: CategoryType) => ct.key === typeKey,
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
                categoriesByPage[entry.pageKey as CategoryPageKey] ?? [];
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

    const resolveDropdownItems = (entry: HeaderEntry): DropdownItemConfig[] =>
        entry.items.flatMap((item): DropdownItemConfig[] => {
            if (item.mode === 'categories' && item.value) {
                // item.value stores the category type key
                const categoryTypes =
                    categoryTypesByPage[entry.pageKey as keyof typeof categoryTypesByPage] ?? [];
                const selectedType = categoryTypes.find(
                    (ct: CategoryType) => ct.key === item.value,
                );

                if (selectedType && selectedType.values) {
                    return selectedType.values.map((val) => ({
                        label: val.name as unknown as LocalizedText,
                        mode: 'filter' as const,
                        value: `${selectedType.key}:${val.key}`,
                    }));
                }
            }

            const resolvedChildren = item.children
                ? resolveDropdownItems({ ...entry, items: item.children })
                : undefined;
            return [{ ...item, children: resolvedChildren }];
        });

    if (loading) {
        return (
            <header
                className="fixed left-0 right-0 top-0 z-50 bg-foreground text-primary-foreground shadow-sm"
            >
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
        <header
            className={`fixed left-0 right-0 top-0 z-50 bg-card shadow-sm`}
        >
            {/* Top Bar - Social, Phone, Blog, Sign In - hidden on mobile, hides on scroll */}
            <div
                className={`hidden lg:block bg-foreground text-primary-foreground border-b border-primary-foreground/10 transition-all duration-300 ease-in-out overflow-hidden ${
                    topBarVisible ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0 border-b-0'
                }`}
            >
                <div className="container mx-auto flex h-8 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        {settings.socialLinks?.map((link, i) => {
                            const Icon = SOCIAL_ICONS[link.label.toLowerCase()] || null;
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

                    <div className="flex items-center gap-4 text-xs text-primary-foreground/60">
                        {settings.phone && (
                            <a
                                href={`tel:${settings.phone.replace(/\D/g, '')}`}
                                className="flex items-center gap-1.5 hover:text-secondary transition-colors"
                            >
                                <Phone className="h-3 w-3" />
                                {settings.phone}
                            </a>
                        )}
                        {settings.phone2 && (
                            <a
                                href={`tel:${settings.phone2.replace(/\D/g, '')}`}
                                className="flex items-center gap-1.5 hover:text-secondary transition-colors"
                            >
                                <Phone className="h-3 w-3" />
                                {settings.phone2}
                            </a>
                        )}
                        {topbarEntries.map((entry) => {
                            const page = getPage(entry.pageKey);
                            if (!page) return null;
                            const displayName = entry.label?.[lang] ?? entry.label?.en ?? t('nav.' + page.key);
                            return (
                                <Link
                                    key={entry.pageKey}
                                    to={page.href}
                                    className="font-medium hover:text-secondary transition-colors"
                                >
                                    {displayName}
                                </Link>
                            );
                        })}
                        <Link to={accountLink}>
                            <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10">
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
                    {topEntries.map((entry) => {
                        const page = getPage(entry.pageKey);
                        if (!page) return null;
                        const dropdownItems = resolveDropdownItems(entry);

                        if (entry.isDropdown) {
                            const triggerPath = entry.pageKey;
                            const isDropdownHovered = hoveredPath === triggerPath || hoveredPath?.startsWith(triggerPath + ':');

                            return (
                                <div
                                    key={entry.pageKey}
                                    className="relative"
                                    onMouseEnter={() => {
                                        hover.clear();
                                        setHoveredPath(triggerPath);
                                    }}
                                    onMouseLeave={() => {
                                        hover.schedule(() => setHoveredPath(null));
                                    }}
                                >
                                    {entry.linkSelf ? (
                                        <Link
                                            to={page.href}
                                            className="inline-flex h-10 items-center gap-1 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                                        >
                                            {resolvePageName(entry, page)}
                                            <ChevronDown className={`h-4 w-4 transition-opacity ${isDropdownHovered ? 'opacity-100' : 'opacity-50'}`} />
                                        </Link>
                                    ) : (
                                        <button className="inline-flex h-10 items-center gap-1 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                                            {resolvePageName(entry, page)}
                                            <ChevronDown className={`h-4 w-4 transition-opacity ${isDropdownHovered ? 'opacity-100' : 'opacity-50'}`} />
                                        </button>
                                    )}
                                    {isDropdownHovered && (
                                        <div className="absolute left-0 top-full -mt-1 pt-1">
                                            <DesktopFlyoutItems
                                                items={dropdownItems}
                                                entry={entry}
                                                lang={lang}
                                                resolveDropdownItemLabel={resolveDropdownItemLabel}
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
                                    <Button size="sm" variant="outline" className="gap-1.5 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                                        <FileCheck className="h-4 w-4" /> {resolvePageName(entry, page)}
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

                    {moreEntries.length > 0 && (
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
                                <ChevronDown className={`h-4 w-4 transition-opacity ${hoveredPath === '__more__' ? 'opacity-100' : 'opacity-50'}`} />
                            </button>
                            {hoveredPath === '__more__' && (
                                <div className="absolute left-0 top-full -mt-1 pt-1">
                                    <ul className="min-w-56 space-y-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                                        {moreEntries.map((entry) => {
                                            const page = getPage(entry.pageKey);
                                            if (!page) return null;
                                            const dropdownItems = resolveDropdownItems(entry);
                                            const isExpanded = openMoreSection === entry.pageKey;

                                            return (
                                                <li key={entry.pageKey}>
                                                    {entry.isDropdown && dropdownItems.length > 0 ? (
                                                        <div className="rounded-md border border-border/60 bg-background/40">
                                                            <button
                                                                type="button"
                                                                aria-expanded={isExpanded}
                                                                onClick={() =>
                                                                    setOpenMoreSection(isExpanded ? null : entry.pageKey)
                                                                }
                                                                 className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                            >
                                                                <span>{resolvePageName(entry, page)}</span>
                                                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : 'opacity-60'}`} />
                                                            </button>
                                                            {isExpanded && (
                                                                <div className="px-2 pb-2">
                                                                    {entry.linkSelf && (
                                                                        <Link
                                                                            to={page.href}
                                                                            className="mb-1 block rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
                                                                        >
                                                                            {t('common.all')} →
                                                                        </Link>
                                                                    )}
                                                                    <MobileNestedItems
                                                                        items={dropdownItems}
                                                                        entry={entry}
                                                                        onClose={() => {
                                                                            setOpenMoreSection(null);
                                                                            setHoveredPath(null);
                                                                        }}
                                                                        resolveDropdownItemLabel={resolveDropdownItemLabel}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : entry.pageKey === 'visa' ? (
                                                        <Link to={page.href} className="block rounded-md px-3 py-2">
                                                            <Button size="sm" variant="outline" className="w-full gap-1.5 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                                                                <FileCheck className="h-4 w-4" /> {resolvePageName(entry, page)}
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            to={page.href}
                                                            className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                        >
                                                            {resolvePageName(entry, page)}
                                                        </Link>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="hidden items-center gap-2 md:flex">
                    <LanguageSwitcher />
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
                            {topEntries.map((entry) => {
                                const page = getPage(entry.pageKey);
                                if (!page) return null;
                                const dropdownItems = resolveDropdownItems(entry);

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
                                                        onClick={() => setOpen(false)}
                                                        className="py-1 text-sm text-primary"
                                                    >
                                                        {t('common.all')}
                                                    </Link>
                                                )}
                                                <MobileNestedItems
                                                    items={dropdownItems}
                                                    entry={entry}
                                                    onClose={() => setOpen(false)}
                                                    resolveDropdownItemLabel={resolveDropdownItemLabel}
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
                                            <Button size="sm" variant="outline" className="w-full gap-1.5 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                                                <FileCheck className="h-4 w-4" /> {resolvePageName(entry, page)}
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

                            {/* More entries grouped under a single "More" collapsible on mobile */}
                            {moreEntries.length > 0 && (
                                <details className="group/main">
                                    <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-foreground">
                                        {t('nav.more')}
                                        <ChevronDown className="h-4 w-4 transition-transform group-open/main:rotate-180" />
                                    </summary>
                                    <div className="flex flex-col gap-2 pb-2 pl-3">
                                        {moreEntries.map((entry) => {
                                            const page = getPage(entry.pageKey);
                                            if (!page) return null;
                                            const dropdownItems = resolveDropdownItems(entry);

                                            if (entry.isDropdown && dropdownItems.length > 0) {
                                                return (
                                                    <details
                                                        key={entry.pageKey}
                                                        className="group/sub"
                                                    >
                                    <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-foreground">
                                                            {resolvePageName(entry, page)}
                                                            <ChevronDown className="h-4 w-4 transition-transform group-open/sub:rotate-180" />
                                                        </summary>
                                                        <div className="flex flex-col gap-1 pb-2 pl-3">
                                                            {entry.linkSelf && (
                                                                <Link
                                                                    to={page.href}
                                                                    onClick={() => setOpen(false)}
                                                                    className="py-1 text-sm text-primary"
                                                                >
                                                                    {t('common.all')}
                                                                </Link>
                                                            )}
                                                            <MobileNestedItems
                                                                items={dropdownItems}
                                                                entry={entry}
                                                                onClose={() => setOpen(false)}
                                                                resolveDropdownItemLabel={resolveDropdownItemLabel}
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
                                                        <Button size="sm" variant="outline" className="w-full gap-1.5 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                                                            <FileCheck className="h-4 w-4" /> {resolvePageName(entry, page)}
                                                        </Button>
                                                    </Link>
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={entry.pageKey}
                                                    to={page.href}
                                                    onClick={() => setOpen(false)}
                                                    className="py-1 text-sm text-muted-foreground"
                                                >
                                                    {resolvePageName(entry, page)}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </details>
                            )}

                            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                                <LanguageSwitcher />
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
