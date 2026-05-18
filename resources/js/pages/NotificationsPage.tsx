import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/http';
import { Button } from '@/components/ui/button';
import type { AppNotification } from '@/components/ui/NotificationBell';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

function message(data: Record<string, unknown>, lang: Lang): string {
    const value = data[lang] ?? data.en ?? data.fr ?? data.ar;
    return typeof value === 'string' ? value : '';
}

export default function NotificationsPage() {
    const { lang, t } = useLanguage();
    const queryClient = useQueryClient();
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', 'all'],
        queryFn: () => apiFetch<AppNotification[]>('/api/notifications'),
    });

    const markRead = useMutation({
        mutationFn: (id: string) =>
            apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    return (
        <main className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-3xl">
                <h1 className="font-serif text-3xl font-bold text-foreground">
                    {t('notifications.title')}
                </h1>
                <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
                    {notifications.map((notification) => (
                        <button
                            key={notification.id}
                            type="button"
                            onClick={() => markRead.mutate(notification.id)}
                            className="block w-full border-b border-border p-4 text-left last:border-0 hover:bg-muted"
                        >
                            <p className="font-medium text-foreground">
                                {message(notification.data, lang)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {notification.created_at
                                    ? new Date(
                                          notification.created_at,
                                      ).toLocaleString()
                                    : ''}
                            </p>
                        </button>
                    ))}
                    {notifications.length === 0 && (
                        <p className="p-8 text-center text-muted-foreground">
                            {t('notifications.empty')}
                        </p>
                    )}
                </div>
                <Button
                    className="mt-6"
                    variant="outline"
                    onClick={() => history.back()}
                >
                    {t('actions.back')}
                </Button>
            </div>
        </main>
    );
}
