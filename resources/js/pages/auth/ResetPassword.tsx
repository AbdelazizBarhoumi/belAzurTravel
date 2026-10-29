import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { buildRequestHeaders } from '@/api/requestHeaders';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

/** Landing page of the reset link Fortify emails: /reset-password/{token}?email=… */
const ResetPassword = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { token = '' } = useParams();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') ?? '');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const mismatch =
        passwordConfirmation.length > 0 && password !== passwordConfirmation;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mismatch) return;
        setIsSubmitting(true);
        setErrors({});

        try {
            const res = await fetch('/reset-password', {
                method: 'POST',
                credentials: 'include',
                headers: buildRequestHeaders({
                    headers: { 'Content-Type': 'application/json' },
                }),
                body: JSON.stringify({
                    token,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                }),
            });

            if (res.ok) {
                toast.success(t('auth.passwordResetDone'));
                navigate('/login', { replace: true });
                return;
            }

            const data = await res.json().catch(() => ({}));
            setErrors(data.errors ?? {});
            toast.error(data.message || t('common.error'));
        } catch {
            toast.error(t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const fieldError = (key: string) =>
        errors[key]?.[0] ? (
            <p className="text-sm text-destructive">{errors[key][0]}</p>
        ) : null;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="flex justify-center">
                    <BrandLogo imageClassName="h-10 w-auto" />
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm"
                >
                    <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-center font-serif text-2xl font-bold text-foreground">
                        {t('auth.resetTitle')}
                    </h1>

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
                        {fieldError('email')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t('client.newPassword')}</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {fieldError('password')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">
                            {t('auth.confirmPassword')}
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            value={passwordConfirmation}
                            onChange={(e) =>
                                setPasswordConfirmation(e.target.value)
                            }
                            required
                        />
                        {mismatch && (
                            <p className="text-sm text-destructive">
                                {t('auth.passwordMismatch')}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || mismatch || !token}
                    >
                        {isSubmitting
                            ? t('common.loading')
                            : t('auth.resetSubmit')}
                    </Button>

                    <p className="text-center text-sm">
                        <Link
                            to="/forgot-password"
                            className="text-primary hover:underline"
                        >
                            {t('auth.requestNewLink')}
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
