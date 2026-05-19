import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/api/http';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { onNotification } from '@/lib/sse';

export interface AppNotification {
    id: string;
    type: string;
    data: Record<string, unknown>;
    read_at?: string | null;
    created_at?: string | null;
}

function message(data: Record<string, unknown>, lang: Lang): string {
    const value = data[lang] ?? data.en ?? data.fr ?? data.ar;
    return typeof value === 'string' ? value : '';
}

function relativeTime(value?: string | null): string {
    if (!value) return '';
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.max(1, Math.round(diff / 60_000));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h`;
    return `${Math.round(hours / 24)} d`;
}

export function NotificationBell({
    feedPath,
    className,
}: {
    feedPath: string;
    className?: string;
}) {
    const { lang, t, dir } = useLanguage();
    const queryClient = useQueryClient();
    const isRtl = dir === 'rtl';

    const { data: countData } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => apiFetch<{ count: number }>('/api/notifications/unread-count'),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', 'latest'],
        queryFn: () => apiFetch<AppNotification[]>('/api/notifications?limit=10'),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const safeNotifications = notifications.filter(
        (notification): notification is AppNotification => !!notification && typeof notification === 'object',
    );

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const markAllRead = useMutation({
        mutationFn: () => apiFetch('/api/notifications/read-all', { method: 'PATCH' }),
        onSuccess: refresh,
    });

    const unreadCount = countData?.count ?? 0;

    useEffect(() => {
        const off = onNotification((payload) => {
            try {
                const raw = payload?.notification ?? payload ?? {};
                const notif = raw.id
                    ? raw
                    : {
                          id: String(Date.now()),
                          type: raw.type ?? 'notification',
                          data: raw.data ?? raw,
                          created_at: raw.created_at ?? new Date().toJSON(),
                      };

                queryClient.setQueryData(['notifications', 'latest'], (old: any[] | undefined) => {
                    const next = Array.isArray(old) ? old.slice() : [];
                    next.unshift(notif);
                    return next.slice(0, 50);
                });

                queryClient.setQueryData(['notifications', 'unread-count'], (old: any) => {
                    const prev = (old && typeof old.count === 'number') ? old.count : (typeof old === 'number' ? old : 0);
                    return { count: prev + 1 };
                });
            } catch (e) {
                // ignore malformed payloads
            }
        });

        return () => off();
    }, [queryClient]);

    return (
        <div className={cn('group relative', className)}>
            <button
                type="button"
                className="relative rounded-lg p-2 transition-colors hover:bg-muted"
                aria-label={t('notifications.title')}
            >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground">
                        {unreadCount}
                    </span>
                )}
            </button>

            <div
                className={cn(
                    'invisible absolute top-11 z-50 w-80 rounded-lg border border-border bg-popover p-3 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100',
                    isRtl ? 'left-0 text-right' : 'right-0 text-left',
                )}
            >
                <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{t('notifications.title')}</h3>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 px-2 text-xs"
                        disabled={unreadCount === 0 || markAllRead.isPending}
                        onClick={() => markAllRead.mutate()}
                    >
                        <CheckCheck className="h-3.5 w-3.5" />
                        {t('notifications.markAllRead')}
                    </Button>
                </div>

                <div className="max-h-80 overflow-auto">
                    {safeNotifications.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">{t('notifications.empty')}</p>
                    ) : (
                        safeNotifications.map((notification) => {
                            const data = notification.data && typeof notification.data === 'object' && !Array.isArray(notification.data) ? notification.data : {};
                            const target = typeof data.url === 'string' ? data.url : feedPath;

                            return (
                                <Link
                                    key={notification.id}
                                    to={target}
                                    className={cn('block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted', !notification.read_at && 'bg-primary/5')}
                                >
                                    <p className="line-clamp-2 text-foreground">{message(data, lang)}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{relativeTime(notification.created_at)}</p>
                                </Link>
                            );
                        })
                    )}
                </div>

                <Link to={feedPath} className="mt-2 block rounded-md px-3 py-2 text-center text-sm font-medium text-primary hover:bg-muted">
                    {t('notifications.viewAll')}
                </Link>
            </div>
        </div>
    );
}

export default NotificationBell;
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/api/http';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { cn } from '@/lib/utils';

export interface AppNotification {
    id: string;
    type: string;
    data: Record<string, unknown>;
    read_at?: string | null;
    created_at?: string | null;
}

function message(data: Record<string, unknown>, lang: Lang): string {
    const value = data[lang] ?? data.en ?? data.fr ?? data.ar;
    return typeof value === 'string' ? value : '';
}

function relativeTime(value?: string | null): string {
    if (!value) return '';
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.max(1, Math.round(diff / 60_000));
    if (minutes < 60) return `${minutes} min`;
        const { data: countData } = useQuery({
            queryKey: ['notifications', 'unread-count'],
            queryFn: () =>
                apiFetch<{ count: number }>('/api/notifications/unread-count'),
            // stop automatic polling here; updates will come from SSE
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        });
    pollIntervalMs = 120_000,
        const { data: notifications = [] } = useQuery({
            queryKey: ['notifications', 'latest'],
            queryFn: () => apiFetch<AppNotification[]>('/api/notifications?limit=10'),
            // stop automatic polling here; updates will come from SSE
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        });

    const { data: countData } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () =>
            apiFetch<{ count: number }>('/api/notifications/unread-count'),
        staleTime: 30_000,
        refetchInterval: pollIntervalMs,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchIntervalInBackground: false,
    });

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', 'latest'],
        queryFn: () =>
            apiFetch<AppNotification[]>('/api/notifications?limit=10'),
        staleTime: 30_000,
        refetchInterval: pollIntervalMs,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchIntervalInBackground: false,
    });

    const safeNotifications = notifications.filter(
        (notification): notification is AppNotification =>
            !!notification && typeof notification === 'object',
    );

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const markAllRead = useMutation({
        mutationFn: () =>
            apiFetch('/api/notifications/read-all', { method: 'PATCH' }),
        onSuccess: refresh,
    });

    const unreadCount = countData?.count ?? 0;

    return (
        <div className={cn('group relative', className)}>
            <button
                type="button"
                className="relative rounded-lg p-2 transition-colors hover:bg-muted"
                aria-label={t('notifications.title')}
            >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground">
                        {unreadCount}
                    </span>
                )}
            </button>

            <div
                className={cn(
                    'invisible absolute top-11 z-50 w-80 rounded-lg border border-border bg-popover p-3 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100',
                    isRtl ? 'left-0 text-right' : 'right-0 text-left',
                )}
            >
                <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                        {t('notifications.title')}
                    </h3>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 px-2 text-xs"
                        disabled={unreadCount === 0 || markAllRead.isPending}
                        onClick={() => markAllRead.mutate()}
                    >
                        <CheckCheck className="h-3.5 w-3.5" />
                        {t('notifications.markAllRead')}
                    </Button>
                </div>

                <div className="max-h-80 overflow-auto">
                    {safeNotifications.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            {t('notifications.empty')}
                        </p>
                    ) : (
                        safeNotifications.map((notification) => {
                            const data =
                                notification.data &&
                                typeof notification.data === 'object' &&
                                !Array.isArray(notification.data)
                                    ? notification.data
                                    : {};
                            const target =
                                typeof data.url === 'string'
                                    ? data.url
                                    : feedPath;

                            return (
                                <Link
                                    key={notification.id}
                                    to={target}
                                    className={cn(
                                        'block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted',
                                        !notification.read_at && 'bg-primary/5',
                                    )}
                                >
                                    <p className="line-clamp-2 text-foreground">
                                        {message(data, lang)}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {relativeTime(notification.created_at)}
                                    </p>
                                </Link>
                            );
                        })
                    )}
                </div>

                <Link
                    to={feedPath}
                    className="mt-2 block rounded-md px-3 py-2 text-center text-sm font-medium text-primary hover:bg-muted"
                >
                    {t('notifications.viewAll')}
                </Link>
            </div>
        </div>
    );
}
