import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { buildRequestHeaders } from '@/api/requestHeaders';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';

import { useLanguage } from '@/contexts/LanguageContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const { t } = useLanguage();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        try {
            const res = await fetch('/register', {
                method: 'POST',
                credentials: 'include',
                headers: buildRequestHeaders({
                    headers: { 'Content-Type': 'application/json' },
                }),
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    password_confirmation: password, // Fortify usually requires this
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Registration error:', res.status, errorData);

                if (res.status === 422) {
                    setErrors(errorData.errors || {});
                    setPassword('');
                    toast.error(errorData.message || t('register.failed'));
                } else if (res.status === 419) {
                    toast.error(
                        t('auth.sessionExpired') ||
                            'Session expired. Please refresh the page.',
                    );
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    toast.error(errorData.message || t('register.failed'));
                }
                return;
            }

            toast.success(t('register.success'));
            // Fortify auto-logs in after registration; reload for fresh session + CSRF
            window.location.href = '/dashboard';
        } catch (error: unknown) {
            console.error('Registration catch:', error);
            const msg =
                (error as { message?: string })?.message ||
                t('register.failed');
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
            {/* Left - Image */}
            <div className="relative hidden h-64 w-1/2 overflow-hidden lg:block lg:h-full">
                <img
                    src="/images/destination-paris.jpg"
                    alt="Travel landscape"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/10" />
                <div className="absolute bottom-12 left-12 right-12">
                    <p className="font-serif text-3xl font-bold leading-tight text-primary-foreground">
                        {t('auth.registerQuote')}
                    </p>
                </div>
            </div>

            {/* Right - Form */}
            <div className="flex flex-1 items-center justify-center p-8 lg:min-h-0">
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md"
                >
                    <Link to="/" className="mb-10 flex items-center gap-2">
                        <BrandLogo imageClassName="h-12 w-auto" />
                    </Link>



                    <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
                        {t('register.title')}
                    </h1>
                    <p className="mb-8 text-muted-foreground">
                        {t('register.subtitle')}
                    </p>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={t('register.fullName')}
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) {
                                            const newErrors = { ...errors };
                                            delete newErrors.name;
                                            setErrors(newErrors);
                                        }
                                    }}
                                    className={`w-full rounded-xl border bg-background py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                        errors.name
                                            ? 'border-destructive'
                                            : 'border-border'
                                    }`}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.name && (
                                <p className="text-xs font-medium text-destructive">
                                    {errors.name[0]}
                                </p>
                            )}
                        </div>

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
                                    className={`w-full rounded-xl border bg-background py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
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
                                    className={`w-full rounded-xl border bg-background py-3 pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
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

                        <label className="flex items-start gap-2 text-sm text-muted-foreground">
                            <input
                                type="checkbox"
                                className="mt-1 rounded border-border"
                                required
                                disabled={isSubmitting}
                            />
                            {t('register.agreeTerms')}
                        </label>

                        <Button
                            type="submit"
                            className="w-full rounded-xl bg-primary py-3 text-sm text-primary-foreground hover:bg-primary/90"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
                            ) : (
                                t('register.title')
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        {t('auth.alreadyAccount')}{' '}
                        <Link
                            to="/login"
                            className="font-medium text-primary hover:underline"
                        >
                            {t('auth.signIn')}
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
