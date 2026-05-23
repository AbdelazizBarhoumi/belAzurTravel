import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Search, Trash2, UserCog } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminUser,
    listAdminUsers,
    toggleAdminUser,
    updateAdminUser,
} from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useAuthUser } from '@/hooks/useAuthUser';
import type { UserRole } from '@/auth';
import type { AdminUser } from '@/types/admin';

const AdminUsers = () => {
    useAdminGuard();
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    const { data: currentUser } = useAuthUser();

    // Filters & Pagination state
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [page, setPage] = useState(1);

    // Dialog states
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

    // Query
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'users', { page, search, roleFilter }],
        queryFn: () =>
            listAdminUsers({
                page,
                search,
                role: roleFilter === 'all' ? undefined : roleFilter,
            }),
    });

    const users = data?.data ?? [];
    const meta = data?.meta;

    // Mutations
    const toggleMutation = useMutation({
        mutationFn: (id: string) => toggleAdminUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            toast.success(t('actions.saved'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AdminUser> }) =>
            updateAdminUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            setEditingUser(null);
            toast.success(t('actions.saved'));
        },
        onError: (error: any) => {
            toast.error(error.message || t('admin.saveError'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            toast.success(t('actions.deleted'));
        },
    });

    // Helpers
    const roleLevels: Record<UserRole, number> = {
        owner: 4,
        superadmin: 3,
        admin: 2,
        assistant: 1,
        client: 0,
    };

    const canManage = (target: AdminUser) => {
        if (!currentUser) return false;
        if (String(currentUser.id) === String(target.id)) return false;
        if (currentUser.role === 'owner') return true;
        return roleLevels[currentUser.role] > roleLevels[target.role];
    };

    const handleToggleActive = (u: AdminUser) => {
        if (!canManage(u)) {
            toast.error('Permission denied');
            return;
        }
        toggleMutation.mutate(u.id);
    };

    return (
        <AdminLayout title="Users" subtitle="Manage client and staff accounts">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex max-w-md flex-1 items-center gap-2">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Select
                        value={roleFilter}
                        onValueChange={(val) => {
                            setRoleFilter(val);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">
                                Superadmin
                            </SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

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
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-12 text-center text-muted-foreground"
                                    >
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-12 text-center text-muted-foreground"
                                    >
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
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
                                                {u.active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!canManage(u)}
                                                    onClick={() =>
                                                        handleToggleActive(u)
                                                    }
                                                >
                                                    {u.active
                                                        ? 'Deactivate'
                                                        : 'Activate'}
                                                </Button>
                                                <button
                                                    disabled={!canManage(u)}
                                                    onClick={() =>
                                                        setEditingUser(u)
                                                    }
                                                    className="rounded-lg p-1.5 hover:bg-primary/10 disabled:opacity-50"
                                                >
                                                    <Edit2 className="h-4 w-4 text-primary" />
                                                </button>
                                                <button
                                                    disabled={!canManage(u)}
                                                    onClick={() =>
                                                        setPendingDelete(u)
                                                    }
                                                    className="rounded-lg p-1.5 hover:bg-destructive/10 disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {meta && meta.last_page > 1 && (
                    <div className="border-t border-border p-4">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (page > 1) setPage(page - 1);
                                        }}
                                        className={
                                            page === 1
                                                ? 'pointer-events-none opacity-50'
                                                : ''
                                        }
                                    />
                                </PaginationItem>
                                {Array.from({ length: meta.last_page }).map(
                                    (_, i) => (
                                        <PaginationItem key={i + 1}>
                                            <PaginationLink
                                                href="#"
                                                isActive={page === i + 1}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setPage(i + 1);
                                                }}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ),
                                )}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (page < meta.last_page)
                                                setPage(page + 1);
                                        }}
                                        className={
                                            page === meta.last_page
                                                ? 'pointer-events-none opacity-50'
                                                : ''
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <UserEditDialog
                user={editingUser}
                open={!!editingUser}
                onClose={() => setEditingUser(null)}
                onSave={(data) => {
                    if (editingUser) {
                        updateMutation.mutate({ id: editingUser.id, data });
                    }
                }}
                currentUserRole={currentUser?.role ?? 'client'}
            />

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

interface EditDialogProps {
    user: AdminUser | null;
    open: boolean;
    onClose: () => void;
    onSave: (data: Partial<AdminUser>) => void;
    currentUserRole: UserRole;
}

const UserEditDialog = ({
    user,
    open,
    onClose,
    onSave,
    currentUserRole,
}: EditDialogProps) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('client');

    useMemo(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
        }
    }, [user]);

    const roleLevels: Record<UserRole, number> = {
        owner: 4,
        superadmin: 3,
        admin: 2,
        assistant: 1,
        client: 0,
    };

    const currentLevel = roleLevels[currentUserRole];

    const availableRoles: UserRole[] = useMemo(() => {
        if (currentUserRole === 'owner')
            return ['client', 'admin', 'superadmin', 'owner'];
        if (currentUserRole === 'superadmin') return ['client', 'admin'];
        return [];
    }, [currentUserRole]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, email, role });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        <div className="flex items-center gap-2">
                            <UserCog className="h-5 w-5 text-primary" />
                            <span>Edit User</span>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        Update user profile and account permissions.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">User Role</Label>
                        <Select
                            value={role}
                            onValueChange={(val) => setRole(val as UserRole)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        <span className="capitalize">{r}</span>
                                    </SelectItem>
                                ))}
                                {!availableRoles.includes(role) && (
                                    <SelectItem value={role} disabled>
                                        <span className="capitalize">
                                            {role} (Restricted)
                                        </span>
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {currentLevel < 3 && (
                            <p className="text-xs text-muted-foreground">
                                Only Superadmins and Owners can manage advanced
                                roles.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AdminUsers;
