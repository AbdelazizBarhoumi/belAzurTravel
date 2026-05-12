import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Heart, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NavDropdown } from '@/components/NavDropdown';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface DropdownGroup {
    labelKey: string;
    href: string;
    items: { labelKey: string; href: string }[];
}

export function Navbar() {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === '/';
    const { t } = useLanguage();
    const { favorites } = useFavorites();

    const isActiveSection = (path: string) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    const destDropdown: DropdownGroup = {
        labelKey: 'nav.destinations',
        href: '/destinations',
        items: [
            { labelKey: 'cat.beach', href: '/destinations?cat=Beach' },
            { labelKey: 'cat.city', href: '/destinations?cat=City' },
            { labelKey: 'cat.nature', href: '/destinations?cat=Nature' },
            { labelKey: 'cat.luxury', href: '/destinations?cat=Luxury' },
            { labelKey: 'cat.adventure', href: '/destinations?cat=Adventure' },
        ],
    };

    const hotelDropdown: DropdownGroup = {
        labelKey: 'nav.hotels',
        href: '/hotels',
        items: [
            { labelKey: 'search.options.fiveStar', href: '/hotels?stars=5' },
            { labelKey: 'search.options.fourStar', href: '/hotels?stars=4' },
            { labelKey: 'search.options.threeStar', href: '/hotels?stars=3' },
        ],
    };

    const moreDropdown: DropdownGroup = {
        labelKey: 'nav.more',
        href: '#',
        items: [
            { labelKey: 'nav.cars', href: '/cars' },
            { labelKey: 'nav.flights', href: '/flights' },
            { labelKey: 'nav.promos', href: '/promos' },
            { labelKey: 'nav.team', href: '/team' },
            { labelKey: 'nav.contact', href: '/contact' },
            { labelKey: 'nav.legal', href: '/legal' },
        ],
    };

    const simpleLinks = [
        { labelKey: 'nav.design', href: '/design-trip' },
        { labelKey: 'nav.tours', href: '/tours' },
        { labelKey: 'nav.deals', href: '/deals' },
        { labelKey: 'nav.gallery', href: '/gallery' },
        { labelKey: 'nav.events', href: '/events' },
        { labelKey: 'nav.blog', href: '/blog' },
    ];

    return (
        <header
            className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${isHome ? 'glass' : 'bg-card shadow-sm'}`}
        >
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg"
            >
                Skip to main content
            </a>
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="flex shrink-0 items-center gap-2">
                    <BrandLogo imageClassName="h-7 w-auto" />
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-1 lg:flex">
                    <NavDropdown
                        labelKey="nav.destinations"
                        href="/destinations"
                        items={destDropdown.items}
                        isActive={isActiveSection('/destinations')}
                    />
                    <NavDropdown
                        labelKey="nav.hotels"
                        href="/hotels"
                        items={hotelDropdown.items}
                        isActive={isActiveSection('/hotels')}
                    />

                    {simpleLinks.map((l) => (
                        <Link
                            key={l.href}
                            to={l.href}
                            aria-current={isActiveSection(l.href) ? 'page' : undefined}
                            className={`inline-flex h-10 items-center px-3 text-sm font-medium transition-colors hover:text-primary ${isActiveSection(l.href) ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                            {t(l.labelKey)}
                        </Link>
                    ))}

                    <NavDropdown
                        labelKey="nav.more"
                        href="#"
                        items={moreDropdown.items}
                        isPlusButton={true}
                        hoverOnly={true}
                    />
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
                    <Link to="/login">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <User className="h-4 w-4" /> {t('nav.signin')}
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
                            {[destDropdown, hotelDropdown].map((d) => (
                                <details key={d.labelKey} className="group">
                                    <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-foreground">
                                        {t(d.labelKey)}
                                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                    </summary>
                                    <div className="flex flex-col gap-1 pb-2 pl-3">
                                        <Link
                                            to={d.href}
                                            onClick={() => setOpen(false)}
                                            className="py-1 text-sm text-primary"
                                        >
                                            {t('common.all')}
                                        </Link>
                                        {d.items.map((it) => (
                                            <Link
                                                key={it.href}
                                                to={it.href}
                                                onClick={() => setOpen(false)}
                                                className="py-1 text-sm text-muted-foreground"
                                            >
                                                {t(it.labelKey)}
                                            </Link>
                                        ))}
                                    </div>
                                </details>
                            ))}
                            {simpleLinks.map((l) => (
                                <Link
                                    key={l.href}
                                    to={l.href}
                                    onClick={() => setOpen(false)}
                                    className="py-2 text-sm font-medium text-foreground"
                                >
                                    {t(l.labelKey)}
                                </Link>
                            ))}
                            <details className="group">
                                <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-foreground">
                                    + {t(moreDropdown.labelKey)}
                                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="flex flex-col gap-1 pb-2 pl-3">
                                    {moreDropdown.items.map((it) => (
                                        <Link
                                            key={it.href}
                                            to={it.href}
                                            onClick={() => setOpen(false)}
                                            className="py-1 text-sm text-muted-foreground"
                                        >
                                            {t(it.labelKey)}
                                        </Link>
                                    ))}
                                </div>
                            </details>
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
                                        {favorites.length > 0 && (
                                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                                                {favorites.length}
                                            </span>
                                        )}
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Link
                                    to="/login"
                                    className="flex-1"
                                    onClick={() => setOpen(false)}
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        {t('nav.signin')}
                                    </Button>
                                </Link>
                                <Link to="/design-trip" className="flex-1" onClick={() => setOpen(false)}>
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
