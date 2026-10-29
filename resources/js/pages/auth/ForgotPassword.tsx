import { ArrowLeft, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { buildRequestHeaders } from '@/api/requestHeaders';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

const ForgotPassword = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/forgot-password', {
                method: 'POST',
                credentials: 'include',
                headers: buildRequestHeaders({
                    headers: { 'Content-Type': 'application/json' },
                }),
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setSent(true);
                return;
            }

            const data = await res.json().catch(() => ({}));
            const message =
                data.errors?.email?.[0] || data.message || t('common.error');
            setError(message);
            toast.error(message);
        } catch {
            toast.error(t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="flex justify-center">
                    <BrandLogo imageClassName="h-10 w-auto" />
                </div>

                <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-center font-serif text-2xl font-bold text-foreground">
                        {t('auth.forgotTitle')}
                    </h1>

                    {sent ? (
                        <p className="mt-4 text-center text-muted-foreground">
                            {t('auth.resetLinkSent')}
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <p className="text-center text-sm text-muted-foreground">
                                {t('auth.forgotDescription')}
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('label.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                {error && (
                                    <p className="text-sm text-destructive">
                                        {error}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting || !email}
                            >
                                {isSubmitting
                                    ? t('common.loading')
                                    : t('auth.sendResetLink')}
                            </Button>
                        </form>
                    )}
                </div>

                <div className="flex justify-center">
                    <Link
                        to="/login"
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                        {t('auth.backToLogin')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
