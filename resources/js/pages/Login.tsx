import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [role, setRole] = useState<'client' | 'admin' | 'assistant'>(
        'client',
    );
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('role', role);
        localStorage.setItem('userEmail', email);
        if (role === 'admin') {
            toast.success(t('auth.welcomeAdmin'));
            navigate('/admin');
        } else if (role === 'assistant') {
            toast.success(t('auth.welcomeAssistant'));
            navigate('/assistant');
        } else {
            toast.success(t('auth.welcomeBack'));
            navigate('/dashboard');
        }
    };

    return (
        <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
            {/* Left - Form */}
            <div className="flex flex-1 items-center justify-center p-8 lg:min-h-0">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md"
                >
                    <Link to="/" className="mb-10 flex items-center gap-2">
                        <BrandLogo imageClassName="h-7 w-auto" />
                    </Link>

                    <div className="mb-6 flex justify-end">
                        <LanguageSwitcher />
                    </div>

                    <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
                        {t('auth.welcomeBack')}
                    </h1>
                    <p className="mb-8 text-muted-foreground">
                        {t('auth.signInDesc')}
                    </p>

                    {/* Role selector */}
                    <div className="mb-6 flex gap-2 rounded-xl bg-muted p-1">
                        {(['client', 'admin', 'assistant'] as const).map(
                            (r) => (
                                <button
                                    key={r}
                                    onClick={() => setRole(r)}
                                    className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all ${
                                        role === r
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {t(`auth.${r}`)}
                                </button>
                            ),
                        )}
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="email"
                                placeholder={t('auth.email')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type={showPass ? 'text' : 'password'}
                                placeholder={t('auth.password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                required
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

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-muted-foreground">
                                <input
                                    type="checkbox"
                                    className="rounded border-border"
                                />{' '}
                                {t('auth.rememberMe')}
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
                            className="w-full rounded-xl bg-primary py-3 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                            {t('auth.signIn')}
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

            {/* Right - Image */}
            <div className="relative hidden h-64 w-1/2 overflow-hidden lg:block lg:h-full">
                <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=1600&fit=crop"
                    alt="Beach"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/30" />
                <div className="absolute bottom-12 left-12 right-12">
                    <p className="font-serif text-3xl font-bold leading-tight text-primary-foreground">
                        {t('auth.loginQuote')}
                    </p>
                    <p className="mt-3 text-sm text-primary-foreground/70">
                        — {t('auth.loginQuoteAuthor')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
