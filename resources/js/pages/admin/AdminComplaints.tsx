import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    getAdminComplaints,
    replyToComplaint,
    updateAdminComplaint,
    resolveComplaint,
    type Complaint,
} from '@/api/complaint.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';

const statusColors: Record<string, string> = {
    pending: 'bg-secondary/10 text-secondary',
    in_review: 'bg-blue-100 text-blue-700',
    resolved: 'bg-primary/10 text-primary',
    rejected: 'bg-destructive/10 text-destructive',
    refunded: 'bg-green-100 text-green-700',
};

const priorityColors: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-secondary/10 text-secondary',
    high: 'bg-destructive/10 text-destructive',
};

const AdminComplaints = () => {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [refundAmount, setRefundAmount] = useState('');

    const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
        queryKey: ['admin-complaints', typeFilter, statusFilter],
        queryFn: () =>
            getAdminComplaints({
                type: typeFilter || undefined,
                status: statusFilter || undefined,
            }),
    });

    const statusMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: { status?: string; priority?: string; refund_amount?: number };
        }) => updateAdminComplaint(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
            toast.success(t('actions.updated'));
        },
    });

    const replyMutation = useMutation({
        mutationFn: ({ id, message }: { id: number; message: string }) =>
            replyToComplaint(id, message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
            setReplyMessage('');
            toast.success(t('client.adminReplySent') || 'Reply sent.');
        },
    });

    const resolveMutation = useMutation({
        mutationFn: (id: number) => resolveComplaint(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
            toast.success(t('actions.resolved') || 'Resolved.');
        },
    });

    const handleApproveRefund = (complaint: Complaint) => {
        const amount = refundAmount ? parseInt(refundAmount, 10) : 0;
        statusMutation.mutate({
            id: complaint.id,
            data: { status: 'refunded', refund_amount: amount },
        });
        setRefundAmount('');
    };

    return (
        <AdminLayout
            title={t('admin.complaints')}
            subtitle={t('admin.complaintManage')}
        >
            <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-sm"
                    >
                        <option value="">{t('common.all')} Types</option>
                        <option value="complaint">{t('complaint.type.complaint')}</option>
                        <option value="refund_request">{t('complaint.type.refund_request')}</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-sm"
                    >
                        <option value="">{t('common.all')} Status</option>
                        <option value="pending">{t('complaint.status.pending')}</option>
                        <option value="in_review">{t('complaint.status.in_review')}</option>
                        <option value="resolved">{t('complaint.status.resolved')}</option>
                        <option value="rejected">{t('complaint.status.rejected')}</option>
                        <option value="refunded">{t('complaint.status.refunded')}</option>
                    </select>
                </div>

                {/* Table */}
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
                                        t('admin.status'),
                                        t('admin.priority'),
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
                                {(isLoading ? [] : complaints).map((c) => (
                                    <>
                                        <tr
                                            key={c.id}
                                            className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/20"
                                            onClick={() =>
                                                setExpandedId(
                                                    expandedId === c.id ? null : c.id,
                                                )
                                            }
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
                                            <td className="px-4 py-3 text-sm">
                                                {c.subject[lang] || c.subject.en}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[c.status] || ''}`}
                                                >
                                                    {t(`complaint.status.${c.status}`)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityColors[c.priority] || ''}`}
                                                >
                                                    {t(`complaint.priority.${c.priority}`)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={c.status}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        statusMutation.mutate({
                                                            id: c.id,
                                                            data: { status: e.target.value },
                                                        });
                                                    }}
                                                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                                                >
                                                    <option value="pending">{t('complaint.status.pending')}</option>
                                                    <option value="in_review">{t('complaint.status.in_review')}</option>
                                                    <option value="resolved">{t('complaint.status.resolved')}</option>
                                                    <option value="rejected">{t('complaint.status.rejected')}</option>
                                                    {c.type === 'refund_request' && (
                                                        <option value="refunded">{t('complaint.status.refunded')}</option>
                                                    )}
                                                </select>
                                            </td>
                                        </tr>
                                        {expandedId === c.id && (
                                            <tr key={`${c.id}-detail`}>
                                                <td colSpan={8} className="border-b border-border bg-muted/10 p-5">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-muted-foreground">
                                                                {t('admin.description')}:
                                                            </p>
                                                            <p className="mt-1 text-sm text-foreground">
                                                                {c.description[lang] || c.description.en}
                                                            </p>
                                                        </div>

                                                        {c.booking && (
                                                            <div className="rounded-xl border border-border bg-card p-4">
                                                                <p className="text-sm font-medium text-muted-foreground">
                                                                    {t('admin.booking')} #{c.booking.id}
                                                                </p>
                                                                <p className="text-sm text-foreground">
                                                                    {c.booking.type} &middot; {c.booking.total_amount} TND &middot; {c.booking.status}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {c.admin_reply && (
                                                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                                                                <p className="text-xs font-semibold text-primary mb-1">
                                                                    {t('client.adminReply')}:
                                                                </p>
                                                                <p className="text-sm text-foreground">
                                                                    {c.admin_reply[lang] || c.admin_reply.en}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-wrap gap-3">
                                                            <div className="flex-1">
                                                                <textarea
                                                                    value={replyMessage}
                                                                    onChange={(e) =>
                                                                        setReplyMessage(e.target.value)
                                                                    }
                                                                    placeholder={t('client.adminReply')}
                                                                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                                                                    rows={3}
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    className="mt-2"
                                                                    disabled={
                                                                        !replyMessage.trim() ||
                                                                        replyMutation.isPending
                                                                    }
                                                                    onClick={() =>
                                                                        replyMutation.mutate({
                                                                            id: c.id,
                                                                            message: replyMessage,
                                                                        })
                                                                    }
                                                                >
                                                                    {t('assistant.send')}
                                                                </Button>
                                                            </div>

                                                            {c.type === 'refund_request' && c.status !== 'refunded' && (
                                                                <div className="flex-1">
                                                                    <label className="text-sm font-medium text-muted-foreground">
                                                                        {t('client.refundAmount')} (TND)
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        value={refundAmount}
                                                                        onChange={(e) =>
                                                                            setRefundAmount(e.target.value)
                                                                        }
                                                                        placeholder="0"
                                                                        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        className="mt-2"
                                                                        disabled={statusMutation.isPending}
                                                                        onClick={() =>
                                                                            handleApproveRefund(c)
                                                                        }
                                                                    >
                                                                        {t('complaint.status.refunded')}
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {c.status !== 'resolved' && c.status !== 'refunded' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={resolveMutation.isPending}
                                                                    onClick={() =>
                                                                        resolveMutation.mutate(c.id)
                                                                    }
                                                                >
                                                                    {t('complaint.status.resolved')}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!isLoading && complaints.length === 0 && (
                        <p className="p-8 text-center text-muted-foreground">
                            {t('client.complaintsEmpty')}
                        </p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminComplaints;
