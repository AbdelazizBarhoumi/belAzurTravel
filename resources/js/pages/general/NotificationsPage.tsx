import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
    const { t, dir } = useLanguage();
    const { pathname } = useLocation();

    const role: 'admin' | 'client' = pathname.startsWith('/admin')
        ? 'admin'
        : 'client';

    const isRtl = dir === 'rtl';

    if (role === 'admin') {
        return (
            <AdminLayout
                title={t('notifications.title')}
                subtitle={t('notifications.adminPanel')}
            >
                <NotificationCenter
                    panelLabel={t('notifications.adminPanel')}
                    showTitle={false}
                />
            </AdminLayout>
        );
    }

    const backTo = '/dashboard';
    const backLabel = t('nav.dashboard');
    const panelLabel = t('notifications.yourNotifications');

    return (
        <div className="min-h-screen bg-background" dir={dir}>
            <header className="border-b border-border bg-card">
                <div className="container mx-auto flex items-center justify-between px-4 py-4">
                    <Link to="/" className="flex items-center gap-2">
                        <BrandLogo imageClassName="h-7 w-auto" />
                    </Link>
                    <Link to={backTo}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft
                                className={cn('h-4 w-4', isRtl && 'rotate-180')}
                            />{' '}
                            {backLabel}
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto max-w-3xl px-4 py-8">
                <NotificationCenter panelLabel={panelLabel} />
            </main>
        </div>
    );
}
