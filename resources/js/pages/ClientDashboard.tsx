import { motion } from 'framer-motion';
import {
    Plane,
    MapPin,
    Hotel,
    Calendar,
    CreditCard,
    User,
    LogOut,
    Settings,
    Heart,
    Clock,
    Star,
    ChevronRight,
    ChevronLeft,
    Bell,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { cn } from '@/lib/utils';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const bookings = [
    {
        id: 1,
        destination: {
            fr: 'Santorin, Grèce',
            ar: 'سانتوريني، اليونان',
            en: 'Santorini, Greece',
        },
        hotel: {
            fr: 'Sunset Paradise Resort',
            ar: 'منتجع صن ست بارادايس',
            en: 'Sunset Paradise Resort',
        },
        dates: {
            fr: '15 mars - 22 mars 2026',
            ar: '15 مارس - 22 مارس 2026',
            en: 'Mar 15 - Mar 22, 2026',
        },
        status: 'confirmed' as const,
        statusLabel: { fr: 'Confirmé', ar: 'مؤكد', en: 'Confirmed' },
        price: '$2,450',
    },
    {
        id: 2,
        destination: {
            fr: 'Bali, Indonésie',
            ar: 'بالي، إندونيسيا',
            en: 'Bali, Indonesia',
        },
        hotel: {
            fr: 'Ubud Jungle Retreat',
            ar: 'ملاذ أوبود الغابي',
            en: 'Ubud Jungle Retreat',
        },
        dates: {
            fr: '5 avr. - 12 avr. 2026',
            ar: '5 أبريل - 12 أبريل 2026',
            en: 'Apr 5 - Apr 12, 2026',
        },
        status: 'pending' as const,
        statusLabel: { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
        price: '$1,890',
    },
    {
        id: 3,
        destination: {
            fr: 'Paris, France',
            ar: 'باريس، فرنسا',
            en: 'Paris, France',
        },
        hotel: {
            fr: 'Le Grand Parisien',
            ar: 'لو غران باريزيان',
            en: 'Le Grand Parisien',
        },
        dates: {
            fr: '1 mai - 7 mai 2026',
            ar: '1 مايو - 7 مايو 2026',
            en: 'May 1 - May 7, 2026',
        },
        status: 'confirmed' as const,
        statusLabel: { fr: 'Confirmé', ar: 'مؤكد', en: 'Confirmed' },
        price: '$3,200',
    },
];

const recommendations = [
    {
        name: { fr: 'Tokyo, Japon', ar: 'طوكيو، اليابان', en: 'Tokyo, Japan' },
        price: '$1,599',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
    },
    {
        name: {
            fr: 'Côte Amalfitaine, Italie',
            ar: 'ساحل أمالفي، إيطاليا',
            en: 'Amalfi Coast, Italy',
        },
        price: '$2,199',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&h=300&fit=crop',
    },
    {
        name: { fr: 'Maldives', ar: 'جزر المالديف', en: 'Maldives' },
        price: '$3,499',
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop',
    },
];

const sidebarLinks = [
    { icon: MapPin, labelKey: 'dashboard.myBookings', active: true },
    { icon: Heart, labelKey: 'dashboard.wishlist' },
    { icon: Calendar, labelKey: 'dashboard.itineraries' },
    { icon: CreditCard, labelKey: 'dashboard.payments' },
    { icon: User, labelKey: 'dashboard.profile' },
    { icon: Settings, labelKey: 'dashboard.settings' },
];

const ClientDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard.myBookings');
    const { lang, t, dir } = useLanguage();
    const isRtl = dir === 'rtl';

    return (
        <div className={cn('flex min-h-screen bg-background', isRtl && 'lg:flex-row-reverse')}>
            <aside
                className={cn(
                    'hidden w-64 flex-col bg-card lg:flex',
                    isRtl ? 'border-l border-border' : 'border-r border-border',
                )}
            >
                <div className={cn('p-6', isRtl && 'text-right')}>
                    <Link to="/" className={cn('flex items-center gap-2', isRtl && 'justify-end')}>
                        <BrandLogo imageClassName="h-7 w-auto" />
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 px-4">
                    {sidebarLinks.map((link) => (
                        <button
                            key={link.labelKey}
                            onClick={() => setActiveTab(link.labelKey)}
                            className={cn(
                                'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                                isRtl && 'text-right',
                                activeTab === link.labelKey
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {t(link.labelKey)}
                        </button>
                    ))}
                </nav>

                <div className="border-t border-border p-4">
                    <Link to="/">
                        <Button
                            variant="ghost"
                            className={cn(
                                'w-full gap-2 text-muted-foreground',
                                isRtl ? 'justify-end' : 'justify-start',
                            )}
                        >
                            <LogOut className="h-4 w-4" />{' '}
                            {t('dashboard.signOut')}
                        </Button>
                    </Link>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
                    <div>
                        <h1 className="font-serif text-2xl font-bold text-foreground">
                            {t('client.welcome')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('client.overview')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="relative rounded-xl p-2 transition-colors hover:bg-muted">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
                        </button>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                </header>

                <div className="space-y-8 p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                labelKey: 'client.upcomingTrips',
                                value: '3',
                                icon: MapPin,
                                color: 'text-primary',
                            },
                            {
                                labelKey: 'client.countriesVisited',
                                value: '12',
                                icon: Plane,
                                color: 'text-secondary',
                            },
                            {
                                labelKey: 'client.totalBookings',
                                value: '8',
                                icon: Calendar,
                                color: 'text-primary',
                            },
                            {
                                labelKey: 'client.rewardsPoints',
                                value: '4,250',
                                icon: Star,
                                color: 'text-secondary',
                            },
                        ].map((stat) => (
                            <motion.div
                                key={stat.labelKey}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl border border-border bg-card p-5"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <stat.icon
                                        className={`h-5 w-5 ${stat.color}`}
                                    />
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {t(stat.labelKey)}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <div>
                        <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
                            {t('client.yourBookings')}
                        </h2>
                        <div className="space-y-3">
                            {bookings.map((booking) => (
                                <motion.div
                                    key={booking.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-center"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                            <Hotel className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">
                                                {localize(
                                                    booking.destination,
                                                    lang,
                                                )}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {localize(booking.hotel, lang)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            {localize(booking.dates, lang)}
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                booking.status === 'confirmed'
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-secondary/10 text-secondary'
                                            }`}
                                        >
                                            {localize(
                                                booking.statusLabel,
                                                lang,
                                            )}
                                        </span>
                                        <span className="font-bold text-foreground">
                                            {booking.price}
                                        </span>
                                        <Button variant="ghost" size="sm">
                                            {dir === 'rtl' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
                            {t('client.recommended')}
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {recommendations.map((rec) => (
                                <div
                                    key={localize(rec.name, lang)}
                                    className="card-elevated group cursor-pointer overflow-hidden rounded-2xl bg-card"
                                >
                                    <div className="h-40 overflow-hidden">
                                        <img
                                            src={rec.image}
                                            alt={localize(rec.name, lang)}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <div className="mb-1 flex items-center justify-between">
                                            <h3 className="font-semibold text-foreground">
                                                {localize(rec.name, lang)}
                                            </h3>
                                            <div className="flex items-center gap-1 text-secondary">
                                                <Star className="h-3.5 w-3.5 fill-current" />
                                                <span className="text-xs font-bold">
                                                    {rec.rating}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-primary">
                                            From {rec.price}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;
