import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { buildRequestHeaders } from '@/api/requestHeaders';
import type { AuthUser } from '@/auth';
import { redirectAfterLogin, storeAuthUser } from '@/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect');
    const { t } = useLanguage();
    const { data: currentUser, isPending, isFetching } = useAuthUser();
    const [consentChecked, setConsentChecked] = useState(false);

    useEffect(() => {
        // if global cookie consent already accepted, allow login without extra checkbox
        if (typeof window !== 'undefined') {
            const match = document.cookie.match(
                new RegExp('(^| )' + 'cookie_consent' + '=([^;]+)'),
            );
            const c = match ? decodeURIComponent(match[2]) : null;
            if (c === 'accepted') setConsentChecked(true);
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            const destination =
                redirectTo || redirectAfterLogin(currentUser.role);
            navigate(destination, { replace: true });
        }
    }, [currentUser, navigate, redirectTo]);

    if (isPending || isFetching) {
        return null;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        try {
            const res = await fetch('/login', {
                method: 'POST',
                credentials: 'include',
                headers: buildRequestHeaders({
                    headers: { 'Content-Type': 'application/json' },
                }),
                body: JSON.stringify({ email, password, remember: true }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Login error:', res.status, errorData);

                if (res.status === 422) {
                    setErrors(errorData.errors || {});
                    setPassword('');
                    toast.error(
                        errorData.message || t('auth.invalidCredentials'),
                    );
                } else if (res.status === 419) {
                    toast.error(
                        t('auth.sessionExpired') ||
                            'Session expired. Please refresh the page.',
                    );
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    toast.error(
                        t('auth.loginFailed') ||
                            'Login failed. Please try again.',
                    );
                }
                return;
            }

            const data = (await res.json()) as { user: AuthUser };
            const user = data.user;
            storeAuthUser(user);

            if (user.role === 'admin') {
                toast.success(t('auth.welcomeAdmin'));
            } else {
                toast.success(t('auth.welcomeBack'));
            }

            // Full reload so the new session's CSRF token is embedded in the page
            window.location.href = redirectTo || redirectAfterLogin(user.role);
        } catch (error) {
            console.error('Login catch:', error);
            toast.error(
                t('auth.loginFailed') || 'Login failed. Please try again.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
            <div className="flex flex-1 items-center justify-center p-8 lg:min-h-0">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md"
                >
                    <Link to="/" className="mb-10 flex items-center gap-2">
                        <BrandLogo imageClassName="h-12 w-auto" />
                    </Link>



                    <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
                        {t('auth.welcomeBack')}
                    </h1>
                    <p className="mb-8 text-muted-foreground">
                        {t('auth.signInDesc')}
                    </p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="email"
                                    placeholder={t('auth.email')}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) {
                                            const newErrors = { ...errors };
                                            delete newErrors.email;
                                            setErrors(newErrors);
                                        }
                                    }}
                                    className={`w-full rounded-2xl border bg-background py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                        errors.email
                                            ? 'border-destructive'
                                            : 'border-border'
                                    }`}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs font-medium text-destructive">
                                    {errors.email[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder={t('auth.password')}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) {
                                            const newErrors = { ...errors };
                                            delete newErrors.password;
                                            setErrors(newErrors);
                                        }
                                    }}
                                    className={`w-full rounded-2xl border bg-background py-3 pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                        errors.password
                                            ? 'border-destructive'
                                            : 'border-border'
                                    }`}
                                    required
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                    {showPass ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs font-medium text-destructive">
                                    {errors.password[0]}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col items-start justify-between gap-3 text-sm md:flex-row">
                            <label className="flex items-center gap-2 text-muted-foreground">
                                <input
                                    type="checkbox"
                                    className="rounded border-border"
                                    checked={consentChecked}
                                    onChange={(e) =>
                                        setConsentChecked(e.target.checked)
                                    }
                                    disabled={isSubmitting}
                                />{' '}
                                <span>
                                    {t('auth.rememberMe')} ·{' '}
                                    <a
                                        href="/legal/1"
                                        className="text-primary hover:underline"
                                    >
                                        {t('cookie.learnMore')}
                                    </a>
                                </span>
                            </label>
                            <a
                                href="#"
                                className="text-primary hover:underline"
                            >
                                {t('auth.forgotPassword')}
                            </a>
                        </div>

                        <Button
                            type="submit"
                            className="w-full rounded-2xl bg-primary py-3 text-sm text-primary-foreground hover:bg-primary/90"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
                            ) : (
                                t('auth.signIn')
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        {t('auth.noAccount')}{' '}
                        <Link
                            to="/register"
                            className="font-medium text-primary hover:underline"
                        >
                            {t('auth.signUp')}
                        </Link>
                    </p>
                </motion.div>
            </div>

            <div className="relative hidden h-64 w-1/2 overflow-hidden lg:block lg:h-full">
                <img
                    src="/images/destination-bali.jpg"
                    alt="Beach"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/10" />
                <div className="absolute bottom-12 left-12 right-12"></div>
            </div>
        </div>
    );
};

export default Login;
