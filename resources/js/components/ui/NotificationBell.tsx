import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Bell,
    CheckCheck,
    CreditCard,
    Headphones,
    ListChecks,
    RotateCcw,
    AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/api/http';
import { getAdminQueueCounts } from '@/api/queue.api';
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

interface NotificationSummaryResponse {
    notifications: AppNotification[];
    count: number;
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
    queueFeedPath,
    className,
}: {
    feedPath: string;
    queueFeedPath?: string;
    className?: string;
}) {
    const { lang, t, dir } = useLanguage();
    const queryClient = useQueryClient();
    const isRtl = dir === 'rtl';

    const { data: summaryData } = useQuery({
        queryKey: ['notifications', 'summary', feedPath],
        queryFn: () =>
            apiFetch<NotificationSummaryResponse>(
                '/api/notifications?limit=10&include_count=1',
            ),
        staleTime: 10_000,
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
    });

    const { data: queueCounts } = useQuery({
        queryKey: ['admin-queue-counts'],
        queryFn: getAdminQueueCounts,
        enabled: !!queueFeedPath,
        staleTime: 10_000,
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
    });

    const notifications = summaryData?.notifications ?? [];

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const markAllRead = useMutation({
        mutationFn: () =>
            apiFetch('/api/notifications/read-all', { method: 'PATCH' }),
        onSuccess: refresh,
    });

    const unreadCount = summaryData?.count ?? 0;

    const queueSections: Array<{
        key: string;
        icon: typeof CreditCard;
        count: number;
    }> = [
        { key: 'bookings', icon: CreditCard, count: queueCounts?.bookings ?? 0 },
        { key: 'complaints', icon: AlertCircle, count: queueCounts?.complaints ?? 0 },
        { key: 'refund_requests', icon: RotateCcw, count: queueCounts?.refund_requests ?? 0 },
        { key: 'support', icon: Headphones, count: queueCounts?.support ?? 0 },
    ];

    return (
        <div className={cn('flex items-center gap-1', className)}>
            {queueFeedPath && (queueCounts?.total ?? 0) > 0 && (
                <div className="group/queue relative">
                    <Link
                        to={queueFeedPath}
                        className="relative inline-flex items-center rounded-lg p-2 transition-colors hover:bg-muted"
                        aria-label={t('admin.queue')}
                    >
                        <ListChecks className="h-5 w-5 text-muted-foreground" />
                        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground">
                            {queueCounts?.total}
                        </span>
                    </Link>

                    <div
                        className={cn(
                            'invisible absolute top-11 z-50 w-64 rounded-lg border border-border bg-popover p-3 opacity-0 shadow-xl transition-all group-hover/queue:visible group-hover/queue:opacity-100',
                            isRtl ? 'left-0 text-right' : 'right-0 text-left',
                        )}
                    >
                        <h3 className="mb-2 text-sm font-semibold text-foreground">
                            {t('admin.queue')}
                        </h3>
                        <div className="space-y-1">
                            {queueSections.map((section) => (
                                <Link
                                    key={section.key}
                                    to={`${queueFeedPath}?tab=${section.key}`}
                                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                                >
                                    <span className="flex items-center gap-2 text-foreground">
                                        <section.icon className="h-4 w-4 text-muted-foreground" />
                                        {t(`admin.queue.tab.${section.key === 'refund_requests' ? 'refunds' : section.key}`)}
                                    </span>
                                    {section.count > 0 && (
                                        <span className="min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-destructive-foreground">
                                            {section.count}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                        <Link
                            to={queueFeedPath}
                            className="mt-2 block rounded-md px-3 py-2 text-center text-sm font-medium text-primary hover:bg-muted"
                        >
                            {t('notifications.viewAll')}
                        </Link>
                    </div>
                </div>
            )}
            <div className="group relative">
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
                    {notifications.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            {t('notifications.empty')}
                        </p>
                    ) : (
                        notifications.map((notification) => {
                            const data =
                                notification.data &&
                                typeof notification.data === 'object' &&
                                !Array.isArray(notification.data)
                                    ? notification.data
                                    : {};

                            return (
                                <Link
                                    key={notification.id}
                                    to={
                                        typeof data.url === 'string'
                                            ? data.url
                                            : feedPath
                                    }
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
        </div>
    );
}
