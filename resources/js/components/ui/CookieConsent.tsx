import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buildRequestHeaders } from '@/api/requestHeaders';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';

function getCookie(name: string) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()};SameSite=Lax`;
}

export default function CookieConsent() {
    const { t } = useLanguage();
    const [dismissed, setDismissed] = useState(false);
    const { data: currentUser } = useAuthUser();

    // Read cookie lazily and compute visibility without setting state inside an effect
    const cookie = typeof window === 'undefined' ? null : getCookie('cookie_consent');
    const visible = !dismissed && !cookie && !(currentUser && currentUser.role === 'admin');

    if (!visible) return null;

    const accept = () => {
        setCookie('cookie_consent', 'accepted');
        setDismissed(true);
        // Optionally notify server about consent for logged-in users
        try {
            void fetch('/api/user/consent', {
                method: 'POST',
                credentials: 'include',
                headers: buildRequestHeaders({
                    headers: { 'Content-Type': 'application/json' },
                }),
                body: JSON.stringify({ consent: 'accepted' }),
            });
        } catch {
            // ignore
        }
    };

    const decline = () => {
        setCookie('cookie_consent', 'declined');
        setDismissed(true);
    };

    return (
        <div className="fixed inset-x-4 bottom-6 z-50 w-auto max-auto rounded-2xl border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="font-semibold">{t('cookie.banner.title')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('cookie.banner.description')}{' '}
                        <Link to="/legal/1" className="font-medium text-primary hover:underline">
                            {t('cookie.learnMore')}
                        </Link>
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <Button variant="ghost" onClick={decline}>
                        {t('cookie.decline')}
                    </Button>
                    <Button onClick={accept}>{t('cookie.accept')}</Button>
                </div>
            </div>
        </div>
    );
}
