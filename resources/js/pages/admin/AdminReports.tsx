import {
    Download,
    Wallet,
    Calendar,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import {
    Pie,
    PieChart,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useAdminBookings } from '@/hooks/useBooking';
import { bookingStatusLabels } from '@/lib/adminI18n';

const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--destructive))',
];

const AdminReports = () => {
    useAdminGuard();
    const { lang } = useLanguage();
    const { data: bookings = [] } = useAdminBookings();

    const totalRevenue = bookings
        .filter((b) => b.status !== 'Cancelled')
        .reduce((s, b) => s + b.total_amount, 0);
    const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
    const pending = bookings.filter((b) => b.status === 'Pending').length;
    const cancelled = bookings.filter((b) => b.status === 'Cancelled').length;

    const pieData = [
        { name: bookingStatusLabels.Confirmed[lang], value: confirmed },
        { name: bookingStatusLabels.Pending[lang], value: pending },
        { name: bookingStatusLabels.Cancelled[lang], value: cancelled },
    ];

    const topItems = Object.entries(
        bookings.reduce<Record<string, number>>((acc, b) => {
            const firstItem = b.items?.[0] as
                | { slug?: string; id?: string }
                | undefined;
            const item = String(
                firstItem?.slug ?? firstItem?.id ?? b.type ?? 'booking',
            );
            acc[item] = (acc[item] || 0) + b.total_amount;
            return acc;
        }, {}),
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const topItemPeak = topItems[0]?.[1] ?? 0;

    const exportCSV = () => {
        const header = 'ID,Client,Type,Item,Date,Amount,Status';
        const rows = bookings.map((b) => {
            const firstItem = b.items?.[0] as
                | { slug?: string; id?: string }
                | undefined;

            return [
                b.id,
                b.client?.name ?? '',
                b.type,
                String(firstItem?.slug ?? firstItem?.id ?? ''),
                b.created_at,
                b.total_amount,
                b.status,
            ].join(',');
        });
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voyageur-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const stats = [
        {
            label: 'Total Revenue',
            value: `${totalRevenue.toLocaleString()} DT`,
            icon: Wallet,
        },
        {
            label: 'Total Bookings',
            value: bookings.length,
            icon: Calendar,
        },
        { label: 'Confirmed', value: confirmed, icon: CheckCircle2 },
        { label: 'Cancelled', value: cancelled, icon: XCircle },
    ];

    return (
        <AdminLayout
            title="Reports"
            subtitle="Revenue and booking insights"
            actions={
                <Button
                    onClick={exportCSV}
                    className="gap-2 bg-primary text-primary-foreground"
                >
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            }
        >
            <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {stats.map((s) => (
                        <div
                            key={s.label}
                            className="rounded-2xl border border-border bg-card p-5"
                        >
                            <s.icon className="mb-3 h-5 w-5 text-primary" />
                            <p className="text-2xl font-bold text-foreground">
                                {s.value}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <h2 className="mb-4 font-serif text-lg font-bold text-foreground">
                            Bookings by Status
                        </h2>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={100}
                                        label
                                    >
                                        {pieData.map((_, idx) => (
                                            <Cell
                                                key={idx}
                                                fill={COLORS[idx]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6">
                        <h2 className="mb-4 font-serif text-lg font-bold text-foreground">
                            Top Items by Revenue
                        </h2>
                        <div className="space-y-3">
                            {topItems.map(([item, amt], i) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-3"
                                >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {item}
                                        </p>
                                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full bg-primary"
                                                style={{
                                                    width: `${topItemPeak > 0 ? (amt / topItemPeak) * 100 : 0}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold">
                                        {amt.toLocaleString()} DT
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminReports;
