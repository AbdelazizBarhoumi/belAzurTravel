import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    BedDouble,
    CheckCheck,
    ChevronRight,
    Clock,
    Inbox,
    RefreshCcw,
    Send,
} from 'lucide-react';
import {
    getAdminBookings,
    getBooking,
    type AdminBookingRow,
    type BookingDetailRow,
} from '@/api/booking.api';
import {
    getAdminComplaints,
    replyToComplaint,
    resolveComplaint,
    updateAdminComplaint,
    type Complaint,
} from '@/api/complaint.api';
import {
    getAdminQueue,
    replyToSupportInquiry,
    updateSupportInquiry,
    type AdminQueuePayload,
    type QueueSection,
    type QueueSupportInquiry,
} from '@/api/queue.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { StatusSelect } from '@/components/ui/StatusSelect';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { api } from '@/hooks/useBooking';
import { bookingStatusLabels } from '@/lib/adminI18n';
import { cn, formatPrice } from '@/lib/utils';

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

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    Pending: ['Approved', 'Rejected', 'Cancelled'],
    Approved: ['Confirmed', 'Rejected', 'Cancelled'],
    Confirmed: ['Cancelled'],
};

type Detail =
    | { kind: 'booking'; item: AdminBookingRow }
    | { kind: 'complaint'; item: Complaint }
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

