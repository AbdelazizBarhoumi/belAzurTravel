import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, Calendar, UserCheck, Globe } from 'lucide-react';
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

import { listAdminEntities, listAdminUsers } from '@/api/admin.api';
import { getAdminBookings, type AdminBookingRow } from '@/api/booking.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { bookingStatusLabels } from '@/lib/adminI18n';

const AdminDashboard = () => {
    useAdminGuard();

    const { t, lang } = useLanguage();
    const {
        data: bookings = [],
        isLoading: bookingsLoading,
        isError: bookingsError,
    } = useQuery<AdminBookingRow[]>({
        queryKey: ['admin-bookings'],
        queryFn: getAdminBookings,
        staleTime: 60_000,
        refetchOnMount: false,
    });
    const {
        data: destinations = [],
        isLoading: destinationsLoading,
        isError: destinationsError,
    } = useQuery({
        queryKey: ['admin', 'destinations'],
        queryFn: () => listAdminEntities('destinations'),
        staleTime: 60_000,
        refetchOnMount: false,
    });
    const {
        data: usersData,
        isLoading: usersLoading,
        isError: usersError,
    } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: () => listAdminUsers(),
        staleTime: 60_000,
        refetchOnMount: false,
    });

    const users = usersData?.data ?? [];
    const totalUsers = usersData?.meta?.total ?? 0;

    if (bookingsLoading || destinationsLoading || usersLoading) {
        return (
            <AdminLayout
                title={t('admin.dashboard')}
                subtitle={t('admin.manage')}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-28 animate-pulse rounded-2xl border border-border bg-card"
                            />
                        ))}
                    </div>
                    <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
                    <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
                </div>
            </AdminLayout>
        );
    }

    if (bookingsError || destinationsError || usersError) {
        return (
            <AdminLayout
                title={t('admin.dashboard')}
                subtitle={t('admin.manage')}
            >
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
                    <h2 className="font-semibold">Failed to load dashboard</h2>
                    <p className="mt-2 text-sm">
                        One or more admin data requests failed. Refresh the page
                        or check the API logs.
                    </p>
                </div>
            </AdminLayout>
        );
    }

    const totalRevenue = bookings
        .filter((b) => b.status !== 'Cancelled')
        .reduce((sum, b) => sum + b.total_amount, 0);

    const stats = [
        {
            labelKey: 'admin.totalRevenue',
            value: `${totalRevenue.toLocaleString()} DT`,
            change: '+12.5%',
            icon: Wallet,
            color: 'text-primary',
        },
        {
            labelKey: 'admin.totalBookings',
            value: bookings.length,
            change: '+8.2%',
            icon: Calendar,
            color: 'text-secondary',
        },
        {
            labelKey: 'admin.activeUsers',
            value: totalUsers,
            change: '+5.1%',
            icon: UserCheck,
            color: 'text-primary',
        },
        {
            labelKey: 'admin.destinationsStat',
            value: destinations.length,
            change: '+3.4%',
            icon: Globe,
            color: 'text-secondary',
        },
    ];

    const revenueData = [
        { month: 'Sep', revenue: 18000 },
        { month: 'Oct', revenue: 22500 },
        { month: 'Nov', revenue: 19800 },
        { month: 'Dec', revenue: 28400 },
        { month: 'Jan', revenue: 24100 },
        { month: 'Feb', revenue: totalRevenue },
    ];

    return (
        <AdminLayout title={t('admin.dashboard')} subtitle={t('admin.manage')}>
            <div className="space-y-8">
                {/* STATS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;

                        return (
                            <motion.div
                                key={stat.labelKey}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl border border-border bg-card p-5"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <Icon className={`h-5 w-5 ${stat.color}`} />

                                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                                        <TrendingUp className="h-3 w-3" />
                                        {stat.change}
                                    </span>
                                </div>

                                <p className="text-2xl font-bold text-foreground">
                                    {stat.value}
                                </p>

                                <p className="text-sm text-muted-foreground">
                                    {t(stat.labelKey)}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* REVENUE CHART */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="mb-4 font-serif text-lg font-bold text-foreground">
                        {t('admin.revenueOverview')}
                    </h2>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                    dataKey="revenue"
                                    fill="hsl(var(--primary))"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* BOOKINGS TABLE */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="border-b border-border px-6 py-4">
                        <h2 className="font-serif text-lg font-bold text-foreground">
                            {t('admin.recentBookings')}
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    {[
                                        t('admin.id'),
                                        t('admin.client'),
                                        t('admin.item'),
                                        t('admin.date'),
                                        t('admin.amount'),
                                        t('admin.status'),
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="px-6 py-3 text-left text-xs font-semibold uppercase text-muted-foreground"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {bookings.slice(0, 6).map((b) => (
                                    <tr
                                        key={b.id}
                                        className="border-b border-border last:border-0 hover:bg-muted/20"
                                    >
                                        <td className="px-6 py-4 text-sm">
                                            {b.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {b.client?.name ??
                                                b.user_id ??
                                                'Guest'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {JSON.stringify(b.items).substring(
                                                0,
                                                50,
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {new Date(
                                                b.created_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold">
                                            {b.total_amount.toLocaleString()} DT
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    b.status === 'Confirmed'
                                                        ? 'bg-primary/10 text-primary'
                                                        : b.status === 'Pending'
                                                          ? 'bg-secondary/10 text-secondary'
                                                          : 'bg-destructive/10 text-destructive'
                                                }`}
                                            >
                                                {bookingStatusLabels[
                                                    b.status
                                                ]?.[lang] ?? b.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
