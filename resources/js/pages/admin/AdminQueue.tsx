import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    CheckCheck,
    ChevronRight,
    Clock,
    Inbox,
    RefreshCcw,
    Send,
    X,
} from 'lucide-react';
import {
    adminCancelBooking,
    approveBooking,
    rejectBooking,
} from '@/api/booking.api';
import {
    replyToComplaint,
    resolveComplaint,
    updateAdminComplaint,
} from '@/api/complaint.api';
import {
    getAdminQueue,
    replyToSupportInquiry,
    updateSupportInquiry,
    type AdminQueuePayload,
    type QueueBooking,
    type QueueComplaint,
    type QueueSection,
    type QueueSupportInquiry,
} from '@/api/queue.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { bookingStatusLabels } from '@/lib/adminI18n';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
    pending: 'bg-secondary/10 text-secondary',
    in_review: 'bg-blue-100 text-blue-700',
    new: 'bg-secondary/10 text-secondary',
    'in-progress': 'bg-blue-100 text-blue-700',
    resolved: 'bg-primary/10 text-primary',
    rejected: 'bg-destructive/10 text-destructive',
    refunded: 'bg-green-100 text-green-700',
};

const priorityColors: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-secondary/10 text-secondary',
    high: 'bg-destructive/10 text-destructive',
};

const bookingStatusColors: Record<string, string> = {
    Pending: 'bg-secondary/10 text-secondary',
    Approved: 'bg-blue-100 text-blue-700',
    Confirmed: 'bg-primary/10 text-primary',
    Rejected: 'bg-destructive/10 text-destructive',
    Cancelled: 'bg-destructive/10 text-destructive',
    Expired: 'bg-muted text-muted-foreground',
    Completed: 'bg-green-100 text-green-700',
};

const auditActionColors: Record<string, string> = {
    created: 'bg-muted text-muted-foreground',
    submitted: 'bg-secondary/10 text-secondary',
    approved: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-primary/10 text-primary',
    rejected: 'bg-destructive/10 text-destructive',
    cancelled: 'bg-destructive/10 text-destructive',
    expired: 'bg-muted text-muted-foreground',
    completed: 'bg-green-100 text-green-700',
    updated: 'bg-muted text-muted-foreground',
};

type Detail =
    | { kind: 'booking'; item: QueueBooking }
    | { kind: 'complaint'; item: QueueComplaint }
    | { kind: 'support'; item: QueueSupportInquiry };

const SECTIONS: Array<{ key: QueueSection; labelKey: string }> = [
    { key: 'bookings', labelKey: 'admin.queue.tab.bookings' },
    { key: 'complaints', labelKey: 'admin.queue.tab.complaints' },
    { key: 'refund_requests', labelKey: 'admin.queue.tab.refunds' },
    { key: 'support', labelKey: 'admin.queue.tab.support' },
];

function localize(
    lang: string,
    value?: Record<string, string> | string | null,
): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[lang] || value.en || value.fr || value.ar || '';
}

function CloudIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
        >
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
    );
}

function EmptyState() {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p>{t('admin.queue.empty')}</p>
        </div>
    );
}

