function LangBadge({ lang }: { lang: Lang }) {
    return (
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {lang}
        </span>
    );
}
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

const title = copy('Promos', 'Promos', 'الرموز الترويجية');
const subtitle = copy(
    'Manage promo codes',
    'Gérer les codes promo',
    'إدارة الرموز الترويجية',
);

const columns: Array<{ key: string; label: Copy }> = [
    { key: 'code', label: copy('Code', 'Code', 'الرمز') },
    { key: 'title_en', label: copy('Title', 'Titre', 'العنوان') },
    {
        key: 'discount_en',
        label: copy('Discount', 'Remise', 'الخصم'),
    },
    {
        key: 'expires_en',
        label: copy('Expires', 'Expiration', 'ينتهي'),
    },
];

const sections: SectionDef[] = [
    {
        title: 'Core information',
        description: 'Identity and public-facing campaign values.',
        columns: 2,
        fields: [
            { key: 'code', label: 'Code' },
            { key: 'color', label: 'Color token' },
        ],
        render: ({ values, setField, activeLang }) => (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    {[
                        {
                            key: 'title',
                            label: copy('Title', 'Titre', 'العنوان'),
                        },
                        {
                            key: 'discount',
                            label: copy('Discount', 'Remise', 'الخصم'),
                        },
                        {
                            key: 'expires',
                            label: copy('Expires', 'Expiration', 'ينتهي'),
                        },
                    ].map((field) => {
                        const fieldKey = `${field.key}_${activeLang}`;

                        return (
                            <div key={fieldKey} className="space-y-2">
                                <label
                                    htmlFor={fieldKey}
                                    className="text-xs font-semibold text-muted-foreground"
                                >
                                    {field.label.en}
                                    <LangBadge lang={activeLang} />
                                </label>
                                <input
                                    id={fieldKey}
                                    value={String(values[fieldKey] ?? '')}
                                    onChange={(event) =>
                                        setField(fieldKey, event.target.value)
                                    }
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        ),
    },
    {
        title: 'Description and rules',
        description:
            'Copy shown in the promo detail cards and the fine print sections.',
        render: ({ values, setField, activeLang }) => (
            <div className="grid gap-4 md:grid-cols-2">
                {[
                    {
                        key: 'description',
                        label: copy('Description', 'Description', 'الوصف'),
                    },
                    {
                        key: 'eligibility',
                        label: copy('Eligibility', 'Éligibilité', 'الأهلية'),
                    },
                    {
                        key: 'howToUse',
                        label: copy(
                            'How to use',
                            'Comment utiliser',
                            'كيفية الاستخدام',
                        ),
                    },
                    {
                        key: 'terms',
                        label: copy(
                            'Terms & Conditions',
                            'Conditions',
                            'الشروط',
                        ),
                    },
                ].map((field) => {
                    const fieldKey = `${field.key}_${activeLang}`;

                    return (
                        <div key={fieldKey} className="space-y-2 md:col-span-2">
                            <label
                                htmlFor={fieldKey}
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {field.label.en}
                                <LangBadge lang={activeLang} />
                            </label>
                            <textarea
                                id={fieldKey}
                                value={String(values[fieldKey] ?? '')}
                                onChange={(event) =>
                                    setField(fieldKey, event.target.value)
                                }
                                rows={4}
                                className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    );
                })}
            </div>
        ),
    },
    {
        title: 'Limits and scope',
        description: 'Campaign usage metadata and active state.',
        columns: 2,
        fields: [
            {
                key: 'gallery',
                label: 'Gallery image URLs (one per line)',
                type: 'textarea',
                rows: 4,
                colSpan: 2,
            },
            { key: 'usage_limit', label: 'Usage limit', type: 'number' },
            { key: 'per_user_limit', label: 'Per-user limit', type: 'number' },
            { key: 'applicable_to', label: 'Applicable to (comma-separated)' },
            {
                key: 'active',
                label: 'Active',
                type: 'select',
                options: [
                    { label: 'Active', value: '1' },
                    { label: 'Inactive', value: '0' },
                ],
            },
        ],
    },
];

export default function AdminPromos() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const queryKey = useMemo(() => ['admin', 'promos'], []);
    const { data: rows = [] } = useQuery<AdminRow[]>({
        queryKey,
        queryFn: () => listAdminEntities<AdminRow>('promos'),
    });

    const saveMutation = useMutation({
        mutationFn: (row: AdminRow) => saveAdminEntity('promos', row),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('promos', id),
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

            <EntityFormDialog<AdminRow>
                open={open}
                onOpenChange={setOpen}
                title={
                    editing
                        ? `${t('actions.edit')} ${title[lang]}`
                        : `${t('actions.add')} ${title[lang]}`
                }
                sections={sections}
                initial={editing}
                onSubmit={handleSave}
                languages={['en', 'fr', 'ar']}
            />
        </AdminLayout>
    );
}
