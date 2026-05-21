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
import { StatusSelect } from '@/components/ui/StatusSelect';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EntityFormDialog, type SectionDef } from '@/components/forms/EntityFormDialog';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import { JsonListEditor, type JsonFieldDef } from '@/components/forms/JsonListEditor';
import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';
import { localizeAdminValue } from '@/lib/adminI18n';

type Copy = Record<Lang, string>;

const copy = (en: string, fr: string, ar: string): Copy => ({ en, fr, ar });

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

const simpleLocalizedSchema: JsonFieldDef[] = [
    { key: 'name', label: 'Name', translatable: true },
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
        mutationFn: (row: Record<string, unknown>) =>
            saveAdminEntity('promos', row as { id?: string | number | null }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('promos', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    const dialogInitial: Record<string, unknown> | null = useMemo(() => {
        if (!editing) return null;

        const parseGallery = (val: unknown): string[] => {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string')
                return val
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean);
            return [];
        };

        return {
            ...editing,
            galleryPaths: parseGallery(editing.gallery),
            galleryFiles: [] as File[],
            active: String(editing.active ?? '1'),
            eligibility: Array.isArray(editing.eligibility) ? editing.eligibility : [],
            howToUse: Array.isArray(editing.howToUse) ? editing.howToUse : [],
            terms: Array.isArray(editing.terms) ? editing.terms : [],
        };
    }, [editing]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset errors when modal opens/closes
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setErrors({});
            setEditing(null);
        }
    };

    const validate = (values: Record<string, unknown>): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (!values.code) errs.code = t('admin.errors.required');
        if (!values.title_en) errs.title_en = t('admin.errors.required');
        return errs;
    };

    function handleSave(values: Record<string, unknown>, callback: (success: boolean) => void) {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            callback(false);
            return;
        }

        const payload: Record<string, unknown> = {
            ...values,
            id: editing?.id ?? '',
            gallery: Array.isArray(values.galleryPaths)
                ? values.galleryPaths
                : [],
            gallery_files: values.galleryFiles,
            usage_limit: values.usage_limit ? Number(values.usage_limit) : null,
            per_user_limit: values.per_user_limit ? Number(values.per_user_limit) : null,
            active: values.active === '1',
            eligibility: Array.isArray(values.eligibility) ? values.eligibility : [],
            howToUse: Array.isArray(values.howToUse) ? values.howToUse : [],
            terms: Array.isArray(values.terms) ? values.terms : [],
        };

        saveMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(editing ? t('actions.saved') : t('actions.added'));
                setEditing(null);
                callback(true);
            },
            onError: () => {
                toast.error(t('admin.saveError'));
                callback(false);
            }
        });
    }

    const promoSections: SectionDef[] = [
        {
            title: 'Core information',
            description: 'Identity and public-facing campaign values.',
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">{t('admin.promos.code')}</label>
                            <input
                                value={String(values.code ?? '')}
                                onChange={(e) => setField('code', e.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm ${errors.code ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                            />
                            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">Color token</label>
                            <input
                                value={String(values.color ?? '')}
                                onChange={(e) => setField('color', e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        {[
                            { key: 'title', label: t('admin.promos.titleLabel') },
                            { key: 'discount', label: t('admin.promos.discount') },
                            { key: 'expires', label: t('admin.promos.expires') },
                        ].map((field) => {
                            const fieldKey = `${field.key}_${activeLang}`;
                            const isTitleEn = fieldKey === 'title_en';
                            
                            return (
                                <div key={fieldKey} className="space-y-2">
                                    <label
                                        htmlFor={fieldKey}
                                        className="text-xs font-semibold text-muted-foreground"
                                    >
                                        {field.label}
                                        <LangBadge lang={activeLang} />
                                    </label>
                                    <input
                                        id={fieldKey}
                                        value={String(values[fieldKey] ?? '')}
                                        onChange={(event) =>
                                            setField(fieldKey, event.target.value)
                                        }
                                        className={`w-full rounded-lg border px-3 py-2 text-sm ${isTitleEn && errors.title_en ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                                    />
                                    {isTitleEn && errors.title_en && <p className="text-xs text-destructive">{errors.title_en}</p>}
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
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            Description <LangBadge lang={activeLang} />
                        </label>
                        <textarea
                            value={String(values[`description_${activeLang}`] ?? '')}
                            onChange={(e) => setField(`description_${activeLang}`, e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="pt-4 border-t border-border">
                        <JsonListEditor
                            title="Eligibility"
                            items={Array.isArray(values.eligibility) ? values.eligibility : []}
                            onItemsChange={(items) => setField('eligibility', items)}
                            schema={simpleLocalizedSchema}
                            activeLang={activeLang}
                            addButtonLabel="Add Rule"
                            itemLabel={(item, index) =>
                                (item.name as Record<string, string> | undefined)?.[activeLang] || `Rule ${index + 1}`
                            }
                        />
                    </div>

                    <div className="pt-4 border-t border-border">
                        <JsonListEditor
                            title={t('admin.promos.eligibility')}
                            items={Array.isArray(values.eligibility) ? values.eligibility : []}
                            onItemsChange={(items) => setField('eligibility', items)}
                            schema={simpleLocalizedSchema}
                            activeLang={activeLang}
                            addButtonLabel={t('admin.promos.addRule')}
                            itemLabel={(item, index) =>
                                (item.name as Record<string, string> | undefined)?.[activeLang] || `Rule ${index + 1}`
                            }
                        />
                    </div>

                    <div className="pt-4 border-t border-border">
                        <JsonListEditor
                            title={t('admin.promos.howToUse')}
                            items={Array.isArray(values.howToUse) ? values.howToUse : []}
                            onItemsChange={(items) => setField('howToUse', items)}
                            schema={simpleLocalizedSchema}
                            activeLang={activeLang}
                            addButtonLabel={t('admin.promos.addStep')}
                            itemLabel={(item, index) =>
                                (item.name as Record<string, string> | undefined)?.[activeLang] || `Step ${index + 1}`
                            }
                        />
                    </div>

                    <div className="pt-4 border-t border-border">
                        <JsonListEditor
                            title={t('admin.promos.terms')}
                            items={Array.isArray(values.terms) ? values.terms : []}
                            onItemsChange={(items) => setField('terms', items)}
                            schema={simpleLocalizedSchema}
                            activeLang={activeLang}
                            addButtonLabel={t('admin.promos.addTerm')}
                            itemLabel={(item, index) =>
                                (item.name as Record<string, string> | undefined)?.[activeLang] || `Term ${index + 1}`
                            }
                        />
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.promos.limitsTitle'),
            description: t('admin.promos.limitsDescription'),
            render: ({ values, setField }) => (
                <div className="space-y-6">
                    <EntityMediaInputs
                        values={values}
                        setField={setField}
                        galleryLabel={t('admin.promos.gallery')}
                        showGallery
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                htmlFor="promo-usage_limit"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.promos.usageLimit')}
                            </label>
                            <input
                                id="promo-usage_limit"
                                type="number"
                                value={String(values.usage_limit ?? '')}
                                onChange={(event) =>
                                    setField('usage_limit', event.target.value)
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="promo-per_user_limit"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.promos.perUserLimit')}
                            </label>
                            <input
                                id="promo-per_user_limit"
                                type="number"
                                value={String(values.per_user_limit ?? '')}
                                onChange={(event) =>
                                    setField('per_user_limit', event.target.value)
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor="promo-applicable_to"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.promos.applicableTo')}
                            </label>
                            <input
                                id="promo-applicable_to"
                                value={String(values.applicable_to ?? '')}
                                onChange={(event) =>
                                    setField('applicable_to', event.target.value)
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor="promo-active"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.promos.active')}
                            </label>
                            <StatusSelect
                                value={String(values.active ?? '1')}
                                onValueChange={(val) => setField('active', val)}
                                options={[
                                    { value: '1', label: t('admin.promos.active') },
                                    { value: '0', label: t('admin.promos.inactive') },
                                ]}
                                className="w-full rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout
            title={t('admin.promos.title')}
            subtitle={t('admin.promos.subtitle')}
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
                                {columns.map((column, index) => (
                                    <th
                                        key={column.key}
                                        className={`px-4 py-3 text-xs font-semibold uppercase text-muted-foreground ${index === 1 ? (lang === 'ar' ? 'text-right' : 'text-left') : 'text-center'}`}
                                    >
                                        {column.label[lang]}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground">
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
                                    {columns.map((column, index) => (
                                        <td
                                            key={column.key}
                                            className={`max-w-64 truncate px-4 py-3 text-sm ${index === 1 ? (lang === 'ar' ? 'text-right' : 'text-left') : 'text-center'}`}
                                        >
                                            {column.key === 'code'
                                                ? String(row[column.key] ?? '')
                                                : localizeAdminValue(
                                                      row,
                                                      column.key.replace(/_en$/, ''),
                                                      lang,
                                                  )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
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

            <EntityFormDialog<Record<string, unknown>>
                open={open}
                onOpenChange={handleOpenChange}
                title={
                    editing
                        ? `${t('actions.edit')} ${t('admin.promos.title')}`
                        : `${t('actions.add')} ${t('admin.promos.title')}`
                }
                sections={promoSections}
                initial={dialogInitial}
                onSubmit={handleSave}
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
                isSubmitting={saveMutation.isPending}
            />
        </AdminLayout>
    );
}