function formatDate(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

function bookingLabel(b: AdminBookingRow) {
    if (b.details?.room_name) {
        const parts = [b.details.room_name];
        if (b.details.boarding_name) parts.push(b.details.boarding_name);
        return parts.join(' · ');
    }
    return (
        b.items
            .map((item: unknown) => {
                const obj = item as Record<string, unknown>;
                return (obj.slug ?? obj.id ?? '') as string;
            })
            .filter(Boolean)
            .join(', ') || `#${b.booking_ref}`
    );
}

const AdminQueue = () => {
    useAdminGuard();
    const { t, lang, dir } = useLanguage();
    const queryClient = useQueryClient();
    const isRtl = dir === 'rtl';

    const [searchParams, setSearchParams] = useSearchParams();
    const validTabs: QueueSection[] = [
        'bookings',
        'complaints',
        'refund_requests',
        'support',
    ];
    const initialTab = validTabs.includes(
        searchParams.get('tab') as QueueSection,
    )
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

    const [complaintTypeFilter, setComplaintTypeFilter] = useState<string>('');
    const [complaintStatusFilter, setComplaintStatusFilter] =
        useState<string>('');

    const { data, isLoading } = useQuery<AdminQueuePayload>({
        queryKey: ['admin-queue'],
        queryFn: getAdminQueue,
        staleTime: 15_000,
        refetchInterval: 30_000,
    });

    const { data: allBookings = [], isLoading: bookingsLoading } = useQuery<
        AdminBookingRow[]
    >({
        queryKey: ['admin-bookings'],
        queryFn: getAdminBookings,
        staleTime: 60_000,
    });

    const { data: allComplaints = [], isLoading: complaintsLoading } = useQuery<
        Complaint[]
    >({
        queryKey: [
            'admin-complaints',
            complaintTypeFilter,
            complaintStatusFilter,
        ],
        queryFn: () =>
            getAdminComplaints({
                type: complaintTypeFilter || undefined,
                status: complaintStatusFilter || undefined,
            }),
    });

    const refresh = () => {
        queryClient.invalidateQueries({
            queryKey: [
                'admin-queue',
                'admin-queue-counts',
                'admin-bookings',
                'admin-complaints',
            ],
        });
    };

    const bookingStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => {
            if (status === 'Confirmed' || status === 'Approved')
                return api.approveBooking(id);
            if (status === 'Rejected') {
                const reason = window.prompt(
                    t('admin.rejectReasonPrompt') || 'Reason for rejection:',
                );
                if (!reason?.trim()) {
                    throw new Error('Rejection reason is required');
                }
                return api.rejectBooking(id, reason.trim());
            }
            if (status === 'Cancelled') return api.adminCancelBooking(id);
            return Promise.resolve();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['admin-bookings', 'admin-queue'],
            });
            toast.success(
                `${t('admin.booking')} → ${
                    bookingStatusLabels[variables.status]?.[lang] ??
                    variables.status
                }`,
            );
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
    const countFor = (section: QueueSection) => {
        if (section === 'bookings') return allBookings.length;
        if (section === 'complaints')
            return allComplaints.filter((c) => c.type === 'complaint').length;
        if (section === 'refund_requests')
            return allComplaints.filter((c) => c.type === 'refund_request')
                .length;
        return counts?.[section] ?? 0;
    };

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
                            'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-all',
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
                                bookings={allBookings}
                                loading={bookingsLoading}
                                onOpen={(item) => openDetail('booking', item)}
                                onStatusChange={(id, status) =>
                                    bookingStatusMutation.mutate({ id, status })
                                }
                                statusPending={bookingStatusMutation.isPending}
                            />
                        )}
                        {activeTab === 'complaints' && (
                            <ComplaintsTable
                                items={allComplaints.filter(
                                    (c) => c.type === 'complaint',
                                )}
                                loading={complaintsLoading}
                                typeFilter={complaintTypeFilter}
                                statusFilter={complaintStatusFilter}
                                onTypeFilterChange={setComplaintTypeFilter}
                                onStatusFilterChange={setComplaintStatusFilter}
                                onOpen={(item) => openDetail('complaint', item)}
                                onStatusChange={(id, status) =>
                                    complaintMutation.mutate({
                                        id,
                                        data: { status },
                                    })
                                }
                            />
                        )}
                        {activeTab === 'refund_requests' && (
                            <ComplaintsTable
                                items={allComplaints.filter(
                                    (c) => c.type === 'refund_request',
                                )}
                                loading={complaintsLoading}
                                typeFilter="refund_request"
                                statusFilter={complaintStatusFilter}
                                onTypeFilterChange={() => {}}
                                onStatusFilterChange={setComplaintStatusFilter}
                                onOpen={(item) => openDetail('complaint', item)}
                                onStatusChange={(id, status) =>
                                    complaintMutation.mutate({
                                        id,
                                        data: { status },
                                    })
                                }
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
                            <BookingDetailView booking={detail.item} />
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
    loading,
    onOpen,
    onStatusChange,
    statusPending,
}: {
    bookings: AdminBookingRow[];
    loading: boolean;
    onOpen: (item: AdminBookingRow) => void;
    onStatusChange: (id: string, status: string) => void;
    statusPending: boolean;
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
                                t('admin.table.item'),
                                t('admin.date'),
                                t('admin.amount'),
                                t('admin.status'),
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
                        {(loading ? [] : bookings).map((b) => (
                            <tr
                                key={b.id}
                                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/20"
                                onClick={() => onOpen(b)}
                            >
                                <td className="px-4 py-3 text-sm font-medium">
                                    #{b.booking_ref}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {b.client?.name ||
                                        b.user_id ||
                                        t('admin.table.guest')}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        {b.details?.image ? (
                                            <img
                                                src={b.details.image}
                                                alt=""
                                                className="h-10 w-12 shrink-0 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <BedDouble className="h-4 w-4 text-muted-foreground/50" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-foreground">
                                                {bookingLabel(b)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(b.start_date)}
                                                {b.end_date
                                                    ? ` \u2014 ${formatDate(b.end_date)}`
                                                    : ''}
                                                {b.details?.nights
                                                    ? ` \u00b7 ${b.details.nights} nights`
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {formatDate(b.created_at)}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold">
                                    {formatPrice(
                                        b.total_amount,
                                        b.details?.currency ?? 'TND',
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusSelect
                                        value={b.status}
                                        onValueChange={(val) =>
                                            onStatusChange(b.id, val)
                                        }
                                        disabled={
                                            statusPending ||
                                            !ALLOWED_TRANSITIONS[b.status]
                                        }
                                        options={[
                                            b.status,
                                            ...(ALLOWED_TRANSITIONS[b.status] ??
                                                []),
                                        ].map((value) => ({
                                            value,
                                            label:
                                                bookingStatusLabels[value]?.[
                                                    lang
                                                ] ?? value,
                                        }))}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!loading && bookings.length === 0 && <EmptyState />}
        </div>
    );
}

function ComplaintsTable({
    items,
    loading,
    typeFilter,
    statusFilter,
    onTypeFilterChange,
    onStatusFilterChange,
    onOpen,
    onStatusChange,
}: {
    items: Complaint[];
    loading: boolean;
    typeFilter: string;
    statusFilter: string;
    onTypeFilterChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    onOpen: (item: Complaint) => void;
    onStatusChange: (id: number, status: string) => void;
}) {
    const { t, lang } = useLanguage();
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <select
                    value={typeFilter}
                    onChange={(e) => onTypeFilterChange(e.target.value)}
                    className="rounded-2xl border border-border bg-card px-4 py-2 text-sm"
                >
                    <option value="">{t('admin.allTypes')}</option>
                    <option value="complaint">
                        {t('complaint.type.complaint')}
                    </option>
                    <option value="refund_request">
                        {t('complaint.type.refund_request')}
                    </option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="rounded-2xl border border-border bg-card px-4 py-2 text-sm"
                >
                    <option value="">{t('admin.allStatuses')}</option>
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
                    <option value="refunded">
                        {t('complaint.status.refunded')}
                    </option>
                </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    'ID',
                                    t('admin.client'),
                                    t('admin.type'),
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
                            {(loading ? [] : items).map((c) => (
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
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {c.type === 'refund_request'
                                            ? t('complaint.type.refund_request')
                                            : t('complaint.type.complaint')}
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
                                            {t(
                                                `complaint.priority.${c.priority}`,
                                            )}
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
                                        <select
                                            value={c.status}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                onStatusChange(
                                                    c.id,
                                                    e.target.value,
                                                );
                                            }}
                                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                                        >
                                            <option value="pending">
                                                {t('complaint.status.pending')}
                                            </option>
                                            <option value="in_review">
                                                {t(
                                                    'complaint.status.in_review',
                                                )}
                                            </option>
                                            <option value="resolved">
                                                {t('complaint.status.resolved')}
                                            </option>
                                            <option value="rejected">
                                                {t('complaint.status.rejected')}
                                            </option>
                                            {c.type === 'refund_request' && (
                                                <option value="refunded">
                                                    {t(
                                                        'complaint.status.refunded',
                                                    )}
                                                </option>
                                            )}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && items.length === 0 && <EmptyState />}
            </div>
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

function BookingDetailView({ booking }: { booking: AdminBookingRow }) {
    const { t, lang } = useLanguage();
    const { data: full, isLoading } = useQuery<BookingDetailRow>({
        queryKey: ['booking', booking.id],
        queryFn: () => getBooking(booking.id),
        staleTime: 60_000,
    });

    const b = full ?? booking;
    const prebook = (b as any).provider_prebook;

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-lg font-bold text-foreground">
                            {b.client?.name ?? 'Guest'}
                        </p>
                        {(b as any).client?.email && (
                            <p className="text-sm text-muted-foreground">
                                {(b as any).client.email}
                            </p>
                        )}
                        {(b as any).client?.phone && (
                            <p className="text-sm text-muted-foreground">
                                {(b as any).client.phone}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <span
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-semibold',
                                bookingStatusColors[b.status],
                            )}
                        >
                            {bookingStatusLabels[b.status]?.[lang] ?? b.status}
                        </span>
                        {b.is_request && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                {t('booking.requestBadge') || 'Request'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-muted-foreground">
                            {t('admin.type')}
                        </p>
                        <p className="font-medium capitalize">{b.type}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">
                            {t('admin.amount')}
                        </p>
                        <p className="font-medium">
                            {formatPrice(b.total_amount, 'TND')}
                        </p>
                    </div>
                    {b.start_date && (
                        <div>
                            <p className="text-muted-foreground">
                                {t('admin.dateRange')}
                            </p>
                            <p className="font-medium">
                                {b.start_date} \u2192 {b.end_date ?? '\u2026'}
                            </p>
                        </div>
                    )}
                    {(b as any).expires_at && (
                        <div>
                            <p className="text-muted-foreground">
                                {t('admin.queue.expiresAt')}
                            </p>
                            <p className="font-medium">
                                {new Date(
                                    (b as any).expires_at,
                                ).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                    {b.details?.nights && (
                        <div>
                            <p className="text-muted-foreground">
                                {t('voucher.nights') || 'Nights'}
                            </p>
                            <p className="font-medium">{b.details.nights}</p>
                        </div>
                    )}
                </div>

                {b.details?.room_name && (
                    <div className="mt-3 rounded-2xl border border-border bg-muted/20 p-3 text-sm">
                        <p className="font-medium">{b.details.room_name}</p>
                        {b.details.boarding_name && (
                            <p className="text-muted-foreground">
                                {b.details.boarding_name}
                            </p>
                        )}
                    </div>
                )}

                {b.details?.image && (
                    <img
                        src={b.details.image}
                        alt=""
                        className="mt-3 h-32 w-full rounded-2xl object-cover"
                    />
                )}

                {(b as any).is_provider && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CloudIcon />
                        {t('admin.queue.providerBooking')}
                        {(b as any).provider_booking_id
                            ? ' \u2014 ' + (b as any).provider_booking_id
                            : ''}
                    </p>
                )}

                {((b as any).reject_reason || (b as any).cancel_reason) && (
                    <div className="mt-3 rounded-2xl bg-destructive/5 p-3 text-sm text-destructive">
                        {(b as any).reject_reason && (
                            <p>
                                <strong>{t('admin.rejectReason')}:</strong>{' '}
                                {(b as any).reject_reason}
                            </p>
                        )}
                        {(b as any).cancel_reason && (
                            <p>
                                <strong>{t('admin.cancelReason')}:</strong>{' '}
                                {(b as any).cancel_reason}
                            </p>
                        )}
                    </div>
                )}

                {(b as any).guests && (b as any).guests.length > 0 && (
                    <div className="mt-3 text-sm">
                        <p className="text-muted-foreground">
                            {t('admin.guests') || 'Guests'}
                        </p>
                        <p className="font-medium">
                            {(b as any).guests
                                .map((g: any) => g.name)
                                .filter(Boolean)
                                .join(', ')}
                        </p>
                    </div>
                )}

                {(b as any).notes && (
                    <div className="mt-3 text-sm">
                        <p className="text-muted-foreground">
                            {t('admin.notes') || 'Notes'}
                        </p>
                        <p className="font-medium">{(b as any).notes}</p>
                    </div>
                )}
            </div>

            {isLoading && (
                <div className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
            )}

            {prebook?.breakdown?.rooms?.length ? (
                <div className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-foreground">
                        <CloudIcon />
                        {t('admin.queue.prebook')}
                    </h3>
                    {(b as any).provider_booking_reference ? (
                        <p className="mb-3 text-xs text-muted-foreground">
                            {t('voucher.providerRef')}:{' '}
                            <span className="font-semibold text-foreground">
                                {(b as any).provider_booking_reference}
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
                                    (room: any, index: number) => (
                                        <tr
                                            key={room.id?.toString() ?? index}
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
                                                    '\u2014'}
                                            </td>
                                            <td className="px-2 py-2 text-right font-semibold text-foreground">
                                                {(() => {
                                                    const roomTotal = Number(
                                                        room.total ?? 0,
                                                    );
                                                    const displayTotal =
                                                        roomTotal > 0
                                                            ? roomTotal
                                                            : Number(
                                                                  prebook
                                                                      .breakdown
                                                                      ?.total ??
                                                                      prebook.total ??
                                                                      0,
                                                              );
                                                    return (
                                                        <>
                                                            {formatPrice(
                                                                displayTotal,
                                                                room.currency ??
                                                                    prebook?.currency ??
                                                                    'TND',
                                                            )}
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

            {(full as any)?.audits && (full as any).audits.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-foreground">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {t('admin.queue.auditTimeline')}
                    </h3>
                    <ol className="relative space-y-4 border-s-2 border-border ps-5">
                        {[...(full as any).audits]
                            .reverse()
                            .map((audit: any) => (
                                <li key={audit.id} className="relative">
                                    <span className="absolute -start-[26px] top-1 h-3 w-3 rounded-full border-2 border-border bg-background" />
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                auditActionColors[
                                                    audit.action
                                                ] ?? 'bg-muted',
                                            )}
                                        >
                                            {t(
                                                `admin.queue.audit.${audit.action}`,
                                            )}
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
                                            ` \u00b7 ${audit.from_status} \u2192 ${audit.to_status ?? '\u2026'}`}
                                    </p>
                                    {audit.notes && (
                                        <p className="mt-0.5 text-xs italic text-muted-foreground">
                                            \u201c{audit.notes}\u201d
                                        </p>
                                    )}
                                </li>
                            ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

function boardingLabel(value: unknown): string {
    if (!value) return '\u2014';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        if (typeof obj.Name === 'string') return obj.Name;
        return JSON.stringify(obj);
    }
    return String(value);
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
    complaint: Complaint;
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
                    <div className="mt-3 rounded-2xl border border-border bg-muted/20 p-3 text-sm">
                        <p className="font-medium">
                            {t('admin.booking')} #
                            {complaint.booking.booking_ref ??
                                complaint.booking.id}{' '}
                            · {complaint.booking.type}
                        </p>
                        <p className="text-muted-foreground">
                            {formatPrice(complaint.booking.total_amount, 'TND')}{' '}
                            · {complaint.booking.status}
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
                                'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
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
                            <div className="max-w-[85%] rounded-2xl bg-primary/10 px-3 py-2 text-sm text-primary">
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
                    className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
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
                                'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
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
                    className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
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
