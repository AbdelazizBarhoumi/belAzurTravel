import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
    Bell,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    cancelBooking,
    createSupportInquiry,
    getClientDashboard,
    getClientPayments,
    type ClientBookingRow,
} from '@/api/booking.api';
import { logout } from '@/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDestinations } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';
import { cn } from '@/lib/utils';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const sidebarLinks = [
    { icon: MapPin, labelKey: 'dashboard.myBookings', to: '/client/dashboard' },
    {
        icon: Bell,
        labelKey: 'notifications.title',
        to: '/client/notifications',
    },
    { icon: Heart, labelKey: 'dashboard.wishlist' },
    { icon: Calendar, labelKey: 'dashboard.itineraries' },
    {
        icon: CreditCard,
        labelKey: 'dashboard.payments',
        to: '/client/payments',
    },
    { icon: User, labelKey: 'dashboard.profile', to: '/client/profile' },
    { icon: Settings, labelKey: 'dashboard.settings', to: '/client/support' },
];

const ClientDashboard = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [activeTab, setActiveTab] = useState(() => {
        if (pathname.includes('/payments')) return 'dashboard.payments';
        if (pathname.includes('/support') || pathname.includes('/profile')) {
            return 'dashboard.settings';
        }
        if (pathname.includes('/notifications')) return 'notifications.title';
        return 'dashboard.myBookings';
    });
    const [supportSubject, setSupportSubject] = useState('');
    const [supportMessage, setSupportMessage] = useState('');
    const { lang, t, dir } = useLanguage();
    const queryClient = useQueryClient();
    const isRtl = dir === 'rtl';

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };
    const { data: dashboard } = useQuery({
        queryKey: ['client', 'dashboard'],
        queryFn: getClientDashboard,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
    const { data: recommendations = [] } = useDestinations();
    const { data: payments = [] } = useQuery({
        queryKey: ['client', 'payments'],
        queryFn: getClientPayments,
        enabled: activeTab === 'dashboard.payments',
    });
    const cancelMutation = useMutation({
        mutationFn: (id: number) => cancelBooking(id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['client'] }),
    });
    const supportMutation = useMutation({
        mutationFn: () =>
            createSupportInquiry({
                subject: supportSubject,
                message: supportMessage,
            }),
        onSuccess: () => {
            setSupportSubject('');
            setSupportMessage('');
            queryClient.invalidateQueries({ queryKey: ['client'] });
        },
    });
    const bookings = dashboard?.bookings ?? [];

    useEffect(() => {
        // Defer setState to avoid synchronous state updates inside effect
        // which can trigger cascading renders during navigation.
        setTimeout(() => {
            if (pathname.includes('/payments'))
                setActiveTab('dashboard.payments');
            else if (
                pathname.includes('/support') ||
                pathname.includes('/profile')
            )
                setActiveTab('dashboard.settings');
            else if (pathname.includes('/notifications'))
                setActiveTab('notifications.title');
            else if (pathname.includes('/dashboard'))
                setActiveTab('dashboard.myBookings');
        }, 0);
    }, [pathname]);

    const formatBookingTitle = (booking: ClientBookingRow) =>
        [
            booking.type,
            booking.item_slug,
            booking.item_id,
            booking.items
                .map((item) => item.slug ?? item.id)
                .filter(Boolean)
                .join(', '),
        ]
            .filter(Boolean)
            .join(' / ');

    return (
        <div
            className={cn(
                'flex min-h-screen bg-background',
                isRtl && 'lg:flex-row-reverse',
            )}
        >
            <aside
                className={cn(
                    'hidden w-64 flex-col bg-card lg:flex',
                    isRtl ? 'border-l border-border' : 'border-r border-border',
                )}
            >
                <div className={cn('p-6', isRtl && 'text-right')}>
                    <Link
                        to="/"
                        className={cn(
                            'flex items-center gap-2',
                            isRtl && 'justify-end',
                        )}
                    >
                        <BrandLogo imageClassName="h-7 w-auto" />
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 px-4">
                    {sidebarLinks.map((link) => {
                        const active = activeTab === link.labelKey;
                        const className = cn(
                            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                            isRtl && 'text-right',
                            active
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        );

                        if (link.to) {
                            return (
                                <Link
                                    key={link.labelKey}
                                    to={link.to}
                                    className={className}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {t(link.labelKey)}
                                </Link>
                            );
                        }

                        return (
                            <button
                                key={link.labelKey}
                                onClick={() => setActiveTab(link.labelKey)}
                                className={className}
                            >
                                <link.icon className="h-4 w-4" />
                                {t(link.labelKey)}
                            </button>
                        );
                    })}
                </nav>

                <div className="border-t border-border p-4">
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className={cn(
                            'w-full gap-2 text-muted-foreground',
                            isRtl ? 'justify-end' : 'justify-start',
                        )}
                    >
                        <LogOut className="h-4 w-4" /> {t('dashboard.signOut')}
                    </Button>
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
                        <NotificationBell feedPath="/client/notifications" />
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
                                value: String(
                                    dashboard?.stats.upcomingTrips ?? 0,
                                ),
                                icon: MapPin,
                                color: 'text-primary',
                            },
                            {
                                labelKey: 'client.countriesVisited',
                                value: String(
                                    dashboard?.stats.unreadNotifications ?? 0,
                                ),
                                icon: Plane,
                                color: 'text-secondary',
                            },
                            {
                                labelKey: 'client.totalBookings',
                                value: String(
                                    dashboard?.stats.totalBookings ?? 0,
                                ),
                                icon: Calendar,
                                color: 'text-primary',
                            },
                            {
                                labelKey: 'client.payments',
                                value: String(dashboard?.stats.payments ?? 0),
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

                    {activeTab === 'dashboard.myBookings' && (
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
                                                    {formatBookingTitle(
                                                        booking,
                                                    )}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    #{booking.id}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                {[
                                                    booking.start_date,
                                                    booking.end_date,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' - ') ||
                                                    new Date(
                                                        booking.created_at,
                                                    ).toLocaleDateString()}
                                            </div>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    booking.status ===
                                                    'Confirmed'
                                                        ? 'bg-primary/10 text-primary'
                                                        : booking.status ===
                                                            'Cancelled'
                                                          ? 'bg-destructive/10 text-destructive'
                                                          : 'bg-secondary/10 text-secondary'
                                                }`}
                                            >
                                                {booking.status}
                                            </span>
                                            <span className="font-bold text-foreground">
                                                $
                                                {Number(
                                                    booking.total_amount,
                                                ).toLocaleString()}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    !booking.can_cancel ||
                                                    cancelMutation.isPending
                                                }
                                                title={
                                                    booking.cancel_reason ??
                                                    undefined
                                                }
                                                onClick={() =>
                                                    cancelMutation.mutate(
                                                        booking.id,
                                                    )
                                                }
                                            >
                                                {t('actions.cancel')}
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                                {bookings.length === 0 && (
                                    <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                                        {t('client.noBookings')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'dashboard.payments' && (
                        <div className="rounded-2xl border border-border bg-card">
                            <div className="border-b border-border p-5">
                                <h2 className="font-serif text-xl font-bold text-foreground">
                                    {t('client.payments')}
                                </h2>
                            </div>
                            <div className="divide-y divide-border">
                                {payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm"
                                    >
                                        <span className="font-medium text-foreground">
                                            #{payment.reference ?? payment.id}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {t('admin.booking')} #
                                            {payment.booking_id}
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {payment.currency}{' '}
                                            {Number(
                                                payment.amount,
                                            ).toLocaleString()}
                                        </span>
                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                            {payment.status}
                                        </span>
                                    </div>
                                ))}
                                {payments.length === 0 && (
                                    <p className="p-8 text-center text-muted-foreground">
                                        {t('client.noPayments')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'dashboard.settings' && (
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h2 className="font-serif text-xl font-bold text-foreground">
                                {t('client.support')}
                            </h2>
                            <div className="mt-4 space-y-3">
                                <input
                                    value={supportSubject}
                                    onChange={(e) =>
                                        setSupportSubject(e.target.value)
                                    }
                                    placeholder={t('client.supportSubject')}
                                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                                />
                                <textarea
                                    value={supportMessage}
                                    onChange={(e) =>
                                        setSupportMessage(e.target.value)
                                    }
                                    placeholder={t('client.supportMessage')}
                                    className="min-h-32 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                                />
                                <Button
                                    disabled={
                                        !supportSubject.trim() ||
                                        !supportMessage.trim() ||
                                        supportMutation.isPending
                                    }
                                    onClick={() => supportMutation.mutate()}
                                >
                                    {t('assistant.send')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications.title' && (
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <NotificationCenter
                                panelLabel={t(
                                    'notifications.yourNotifications',
                                )}
                                showTitle={false}
                            />
                        </div>
                    )}

                    {activeTab === 'dashboard.wishlist' && (
                        <div>
                            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
                                {t('client.recommended')}
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {recommendations.slice(0, 3).map((rec) => (
                                    <div
                                        key={rec.slug}
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
                                                {t('common.from')} ${rec.price}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;