const AdminQueue = () => {
    useAdminGuard();
    const { t, lang, dir } = useLanguage();
    const queryClient = useQueryClient();
    const isRtl = dir === 'rtl';

    const [searchParams, setSearchParams] = useSearchParams();
    const validTabs: QueueSection[] = ['bookings', 'complaints', 'refund_requests', 'support'];
    const initialTab = validTabs.includes(searchParams.get('tab') as QueueSection)
        ? (searchParams.get('tab') as QueueSection)
        : 'bookings';
    const [activeTab, setActiveTab] = useState<QueueSection>(initialTab);

    const setActiveTabWithParam = (tab: QueueSection) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };
    const [detail, setDetail] = useState<Detail | null>(null);
    const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
    const [refundAmounts, setRefundAmounts] = useState<Record<number, string>>(
        {},
    );

    const { data, isLoading } = useQuery<AdminQueuePayload>({
        queryKey: ['admin-queue'],
        queryFn: getAdminQueue,
        staleTime: 15_000,
        refetchInterval: 30_000,
    });

    const refresh = () => {
        queryClient.invalidateQueries({
            queryKey: ['admin-queue', 'admin-queue-counts'],
        });
    };

    const bookingActionMutation = useMutation({
        mutationFn: ({
            id,
            action,
        }: {
            id: number;
            action: 'approve' | 'reject' | 'cancel';
        }) => {
            if (action === 'approve') return approveBooking(id);
            if (action === 'reject') {
                const reason = window.prompt(
                    t('admin.rejectReasonPrompt') || 'Reason for rejection:',
                );
                if (!reason?.trim()) {
                    throw new Error('Rejection reason is required');
                }
                return rejectBooking(id, reason.trim());
            }
            return adminCancelBooking(id);
        },
        onSuccess: () => {
            refresh();
            toast.success(t('actions.updated'));
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        },
    });

    const complaintMutation = useMutation({
        mutationFn: ({
            id,
            data: patch,
        }: {
            id: number;
            data: {
                status?: string;
                priority?: string;
                refund_amount?: number;
            };
        }) => updateAdminComplaint(id, patch),
        onSuccess: () => {
            refresh();
            toast.success(t('actions.updated'));
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        },
    });

    const complaintReplyMutation = useMutation({
        mutationFn: ({ id, message }: { id: number; message: string }) =>
            replyToComplaint(id, message),
        onSuccess: (_data, variables) => {
            refresh();
            setReplyDrafts((prev) => ({ ...prev, [variables.id]: '' }));
            toast.success(t('client.adminReplySent') || 'Reply sent.');
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        },
    });

    const resolveMutation = useMutation({
        mutationFn: (id: number) => resolveComplaint(id),
        onSuccess: () => {
            refresh();
            toast.success(t('actions.resolved') || 'Resolved.');
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        },
    });

    const supportMutation = useMutation({
        mutationFn: ({
            id,
            data: patch,
        }: {
            id: number;
            data: { status?: string; priority?: string };
        }) => updateSupportInquiry(id, patch),
        onSuccess: () => {
            refresh();
            toast.success(t('actions.updated'));
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        },
    });

    const supportReplyMutation = useMutation({
        mutationFn: ({ id, message }: { id: number; message: string }) =>
            replyToSupportInquiry(id, message),
        onSuccess: (_data, variables) => {
            refresh();
            setReplyDrafts((prev) => ({ ...prev, [variables.id]: '' }));
            toast.success(t('client.adminReplySent') || 'Reply sent.');
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        },
    });

    const counts = data?.counts;
    const countFor = (section: QueueSection) => counts?.[section] ?? 0;

    const openDetail = (kind: Detail['kind'], item: Detail['item']) =>
        setDetail({ kind, item } as Detail);

    return (
        <AdminLayout
            title={t('admin.queue')}
            subtitle={t('admin.queueSubtitle')}
            actions={
                <Button
                    size="sm"
                    variant="outline"
                    onClick={refresh}
                    className="gap-2"
                >
                    <RefreshCcw className="h-4 w-4" />
                    {t('admin.queue.refresh')}
                </Button>
            }
        >
            {/* Section tabs */}
            <div className="flex flex-wrap gap-2">
                {SECTIONS.map((section) => (
                    <button
                        key={section.key}
                        type="button"
                        onClick={() => setActiveTabWithParam(section.key)}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                            activeTab === section.key
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                    >
                        {t(section.labelKey)}
                        <span
                            className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-bold',
                                activeTab === section.key
                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                    : 'bg-secondary/10 text-secondary',
                            )}
                        >
                            {countFor(section.key)}
                        </span>
                    </button>
                ))}
            </div>

            <div className="mt-4">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-16 animate-pulse rounded-2xl border border-border bg-card"
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        {activeTab === 'bookings' && (
                            <BookingsTable
                                bookings={data?.bookings ?? []}
                                onOpen={(item) => openDetail('booking', item)}
                            />
                        )}
                        {activeTab === 'complaints' && (
                            <ComplaintsTable
                                items={data?.complaints ?? []}
                                onOpen={(item) => openDetail('complaint', item)}
                            />
                        )}
                        {activeTab === 'refund_requests' && (
                            <ComplaintsTable
                                items={data?.refund_requests ?? []}
                                onOpen={(item) => openDetail('complaint', item)}
                            />
                        )}
                        {activeTab === 'support' && (
                            <SupportTable
                                items={data?.support ?? []}
                                onOpen={(item) => openDetail('support', item)}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Drill-in detail drawer */}
            <Sheet
                open={detail !== null}
                onOpenChange={(open) => {
                    if (!open) setDetail(null);
                }}
            >
                <SheetContent
                    side={isRtl ? 'left' : 'right'}
                    className="w-full overflow-y-auto sm:max-w-md"
                >
                    {detail && (
                        <SheetHeader className="text-start">
                            <SheetTitle>
                                {detail.kind === 'booking' && (
                                    <>
                                        {t('admin.booking')} #{detail.item.id}
                                    </>
                                )}
                                {detail.kind === 'complaint' && (
                                    <>
                                        {t('admin.queue.detail')} —{' '}
                                        {t(
                                            `complaint.type.${detail.item.type}`,
                                        )}{' '}
                                        #{detail.item.id}
                                    </>
                                )}
                                {detail.kind === 'support' && (
                                    <>
                                        {t('admin.queue.detail')} —{' '}
                                        {t('admin.queue.tab.support')} #
                                        {detail.item.id}
                                    </>
                                )}
                            </SheetTitle>
                        </SheetHeader>
                    )}

                    <div className="mt-4 space-y-4">
                        {detail?.kind === 'booking' && (
                            <BookingDetail
                                booking={detail.item}
                                onApprove={() =>
                                    bookingActionMutation.mutate({
                                        id: detail.item.id,
                                        action: 'approve',
                                    })
                                }
                                onReject={() =>
                                    bookingActionMutation.mutate({
                                        id: detail.item.id,
                                        action: 'reject',
                                    })
                                }
                                onCancel={() =>
                                    bookingActionMutation.mutate({
                                        id: detail.item.id,
                                        action: 'cancel',
                                    })
                                }
                                pending={
                                    bookingActionMutation.isPending &&
                                    bookingActionMutation.variables?.id ===
                                        detail.item.id
                                }
                            />
                        )}
                        {detail?.kind === 'complaint' && (
                            <ComplaintDetail
                                complaint={detail.item}
                                draft={replyDrafts[detail.item.id] ?? ''}
                                onDraftChange={(value) =>
                                    setReplyDrafts((prev) => ({
                                        ...prev,
                                        [detail.item.id]: value,
                                    }))
                                }
                                onReply={() =>
                                    complaintReplyMutation.mutate({
                                        id: detail.item.id,
                                        message:
                                            replyDrafts[detail.item.id] ?? '',
                                    })
                                }
                                onResolve={() =>
                                    resolveMutation.mutate(detail.item.id)
                                }
                                onStatus={(status) =>
                                    complaintMutation.mutate({
                                        id: detail.item.id,
                                        data: { status },
                                    })
                                }
                                refundAmount={
                                    refundAmounts[detail.item.id] ?? ''
                                }
                                onRefundAmountChange={(value) =>
                                    setRefundAmounts((prev) => ({
                                        ...prev,
                                        [detail.item.id]: value,
                                    }))
                                }
                                onMarkRefunded={() =>
                                    complaintMutation.mutate({
                                        id: detail.item.id,
                                        data: {
                                            status: 'refunded',
                                            refund_amount: parseInt(
                                                refundAmounts[detail.item.id] ??
                                                    '0',
                                                10,
                                            ),
                                        },
                                    })
                                }
                                busy={
                                    complaintReplyMutation.isPending ||
                                    resolveMutation.isPending ||
                                    complaintMutation.isPending
                                }
                            />
                        )}
                        {detail?.kind === 'support' && (
                            <SupportDetail
                                inquiry={detail.item}
                                draft={replyDrafts[detail.item.id] ?? ''}
                                onDraftChange={(value) =>
                                    setReplyDrafts((prev) => ({
                                        ...prev,
                                        [detail.item.id]: value,
                                    }))
                                }
                                onReply={() =>
                                    supportReplyMutation.mutate({
                                        id: detail.item.id,
                                        message:
                                            replyDrafts[detail.item.id] ?? '',
                                    })
                                }
                                onStatus={(status) =>
                                    supportMutation.mutate({
                                        id: detail.item.id,
                                        data: { status },
                                    })
                                }
                                onPriority={(priority) =>
                                    supportMutation.mutate({
                                        id: detail.item.id,
                                        data: { priority },
                                    })
                                }
                                busy={
                                    supportReplyMutation.isPending ||
                                    supportMutation.isPending
                                }
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </AdminLayout>
    );
};

function BookingsTable({
    bookings,
    onOpen,
}: {
    bookings: QueueBooking[];
    onOpen: (item: QueueBooking) => void;
}) {
    const { t, lang } = useLanguage();
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            {[
                                'ID',
                                t('admin.client'),
                                t('admin.type'),
                                t('admin.date'),
                                t('admin.amount'),
                                t('admin.status'),
                                t('admin.actions'),
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((b) => (
                            <tr
                                key={b.id}
                                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/20"
                                onClick={() => onOpen(b)}
                            >
                                <td className="px-4 py-3 text-sm font-medium">
                                    {b.id}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {b.client?.name ?? b.user_id ?? 'Guest'}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {b.type}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {b.start_date
                                        ? `${b.start_date} → ${b.end_date ?? '…'}`
                                        : new Date(
                                              b.created_at,
                                          ).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold">
                                    {b.total_amount.toLocaleString()} TND
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                                            bookingStatusColors[b.status],
                                        )}
                                    >
                                        {b.is_provider && <CloudIcon />}
                                        {bookingStatusLabels[b.status]?.[
                                            lang
                                        ] ?? b.status}
                                    </span>
                                    {b.is_request && (
                                        <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                            {t('booking.requestBadge') || 'Request'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <Button
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpen(b);
                                        }}
                                    >
                                        <ChevronRight className="mr-1 h-3.5 w-3.5" />
                                        {t('admin.queue.detail')}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {bookings.length === 0 && <EmptyState />}
        </div>
    );
}

function ComplaintsTable({
    items,
    onOpen,
}: {
    items: QueueComplaint[];
    onOpen: (item: QueueComplaint) => void;
}) {
    const { t, lang } = useLanguage();
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            {[
                                'ID',
                                t('admin.client'),
                                t('admin.subject'),
                                t('admin.date'),
                                t('admin.priority'),
                                t('admin.status'),
                                t('admin.actions'),
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((c) => (
                            <tr
                                key={c.id}
                                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/20"
                                onClick={() => onOpen(c)}
                            >
                                <td className="px-4 py-3 text-sm font-medium">
                                    {c.id}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {c.user?.name ?? 'N/A'}
                                </td>
                                <td className="max-w-[220px] truncate px-4 py-3 text-sm">
                                    {localize(lang, c.subject)}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {new Date(
                                        c.created_at,
                                    ).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={cn(
                                            'rounded-full px-3 py-1 text-xs font-semibold',
                                            priorityColors[c.priority],
                                        )}
                                    >
                                        {t(`complaint.priority.${c.priority}`)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={cn(
                                            'rounded-full px-3 py-1 text-xs font-semibold',
                                            statusColors[c.status],
                                        )}
                                    >
                                        {t(`complaint.status.${c.status}`)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpen(c);
                                        }}
                                    >
                                        <ChevronRight className="mr-1 h-3.5 w-3.5" />
                                        {t('admin.queue.detail')}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {items.length === 0 && <EmptyState />}
        </div>
    );
}

function SupportTable({
    items,
    onOpen,
}: {
    items: QueueSupportInquiry[];
    onOpen: (item: QueueSupportInquiry) => void;
}) {
    const { t, lang } = useLanguage();
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            {[
                                'ID',
                                t('admin.client'),
                                t('admin.subject'),
                                t('admin.date'),
                                t('admin.priority'),
                                t('admin.status'),
                                t('admin.actions'),
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((s) => (
                            <tr
                                key={s.id}
                                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/20"
                                onClick={() => onOpen(s)}
                            >
                                <td className="px-4 py-3 text-sm font-medium">
                                    {s.id}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {s.client?.name ?? 'N/A'}
                                </td>
                                <td className="max-w-[220px] truncate px-4 py-3 text-sm">
                                    {localize(lang, s.subject)}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {new Date(
                                        s.created_at,
                                    ).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={cn(
                                            'rounded-full px-3 py-1 text-xs font-semibold',
                                            priorityColors[s.priority],
                                        )}
                                    >
                                        {t(`complaint.priority.${s.priority}`)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={cn(
                                            'rounded-full px-3 py-1 text-xs font-semibold',
                                            statusColors[s.status],
                                        )}
                                    >
                                        {t(`complaint.status.${s.status}`)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpen(s);
                                        }}
                                    >
                                        <ChevronRight className="mr-1 h-3.5 w-3.5" />
                                        {t('admin.queue.detail')}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {items.length === 0 && <EmptyState />}
        </div>
    );
}

/** OS-TRAVEL boarding fields can be {Id, Code, Name} objects or plain strings. */
function boardingLabel(value: unknown): string {
    if (!value) return '—';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        if (typeof obj.Name === 'string') return obj.Name;
        return JSON.stringify(obj);
    }
    return String(value);
}

function BookingDetail({
    booking,
    onApprove,
    onReject,
    onCancel,
    pending,
}: {
    booking: QueueBooking;
    onApprove: () => void;
    onReject: () => void;
    onCancel: () => void;
    pending: boolean;
}) {
    const { t, lang } = useLanguage();
    const prebook = booking.provider_prebook;
    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-lg font-bold text-foreground">
                            {booking.client?.name ?? 'Guest'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {booking.client?.email}
                        </p>
                        {booking.client?.phone && (
                            <p className="text-sm text-muted-foreground">
                                {booking.client.phone}
                            </p>
                        )}
                    </div>
                    <span
                        className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            bookingStatusColors[booking.status],
                        )}
                    >
                        {bookingStatusLabels[booking.status]?.[lang] ??
                            booking.status}
                    </span>
                    {booking.is_request && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {t('booking.requestBadge') || 'Request'}
                        </span>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-muted-foreground">
                            {t('admin.type')}
                        </p>
                        <p className="font-medium capitalize">{booking.type}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">
                            {t('admin.amount')}
                        </p>
                        <p className="font-medium">
                            {booking.total_amount.toLocaleString()} TND
                        </p>
                    </div>
                    {booking.start_date && (
                        <div>
                            <p className="text-muted-foreground">
                                {t('admin.dateRange')}
                            </p>
                            <p className="font-medium">
                                {booking.start_date} → {booking.end_date ?? '…'}
                            </p>
                        </div>
                    )}
                    <div>
                        <p className="text-muted-foreground">
                            {t('admin.queue.expiresAt')}
                        </p>
                        <p className="font-medium">
                            {booking.expires_at
                                ? new Date(
                                      booking.expires_at,
                                  ).toLocaleDateString()
                                : '—'}
                        </p>
                    </div>
                </div>

                {booking.is_provider && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CloudIcon />
                        {t('admin.queue.providerBooking')}
                        {booking.provider_booking_id
                            ? ` — ${booking.provider_booking_id}`
                            : ''}
                    </p>
                )}

                {(booking.reject_reason || booking.cancel_reason) && (
                    <div className="mt-3 rounded-xl bg-destructive/5 p-3 text-sm text-destructive">
                        {booking.reject_reason && (
                            <p>
                                <strong>{t('admin.rejectReason')}:</strong>{' '}
                                {booking.reject_reason}
                            </p>
                        )}
                        {booking.cancel_reason && (
                            <p>
                                <strong>{t('admin.cancelReason')}:</strong>{' '}
                                {booking.cancel_reason}
                            </p>
                        )}
                    </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" disabled={pending} onClick={onApprove}>
                        <CheckCheck className="mr-1 h-3.5 w-3.5" />
                        {t('admin.queue.approve')}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={onReject}
                    >
                        <X className="mr-1 h-3.5 w-3.5" />
                        {t('admin.queue.reject')}
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        disabled={pending}
                        onClick={onCancel}
                    >
                        {t('admin.queue.cancel')}
                    </Button>
                </div>
            </div>

            {/* Prebook / voucher breakdown */}
            {prebook?.breakdown?.rooms?.length ? (
                <div className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-foreground">
                        <CloudIcon />
                        {t('admin.queue.prebook')}
                    </h3>
                    {booking.provider_booking_reference ? (
                        <p className="mb-3 text-xs text-muted-foreground">
                            {t('voucher.providerRef')}:{' '}
                            <span className="font-semibold text-foreground">
                                {booking.provider_booking_reference}
                            </span>
                        </p>
                    ) : null}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                                    <th className="px-2 py-1.5 font-medium">
                                        {t('voucher.room') || 'Room'}
                                    </th>
                                    <th className="px-2 py-1.5 font-medium">
                                        {t('voucher.boarding') || 'Boarding'}
                                    </th>
                                    <th className="px-2 py-1.5 font-medium">
                                        {t('voucher.nights') || 'Nights'}
                                    </th>
                                    <th className="px-2 py-1.5 text-right font-medium">
                                        {t('voucher.total') || 'Total'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {prebook.breakdown.rooms.map(
                                    (room, index) => (
                                        <tr
                                            key={
                                                room.id?.toString() ?? index
                                            }
                                            className="border-b border-border/60 last:border-0"
                                        >
                                            <td className="px-2 py-2 font-medium text-foreground">
                                                {t('voucher.room') || 'Room'}{' '}
                                                {index + 1}
                                            </td>
                                            <td className="px-2 py-2 text-muted-foreground">
                                                {boardingLabel(room.boarding)}
                                            </td>
                                            <td className="px-2 py-2 text-muted-foreground">
                                                {prebook.breakdown?.nights ??
                                                    '—'}
                                            </td>
                                            <td className="px-2 py-2 text-right font-semibold text-foreground">
                                                {(() => {
                                                    const roomTotal = Number(room.total ?? 0);
                                                    const displayTotal = roomTotal > 0
                                                        ? roomTotal
                                                        : Number(prebook.breakdown?.total ?? prebook.total ?? 0);
                                                    return (
                                                        <>
                                                            {displayTotal.toLocaleString()}{' '}
                                                            {room.currency ??
                                                                prebook?.currency ??
                                                                'TND'}
                                                        </>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            {/* Audit timeline */}
            <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {t('admin.queue.auditTimeline')}
                </h3>
                <ol className="relative space-y-4 border-s-2 border-border ps-5">
                    {[...booking.audits].reverse().map((audit) => (
                        <li key={audit.id} className="relative">
                            <span className="absolute -start-[26px] top-1 h-3 w-3 rounded-full border-2 border-border bg-background" />
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                        auditActionColors[audit.action] ??
                                            'bg-muted',
                                    )}
                                >
                                    {t(`admin.queue.audit.${audit.action}`)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(
                                        audit.created_at,
                                    ).toLocaleString()}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {audit.actor_name
                                    ? `${audit.actor_name} (${audit.actor_role ?? 'admin'})`
                                    : (audit.actor_role ?? 'system')}
                                {audit.from_status &&
                                    ` · ${audit.from_status} → ${audit.to_status ?? '…'}`}
                            </p>
                            {audit.notes && (
                                <p className="mt-0.5 text-xs italic text-muted-foreground">
                                    “{audit.notes}”
                                </p>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

function ComplaintDetail({
    complaint,
    draft,
    onDraftChange,
    onReply,
    onResolve,
    onStatus,
    refundAmount,
    onRefundAmountChange,
    onMarkRefunded,
    busy,
}: {
    complaint: QueueComplaint;
    draft: string;
    onDraftChange: (value: string) => void;
    onReply: () => void;
    onResolve: () => void;
    onStatus: (status: string) => void;
    refundAmount: string;
    onRefundAmountChange: (value: string) => void;
    onMarkRefunded: () => void;
    busy: boolean;
}) {
    const { t, lang } = useLanguage();
    const isRefund = complaint.type === 'refund_request';
    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-lg font-bold text-foreground">
                            {localize(lang, complaint.subject)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {complaint.user?.name} · {complaint.user?.email}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <span
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-semibold',
                                statusColors[complaint.status],
                            )}
                        >
                            {t(`complaint.status.${complaint.status}`)}
                        </span>
                        <span
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-semibold',
                                priorityColors[complaint.priority],
                            )}
                        >
                            {t(`complaint.priority.${complaint.priority}`)}
                        </span>
                    </div>
                </div>

                <p className="mt-3 text-sm text-foreground">
                    {localize(lang, complaint.description)}
                </p>

                {complaint.booking && (
                    <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3 text-sm">
                        <p className="font-medium">
                            {t('admin.booking')} #{complaint.booking.id} ·{' '}
                            {complaint.booking.type}
                        </p>
                        <p className="text-muted-foreground">
                            {complaint.booking.total_amount.toLocaleString()}{' '}
                            TND · {complaint.booking.status}
                        </p>
                    </div>
                )}

                <div className="mt-4 flex items-center gap-3 text-sm">
                    <label className="text-muted-foreground">
                        {t('admin.status')}
                    </label>
                    <select
                        value={complaint.status}
                        onChange={(e) => onStatus(e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                    >
                        <option value="pending">
                            {t('complaint.status.pending')}
                        </option>
                        <option value="in_review">
                            {t('complaint.status.in_review')}
                        </option>
                        <option value="resolved">
                            {t('complaint.status.resolved')}
                        </option>
                        <option value="rejected">
                            {t('complaint.status.rejected')}
                        </option>
                        {isRefund && (
                            <option value="refunded">
                                {t('complaint.status.refunded')}
                            </option>
                        )}
                    </select>
                </div>
            </div>

            {/* Conversation */}
            <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 font-serif text-base font-bold text-foreground">
                    {t('admin.queue.replies')}
                </h3>
                <div className="space-y-2">
                    {complaint.replies.map((reply) => (
                        <div
                            key={reply.id}
                            className={cn(
                                'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                                reply.sender === 'admin'
                                    ? 'ms-auto bg-primary/10 text-primary'
                                    : 'bg-muted text-foreground',
                            )}
                        >
                            <p>{localize(lang, reply.message)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {reply.sender === 'admin'
                                    ? 'Admin'
                                    : t('admin.client')}{' '}
                                · {new Date(reply.created_at).toLocaleString()}
                            </p>
                        </div>
                    ))}
                    {complaint.admin_reply &&
                        complaint.replies.length === 0 && (
                            <div className="max-w-[85%] rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
                                {localize(lang, complaint.admin_reply)}
                            </div>
                        )}
                    {complaint.replies.length === 0 &&
                        !complaint.admin_reply && (
                            <p className="py-2 text-center text-sm text-muted-foreground">
                                {t('admin.queue.noReplies')}
                            </p>
                        )}
                </div>

                <textarea
                    value={draft}
                    onChange={(e) => onDraftChange(e.target.value)}
                    placeholder={t('client.adminReply')}
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        disabled={!draft.trim() || busy}
                        onClick={onReply}
                    >
                        <Send className="mr-1 h-3.5 w-3.5" />
                        {t('admin.queue.sendReply')}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={onResolve}
                    >
                        <CheckCheck className="mr-1 h-3.5 w-3.5" />
                        {t('complaint.status.resolved')}
                    </Button>
                    {isRefund && complaint.status !== 'refunded' && (
                        <>
                            <input
                                type="number"
                                min={0}
                                value={refundAmount}
                                onChange={(e) =>
                                    onRefundAmountChange(e.target.value)
                                }
                                placeholder={t('client.refundAmount')}
                                className="w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                            />
                            <Button
                                size="sm"
                                variant="default"
                                disabled={busy}
                                onClick={onMarkRefunded}
                            >
                                {t('complaint.status.refunded')}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function SupportDetail({
    inquiry,
    draft,
    onDraftChange,
    onReply,
    onStatus,
    onPriority,
    busy,
}: {
    inquiry: QueueSupportInquiry;
    draft: string;
    onDraftChange: (value: string) => void;
    onReply: () => void;
    onStatus: (status: string) => void;
    onPriority: (priority: string) => void;
    busy: boolean;
}) {
    const { t, lang } = useLanguage();
    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-lg font-bold text-foreground">
                            {localize(lang, inquiry.subject)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {inquiry.client?.name} · {inquiry.client?.email}
                        </p>
                    </div>
                    <span
                        className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            statusColors[inquiry.status],
                        )}
                    >
                        {t(`complaint.status.${inquiry.status}`)}
                    </span>
                </div>

                <p className="mt-3 text-sm text-foreground">
                    {localize(lang, inquiry.message)}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <label className="text-muted-foreground">
                        {t('admin.status')}
                    </label>
                    <select
                        value={inquiry.status}
                        onChange={(e) => onStatus(e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                    >
                        <option value="new">
                            {t('complaint.status.pending')}
                        </option>
                        <option value="in-progress">
                            {t('complaint.status.in_review')}
                        </option>
                        <option value="resolved">
                            {t('complaint.status.resolved')}
                        </option>
                    </select>
                    <label className="text-muted-foreground">
                        {t('admin.priority')}
                    </label>
                    <select
                        value={inquiry.priority}
                        onChange={(e) => onPriority(e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                    >
                        <option value="low">
                            {t('complaint.priority.low')}
                        </option>
                        <option value="medium">
                            {t('complaint.priority.medium')}
                        </option>
                        <option value="high">
                            {t('complaint.priority.high')}
                        </option>
                    </select>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 font-serif text-base font-bold text-foreground">
                    {t('admin.queue.replies')}
                </h3>
                <div className="space-y-2">
                    {inquiry.replies.map((reply, i) => (
                        <div
                            key={`${inquiry.id}-${i}`}
                            className={cn(
                                'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                                reply.author_id
                                    ? 'ms-auto bg-primary/10 text-primary'
                                    : 'bg-muted text-foreground',
                            )}
                        >
                            <p>{reply.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {reply.author ?? t('admin.client')} ·{' '}
                                {new Date(reply.created_at).toLocaleString()}
                            </p>
                        </div>
                    ))}
                    {inquiry.replies.length === 0 && (
                        <p className="py-2 text-center text-sm text-muted-foreground">
                            {t('admin.queue.noReplies')}
                        </p>
                    )}
                </div>

                <textarea
                    value={draft}
                    onChange={(e) => onDraftChange(e.target.value)}
                    placeholder={t('client.adminReply')}
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
                <Button
                    size="sm"
                    className="mt-2"
                    disabled={!draft.trim() || busy}
                    onClick={onReply}
                >
                    <Send className="mr-1 h-3.5 w-3.5" />
                    {t('admin.queue.sendReply')}
                </Button>
            </div>
        </div>
    );
}

export default AdminQueue;
