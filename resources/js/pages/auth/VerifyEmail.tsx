import { Mail, LogOut, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { buildRequestHeaders } from '@/api/requestHeaders';
import { logout, redirectAfterLogin } from '@/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';

const VerifyEmail = () => {
    useLanguage();
    const navigate = useNavigate();
    const { data: user, refetch } = useAuthUser();
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (user?.email_verified_at) {
            navigate(redirectAfterLogin(user.role), { replace: true });
        }
    }, [navigate, user]);

    const handleResend = async () => {
        setIsResending(true);
        try {
            const res = await fetch('/email/verification-notification', {
                method: 'POST',
                headers: buildRequestHeaders({
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }),
            });

            if (res.ok) {
                toast.success('Verification link sent!');
            } else {
                toast.error('Failed to resend link. Please try again later.');
            }
        } catch {
            toast.error('An error occurred.');
        } finally {
            setIsResending(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const handleRefresh = async () => {
        const { data } = await refetch();
        if (data?.email_verified_at) {
            toast.success('Email verified!');
            navigate(redirectAfterLogin(data.role ?? user?.role ?? 'client'), {
                replace: true,
            });
        } else {
            toast.info('Email not yet verified. Please check your inbox.');
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="flex justify-center">
                    <BrandLogo imageClassName="h-10 w-auto" />
                </div>

                <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>

                    <h1 className="font-serif text-2xl font-bold text-foreground">
                        Verify your email
                    </h1>
                    <p className="mt-4 text-muted-foreground">
                        Thanks for signing up! Before getting started, could you
                        verify your email address by clicking on the link we
                        just emailed to you? If you didn't receive the email, we
                        will gladly send you another.
                    </p>

                    <div className="mt-8 flex flex-col gap-3">
                        <Button
                            onClick={handleResend}
                            disabled={isResending}
                            className="w-full"
                        >
                            <Send className="mr-2 h-4 w-4" />
                            {isResending
                                ? 'Sending...'
                                : 'Resend Verification Email'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            className="w-full"
                        >
                            I've verified my email
                        </Button>
                    </div>
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
