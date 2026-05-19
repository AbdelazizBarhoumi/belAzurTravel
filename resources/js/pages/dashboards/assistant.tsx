import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    MessageSquare,
    Calendar,
    Users,
    LogOut,
    Settings,
    Search,
    Send,
    CheckCircle,
    AlertCircle,
    User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { logout } from '@/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { cn } from '@/lib/utils';

type LocalizedText = Record<Lang, string>;

type Inquiry = {
    id: number;
    client: { name: string; email: string };
    subject: LocalizedText;
    message: LocalizedText;
    status: 'new' | 'in-progress' | 'resolved';
    priority: 'high' | 'medium' | 'low';
    replies: Array<{ author: string; message: string; created_at: string }>;
    created_at: string;
};

type AssistantBooking = {
    id: number;
    client: { name?: string; email?: string };
    type: string;
    items: Array<{ slug?: string; qty?: number }>;
    start_date?: string;
    end_date?: string;
    total_amount: number;
    status: 'Pending' | 'Confirmed' | 'Cancelled';
    created_at: string;
};

type AssistantClient = {
    id: number;
    name: string;
    email: string;
    active: boolean;
    joined: string;
    bookings: number;
};

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang] || value.en || value.fr || value.ar || '';
}

const sidebarLinks = [
    { icon: MessageSquare, labelKey: 'assistant.inquiries', active: true },
    { icon: Calendar, labelKey: 'assistant.bookingRequests' },
    { icon: Users, labelKey: 'assistant.clients' },
    { icon: Settings, labelKey: 'assistant.settings' },
];

