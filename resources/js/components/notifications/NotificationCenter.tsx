import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Check,
    Trash2,
    CheckCheck,
    Calendar,
    CreditCard,
    Tag,
    AlertCircle,
    Plane as PlaneIcon,
    Hotel,
    UserPlus,
    Server,
    MessageSquare,
    TrendingUp,
    ShieldAlert,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { apiFetch } from '@/api/http';
import { Button } from '@/components/ui/button';
import type { AppNotification } from '@/components/ui/NotificationBell';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type NotifType =
    | 'booking'
    | 'payment'
    | 'deal'
    | 'alert'
    | 'flight'
    | 'hotel'
    | 'user'
    | 'system'
    | 'inquiry'
    | 'revenue'
    | 'review';

const iconFor: Record<NotifType, LucideIcon> = {
    booking: Calendar,
    payment: CreditCard,
    deal: Tag,
    alert: AlertCircle,
    flight: PlaneIcon,
    hotel: Hotel,
    user: UserPlus,
    system: Server,
    inquiry: MessageSquare,
    revenue: TrendingUp,
    review: ShieldAlert,
};

const colorFor: Record<NotifType, string> = {
    booking: 'text-primary bg-primary/10',
    payment: 'text-secondary bg-secondary/10',
    deal: 'text-secondary bg-secondary/10',
    alert: 'text-destructive bg-destructive/10',
    flight: 'text-primary bg-primary/10',
    hotel: 'text-primary bg-primary/10',
    user: 'text-primary bg-primary/10',
    system: 'text-muted-foreground bg-muted',
    inquiry: 'text-secondary bg-secondary/10',
    revenue: 'text-primary bg-primary/10',
    review: 'text-destructive bg-destructive/10',
};

function getNotifType(type: string): NotifType {
    const lower = type.toLowerCase();
    if (lower.includes('booking')) return 'booking';
    if (lower.includes('payment')) return 'payment';
    if (lower.includes('deal')) return 'deal';
    if (lower.includes('flight')) return 'flight';
    if (lower.includes('hotel')) return 'hotel';
    if (lower.includes('user')) return 'user';
    if (lower.includes('inquiry')) return 'inquiry';
    if (lower.includes('support')) return 'inquiry';
    if (lower.includes('revenue')) return 'revenue';
    if (lower.includes('review')) return 'review';
    if (lower.includes('system')) return 'system';
    return 'alert';
}

function relativeTime(value?: string | null): string {
    if (!value) return '';
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.max(1, Math.round(diff / 60_000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
}

interface NotificationCenterProps {
    panelLabel: string;
    showTitle?: boolean;
}

export function NotificationCenter({
    panelLabel,
    showTitle = true,
}: NotificationCenterProps) {
    const { lang, t, dir } = useLanguage();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', 'all'],
        queryFn: () => apiFetch<AppNotification[]>('/api/notifications'),
        staleTime: 15_000,
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const markRead = useMutation({
        mutationFn: (id: string) =>
            apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }),
        onSuccess: refresh,
    });

    const markAllRead = useMutation({
        mutationFn: () =>
            apiFetch('/api/notifications/read-all', { method: 'PATCH' }),
        onSuccess: refresh,
    });

    const remove = useMutation({
        mutationFn: (id: string) =>
            apiFetch(`/api/notifications/${id}`, { method: 'DELETE' }),
        onSuccess: refresh,
    });

    const clearAll = useMutation({
        mutationFn: () =>
            apiFetch('/api/notifications/clear-all', { method: 'DELETE' }),
        onSuccess: refresh,
    });

    const visible =
        filter === 'unread'
            ? notifications.filter((i) => !i.read_at)
            : notifications;
    const unreadCount = notifications.filter((i) => !i.read_at).length;

    const message = (data: Record<string, unknown>): string => {
        const value = data[lang] ?? data.en ?? data.fr ?? data.ar;
        return typeof value === 'string' ? value : '';
    };

    return (
        <div className="mx-auto w-full max-w-3xl" dir={dir}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                        <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        {showTitle && (
                            <h1 className="font-serif text-2xl font-bold text-foreground">
                                {t('notifications.title')}
                            </h1>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {panelLabel} ·{' '}
                            {unreadCount > 0
                                ? `${unreadCount} ${t('notifications.unread')}`
                                : t('notifications.allCaughtUp')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAllRead.mutate()}
                        disabled={unreadCount === 0 || markAllRead.isPending}
                        className="gap-1.5"
                    >
                        <CheckCheck className="h-4 w-4" />{' '}
                        {t('notifications.markAllRead')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearAll.mutate()}
                        disabled={
                            notifications.length === 0 || clearAll.isPending
                        }
                        className="gap-1.5 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />{' '}
                        {t('notifications.clear')}
                    </Button>
                </div>
            </div>

            <div className="mb-4 flex gap-2">
                {(['all', 'unread'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                            filter === f
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {t(`notifications.filter.${f}`)}{' '}
                        {f === 'unread' &&
                            unreadCount > 0 &&
                            `(${unreadCount})`}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {visible.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-2xl border border-border bg-card p-12 text-center"
                        >
                            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="text-muted-foreground">
                                {t('notifications.empty')}
                            </p>
                        </motion.div>
                    ) : (
                        visible.map((n) => {
                            const type = getNotifType(n.type);
                            const Icon = iconFor[type] || Bell;
                            return (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    layout
                                    className={cn(
                                        'group relative flex gap-4 rounded-2xl border bg-card p-4 transition-colors',
                                        n.read_at
                                            ? 'border-border'
                                            : 'border-primary/30 bg-primary/[0.02]',
                                    )}
                                >
                                    <Link
                                        to={
                                            typeof n.data.url === 'string'
                                                ? n.data.url
                                                : '#'
                                        }
                                        className="absolute inset-0 z-0 rounded-2xl"
                                        aria-label={
                                            n.data.title
                                                ? String(n.data.title)
                                                : t(
                                                      `notifications.type.${type}`,
                                                  )
                                        }
                                    />
                                    <div
                                        className={cn(
                                            'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                                            colorFor[type] ||
                                                'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="relative z-10 min-w-0 flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-foreground">
                                                {n.data.title
                                                    ? String(n.data.title)
                                                    : t(
                                                          `notifications.type.${type}`,
                                                      )}
                                            </h3>
                                            {!n.read_at && (
                                                <span className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {message(n.data)}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground/70">
                                            {relativeTime(n.created_at)}
                                        </p>
                                    </div>
                                    <div className="relative z-10 flex shrink-0 flex-col gap-1">
                                        {!n.read_at && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    markRead.mutate(n.id);
                                                }}
                                                title={t(
                                                    'notifications.markAsRead',
                                                )}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                remove.mutate(n.id);
                                            }}
                                            title={t('actions.delete')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
