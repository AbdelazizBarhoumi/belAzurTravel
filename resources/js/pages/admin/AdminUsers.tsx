import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { AdminUser } from '@/hooks/useAdminStore';
import { useAdminStore } from '@/hooks/useAdminStore';

const AdminUsers = () => {
    useAdminGuard();
    const { state, upsert, remove } = useAdminStore();

    const { t } = useLanguage();

    const toggleActive = (u: AdminUser) => {
        upsert('users', { ...u, active: !u.active });
        toast.success(`${u.name} ${t(u.active ? 'admin.deactivated' : 'admin.activated')}`);
    };

    return (
        <AdminLayout title="Users" subtitle="Manage client and staff accounts">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    'Name',
                                    'Email',
                                    'Role',
                                    'Joined',
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
                            {state.users.map((u) => (
                                <tr
                                    key={u.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        {u.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {u.email}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {u.joined}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${u.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                                        >
                                            {u.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => toggleActive(u)}
                                            >
                                                {u.active
                                                    ? 'Deactivate'
                                                    : 'Activate'}
                                            </Button>
                                            <button
                                                    onClick={() => {
                                                    remove('users', u.id);
                                                    toast.success(t('actions.deleted'));
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </button>
                                        </div>
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

export default AdminUsers;
