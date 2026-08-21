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
    Globe,
    Mail,
    Trash2,
    AlertCircle,
    Info,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    MessageSquare,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
    cancelBooking,
    createSupportInquiry,
    getClientDashboard,
    getClientPayments,
    updateClientLanguage,
    updateClientProfile,
    type ClientBookingRow,
} from '@/api/booking.api';
import {
    getClientComplaints,
    createComplaint,
    replyToClientComplaint,
    type Complaint,
} from '@/api/complaint.api';
import { logout } from '@/auth';
import { VoucherCard } from '@/components/booking/VoucherCard';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useDestinations } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';
import { bookingStatusLabels } from '@/lib/adminI18n';
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
    {
        icon: AlertCircle,
        labelKey: 'client.complaints',
        to: '/client/complaints',
    },
    { icon: RotateCcw, labelKey: 'client.refunds', to: '/client/refunds' },
    { icon: Settings, labelKey: 'dashboard.settings', to: '/client/support' },
];

const ClientDashboard = () => {
    const { pathname } = useLocation();
    const [activeTab, setActiveTab] = useState(() => {
        if (pathname.includes('/payments')) return 'dashboard.payments';
        if (pathname.includes('/profile')) return 'dashboard.profile';
        if (pathname.includes('/support')) return 'dashboard.settings';
        if (pathname.includes('/notifications')) return 'notifications.title';
        if (pathname.includes('/complaints')) return 'client.complaints';
        if (pathname.includes('/refunds')) return 'client.refunds';
        return 'dashboard.myBookings';
    });
    const [supportSubject, setSupportSubject] = useState('');
    const [supportMessage, setSupportMessage] = useState('');
    const [complaintSubject, setComplaintSubject] = useState('');
    const [complaintDescription, setComplaintDescription] = useState('');
    const [refundBookingId, setRefundBookingId] = useState<number | ''>('');
    const [refundSubject, setRefundSubject] = useState('');
    const [refundDescription, setRefundDescription] = useState('');
    const [expandedComplaint, setExpandedComplaint] = useState<number | null>(
        null,
    );
    const [clientReplyMessage, setClientReplyMessage] = useState('');

    const { data: user } = useAuthUser();
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');

    useEffect(() => {
        if (user) {
            // Defer to avoid synchronous setState in effect
            setTimeout(() => {
                setProfileName(user.name);
                setProfileEmail(user.email);
            }, 0);
        }
    }, [user]);

    const { lang, t, dir, setLang } = useLanguage();
    const queryClient = useQueryClient();
    const { favorites, remove: removeFavorite } = useFavorites();
    const isRtl = dir === 'rtl';

    const handleLogout = async () => {
        await logout();
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
    const { data: complaints = [] } = useQuery<Complaint[]>({
        queryKey: ['client', 'complaints'],
        queryFn: getClientComplaints,
        enabled:
            activeTab === 'client.complaints' || activeTab === 'client.refunds',
    });
    const cancelMutation = useMutation({
        mutationFn: (id: number) => cancelBooking(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client'] });
            toast.success(t('booking.cancelled') || 'Booking cancelled successfully.');
        },
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
            toast.success(t('client.supportSuccess') || 'Message sent.');
        },
    });

    const complaintMutation = useMutation({
        mutationFn: () =>
            createComplaint({
                type: 'complaint',
                subject: complaintSubject,
                description: complaintDescription,
            }),
        onSuccess: () => {
            setComplaintSubject('');
            setComplaintDescription('');
            queryClient.invalidateQueries({
                queryKey: ['client', 'complaints'],
            });
            toast.success(
                t('client.complaintSuccess') || 'Complaint submitted.',
            );
        },
    });

    const refundMutation = useMutation({
        mutationFn: () =>
            createComplaint({
                type: 'refund_request',
                subject: refundSubject,
                description: refundDescription,
                booking_id: Number(refundBookingId),
            }),
        onSuccess: () => {
            setRefundBookingId('');
            setRefundSubject('');
            setRefundDescription('');
            queryClient.invalidateQueries({
                queryKey: ['client', 'complaints'],
            });
            toast.success(
                t('client.refundSuccess') || 'Refund request submitted.',
            );
        },
    });

    const clientReplyMutation = useMutation({
        mutationFn: ({ id, message }: { id: number; message: string }) =>
            replyToClientComplaint(id, message),
        onSuccess: () => {
            setClientReplyMessage('');
            queryClient.invalidateQueries({
                queryKey: ['client', 'complaints'],
            });
            toast.success(t('client.replySent') || 'Reply sent.');
        },
    });

    const profileMutation = useMutation({
        mutationFn: () =>
            updateClientProfile({ name: profileName, email: profileEmail }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
            toast.success(t('client.profileUpdated') || 'Profile updated.');
        },
    });

    const langMutation = useMutation({
        mutationFn: (newLang: string) => updateClientLanguage(newLang),
        onSuccess: (_, newLang) => {
            setLang(newLang as Lang);
            toast.success(t('client.languageUpdated') || 'Language updated.');
        },
    });

    const bookings = dashboard?.bookings ?? [];

    useEffect(() => {
        // Defer setState to avoid synchronous state updates inside effect
        // which can trigger cascading renders during navigation.
        setTimeout(() => {
            if (pathname.includes('/payments'))
                setActiveTab('dashboard.payments');
            else if (pathname.includes('/profile'))
                setActiveTab('dashboard.profile');
            else if (pathname.includes('/support'))
                setActiveTab('dashboard.settings');
            else if (pathname.includes('/notifications'))
                setActiveTab('notifications.title');
            else if (pathname.includes('/complaints'))
                setActiveTab('client.complaints');
            else if (pathname.includes('/refunds'))
                setActiveTab('client.refunds');
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

    const bookingStatusColors: Record<string, string> = {
        Pending: 'bg-secondary/10 text-secondary',
        Approved: 'bg-blue-100 text-blue-700',
        Confirmed: 'bg-primary/10 text-primary',
        Rejected: 'bg-destructive/10 text-destructive',
        Cancelled: 'bg-destructive/10 text-destructive',
        Expired: 'bg-muted text-muted-foreground',
        Completed: 'bg-green-100 text-green-700',
    };

    const statusLabel = (booking: ClientBookingRow) =>
        bookingStatusLabels[booking.status]?.[lang] ?? booking.status;

    const decisionByLabel = (booking: ClientBookingRow) => {
        if (!booking.expires_at) return null;
        const date = new Date(booking.expires_at);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleString();
    };

    const formattedAmount = (booking: ClientBookingRow) =>
        `${Number(booking.total_amount).toLocaleString()} ${
            booking.currency ?? 'TND'
        }`;

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
                        <BrandLogo imageClassName="h-12 w-auto" />
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
                            {t('client.welcome')}, {user?.name || ''}
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
                                labelKey: 'client.unreadNotifications',
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
                                        className="space-y-3"
                                    >
                                        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-center">
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
                                            <div className="flex flex-wrap items-center gap-3 text-sm">
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
                                                    className={cn(
                                                        'rounded-full px-3 py-1 text-xs font-semibold',
                                                        bookingStatusColors[
                                                            booking.status
                                                        ] ??
                                                            'bg-secondary/10 text-secondary',
                                                    )}
                                                >
                                                    {statusLabel(booking)}
                                                </span>
                                                {booking.is_request && (
                                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                                        {t('booking.requestBadge') || 'Request'}
                                                    </span>
                                                )}
                                                <span className="font-bold text-foreground">
                                                    {formattedAmount(booking)}
                                                </span>
                                                <Link
                                                    to={`/client/bookings/${booking.id}`}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        {t(
                                                            'bookingDetail.title',
                                                        ) || 'Details'}
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={
                                                        !booking.can_cancel ||
                                                        cancelMutation.isPending
                                                    }
                                                    title={
                                                        booking.can_cancel
                                                            ? undefined
                                                            : (booking.cancel_closed_reason ??
                                                              booking.cancel_reason ??
                                                              undefined)
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
                                        </div>

                                        {booking.status === 'Pending' && (
                                            <div className="flex items-start gap-2 rounded-xl border border-secondary/30 bg-secondary/5 px-4 py-3 text-sm">
                                                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                                                <p className="text-muted-foreground">
                                                    {booking.is_request
                                                        ? (t('booking.requestBanner') || 'Your request is being processed. We\'ll contact the hotel to check availability.')
                                                        : (<>{t('client.bookingDecisionWindow')}{' '}<span className="font-semibold text-foreground">{decisionByLabel(booking) ?? t('client.bookingDecisionUnknown')}</span></>)
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {booking.status === 'Approved' && (
                                            <div className="flex items-start gap-2 rounded-xl border border-blue-300/50 bg-blue-50 px-4 py-3 text-sm">
                                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                                                <p className="text-blue-900">
                                                    {t(
                                                        'bookingDetail.approvedNote',
                                                    ) ||
                                                        'Your booking is approved. Waiting for the hotel to confirm.'}
                                                </p>
                                            </div>
                                        )}

                                        {booking.status === 'Rejected' &&
                                            booking.reject_reason && (
                                                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                                    <p className="text-muted-foreground">
                                                        <span className="font-semibold text-destructive">
                                                            {t(
                                                                'client.bookingRejectedReason',
                                                            )}
                                                            :
                                                        </span>{' '}
                                                        {booking.reject_reason}
                                                    </p>
                                                </div>
                                            )}

                                        {booking.status === 'Cancelled' &&
                                            booking.cancel_reason && (
                                                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                                    <p className="text-muted-foreground">
                                                        <span className="font-semibold text-destructive">
                                                            {t(
                                                                'client.bookingCancelledReason',
                                                            )}
                                                            :
                                                        </span>{' '}
                                                        {booking.cancel_reason}
                                                    </p>
                                                </div>
                                            )}

                                        {booking.status === 'Confirmed' && (
                                            <VoucherCard booking={booking} />
                                        )}
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

                    {activeTab === 'client.complaints' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6">
                                <h2 className="font-serif text-xl font-bold text-foreground">
                                    {t('client.newComplaint')}
                                </h2>
                                <div className="mt-4 space-y-3">
                                    <input
                                        value={complaintSubject}
                                        onChange={(e) =>
                                            setComplaintSubject(e.target.value)
                                        }
                                        placeholder={t(
                                            'client.complaintSubject',
                                        )}
                                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                                    />
                                    <textarea
                                        value={complaintDescription}
                                        onChange={(e) =>
                                            setComplaintDescription(
                                                e.target.value,
                                            )
                                        }
                                        placeholder={t(
                                            'client.complaintDescription',
                                        )}
                                        className="min-h-32 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                                    />
                                    <Button
                                        disabled={
                                            !complaintSubject.trim() ||
                                            !complaintDescription.trim() ||
                                            complaintMutation.isPending
                                        }
                                        onClick={() =>
                                            complaintMutation.mutate()
                                        }
                                    >
                                        {t('actions.submit')}
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-card">
                                <div className="border-b border-border p-5">
                                    <h2 className="font-serif text-xl font-bold text-foreground">
                                        {t('client.complaints')}
                                    </h2>
                                </div>
                                <div className="divide-y divide-border">
                                    {complaints
                                        .filter((c) => c.type === 'complaint')
                                        .map((complaint) => (
                                            <div
                                                key={complaint.id}
                                                className="p-5"
                                            >
                                                <div
                                                    className="flex cursor-pointer items-center justify-between"
                                                    onClick={() =>
                                                        setExpandedComplaint(
                                                            expandedComplaint ===
                                                                complaint.id
                                                                ? null
                                                                : complaint.id,
                                                        )
                                                    }
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {complaint
                                                                    .subject[
                                                                    lang
                                                                ] ||
                                                                    complaint
                                                                        .subject
                                                                        .en}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                #{complaint.id}{' '}
                                                                &middot;{' '}
                                                                {new Date(
                                                                    complaint.created_at,
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                                complaint.status ===
                                                                'resolved'
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : complaint.status ===
                                                                        'rejected'
                                                                      ? 'bg-destructive/10 text-destructive'
                                                                      : 'bg-secondary/10 text-secondary'
                                                            }`}
                                                        >
                                                            {complaint.status}
                                                        </span>
                                                        {expandedComplaint ===
                                                        complaint.id ? (
                                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </div>
                                                {expandedComplaint ===
                                                    complaint.id && (
                                                    <div className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4">
                                                        <p className="text-sm text-foreground">
                                                            {complaint
                                                                .description[
                                                                lang
                                                            ] ||
                                                                complaint
                                                                    .description
                                                                    .en}
                                                        </p>

                                                        {/* Thread */}
                                                        {complaint.replies &&
                                                            complaint.replies
                                                                .length > 0 && (
                                                                <div className="mt-4 space-y-3">
                                                                    <p className="text-xs font-semibold text-muted-foreground">
                                                                        {t(
                                                                            'client.conversation',
                                                                        ) ||
                                                                            'Conversation'}
                                                                    </p>
                                                                    {complaint.replies.map(
                                                                        (
                                                                            reply,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    reply.id
                                                                                }
                                                                                className={`rounded-xl p-4 ${
                                                                                    reply.sender ===
                                                                                    'admin'
                                                                                        ? 'border border-primary/20 bg-primary/5'
                                                                                        : 'ml-8 border border-border bg-card'
                                                                                }`}
                                                                            >
                                                                                <div className="mb-2 flex items-center gap-2">
                                                                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                                                    <span className="text-xs font-semibold text-muted-foreground">
                                                                                        {reply.sender ===
                                                                                        'admin'
                                                                                            ? t(
                                                                                                  'admin.admin',
                                                                                              ) ||
                                                                                              'Admin'
                                                                                            : t(
                                                                                                  'client.you',
                                                                                              ) ||
                                                                                              'You'}
                                                                                    </span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {new Date(
                                                                                            reply.created_at,
                                                                                        ).toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-sm text-foreground">
                                                                                    {reply
                                                                                        .message[
                                                                                        lang
                                                                                    ] ||
                                                                                        reply
                                                                                            .message
                                                                                            .en}
                                                                                </p>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}

                                                        {/* Legacy admin_reply fallback */}
                                                        {complaint.admin_reply &&
                                                            (!complaint.replies ||
                                                                complaint
                                                                    .replies
                                                                    .length ===
                                                                    0) && (
                                                                <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                                                    <div className="mb-2 flex items-center gap-2">
                                                                        <MessageSquare className="h-4 w-4 text-primary" />
                                                                        <span className="text-xs font-semibold text-primary">
                                                                            {t(
                                                                                'client.adminReply',
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-foreground">
                                                                        {complaint
                                                                            .admin_reply[
                                                                            lang
                                                                        ] ||
                                                                            complaint
                                                                                .admin_reply
                                                                                .en}
                                                                    </p>
                                                                </div>
                                                            )}

                                                        {/* Client Reply Input */}
                                                        {complaint.status !==
                                                            'resolved' &&
                                                            complaint.status !==
                                                                'rejected' &&
                                                            complaint.status !==
                                                                'refunded' && (
                                                                <div className="mt-4 flex gap-2">
                                                                    <input
                                                                        value={
                                                                            expandedComplaint ===
                                                                            complaint.id
                                                                                ? clientReplyMessage
                                                                                : ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setClientReplyMessage(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder={
                                                                            t(
                                                                                'client.writeReply',
                                                                            ) ||
                                                                            'Write a reply...'
                                                                        }
                                                                        className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm"
                                                                        onClick={(
                                                                            e,
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        disabled={
                                                                            !clientReplyMessage.trim() ||
                                                                            clientReplyMutation.isPending
                                                                        }
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            clientReplyMutation.mutate(
                                                                                {
                                                                                    id: complaint.id,
                                                                                    message:
                                                                                        clientReplyMessage,
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        {t(
                                                                            'assistant.send',
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    {complaints.filter(
                                        (c) => c.type === 'complaint',
                                    ).length === 0 && (
                                        <p className="p-8 text-center text-muted-foreground">
                                            {t('client.complaintsEmpty')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'client.refunds' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6">
                                <h2 className="font-serif text-xl font-bold text-foreground">
                                    {t('client.requestRefund')}
                                </h2>
                                <div className="mt-4 space-y-3">
                                    <select
                                        value={refundBookingId}
                                        onChange={(e) =>
                                            setRefundBookingId(
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : '',
                                            )
                                        }
                                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                                    >
                                        <option value="">
                                            {t('client.selectBooking')}
                                        </option>
                                        {bookings
                                            .filter(
                                                (b) => b.status !== 'Cancelled',
                                            )
                                            .map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    #{b.id} - {b.type} (
                                                    {b.total_amount} TND)
                                                </option>
                                            ))}
                                    </select>
                                    <input
                                        value={refundSubject}
                                        onChange={(e) =>
                                            setRefundSubject(e.target.value)
                                        }
                                        placeholder={t(
                                            'client.complaintSubject',
                                        )}
                                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                                    />
                                    <textarea
                                        value={refundDescription}
                                        onChange={(e) =>
                                            setRefundDescription(e.target.value)
                                        }
                                        placeholder={t('client.refundReason')}
                                        className="min-h-32 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                                    />
                                    <Button
                                        disabled={
                                            !refundBookingId ||
                                            !refundSubject.trim() ||
                                            !refundDescription.trim() ||
                                            refundMutation.isPending
                                        }
                                        onClick={() => refundMutation.mutate()}
                                    >
                                        {t('actions.submit')}
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-card">
                                <div className="border-b border-border p-5">
                                    <h2 className="font-serif text-xl font-bold text-foreground">
                                        {t('client.refunds')}
                                    </h2>
                                </div>
                                <div className="divide-y divide-border">
                                    {complaints
                                        .filter(
                                            (c) => c.type === 'refund_request',
                                        )
                                        .map((complaint) => (
                                            <div
                                                key={complaint.id}
                                                className="p-5"
                                            >
                                                <div
                                                    className="flex cursor-pointer items-center justify-between"
                                                    onClick={() =>
                                                        setExpandedComplaint(
                                                            expandedComplaint ===
                                                                complaint.id
                                                                ? null
                                                                : complaint.id,
                                                        )
                                                    }
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {complaint
                                                                    .subject[
                                                                    lang
                                                                ] ||
                                                                    complaint
                                                                        .subject
                                                                        .en}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                #{complaint.id}{' '}
                                                                &middot; Booking
                                                                #
                                                                {
                                                                    complaint.booking_id
                                                                }{' '}
                                                                &middot;{' '}
                                                                {new Date(
                                                                    complaint.created_at,
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                                complaint.status ===
                                                                'refunded'
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : complaint.status ===
                                                                        'rejected'
                                                                      ? 'bg-destructive/10 text-destructive'
                                                                      : 'bg-secondary/10 text-secondary'
                                                            }`}
                                                        >
                                                            {complaint.status}
                                                        </span>
                                                        {expandedComplaint ===
                                                        complaint.id ? (
                                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </div>
                                                {expandedComplaint ===
                                                    complaint.id && (
                                                    <div className="mt-4 space-y-3 rounded-xl border border-border bg-background p-4">
                                                        <p className="text-sm text-foreground">
                                                            {complaint
                                                                .description[
                                                                lang
                                                            ] ||
                                                                complaint
                                                                    .description
                                                                    .en}
                                                        </p>
                                                        {complaint.refund_amount && (
                                                            <p className="text-sm font-semibold text-primary">
                                                                {t(
                                                                    'client.refundAmount',
                                                                )}
                                                                :{' '}
                                                                {
                                                                    complaint.refund_amount
                                                                }{' '}
                                                                TND
                                                            </p>
                                                        )}

                                                        {/* Thread */}
                                                        {complaint.replies &&
                                                            complaint.replies
                                                                .length > 0 && (
                                                                <div className="mt-4 space-y-3">
                                                                    <p className="text-xs font-semibold text-muted-foreground">
                                                                        {t(
                                                                            'client.conversation',
                                                                        ) ||
                                                                            'Conversation'}
                                                                    </p>
                                                                    {complaint.replies.map(
                                                                        (
                                                                            reply,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    reply.id
                                                                                }
                                                                                className={`rounded-xl p-4 ${
                                                                                    reply.sender ===
                                                                                    'admin'
                                                                                        ? 'border border-primary/20 bg-primary/5'
                                                                                        : 'ml-8 border border-border bg-card'
                                                                                }`}
                                                                            >
                                                                                <div className="mb-2 flex items-center gap-2">
                                                                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                                                    <span className="text-xs font-semibold text-muted-foreground">
                                                                                        {reply.sender ===
                                                                                        'admin'
                                                                                            ? t(
                                                                                                  'admin.admin',
                                                                                              ) ||
                                                                                              'Admin'
                                                                                            : t(
                                                                                                  'client.you',
                                                                                              ) ||
                                                                                              'You'}
                                                                                    </span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {new Date(
                                                                                            reply.created_at,
                                                                                        ).toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-sm text-foreground">
                                                                                    {reply
                                                                                        .message[
                                                                                        lang
                                                                                    ] ||
                                                                                        reply
                                                                                            .message
                                                                                            .en}
                                                                                </p>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}

                                                        {/* Legacy admin_reply fallback */}
                                                        {complaint.admin_reply &&
                                                            (!complaint.replies ||
                                                                complaint
                                                                    .replies
                                                                    .length ===
                                                                    0) && (
                                                                <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                                                    <div className="mb-2 flex items-center gap-2">
                                                                        <MessageSquare className="h-4 w-4 text-primary" />
                                                                        <span className="text-xs font-semibold text-primary">
                                                                            {t(
                                                                                'client.adminReply',
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-foreground">
                                                                        {complaint
                                                                            .admin_reply[
                                                                            lang
                                                                        ] ||
                                                                            complaint
                                                                                .admin_reply
                                                                                .en}
                                                                    </p>
                                                                </div>
                                                            )}

                                                        {/* Client Reply Input */}
                                                        {complaint.status !==
                                                            'resolved' &&
                                                            complaint.status !==
                                                                'rejected' &&
                                                            complaint.status !==
                                                                'refunded' && (
                                                                <div className="mt-4 flex gap-2">
                                                                    <input
                                                                        value={
                                                                            expandedComplaint ===
                                                                            complaint.id
                                                                                ? clientReplyMessage
                                                                                : ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setClientReplyMessage(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder={
                                                                            t(
                                                                                'client.writeReply',
                                                                            ) ||
                                                                            'Write a reply...'
                                                                        }
                                                                        className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm"
                                                                        onClick={(
                                                                            e,
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        disabled={
                                                                            !clientReplyMessage.trim() ||
                                                                            clientReplyMutation.isPending
                                                                        }
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            clientReplyMutation.mutate(
                                                                                {
                                                                                    id: complaint.id,
                                                                                    message:
                                                                                        clientReplyMessage,
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        {t(
                                                                            'assistant.send',
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    {complaints.filter(
                                        (c) => c.type === 'refund_request',
                                    ).length === 0 && (
                                        <p className="p-8 text-center text-muted-foreground">
                                            {t('client.refundsEmpty')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'dashboard.profile' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6">
                                <h2 className="mb-6 font-serif text-xl font-bold text-foreground">
                                    {t('dashboard.profile')}
                                </h2>
                                <div className="max-w-md space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">
                                            {t('label.fullName')}
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                value={profileName}
                                                onChange={(e) =>
                                                    setProfileName(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">
                                            {t('label.email')}
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="email"
                                                value={profileEmail}
                                                onChange={(e) =>
                                                    setProfileEmail(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => profileMutation.mutate()}
                                        disabled={profileMutation.isPending}
                                        className="w-full sm:w-auto"
                                    >
                                        {t('actions.save')}
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-6">
                                <h2 className="mb-6 font-serif text-xl font-bold text-foreground">
                                    {t('dashboard.settings')}
                                </h2>
                                <div className="max-w-md space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">
                                            {t('common.language')}
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['en', 'fr', 'ar'].map((l) => (
                                                <Button
                                                    key={l}
                                                    variant={
                                                        lang === l
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        langMutation.mutate(l)
                                                    }
                                                    className="gap-2"
                                                >
                                                    <Globe className="h-3 w-3" />
                                                    {l.toUpperCase()}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
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
                        <div className="space-y-6">
                            <h2 className="font-serif text-xl font-bold text-foreground">
                                {t('dashboard.wishlist')}
                            </h2>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {favorites.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="group relative overflow-hidden rounded-2xl border border-border bg-card"
                                    >
                                        <div className="aspect-[4/3] overflow-hidden">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <div className="mb-2 flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-bold text-foreground">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t(
                                                            `nav.${item.type}s`,
                                                        ) || item.type}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() =>
                                                        removeFavorite(item.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                {item.price && (
                                                    <p className="font-bold text-primary">
                                                        ${item.price}
                                                    </p>
                                                )}
                                                <Link
                                                    to={`/${item.type}s/${item.id}`}
                                                    className="text-xs font-medium text-secondary hover:underline"
                                                >
                                                    {t('common.viewDetails')}
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {favorites.length === 0 && (
                                    <div className="col-span-full rounded-2xl border border-dashed border-border py-12 text-center">
                                        <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
                                        <p className="text-muted-foreground">
                                            {t('client.emptyWishlist') ||
                                                'Your wishlist is empty.'}
                                        </p>
                                        <Link
                                            to="/destinations"
                                            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                                        >
                                            {t('client.exploreNow') ||
                                                'Explore destinations'}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {recommendations.length > 0 && (
                                <div className="pt-8">
                                    <h3 className="mb-4 font-serif text-lg font-bold text-foreground">
                                        {t('client.recommended')}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        {recommendations
                                            .slice(0, 3)
                                            .map((rec) => (
                                                <div
                                                    key={rec.slug}
                                                    className="card-elevated group cursor-pointer overflow-hidden rounded-2xl bg-card"
                                                >
                                                    <div className="h-40 overflow-hidden">
                                                        <img
                                                            src={rec.image}
                                                            alt={localize(
                                                                rec.name,
                                                                lang,
                                                            )}
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="mb-1 flex items-center justify-between">
                                                            <h3 className="font-semibold text-foreground">
                                                                {localize(
                                                                    rec.name,
                                                                    lang,
                                                                )}
                                                            </h3>
                                                            <div className="flex items-center gap-1 text-secondary">
                                                                <Star className="h-3.5 w-3.5 fill-current" />
                                                                <span className="text-xs font-bold">
                                                                    {rec.rating}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-bold text-primary">
                                                            {t('common.from')} $
                                                            {rec.price}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;
