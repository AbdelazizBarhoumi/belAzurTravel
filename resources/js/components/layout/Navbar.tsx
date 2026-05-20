import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Heart, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { redirectAfterLogin } from '@/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useCategories, type PublicCategory } from '@/hooks/usePublicData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
    type DropdownItemConfig,
    type HeaderEntry,
    getPage,
    buildItemHref,
    DEFAULT_NAV_SETTINGS,
    type NavSettings,
} from '@/lib/nav-config';

type LocalizedText = Record<string, string>;

export function Navbar() {
    const [open, setOpen] = useState(false);
    const [openMoreSection, setOpenMoreSection] = useState<string | null>(null);
    const location = useLocation();
    const isHome = location.pathname === '/';
    const { t, lang } = useLanguage();
    const { data: user } = useAuthUser();

    const resolveLabel = (label: string | LocalizedText | null | undefined) => {
        if (!label) return '';
        if (typeof label === 'string') return label;
        // If it's a localized object, resolve based on current lang
        return label[lang] ?? label.en ?? Object.values(label)[0] ?? '';
    };
    const { settings, loading } = useSiteSettings();
    const { favorites } = useFavorites();

    const { data: destinationCategories = [] } = useCategories('destinations');
    const { data: hotelCategories = [] } = useCategories('hotels');
    const { data: tourCategories = [] } = useCategories('tours');
    const { data: carCategories = [] } = useCategories('cars');
    const { data: eventCategories = [] } = useCategories('events');
    const { data: dealCategories = [] } = useCategories('deals');
    const { data: blogCategories = [] } = useCategories('blog');

    const isActiveSection = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    // Get nav settings from database or defaults
    let navSettings: NavSettings = DEFAULT_NAV_SETTINGS;
    if (settings.content?.nav?.settings) {
        navSettings = settings.content.nav.settings;
    }

    const enabled = navSettings.header.filter(
        (h) => h.enabled && getPage(h.pageKey),
    );
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
            blog: blogCategories,
        }),
        [
            destinationCategories,
            hotelCategories,
            tourCategories,
            carCategories,
            eventCategories,
            dealCategories,
            blogCategories,
        ],
    );

    type CategoryPageKey = keyof typeof categoriesByPage;

    const resolveDropdownItems = (entry: HeaderEntry): DropdownItemConfig[] =>
        entry.items.flatMap((item) => {
            if (item.mode !== 'categories') {
                return [item];
            }

            const categories =
                categoriesByPage[entry.pageKey as CategoryPageKey] ?? [];

            return categories.map((category: PublicCategory) => ({
                label: category.name,
                mode: 'filter' as const,
                value: category.key,
            }));
        });

    if (loading) {
        return (
            <header
                className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
                    isHome
                        ? 'bg-gradient-to-b from-black/30 to-transparent'
                        : 'bg-card shadow-sm'
                }`}
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
        ? user.role === 'admin' || user.role === 'assistant'
            ? t('nav.dashboard')
            : t('nav.profile')
        : t('nav.signin');

    const accountLink = user ? redirectAfterLogin(user.role) : '/login';

    return (
        <header
            className={`fixed left-0 right-0 top-0 z-50 ${isHome ? 'glass' : 'bg-card shadow-sm'}`}
        >
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="flex shrink-0 items-center gap-2">
                    <BrandLogo imageClassName="h-7 w-auto" />
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-1 lg:flex">
                    {topEntries.map((entry) => {
                        const page = getPage(entry.pageKey);
                        if (!page) return null;
                        const dropdownItems = resolveDropdownItems(entry);

                        if (entry.isDropdown) {
                            return (
                                <div
                                    key={entry.pageKey}
                                    className="group relative"
                                >
                                    <button className="inline-flex h-10 items-center gap-1 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                                        {t(`nav.${page.key}`)}
                                        <ChevronDown className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                                    </button>
                                    <div className="absolute left-0 top-full hidden pt-1 group-hover:block">
                                        <ul className="min-w-56 space-y-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                                            {entry.linkSelf && (
                                                <li>
                                                    <Link
                                                        to={page.href}
                                                        className="block rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
                                                    >
                                                        {t('common.all')} →
                                                    </Link>
                                                </li>
                                            )}
                                            {dropdownItems.map((it, i) => (
                                                <li key={i}>
                                                    <Link
                                                        to={buildItemHref(
                                                            entry.pageKey,
                                                            it,
                                                        )}
                                                        className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                    >
                                                        {resolveLabel(it.label)}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={entry.pageKey}
                                to={page.href}
                                className={`inline-flex h-10 items-center px-3 text-sm font-medium transition-colors ${isActiveSection(page.href) ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                            >
                                {t(`nav.${page.key}`)}
                            </Link>
                        );
                    })}

                    {moreEntries.length > 0 && (
                        <div className="group relative">
                            <button className="inline-flex h-10 items-center gap-1 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                                {t('nav.more') || 'More'}
                                <ChevronDown className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                            </button>
                            <div className="absolute left-0 top-full hidden pt-1 group-hover:block">
                                <ul className="min-w-56 space-y-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                                    {moreEntries.map((entry) => {
                                        const page = getPage(entry.pageKey);
                                        if (!page) return null;
                                        const dropdownItems = resolveDropdownItems(entry);
                                        const isExpanded =
                                            openMoreSection === entry.pageKey;
                                        return (
                                            <li key={entry.pageKey}>
                                                {entry.isDropdown &&
                                                dropdownItems.length > 0 ? (
                                                    <div className="rounded-md border border-border/60 bg-background/40">
                                                        <button
                                                            type="button"
                                                            aria-expanded={isExpanded}
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
                                                                {t(
                                                                    `nav.${page.key}`,
                                                                )}
                                                            </span>
                                                            <ChevronDown
                                                                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : 'opacity-60'}`}
                                                            />
                                                        </button>

                                                        {isExpanded && (
                                                            <div className="px-2 pb-2">
                                                                <Link
                                                                    to={page.href}
                                                                    className="mb-1 block rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
                                                                >
                                                                    {t(
                                                                        'common.all',
                                                                    )}{' '}
                                                                    →
                                                                </Link>
                                                                <ul className="space-y-1 border-l border-border pl-3">
                                                                    {dropdownItems.map(
                                                                        (it, i) => (
                                                                            <li key={i}>
                                                                                <Link
                                                                                    to={buildItemHref(
                                                                                        entry.pageKey,
                                                                                        it,
                                                                                    )}
                                                                                    className="block rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                                >
                                                                                    {resolveLabel(
                                                                                        it.label,
                                                                                    )}
                                                                                </Link>
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link
                                                        to={page.href}
                                                        className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                    >
                                                        {t(`nav.${page.key}`)}
                                                    </Link>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
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

                    <Link to={accountLink}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <User className="h-4 w-4" /> {accountLabel}
                        </Button>
                    </Link>

                    <Link to="/design-trip">
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {t('nav.design')}
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
                                                {t(`nav.${page.key}`)}
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
                                                {dropdownItems.map((it, i) => (
                                                    <Link
                                                        key={i}
                                                        to={buildItemHref(entry.pageKey, it)}
                                                        onClick={() => setOpen(false)}
                                                        className="py-1 text-sm text-muted-foreground"
                                                    >
                                                        {resolveLabel(it.label)}
                                                    </Link>
                                                ))}
                                            </div>
                                        </details>
                                    );
                                }

                                return (
                                    <Link
                                        key={entry.pageKey}
                                        to={page.href}
                                        onClick={() => setOpen(false)}
                                        className="py-2 text-sm font-medium text-foreground"
                                    >
                                        {page.label}
                                    </Link>
                                );
                            })}

                            {/* More entries grouped under a single "More" collapsible on mobile */}
                            {moreEntries.length > 0 && (
                                <details className="group/main">
                                    <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-foreground">
                                        {t('nav.more') /* translation key for More */}
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
                                                            {t(`nav.${page.key}`)}
                                                            <ChevronDown className="h-4 w-4 transition-transform group-open/sub:rotate-180" />
                                                        </summary>
                                                        <div className="flex flex-col gap-1 pb-2 pl-3">
                                                            <Link
                                                                to={page.href}
                                                                onClick={() => setOpen(false)}
                                                                className="py-1 text-sm text-primary"
                                                            >
                                                                {t('common.all')}
                                                            </Link>
                                                            {dropdownItems.map((it, i) => (
                                                                <Link
                                                                    key={i}
                                                                    to={buildItemHref(entry.pageKey, it)}
                                                                    onClick={() => setOpen(false)}
                                                                    className="py-1 text-sm text-muted-foreground"
                                                                >
                                                                    {resolveLabel(it.label)}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </details>
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={entry.pageKey}
                                                    to={page.href}
                                                    onClick={() => setOpen(false)}
                                                    className="py-1 text-sm text-muted-foreground"
                                                >
                                                    {t(`nav.${page.key}`)}
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
                                <Link
                                    to="/design-trip"
                                    className="flex-1"
                                    onClick={() => setOpen(false)}
                                >
                                    <Button className="w-full bg-primary text-primary-foreground">
                                        {t('nav.design')}
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
