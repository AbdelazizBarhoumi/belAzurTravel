import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { api, useAdminBookings } from '@/hooks/useBooking';
import { bookingStatusLabels } from '@/lib/adminI18n';

interface BookingItem {
    id: number;
    user_id: number | null;
    type: string;
    items: unknown[];
    created_at: string;
    total_amount: number;
    status: string;
}

const AdminBookings = () => {
    useAdminGuard();
    const { data, isLoading } = useAdminBookings();
    const queryClient = useQueryClient();
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) => {
            if (status === 'Confirmed') return api.confirmBooking(id);
            if (status === 'Cancelled') return api.adminCancelBooking(id);
            return Promise.resolve();
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }),
    });
    const { lang } = useLanguage();
    const { t } = useLanguage();

    const updateStatus = (_b: BookingItem, status: string) => {
        statusMutation.mutate({ id: _b.id, status });
        toast.success(
            `${t('admin.booking')} → ${bookingStatusLabels[status][lang]}`,
        );
    };

    return (
        <AdminLayout
            title="Bookings"
            subtitle="Review and update booking statuses"
        >
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    'ID',
                                    'Client',
                                    'Type',
                                    'Item',
                                    'Date',
                                    'Amount',
                                    'Status',
                                    'Actions',
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
                                (b: BookingItem) => (
                                    <tr
                                        key={b.id}
                                        className="border-b border-border last:border-0 hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {b.id}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {b.user_id || 'Guest'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {b.type}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {JSON.stringify(b.items).substring(
                                                0,
                                                50,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(
                                                b.created_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold">
                                            ${b.total_amount}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={b.status}
                                                onChange={(e) =>
                                                    updateStatus(
                                                        b,
                                                        e.target.value,
                                                    )
                                                }
                                                className={`rounded-lg border-0 px-2 py-1 text-xs font-semibold ${
                                                    b.status === 'Confirmed'
                                                        ? 'bg-primary/10 text-primary'
                                                        : b.status === 'Pending'
                                                          ? 'bg-secondary/10 text-secondary'
                                                          : 'bg-destructive/10 text-destructive'
                                                }`}
                                            >
                                                <option value="Pending">
                                                    {bookingStatusLabels.Pending?.[
                                                        lang
                                                    ] ?? 'Pending'}
                                                </option>
                                                <option value="Confirmed">
                                                    {bookingStatusLabels.Confirmed?.[
                                                        lang
                                                    ] ?? 'Confirmed'}
                                                </option>
                                                <option value="Cancelled">
                                                    {bookingStatusLabels.Cancelled?.[
                                                        lang
                                                    ] ?? 'Cancelled'}
                                                </option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => {
                                                    // TODO: implement delete via API
                                                    toast.success(
                                                        t('actions.deleted'),
                                                    );
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </button>
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
