import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    deleteAdminUser,
    listAdminUsers,
    toggleAdminUser,
} from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { AdminUser } from '@/hooks/useAdminStore';

const AdminUsers = () => {
    useAdminGuard();
    const queryClient = useQueryClient();
    const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
    const { data: users = [] } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: listAdminUsers,
    });
    const toggleMutation = useMutation({
        mutationFn: (id: string) => toggleAdminUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });

    const { t } = useLanguage();

    const toggleActive = (u: AdminUser) => {
        toggleMutation.mutate(u.id);
        toast.success(
            `${u.name} ${t(u.active ? 'admin.deactivated' : 'admin.activated')}`,
        );
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
                            {users.map((u) => (
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
                                                onClick={() =>
                                                    setPendingDelete(u)
                                                }
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

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setPendingDelete(null);
                    }
                }}
                title={t('admin.deleteItemTitle')}
                description={
                    pendingDelete
                        ? `${t('admin.deleteItemPrompt')} “${pendingDelete.name}”? ${t('admin.deleteItemWarning')}`
                        : t('admin.deleteItemFallback')
                }
                confirmText={t('actions.delete')}
                cancelText={t('actions.cancel')}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    deleteMutation.mutate(pendingDelete.id);
                    setPendingDelete(null);
                }}
            />
        </AdminLayout>
    );
};

export default AdminUsers;
