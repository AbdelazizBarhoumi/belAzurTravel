import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
    type AdminRow,
} from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
    EntityFormDialog,
    type FieldDef,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';

type Copy = Record<Lang, string>;

const copy = (en: string, fr: string, ar: string): Copy => ({ en, fr, ar });

function localizedFields(base: string, label: Copy, type?: FieldDef['type']) {
    return [
        { key: `${base}_en`, label: label.en, type, required: true },
        { key: `${base}_fr`, label: label.fr, type, required: true },
        { key: `${base}_ar`, label: label.ar, type, required: true },
    ];
}

const title = copy('Deals', 'Offres', 'العروض');
const subtitle = copy('Manage deals', 'Gérer les offres', 'إدارة العروض');

const columns: Array<{ key: string; label: Copy }> = [
    { key: 'title_en', label: copy('Title', 'Titre', 'العنوان') },
    {
        key: 'discount_en',
        label: copy('Discount', 'Remise', 'الخصم'),
    },
    {
        key: 'expires_en',
        label: copy('Expires', 'Expiration', 'ينتهي'),
    },
    { key: 'category_en', label: copy('Category', 'Catégorie', 'الفئة') },
];

const sections: SectionDef[] = [
    {
        title: 'Promotion details',
        description: 'The public title and the campaign timing details.',
        columns: 2,
        fields: [
            ...localizedFields('title', copy('Title', 'Titre', 'العنوان')),
            ...localizedFields('discount', copy('Discount', 'Remise', 'الخصم')),
            ...localizedFields(
                'expires',
                copy('Expires', 'Expiration', 'ينتهي'),
            ),
            ...localizedFields(
                'category',
                copy('Category', 'Catégorie', 'الفئة'),
            ),
        ],
    },
    {
        title: 'Description',
        description: 'Long-form copy shown on the deal detail page.',
        fields: [
            ...localizedFields(
                'description',
                copy('Description', 'Description', 'الوصف'),
                'textarea',
            ),
        ],
    },
];

export default function AdminDeals() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const queryKey = useMemo(() => ['admin', 'deals'], []);
    const { data: rows = [] } = useQuery<AdminRow[]>({
        queryKey,
        queryFn: async () => {
            const data = (await listAdminEntities<AdminRow>(
                'deals',
            )) as unknown as AdminRow[] | { data?: AdminRow[] };
            return Array.isArray(data) ? data : (data.data ?? []);
        },
    });

    const saveMutation = useMutation({
        mutationFn: (row: AdminRow) => saveAdminEntity('deals', row),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('deals', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    function handleSave(values: AdminRow) {
        saveMutation.mutate({ ...values, id: editing?.id ?? '' });
        toast.success(editing ? t('actions.saved') : t('actions.added'));
        setEditing(null);
    }

    const dealSections: SectionDef[] = [
        {
            title: 'Promotion details',
            description:
                'Edit localized promotion fields one language at a time.',
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            {
                                key: `title_${activeLang}`,
                                label: 'Title',
                            },
                            {
                                key: `discount_${activeLang}`,
                                label: 'Discount',
                            },
                            {
                                key: `expires_${activeLang}`,
                                label: 'Expires',
                            },
                            {
                                key: `category_${activeLang}`,
                                label: 'Category',
                            },
                        ].map((f) => (
                            <div key={f.key} className="space-y-2">
                                <label
                                    htmlFor={f.key}
                                    className="text-xs font-semibold text-muted-foreground"
                                >
                                    {f.label}
                                    <LangBadge lang={activeLang} />
                                </label>
                                <input
                                    id={f.key}
                                    value={String(values[f.key] ?? '')}
                                    onChange={(e) =>
                                        setField(f.key, e.target.value)
                                    }
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        ...sections.slice(1),
    ];

    return (
        <AdminLayout
            title={title[lang]}
            subtitle={subtitle[lang]}
            actions={
                <Button
                    onClick={() => {
                        setEditing(null);
                        setOpen(true);
                    }}
                    className="gap-2 bg-primary text-primary-foreground"
                >
                    <Plus className="h-4 w-4" /> {t('actions.add')}
                </Button>
            }
        >
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground"
                                    >
                                        {column.label[lang]}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                    {t('admin.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row: AdminRow) => (
                                <tr
                                    key={String(row.id)}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className="max-w-64 truncate px-4 py-3 text-sm"
                                        >
                                            {String(row[column.key] ?? '')}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(row);
                                                    setOpen(true);
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                                aria-label={t('actions.edit')}
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPendingDelete(row)
                                                }
                                                className="rounded-lg p-1.5 hover:bg-destructive/10"
                                                aria-label={t('actions.delete')}
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

            <EntityFormDialog<AdminRow>
                open={open}
                onOpenChange={setOpen}
                title={
                    editing
                        ? `${t('actions.edit')} ${title[lang]}`
                        : `${t('actions.add')} ${title[lang]}`
                }
                sections={dealSections}
                initial={editing}
                onSubmit={handleSave}
                languages={['en', 'fr', 'ar']}
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
                        ? `${t('admin.deleteItemPrompt')} “${String(pendingDelete.title_en ?? '')}”? ${t('admin.deleteItemWarning')}`
                        : t('admin.deleteItemFallback')
                }
                confirmText={t('actions.delete')}
                cancelText={t('actions.cancel')}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    deleteMutation.mutate(String(pendingDelete.id));
                    setPendingDelete(null);
                }}
            />
        </AdminLayout>
    );
}
