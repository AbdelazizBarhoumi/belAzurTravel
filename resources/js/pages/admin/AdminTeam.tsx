import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
} from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import type { FieldDef, SectionDef } from '@/components/forms/EntityFormDialog';
import { EntityFormDialog } from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/api/entities.api';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';
import { cn } from '@/lib/utils';

interface AdminTeamMember {
    id: string;
    name: string;
    name_en: string;
    name_fr: string;
    name_ar: string;
    role: string;
    role_en: string;
    role_fr: string;
    role_ar: string;
    bio: string;
    bio_en: string;
    bio_fr: string;
    bio_ar: string;
    image: string;
    linkedin?: string | null;
    twitter?: string | null;
    email?: string | null;
}

type TeamFormValues = AdminTeamMember & {
    imageFile?: File | null;
};

const AdminTeam = () => {
    useAdminGuard();
    const queryClient = useQueryClient();
    const { data: team = [] } = useQuery({
        queryKey: ['admin', 'team'],
        queryFn: () => listAdminEntities<AdminTeamMember>('team'),
    });
    const saveMutation = useMutation({
        mutationFn: (item: AdminTeamMember) => saveAdminEntity('team', item),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('team', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });
    const { t, dir, lang } = useLanguage();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminTeamMember | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminTeamMember | null>(
        null,
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewRef = useRef<string | null>(null);

    const handleSave = (values: TeamFormValues) => {
        const payload: Record<string, unknown> = {
            ...values,
            id: editing?.id || '',
            image:
                values.imageFile instanceof File
                    ? values.imageFile
                    : values.image,
        };

        // Ensure we send 'image_path' as per migration
        const apiPayload = {
            ...payload,
            image_path: payload.image,
        };

        saveMutation.mutate(apiPayload as unknown as AdminTeamMember);
        toast.success(editing ? t('admin.teamUpdated') : t('admin.teamAdded'));
        setEditing(null);
        setOpen(false);
        // cleanup preview object URL
        if (previewRef.current) {
            try {
                URL.revokeObjectURL(previewRef.current);
            } catch {}
            previewRef.current = null;
            setPreviewUrl(null);
        }
    };

    const teamSections: SectionDef[] = [
        {
            title: t('admin.teamForm.coreDetails'),
            description: t('admin.teamForm.coreDetailsHint'),
            render: ({
                values,
                setField,
                activeLang,
            }: {
                values: any;
                setField: any;
                activeLang: Lang;
            }) => (
                <div className="space-y-4">
                    {['name', 'role', 'bio'].map((k) => (
                        <div key={k} className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                {t(`admin.${k}`)}{' '}
                                <LangBadge lang={activeLang} />
                            </label>
                            <input
                                value={String(
                                    values[`${k}_${activeLang}`] ?? '',
                                )}
                                onChange={(e) =>
                                    setField(
                                        `${k}_${activeLang}`,
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    ))}
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { key: 'linkedin', label: t('admin.teamForm.linkedin') },
                            { key: 'twitter', label: t('admin.teamForm.twitter') },
                            { key: 'email', label: t('admin.teamForm.email') },
                        ].map((field) => (
                            <div key={field.key} className="space-y-2 md:col-span-1">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    {field.label}
                                </label>
                                <input
                                    value={String(values[field.key] ?? '')}
                                    onChange={(e) =>
                                        setField(field.key, e.target.value)
                                    }
                                    placeholder={field.key === 'email' ? 'name@example.com' : 'https://...'}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">{t('admin.teamForm.mainImage')}</label>
                        {(values?.imageFile instanceof File || (editing && editing.image)) && (
                            <div className="mb-2">
                                <img
                                    src={values?.imageFile instanceof File ? previewUrl ?? '' : editing?.image}
                                    alt={editing?.name ?? ''}
                                    className="h-20 w-20 rounded-lg object-cover border border-border"
                                />
                            </div>
                        )}
                        <input
                            type="file"
                            required={!editing}
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setField('imageFile', file);
                                // revoke previous object URL
                                if (previewRef.current) {
                                    try { URL.revokeObjectURL(previewRef.current); } catch {}
                                    previewRef.current = null;
                                }
                                if (file) {
                                    const url = URL.createObjectURL(file);
                                    previewRef.current = url;
                                    setPreviewUrl(url);
                                } else {
                                    setPreviewUrl(null);
                                }
                            }}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout
            title={t('nav.team')}
            subtitle={t('admin.teamSubtitle')}
            actions={
                    <Button
                    onClick={() => {
                        setEditing(null);
                        // clear any previous preview
                        if (previewRef.current) {
                            try { URL.revokeObjectURL(previewRef.current); } catch {}
                            previewRef.current = null;
                        }
                        setPreviewUrl(null);
                        setOpen(true);
                    }}
                    className="gap-2 bg-primary text-primary-foreground"
                >
                    <Plus className="h-4 w-4" /> {t('admin.actions')}
                </Button>
            }
        >
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[t('admin.teamTable.image'), t('admin.teamTable.name'), t('admin.teamTable.role'), t('admin.teamTable.actions')].map(
                                    (h, i) => (
                                        <th
                                            key={h}
                                            className={cn(
                                                'px-4 py-3 text-xs font-semibold uppercase text-muted-foreground',
                                                i === 1 ? (dir === 'rtl' ? 'text-right' : 'text-left') : 'text-center'
                                            )}
                                        >
                                            {h}
                                        </th>
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {team.map((d) => (
                                <tr
                                    key={d.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 text-center">
                                        <img
                                            src={d.image}
                                            alt={d.name}
                                            className="mx-auto h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className={cn(
                                        'px-4 py-3 text-sm font-semibold',
                                        dir === 'rtl' ? 'text-right' : 'text-left'
                                    )}>
                                        {localizeText({
                                            en: d.name_en,
                                            fr: d.name_fr,
                                            ar: d.name_ar,
                                        }, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                        {localizeText({
                                            en: d.role_en,
                                            fr: d.role_fr,
                                            ar: d.role_ar,
                                        }, lang)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(d);
                                                    // clear previous preview when editing existing
                                                    if (previewRef.current) {
                                                        try { URL.revokeObjectURL(previewRef.current); } catch {}
                                                        previewRef.current = null;
                                                    }
                                                    setPreviewUrl(null);
                                                    setOpen(true);
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPendingDelete(d)
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
                    if (!isOpen) setPendingDelete(null);
                }}
                title={t('admin.deleteItemTitle')}
                description={
                    pendingDelete
                        ? `${t('admin.deleteItemPrompt')} “${pendingDelete.name}”? ${t('admin.deleteItemWarning')}`
                        : ''
                }
                confirmText={t('actions.delete')}
                cancelText={t('actions.cancel')}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    deleteMutation.mutate(pendingDelete.id);
                    setPendingDelete(null);
                }}
            />

            <EntityFormDialog<Record<string, unknown>>
                open={open}
                onOpenChange={(isOpen) => {
                    setOpen(isOpen);
                    if (!isOpen) {
                        // cleanup preview when dialog closes
                        if (previewRef.current) {
                            try { URL.revokeObjectURL(previewRef.current); } catch {}
                            previewRef.current = null;
                        }
                        setPreviewUrl(null);
                        setEditing(null);
                    }
                }}
                title={editing ? t('admin.teamEditTitle') : t('admin.teamAddTitle')}
                sections={teamSections}
                initial={editing as unknown as Record<string, unknown>}
                onSubmit={(values) =>
                    handleSave(values as unknown as TeamFormValues)
                }
                languages={['en', 'fr', 'ar']}
                layout="grid-1"
                isSubmitting={saveMutation.isPending}
            />
        </AdminLayout>
    );
};

export default AdminTeam;
