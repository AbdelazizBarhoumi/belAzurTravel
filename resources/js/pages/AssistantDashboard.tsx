import {
    Plane,
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
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { cn } from '@/lib/utils';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const inquiries = [
    {
        id: 1,
        client: 'Sarah Johnson',
        subject: {
            fr: 'Demande de surclassement pour la réservation à Santorin',
            ar: 'طلب ترقية الغرفة لحجز سانتوريني',
            en: 'Room upgrade request for Santorini booking',
        },
        time: '2h ago',
        status: 'new',
        priority: 'high',
    },
    {
        id: 2,
        client: 'Mike Chen',
        subject: {
            fr: 'Demande de changement de vol pour le voyage à Bali',
            ar: 'استفسار تغيير رحلة لرحلة بالي',
            en: 'Flight change inquiry for Bali trip',
        },
        time: '4h ago',
        status: 'in-progress',
        priority: 'medium',
    },
    {
        id: 3,
        client: 'Emma Davis',
        subject: {
            fr: 'Demande d’annulation et de remboursement',
            ar: 'طلب إلغاء واسترداد',
            en: 'Cancel and refund request',
        },
        time: '6h ago',
        status: 'new',
        priority: 'high',
    },
    {
        id: 4,
        client: 'James Wilson',
        subject: {
            fr: 'Assistance visa nécessaire pour Dubaï',
            ar: 'مساعدة في التأشيرة مطلوبة لدبي',
            en: 'Visa assistance needed for Dubai',
        },
        time: '1d ago',
        status: 'resolved',
        priority: 'low',
    },
    {
        id: 5,
        client: 'Lisa Brown',
        subject: {
            fr: 'Exigences alimentaires particulières pour le circuit',
            ar: 'متطلبات غذائية خاصة للجولة',
            en: 'Special dietary requirements for tour',
        },
        time: '1d ago',
        status: 'in-progress',
        priority: 'medium',
    },
];

const bookingRequests = [
    {
        id: 'BR-001',
        client: 'Alex Turner',
        destination: { fr: 'Maldives', ar: 'جزر المالديف', en: 'Maldives' },
        dates: {
            fr: '1 avr. - 8 avr. 2026',
            ar: '1 أبريل - 8 أبريل 2026',
            en: 'Apr 1-8, 2026',
        },
        guests: 2,
        status: 'pending',
        statusLabel: {
            fr: 'En attente de validation',
            ar: 'بانتظار المراجعة',
            en: 'Pending Review',
        },
    },
    {
        id: 'BR-002',
        client: 'Nina Patel',
        destination: { fr: 'Tokyo', ar: 'طوكيو', en: 'Tokyo' },
        dates: {
            fr: '20 mars - 27 mars 2026',
            ar: '20 مارس - 27 مارس 2026',
            en: 'Mar 20-27, 2026',
        },
        guests: 4,
        status: 'pending',
        statusLabel: {
            fr: 'En attente de validation',
            ar: 'بانتظار المراجعة',
            en: 'Pending Review',
        },
    },
    {
        id: 'BR-003',
        client: 'Tom Hardy',
        destination: { fr: 'Islande', ar: 'آيسلندا', en: 'Iceland' },
        dates: {
            fr: '5 mai - 12 mai 2026',
            ar: '5 مايو - 12 مايو 2026',
            en: 'May 5-12, 2026',
        },
        guests: 2,
        status: 'approved',
        statusLabel: { fr: 'Approuvé', ar: 'تمت الموافقة', en: 'Approved' },
    },
];

const sidebarLinks = [
    { icon: MessageSquare, labelKey: 'assistant.inquiries', active: true },
    { icon: Calendar, labelKey: 'assistant.bookingRequests' },
    { icon: Users, labelKey: 'assistant.clients' },
    { icon: Settings, labelKey: 'assistant.settings' },
];

const AssistantDashboard = () => {
    const [activeTab, setActiveTab] = useState('assistant.inquiries');
    const [selectedInquiry, setSelectedInquiry] = useState(inquiries[0]);
    const [reply, setReply] = useState('');
    const { lang, t, dir } = useLanguage();
    const isRtl = dir === 'rtl';

    return (
        <div className={cn('flex min-h-screen bg-background', isRtl && 'lg:flex-row-reverse')}>
            <aside
                className={cn(
                    'hidden w-64 flex-col bg-card lg:flex',
                    isRtl ? 'border-l border-border' : 'border-r border-border',
                )}
            >
                <div className={cn('p-6', isRtl && 'text-right')}>
                    <Link to="/" className={cn('flex items-center gap-2', isRtl && 'justify-end')}>
                        <Plane className="h-6 w-6 text-primary" />
                        <span className="font-serif text-xl font-bold text-foreground">
                            Voyageur
                        </span>
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
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {t(link.labelKey)}
                            {link.labelKey === 'assistant.inquiries' && (
                                <span className={`${dir === 'rtl' ? 'mr-auto' : 'ml-auto'} rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground`}>
                                    3
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="border-t border-border p-4">
                    <Link to="/">
                        <Button
                            variant="ghost"
                            className={cn(
                                'w-full gap-2 text-muted-foreground',
                                isRtl ? 'justify-end' : 'justify-start',
                            )}
                        >
                            <LogOut className="h-4 w-4" />{' '}
                            {t('assistant.signOut')}
                        </Button>
                    </Link>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                <header className="border-b border-border bg-card px-6 py-4">
                    <h1 className="font-serif text-2xl font-bold text-foreground">
                        {t('assistant.dashboard')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t('assistant.manage')}
                    </p>
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
                                            selectedInquiry.id === inq.id
                                                ? 'border border-primary/20 bg-primary/5'
                                                : 'hover:bg-muted'
                                        }`}
                                    >
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-foreground">
                                                {inq.client}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {inq.time}
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
                                            {selectedInquiry.client}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {localize(
                                                selectedInquiry.subject,
                                                lang,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                <div className="mb-4 max-w-lg rounded-2xl bg-muted p-4">
                                    <p className="text-sm text-foreground">
                                        {localize(
                                            selectedInquiry.subject,
                                            lang,
                                        )}
                                    </p>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {selectedInquiry.time}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-border p-4">
                                <div className="flex gap-3">
                                    <input
                                        value={reply}
                                        onChange={(e) =>
                                            setReply(e.target.value)
                                        }
                                        placeholder="Type your reply..."
                                        className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <Button className="gap-2 rounded-xl bg-primary px-6 text-primary-foreground">
                                        <Send className="h-4 w-4" />{' '}
                                        {t('assistant.send')}
                                    </Button>
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
                                                Guests
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                {t('admin.status')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                Actions
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
                                                    {br.id}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-foreground">
                                                    {br.client}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {localize(
                                                        br.destination,
                                                        lang,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {localize(br.dates, lang)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {br.guests}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                            br.status ===
                                                            'approved'
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'bg-secondary/10 text-secondary'
                                                        }`}
                                                    >
                                                        {localize(
                                                            br.statusLabel,
                                                            lang,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="flex gap-2 px-6 py-4">
                                                    <Button
                                                        size="sm"
                                                        className="gap-1 bg-primary text-xs text-primary-foreground"
                                                    >
                                                        <CheckCircle className="h-3 w-3" />{' '}
                                                        {t('assistant.approve')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 text-xs"
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
                            <p className="text-sm text-muted-foreground">
                                View and manage client profiles and their
                                booking history.
                            </p>
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
                            <p className="text-sm text-muted-foreground">
                                Configure your notification preferences and
                                availability status.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AssistantDashboard;
