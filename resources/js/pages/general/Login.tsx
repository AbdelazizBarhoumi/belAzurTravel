import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { csrfToken } from '@/api/http';
import type { AuthUser } from '@/auth';
import { redirectAfterLogin, storeAuthUser, storedRole } from '@/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const role = storedRole();
        if (role) {
            navigate(redirectAfterLogin(role), { replace: true });
        }
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ email, password, remember: true }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Login error:', res.status, errorData);
                throw new Error('Login failed');
            }

            const data = (await res.json()) as { user: AuthUser };
            const user = data.user;
            storeAuthUser(user);

            if (user.role === 'admin') {
                toast.success(t('auth.welcomeAdmin'));
            } else if (user.role === 'assistant') {
                toast.success(t('auth.welcomeAssistant'));
            } else {
                toast.success(t('auth.welcomeBack'));
            }

            navigate(redirectAfterLogin(user.role), { replace: true });
        } catch (error) {
            console.error('Login catch:', error);
            toast.error('Invalid email or password');
        }
    };

    return (
        <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
            <div className="flex flex-1 items-center justify-center p-8 lg:min-h-0">
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
                    <Link to="/" className="mb-10 flex items-center gap-2">
                        <BrandLogo imageClassName="h-7 w-auto" />
                    </Link>

                    <div className="mb-6 flex justify-end">
                        <LanguageSwitcher />
                    </div>

                    <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
                        {t('auth.welcomeBack')}
                    </h1>
                    <p className="mb-8 text-muted-foreground">{t('auth.signInDesc')}</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input type={showPass ? 'text' : 'password'} placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-muted-foreground">
                                <input type="checkbox" className="rounded border-border" /> {t('auth.rememberMe')}
                            </label>
                            <a href="#" className="text-primary hover:underline">{t('auth.forgotPassword')}</a>
                        </div>

                        <Button type="submit" className="w-full rounded-xl bg-primary py-3 text-sm text-primary-foreground hover:bg-primary/90">{t('auth.signIn')}</Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        {t('auth.noAccount')}{' '}
                        <Link to="/register" className="font-medium text-primary hover:underline">{t('auth.signUp')}</Link>
                    </p>
                </motion.div>
            </div>

            <div className="relative hidden h-64 w-1/2 overflow-hidden lg:block lg:h-full">
                <img src="/images/destination-bali.jpg" alt="Beach" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-primary/30" />
                <div className="absolute bottom-12 left-12 right-12">
                    <p className="font-serif text-3xl font-bold leading-tight text-primary-foreground">{t('auth.loginQuote')}</p>
                    <p className="mt-3 text-sm text-primary-foreground/70">— {t('auth.loginQuoteAuthor')}</p>
                </div>
            </div>
        </div>
    );
};

export default Login;