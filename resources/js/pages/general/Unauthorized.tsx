import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Unauthorized() {
    const { t } = useLanguage();

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-6">
            <div className="max-w-md text-center">
                <h1 className="font-serif text-3xl font-bold text-foreground">
                    {t('auth.unauthorizedTitle')}
                </h1>
                <p className="mt-3 text-muted-foreground">
                    {t('auth.unauthorizedDesc')}
                </p>
                <Button asChild className="mt-6">
                    <Link to="/login">{t('auth.signIn')}</Link>
                </Button>
            </div>
        </main>
    );
}
