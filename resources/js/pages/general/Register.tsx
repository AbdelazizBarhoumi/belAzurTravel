import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(t('register.success'));
        navigate('/dashboard');
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
                <div className="absolute inset-0 bg-primary/30" />
                <div className="absolute bottom-12 left-12 right-12">
                    <p className="font-serif text-3xl font-bold leading-tight text-primary-foreground">
                        {t('auth.registerQuote')}
                    </p>
                    <p className="mt-3 text-sm text-primary-foreground/70">
                        — {t('auth.registerQuoteAuthor')}
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
                        <BrandLogo imageClassName="h-7 w-auto" />
                    </Link>

                    <div className="mb-6 flex justify-end">
                        <LanguageSwitcher />
                    </div>

                    <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
                        {t('register.title')}
                    </h1>
                    <p className="mb-8 text-muted-foreground">
                        {t('register.subtitle')}
                    </p>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={t('register.fullName')}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                required
                            />
                        </div>
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

                        <label className="flex items-start gap-2 text-sm text-muted-foreground">
                            <input
                                type="checkbox"
                                className="mt-1 rounded border-border"
                                required
                            />
                            {t('register.agreeTerms')}
                        </label>

                        <Button
                            type="submit"
                            className="w-full rounded-xl bg-primary py-3 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                            {t('register.title')}
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
