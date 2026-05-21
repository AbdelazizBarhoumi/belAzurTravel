import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
    type AdminRow,
} from '@/api/admin.api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import {
    EntityFormDialog,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { JsonListEditor, type JsonFieldDef } from '@/components/forms/JsonListEditor';
import { Button } from '@/components/ui/button';
import { fetchCategories } from '@/api/categories.api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';

function LangBadge({ lang }: { lang: Lang }) {
    return (
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {lang}
        </span>
    );
}

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function parseGallery(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value === 'string') {
        return value
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

const simpleLocalizedSchema: JsonFieldDef[] = [
    { key: 'name', label: 'Name', translatable: true },
];

export default function AdminCars() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const { settings: siteSettings } = useSiteSettings();
    const isCodeEnabled =
        siteSettings?.config?.navigation?.enabled_dropdowns?.includes(
            'cars',
        );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [open, setOpen] = useState(false);

    // Reset errors when dialog toggles
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) setErrors({});
        setOpen(isOpen);
    };

    const validate = (values: Record<string, unknown>) => {
        const errs: Record<string, string> = {};
        if (!values.name_en) errs.name_en = t('admin.fieldRequired');
        if (!values.price || Number(values.price) <= 0) errs.price = t('admin.invalidPrice');
        if (!values.seats || Number(values.seats) <= 0) errs.seats = t('admin.invalidSeats');
        return errs;
    };

    function handleSave(values: Record<string, unknown>) {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        const payload: Record<string, unknown> = {
            ...values,
            id: editing?.id ?? '',
            image:
                values.imageFile instanceof File
                    ? values.imageFile
                    : ((values.imagePath as string | undefined) ??
                      (values.image as string | undefined) ??
                      ''),
            gallery: Array.isArray(values.galleryPaths)
                ? values.galleryPaths
                : [],
            features: Array.isArray(values.features) ? values.features : [],
            details: {
                policy: Array.isArray(values.policy) ? values.policy : [],
            },
        };

        if (
            Array.isArray(values.galleryFiles) &&
            values.galleryFiles.length > 0
        ) {
            payload.gallery_files = values.galleryFiles;
        }

        saveMutation.mutate(payload);
        toast.success(editing ? t('actions.saved') : t('actions.added'));
        setEditing(null);
        setOpen(false);
    }

    const carSections: SectionDef[] = [
        {
            title: t('admin.carForm.coreDetails'),
            column: 'main',
            description: t('admin.carForm.coreDetailsHint'),
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { key: 'name', label: t('admin.name') },
                            {
                                key: 'category',
                                label: t('admin.category'),
                            },
                            {
                                key: 'fuel',
                                label: t('admin.carForm.fuel'),
                            },
                            {
                                key: 'transmission',
                                label: t('admin.carForm.transmission'),
                            },
                        ].map((field) => {
                            const localizedKey = `${field.key}_${activeLang}`;
                            const error = errors[localizedKey] || (field.key === 'name' ? errors.name_en : null);

                            return (
                                <div key={localizedKey} className="space-y-2">
                                    <label
                                        htmlFor={localizedKey}
                                        className={`text-xs font-semibold ${error ? 'text-destructive' : 'text-muted-foreground'}`}
                                    >
                                        {field.label}
                                        <LangBadge lang={activeLang} />
                                    </label>
                                    {field.key === 'category' &&
                                    dbCategories.length > 0 ? (
                                        <Select
                                            value={String(
                                                values[localizedKey] ?? '',
                                            )}
                                            onValueChange={(val) =>
                                                setField(localizedKey, val)
                                            }
                                        >
                                            <SelectTrigger
                                                id={localizedKey}
                                                className={`w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 ${error ? 'border-destructive focus:ring-destructive/20' : 'border-border focus:border-primary focus:ring-primary/20'}`}
                                            >
                                                <SelectValue
                                                    placeholder={t('actions.select')}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dbCategories.map((c) => (
                                                    <SelectItem
                                                        key={c.key}
                                                        value={c.key}
                                                    >
                                                        {c.name[activeLang] ||
                                                            c.name.en}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <input
                                            id={localizedKey}
                                            value={String(
                                                values[localizedKey] ?? '',
                                            )}
                                            onChange={(event) =>
                                                setField(
                                                    localizedKey,
                                                    event.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 ${error ? 'border-destructive focus:ring-destructive/20' : 'border-border focus:border-primary focus:ring-primary/20'}`}
                                            required
                                        />
                                    )}
                                    {error && <p className="text-xs text-destructive">{error}</p>}
                                </div>
                            );
                        })}

                        <div className="space-y-2">
                            <label
                                htmlFor="car-price"
                                className={`text-xs font-semibold ${errors.price ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                                {t('admin.price')}
                            </label>
                            <input
                                id="car-price"
                                type="number"
                                value={String(values.price ?? '')}
                                onChange={(event) =>
                                    setField('price', event.target.value)
                                }
                                className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 ${errors.price ? 'border-destructive focus:ring-destructive/20' : 'border-border focus:border-primary focus:ring-primary/20'}`}
                            />
                            {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="car-seats"
                                className={`text-xs font-semibold ${errors.seats ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                                {t('admin.carForm.seats')}
                            </label>
                            <input
                                id="car-seats"
                                type="number"
                                value={String(values.seats ?? '')}
                                onChange={(event) =>
                                    setField('seats', event.target.value)
                                }
                                className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 ${errors.seats ? 'border-destructive focus:ring-destructive/20' : 'border-border focus:border-primary focus:ring-primary/20'}`}
                            />
                            {errors.seats && <p className="text-xs text-destructive">{errors.seats}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor={`car-description-${activeLang}`}
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.description')}
                                <LangBadge lang={activeLang} />
                            </label>
                            <textarea
                                id={`car-description-${activeLang}`}
                                value={String(
                                    values[`description_${activeLang}`] ?? '',
                                )}
                                onChange={(event) =>
                                    setField(
                                        `description_${activeLang}`,
                                        event.target.value,
                                    )
                                }
                                rows={5}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.carForm.media'),
            column: 'side',
            description: t('admin.carForm.mediaHint'),
            render: ({ values, setField, activeLang }) => (
                <EntityMediaInputs
                    values={values}
                    setField={setField}
                    imageLabel={t('admin.image')}
                    galleryLabel={t('admin.gallery')}
                    showImage
                    showGallery
                />
            ),
        },
        {
            title: t('admin.carForm.features'),
            column: 'main',
            description: t('admin.carForm.featuresHint'),
            render: ({ values, setField, activeLang }) => (
                <JsonListEditor
                    title={t('admin.carForm.features')}
                    items={
                        Array.isArray(values.features) ? values.features : []
                    }
                    onItemsChange={(items) => setField('features', items)}
                    schema={simpleLocalizedSchema}
                    activeLang={activeLang}
                    addButtonLabel={t('admin.carForm.addFeature')}
                    itemLabel={(item, index) =>
                        ((item as any).name as any)?.[activeLang] ||
                        `Feature ${index + 1}`
                    }
                />
            ),
        },
        {
            title: t('admin.carForm.policy'),
            column: 'side',
            description: t('admin.carForm.policyHint'),
            render: ({ values, setField, activeLang }) => (
                <JsonListEditor
                    title={t('admin.carForm.policy')}
                    items={Array.isArray(values.policy) ? values.policy : []}
                    onItemsChange={(items) => setField('policy', items)}
                    schema={simpleLocalizedSchema}
                    activeLang={activeLang}
                    addButtonLabel={t('admin.carForm.addPolicy')}
                    itemLabel={(item, index) =>
                        ((item as any).name as any)?.[activeLang] ||
                        `Rule ${index + 1}`
                    }
                />
            ),
        },
    ];

    return (
        <AdminLayout
            title={t('admin.cars')}
            subtitle={t('admin.carsSubtitle')}
            actions={
                <div className="flex gap-2">
                    {isCodeEnabled && (
                        <Button
                            variant="outline"
                            onClick={() => setCatManagerOpen(true)}
                            className="gap-2"
                        >
                            <Settings className="h-4 w-4" />{' '}
                            {t('admin.manageCategories') || 'Manage Categories'}
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            setEditing(null);
                            setOpen(true);
                        }}
                        className="gap-2 bg-primary text-primary-foreground"
                    >
                        <Plus className="h-4 w-4" /> {t('actions.add')}
                    </Button>
                </div>
            }
        >
            <CategoryManager
                type="cars"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'categories', 'cars'],
                    });
                }}
            />

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    t('admin.image'),
                                    t('admin.name'),
                                    t('admin.category'),
                                    t('admin.price'),
                                    t('admin.carForm.seats'),
                                    t('admin.actions'),
                                ].map((column, index) => (
                                    <th
                                        key={column}
                                        className={`px-4 py-3 text-xs font-semibold uppercase text-muted-foreground ${
                                            index === 1 
                                                ? (lang === 'ar' ? 'text-right' : 'text-left') 
                                                : 'text-center'
                                        }`}
                                    >
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={String(row.id)}
                                    className="border-b border-border last:border-0 hover:bg-muted/20 text-center"
                                >
                                    <td className="px-4 py-3 flex justify-center">
                                        <img
                                            src={asText(row.image)}
                                            alt={asText(row.name_en)}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-semibold ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                                        {asText(row[`name_${lang}`]) ||
                                            asText(row.name_en)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {asText(row[`category_${lang}`]) ||
                                            asText(row.category_en)}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        ${Number(row.price).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {asText(row.seats)}
                                    </td>
                                    <td className="px-4 py-3">
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
                        ? `${t('admin.deleteItemPrompt')} “${String(pendingDelete.name_en ?? pendingDelete.name ?? '')}”? ${t('admin.deleteItemWarning')}`
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
                onOpenChange={setOpen}
                title={
                    editing
                        ? `${t('actions.edit')} ${t('admin.name')}`
                        : `${t('actions.add')} ${t('admin.name')}`
                }
                sections={carSections}
                initial={dialogInitial}
                onSubmit={handleSave}
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
                isSubmitting={saveMutation.isPending}
            />
        </AdminLayout>
    );
}
