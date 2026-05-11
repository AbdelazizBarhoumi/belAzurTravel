import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { AdminBooking } from '@/hooks/useAdminStore';
import { useAdminStore } from '@/hooks/useAdminStore';
import { bookingStatusLabels, bookingTypeLabels, countryLabels, destinationLabels, hotelLabels, localizeKnown, tourLabels } from '@/lib/adminI18n';

const AdminBookings = () => {
    useAdminGuard();
    const { state, upsert, remove } = useAdminStore();
    const { lang } = useLanguage();

    const { t } = useLanguage();

    const updateStatus = (b: AdminBooking, status: AdminBooking['status']) => {
        upsert('bookings', { ...b, status });
        // use localized booking label + localized status label
        toast.success(`${t('admin.booking')} ${b.id} → ${bookingStatusLabels[status][lang]}`);
    };

    const localizeBookingItem = (item: string) =>
        localizeKnown(
            item,
            {
                ...destinationLabels,
                ...hotelLabels,
                ...tourLabels,
                ...countryLabels,
            },
            lang,
        );

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
                            {state.bookings.map((b) => (
                                <tr
                                    key={b.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 text-sm font-medium">
                                        {b.id}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {b.client}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {localizeKnown(b.type, bookingTypeLabels, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {localizeBookingItem(b.item)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {b.date}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        ${b.amount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={b.status}
                                            onChange={(e) =>
                                                updateStatus(
                                                    b,
                                                    e.target
                                                        .value as AdminBooking['status'],
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
                                                {bookingStatusLabels.Pending[lang]}
                                            </option>
                                            <option value="Confirmed">
                                                {bookingStatusLabels.Confirmed[lang]}
                                            </option>
                                            <option value="Cancelled">
                                                {bookingStatusLabels.Cancelled[lang]}
                                            </option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                                onClick={() => {
                                                remove('bookings', b.id);
                                                toast.success(t('actions.deleted'));
                                            }}
                                            className="rounded-lg p-1.5 hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminBookings;
