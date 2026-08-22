import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BedDouble, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { StatusSelect } from '@/components/ui/StatusSelect';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { api, useAdminBookings } from '@/hooks/useBooking';
import { bookingStatusLabels } from '@/lib/adminI18n';
import type { AdminBookingRow } from '@/api/booking.api';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    Pending: ['Approved', 'Rejected', 'Cancelled'],
    Approved: ['Confirmed', 'Rejected', 'Cancelled'],
    Confirmed: ['Cancelled'],
};

function formatDate(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

const AdminBookings = () => {
    useAdminGuard();
    const { data, isLoading } = useAdminBookings();
    const queryClient = useQueryClient();
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) => {
            if (status === 'Confirmed') return api.approveBooking(id);
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
            queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
            toast.success(
                `${t('admin.booking')} → ${
                    bookingStatusLabels[variables.status]?.[lang] ??
                    variables.status
                }`,
            );
        },
        onError: (err) => {
            const message =
                err instanceof Error ? err.message : 'Action failed';
            toast.error(message);
        },
    });
    const { lang } = useLanguage();
    const { t } = useLanguage();

    const updateStatus = (_b: AdminBookingRow, status: string) => {
        statusMutation.mutate({ id: _b.id, status });
    };

    const bookingLabel = (b: AdminBookingRow) => {
        if (b.details?.room_name) {
            const parts = [b.details.room_name];
            if (b.details.boarding_name) parts.push(b.details.boarding_name);
            return parts.join(' · ');
        }
        return b.items
            .map((item: unknown) => {
                const obj = item as Record<string, unknown>;
                return (obj.slug ?? obj.id ?? '') as string;
            })
            .filter(Boolean)
            .join(', ') || `#${b.id}`;
    };

    return (
        <AdminLayout
            title={t('admin.bookings')}
            subtitle={t('admin.bookingsSubtitle')}
            actions={
                <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link to="/admin/queue">
                        <Inbox className="h-4 w-4" />
                        {t('admin.queue')}
                    </Link>
                </Button>
            }
        >
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    'ID',
                                    t('admin.table.client'),
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
                            {(isLoading ? [] : (data ?? [])).map(
                                (b: AdminBookingRow) => (
                                    <tr
                                        key={b.id}
                                        className="border-b border-border last:border-0 hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {b.id}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {b.client?.name || b.user_id || t('admin.table.guest')}
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
                                                        {b.end_date ? ` — ${formatDate(b.end_date)}` : ''}
                                                        {b.details?.nights ? ` · ${b.details.nights} nights` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            <div>
                                                {formatDate(b.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold">
                                            {b.total_amount.toLocaleString()} {b.details?.currency ?? 'TND'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusSelect
                                                value={b.status}
                                                onValueChange={(val) =>
                                                    updateStatus(b, val)
                                                }
                                                disabled={
                                                    !ALLOWED_TRANSITIONS[
                                                        b.status
                                                    ]
                                                }
                                                options={[
                                                    b.status,
                                                    ...(ALLOWED_TRANSITIONS[
                                                        b.status
                                                    ] ?? []),
                                                ].map((value) => ({
                                                    value,
                                                    label:
                                                        bookingStatusLabels[
                                                            value
                                                        ]?.[lang] ?? value,
                                                }))}
                                            />
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminBookings;
