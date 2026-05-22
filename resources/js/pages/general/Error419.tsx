import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const Error419 = () => {
    const { t } = useLanguage();

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <ShieldAlert className="h-10 w-10" />
                </div>
                <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
                    419
                </h1>
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                    {t('auth.sessionExpired') || 'Session Expired'}
                </h2>
                <p className="mb-8 text-muted-foreground">
                    {t('error.419Desc') ||
                        'Your session has expired due to inactivity. Please refresh the page to continue.'}
                </p>
                <div className="flex flex-col gap-3">
                    <Button onClick={handleRefresh} className="w-full">
                        {t('common.refresh') || 'Refresh Page'}
                    </Button>
                    <a
                        href="/"
                        className="text-sm text-primary hover:underline"
                    >
                        {t('error.returnHome')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Error419;