const AssistantDashboard = () => {
    const [activeTab, setActiveTab] = useState('assistant.inquiries');
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(
        null,
    );
    const [reply, setReply] = useState('');
    const [available, setAvailable] = useState(true);
    const { lang, t, dir } = useLanguage();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isRtl = dir === 'rtl';

    // Authorization is handled by the route-level guard (RoleGuard).
    // Do not perform client-side localStorage role checks here.

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const { data: summary } = useQuery({
        queryKey: ['assistant', 'summary'],
        queryFn: () =>
            apiFetch<{
                newInquiries: number;
                pendingBookings: number;
                activeClients: number;
                resolvedToday: number;
            }>('/api/assistant/summary'),
    });
    const { data: inquiries = [] } = useQuery({
        queryKey: ['assistant', 'inquiries'],
        queryFn: () => apiFetch<Inquiry[]>('/api/assistant/inquiries'),
    });
    const { data: bookingRequests = [] } = useQuery({
        queryKey: ['assistant', 'bookings'],
        queryFn: () => apiFetch<AssistantBooking[]>('/api/assistant/bookings'),
    });
    const { data: clients = [] } = useQuery({
        queryKey: ['assistant', 'clients'],
        queryFn: () => apiFetch<AssistantClient[]>('/api/assistant/clients'),
    });

    useEffect(() => {
        if (!selectedInquiry && inquiries.length > 0) {
            // Defer setting selected inquiry to avoid synchronous setState inside effect
            const id = setTimeout(() => setSelectedInquiry(inquiries[0]), 0);
            return () => clearTimeout(id);
        }
    }, [inquiries, selectedInquiry]);

    const updateInquiry = useMutation({
        mutationFn: (input: { id: number; status: Inquiry['status'] }) =>
            apiFetch<Inquiry>(`/api/assistant/inquiries/${input.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: input.status }),
            }),
        onSuccess: (inquiry) => {
            setSelectedInquiry(inquiry);
            queryClient.invalidateQueries({ queryKey: ['assistant'] });
        },
    });

    const sendReply = useMutation({
        mutationFn: () =>
            apiFetch<Inquiry>(
                `/api/assistant/inquiries/${selectedInquiry?.id}/reply`,
                {
                    method: 'POST',
                    body: JSON.stringify({ message: reply }),
                },
            ),
        onSuccess: (inquiry) => {
            setReply('');
            setSelectedInquiry(inquiry);
            toast.success(t('assistant.replySent'));
            queryClient.invalidateQueries({ queryKey: ['assistant'] });
        },
    });

    const bookingAction = useMutation({
        mutationFn: (input: { id: number; action: 'confirm' | 'cancel' }) =>
            apiFetch(`/api/assistant/bookings/${input.id}/${input.action}`, {
                method: 'POST',
            }),
        onSuccess: () => {
            toast.success(t('actions.saved'));
            queryClient.invalidateQueries({ queryKey: ['assistant'] });
        },
    });

    const statusMutation = useMutation({
        mutationFn: (next: boolean) =>
            apiFetch('/api/assistant/status', {
                method: 'PUT',
                body: JSON.stringify({ available: next }),
            }),
        onSuccess: (_, next) => {
            setAvailable(next);
            toast.success(t('actions.saved'));
        },
    });

    const newCount =
        summary?.newInquiries ??
        inquiries.filter((inq) => inq.status === 'new').length;

    return (
        <div
            className={cn(
                'flex min-h-screen bg-background',
                isRtl && 'lg:flex-row-reverse',
            )}
        >
            <aside
                className={cn(
                    'hidden w-64 flex-col bg-card lg:flex',
                    isRtl ? 'border-l border-border' : 'border-r border-border',
                )}
            >
                <div className={cn('p-6', isRtl && 'text-right')}>
                    <Link
                        to="/"
                        className={cn(
                            'flex items-center gap-2',
                            isRtl && 'justify-end',
                        )}
                    >
                        <BrandLogo imageClassName="h-7 w-auto" />
                    </Link>
                    <span className="mt-1 block text-xs text-muted-foreground">
                        {t('assistant.panel')}
                    </span>
                </div>

                <nav className="flex-1 space-y-1 px-4">
                    {sidebarLinks.map((link) => (
                        <button
                            key={link.labelKey}
                            onClick={() => setActiveTab(link.labelKey)}
                            className={cn(
                                'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                                isRtl && 'text-right',
                                activeTab === link.labelKey
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {t(link.labelKey)}
                            {link.labelKey === 'assistant.inquiries' && (
                                <span
                                    className={`${dir === 'rtl' ? 'mr-auto' : 'ml-auto'} rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground`}
                                >
                                    {newCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="border-t border-border p-4">
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className={cn(
                            'w-full gap-2 text-muted-foreground',
                            isRtl ? 'justify-end' : 'justify-start',
                        )}
                    >
                        <LogOut className="h-4 w-4" /> {t('assistant.signOut')}
                    </Button>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                <header className="border-b border-border bg-card px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="font-serif text-2xl font-bold text-foreground">
                                {t('assistant.dashboard')}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t('assistant.manage')}
                            </p>
                        </div>
                        <NotificationBell feedPath="/assistant/notifications" />
                    </div>
                </header>

                {activeTab === 'assistant.inquiries' && (
                    <div className="flex h-[calc(100vh-80px)]">
                        <div className="w-96 overflow-auto border-r border-border">
                            <div className="p-4">
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        placeholder={t(
                                            'assistant.searchInquiries',
                                        )}
                                        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                {inquiries.map((inq) => (
                                    <button
                                        key={inq.id}
                                        onClick={() => setSelectedInquiry(inq)}
                                        className={`mb-2 w-full rounded-xl p-4 text-left transition-all ${
                                            selectedInquiry?.id === inq.id
                                                ? 'border border-primary/20 bg-primary/5'
                                                : 'hover:bg-muted'
                                        }`}
                                    >
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-foreground">
                                                {inq.client.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(
                                                    inq.created_at,
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {localize(inq.subject, lang)}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    inq.status === 'new'
                                                        ? 'bg-destructive/10 text-destructive'
                                                        : inq.status ===
                                                            'in-progress'
                                                          ? 'bg-secondary/10 text-secondary'
                                                          : 'bg-primary/10 text-primary'
                                                }`}
                                            >
                                                {inq.status}
                                            </span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs ${
                                                    inq.priority === 'high'
                                                        ? 'bg-destructive/10 text-destructive'
                                                        : inq.priority ===
                                                            'medium'
                                                          ? 'bg-secondary/10 text-secondary'
                                                          : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {inq.priority}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col">
                            <div className="border-b border-border p-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">
                                            {selectedInquiry?.client.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedInquiry
                                                ? localize(
                                                      selectedInquiry.subject,
                                                      lang,
                                                  )
                                                : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                <div className="mb-4 max-w-lg rounded-2xl bg-muted p-4">
                                    <p className="text-sm text-foreground">
                                        {selectedInquiry
                                            ? localize(
                                                  selectedInquiry.message,
                                                  lang,
                                              )
                                            : ''}
                                    </p>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {selectedInquiry
                                            ? new Date(
                                                  selectedInquiry.created_at,
                                              ).toLocaleString()
                                            : ''}
                                    </p>
                                </div>
                                {selectedInquiry?.replies.map((item) => (
                                    <div
                                        key={`${item.author}-${item.created_at}`}
                                        className="mb-4 ml-auto max-w-lg rounded-2xl bg-primary p-4 text-primary-foreground"
                                    >
                                        <p className="text-sm">
                                            {item.message}
                                        </p>
                                        <p className="mt-2 text-xs opacity-70">
                                            {item.author} ·{' '}
                                            {new Date(
                                                item.created_at,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-border p-4">
                                <div className="flex gap-3">
                                    <input
                                        value={reply}
                                        onChange={(e) =>
                                            setReply(e.target.value)
                                        }
                                        placeholder={t('assistant.typeReply')}
                                        className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <Button
                                        className="gap-2 rounded-xl bg-primary px-6 text-primary-foreground"
                                        disabled={
                                            !reply.trim() || !selectedInquiry
                                        }
                                        onClick={() => sendReply.mutate()}
                                    >
                                        <Send className="h-4 w-4" />{' '}
                                        {t('assistant.send')}
                                    </Button>
                                    {selectedInquiry?.status !== 'resolved' && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                selectedInquiry &&
                                                updateInquiry.mutate({
                                                    id: selectedInquiry.id,
                                                    status: 'resolved',
                                                })
                                            }
                                        >
                                            {t('assistant.resolve')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'assistant.bookingRequests' && (
                    <div className="p-6">
                        <div className="overflow-hidden rounded-2xl border border-border bg-card">
                            <div className="border-b border-border px-6 py-4">
                                <h2 className="font-serif text-lg font-bold text-foreground">
                                    {t('assistant.pendingRequests')}
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                {t('admin.client')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                {t('admin.destinations')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                {t('admin.date')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                {t('label.guests')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                {t('admin.status')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                {t('admin.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookingRequests.map((br) => (
                                            <tr
                                                key={br.id}
                                                className="border-b border-border transition-colors last:border-0 hover:bg-muted/20"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                    BR-{br.id}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-foreground">
                                                    {br.client.name ??
                                                        t('common.guest')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {br.type}:{' '}
                                                    {br.items
                                                        .map(
                                                            (item) => item.slug,
                                                        )
                                                        .join(', ')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {[
                                                        br.start_date,
                                                        br.end_date,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' - ') ||
                                                        new Date(
                                                            br.created_at,
                                                        ).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    $
                                                    {Number(
                                                        br.total_amount,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                            br.status ===
                                                            'Confirmed'
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'bg-secondary/10 text-secondary'
                                                        }`}
                                                    >
                                                        {br.status}
                                                    </span>
                                                </td>
                                                <td className="flex gap-2 px-6 py-4">
                                                    <Button
                                                        size="sm"
                                                        className="gap-1 bg-primary text-xs text-primary-foreground"
                                                        disabled={
                                                            br.status ===
                                                            'Confirmed'
                                                        }
                                                        onClick={() =>
                                                            bookingAction.mutate(
                                                                {
                                                                    id: br.id,
                                                                    action: 'confirm',
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <CheckCircle className="h-3 w-3" />{' '}
                                                        {t('assistant.approve')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 text-xs"
                                                        disabled={
                                                            br.status ===
                                                            'Cancelled'
                                                        }
                                                        onClick={() =>
                                                            bookingAction.mutate(
                                                                {
                                                                    id: br.id,
                                                                    action: 'cancel',
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <AlertCircle className="h-3 w-3" />{' '}
                                                        {t('assistant.reject')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'assistant.clients' && (
                    <div className="p-6">
                        <div className="rounded-2xl border border-border bg-card p-8 text-center">
                            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mb-2 font-serif text-lg font-bold text-foreground">
                                {t('assistant.clientManagement')}
                            </h3>
                            <div className="mt-6 overflow-x-auto text-left">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-4 py-2 text-xs uppercase text-muted-foreground">
                                                {t('admin.client')}
                                            </th>
                                            <th className="px-4 py-2 text-xs uppercase text-muted-foreground">
                                                {t('admin.email')}
                                            </th>
                                            <th className="px-4 py-2 text-xs uppercase text-muted-foreground">
                                                {t('admin.bookings')}
                                            </th>
                                            <th className="px-4 py-2 text-xs uppercase text-muted-foreground">
                                                {t('admin.status')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map((client) => (
                                            <tr
                                                key={client.id}
                                                className="border-b border-border"
                                            >
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    {client.name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {client.email}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {client.bookings}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {client.active
                                                        ? t('admin.active')
                                                        : t('admin.inactive')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'assistant.settings' && (
                    <div className="p-6">
                        <div className="rounded-2xl border border-border bg-card p-8 text-center">
                            <Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mb-2 font-serif text-lg font-bold text-foreground">
                                {t('assistant.settingsTitle')}
                            </h3>
                            <div className="mt-6 flex items-center justify-center gap-3">
                                <span className="text-sm text-muted-foreground">
                                    {t('assistant.availability')}
                                </span>
                                <Button
                                    variant={available ? 'default' : 'outline'}
                                    onClick={() =>
                                        statusMutation.mutate(!available)
                                    }
                                >
                                    {available
                                        ? t('assistant.available')
                                        : t('assistant.unavailable')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AssistantDashboard;
