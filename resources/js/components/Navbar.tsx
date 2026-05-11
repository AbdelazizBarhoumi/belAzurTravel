import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Plane, User, Heart, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
            { labelKey: 'cat.luxury', href: '/hotels?cat=Luxury' },
            { labelKey: 'cat.boutique', href: '/hotels?cat=Boutique' },
            { labelKey: 'cat.resorts', href: '/hotels?cat=Resorts' },
            { labelKey: 'cat.budget', href: '/hotels?cat=Budget' },
            { labelKey: 'cat.family', href: '/hotels?cat=Family' },
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
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link to="/" className="flex shrink-0 items-center gap-2">
                    <Plane className="h-6 w-6 text-primary" />
                    <span className="font-serif text-xl font-bold text-foreground">
                        Voyageur
                    </span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-1 lg:flex">
                    <NavDropdown
                        labelKey="nav.destinations"
                        href="/destinations"
                        items={destDropdown.items}
                    />
                    <NavDropdown
                        labelKey="nav.hotels"
                        href="/hotels"
                        items={hotelDropdown.items}
                    />

                    {simpleLinks.map((l) => (
                        <Link
                            key={l.href}
                            to={l.href}
                            className="inline-flex h-10 items-center px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            {t(l.labelKey)}
                        </Link>
                    ))}

                    <NavDropdown
                        labelKey="nav.more"
                        href="#"
                        items={moreDropdown.items}
                        isPlusButton={true}
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
                    <Link to="/register">
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {t('nav.start')}
                        </Button>
                    </Link>
                </div>

                {/* Mobile toggle */}
                <button
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
                                        {favorites.length}
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
                                <Link
                                    to="/register"
                                    className="flex-1"
                                    onClick={() => setOpen(false)}
                                >
                                    <Button className="w-full bg-primary text-primary-foreground">
                                        {t('nav.start')}
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
