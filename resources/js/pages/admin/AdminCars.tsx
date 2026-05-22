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
import {
    JsonListEditor,
    type JsonFieldDef,
} from '@/components/forms/JsonListEditor';
import { Button } from '@/components/ui/button';
import { fetchCategories, type Category } from '@/api/categories.api';
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

function getCategoryLabel(
    category: Category | undefined,
    locale: Lang,
): string {
    if (!category) return '';

    return category.name[locale] || category.name.en || category.key;
}

function resolveCategoryKey(
    categories: Category[],
    ...values: Array<unknown>
): string {
    const candidates = values
        .flatMap((value) => {
            if (typeof value === 'string') {
                return [value.trim()];
            }

            if (value && typeof value === 'object') {
                const record = value as Record<string, unknown>;
                return [
                    typeof record.key === 'string' ? record.key.trim() : '',
                    typeof record.category_key === 'string'
                        ? record.category_key.trim()
                        : '',
                    typeof record.en === 'string' ? record.en.trim() : '',
                    typeof record.fr === 'string' ? record.fr.trim() : '',
                    typeof record.ar === 'string' ? record.ar.trim() : '',
                ];
            }

            return [] as string[];
        })
        .filter(Boolean);

    for (const candidate of candidates) {
        const match = categories.find((category) => {
            const names = [
                category.key,
                category.name.en,
                category.name.fr,
                category.name.ar,
            ]
                .filter((value): value is string => typeof value === 'string')
                .map((value) => value.trim())
                .filter(Boolean);

            return names.includes(candidate);
        });

        if (match) return match.key;
    }

    return candidates[0] ?? '';
}

function syncCategoryFields(
    setField: (key: string, value: unknown) => void,
    category: Category | undefined,
    fallbackKey: string,
) {
    const selectedKey = category?.key ?? fallbackKey;
    const baseLabel =
        category?.name.en ??
        category?.name.fr ??
        category?.name.ar ??
        selectedKey;

    setField('category_key', selectedKey);
    setField('category', baseLabel);
    setField('category_en', category?.name.en ?? baseLabel);
    setField('category_fr', category?.name.fr ?? baseLabel);
    setField('category_ar', category?.name.ar ?? baseLabel);
}

function parseGallery(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === 'string') return item.trim();
                if (typeof item === 'number') return String(item);
                if (item && typeof item === 'object') {
                    const record = item as Record<string, unknown>;
                    const candidate =
                        record.url ?? record.path ?? record.src ?? record.image;

                    if (
                        typeof candidate === 'string' ||
                        typeof candidate === 'number'
                    ) {
                        return String(candidate).trim();
                    }
                }

                return '';
            })
            .filter(Boolean);
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
    // Use a translation key here; `t` is only available inside the component via useLanguage
    { key: 'name', labelKey: 'admin.name', translatable: true },
];

export default function AdminCars() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const { settings: siteSettings } = useSiteSettings();
    const isCodeEnabled =
        siteSettings?.config?.navigation?.enabled_dropdowns?.includes('cars');
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const queryKey = useMemo(() => ['admin', 'cars'], []);

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['admin', 'categories', 'cars'],
        queryFn: () => fetchCategories('cars'),
    });

    const categoryLabelByKey = useMemo(
        () =>
            new Map(
                dbCategories.map((category) => [
                    category.key,
                    category.name[lang] || category.name.en,
                ]),
            ),
        [dbCategories, lang],
    );

    const { data: rows = [] } = useQuery<AdminRow[]>({
        queryKey,
        queryFn: async () => {
            const data = (await listAdminEntities<AdminRow>(
                'cars',
            )) as unknown as AdminRow[] | { data?: AdminRow[] };
            const result = Array.isArray(data) ? data : (data.data ?? []);
            console.log('DEBUG: rows data', result);
            return result;
        },
    });

    const saveMutation = useMutation({
        mutationFn: (row: AdminRow) => saveAdminEntity('cars', row),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('cars', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    const dialogInitial = useMemo<Record<string, unknown> | null>(() => {
        if (!editing) return null;

        const details =
            editing.details && typeof editing.details === 'object'
                ? (editing.details as Record<string, unknown>)
                : {};

        const resolvedCategoryKey = resolveCategoryKey(
            dbCategories,
            (editing as Record<string, unknown>).category_key,
            editing.category,
            (editing as Record<string, unknown>).category_en,
            (editing as Record<string, unknown>).category_fr,
            (editing as Record<string, unknown>).category_ar,
            details.category,
        );
        const resolvedCategory = dbCategories.find(
            (category) => category.key === resolvedCategoryKey,
        );

        return {
            ...editing,
            category_key: resolvedCategoryKey,
            category:
                resolvedCategory?.name[lang] ??
                resolvedCategory?.name.en ??
                asText((editing as Record<string, unknown>).category) ??
                '',
            category_en:
                resolvedCategory?.name.en ??
                asText((editing as Record<string, unknown>).category_en) ??
                '',
            category_fr:
                resolvedCategory?.name.fr ??
                asText((editing as Record<string, unknown>).category_fr) ??
                '',
            category_ar:
                resolvedCategory?.name.ar ??
                asText((editing as Record<string, unknown>).category_ar) ??
                '',
            imagePath: asText(editing.image),
            imageFile: null,
            galleryPaths: parseGallery(editing.gallery),
            galleryFiles: [] as File[],
            features: Array.isArray(editing.features) ? editing.features : [],
            policy: Array.isArray(editing.policy)
                ? editing.policy
                : Array.isArray(details.policy)
                  ? details.policy
                  : [],
        };
    }, [dbCategories, editing, lang]);

    // Reset errors when dialog toggles
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setErrors({});
            setEditing(null);
        }
        setOpen(isOpen);
    };

    const validate = (values: Record<string, unknown>) => {
        const errs: Record<string, string> = {};

        ['en', 'fr', 'ar'].forEach((locale) => {
            if (!values[`name_${locale}`]) {
                errs[`name_${locale}`] = t('admin.fieldRequired');
            }
        });

        if (!values.category_key) {
            errs.category_key = t('admin.fieldRequired');
        }

        if (!values.price || Number(values.price) <= 0)
            errs.price = t('admin.invalidPrice');
        if (!values.seats || Number(values.seats) <= 0)
            errs.seats = t('admin.invalidSeats');

        return errs;
    };

    function handleSave(values: Record<string, unknown>) {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        const selectedCategoryKey = asText(values.category_key);
        const selectedCategory = dbCategories.find(
            (category) => category.key === selectedCategoryKey,
        );

        const payload: Record<string, unknown> = {
            ...values,
            id: editing?.id ?? '',
            category_key: selectedCategoryKey,
            category: selectedCategory?.name.en ?? values.category ?? '',
            category_en: selectedCategory?.name.en ?? values.category_en ?? '',
            category_fr: selectedCategory?.name.fr ?? values.category_fr ?? '',
            category_ar: selectedCategory?.name.ar ?? values.category_ar ?? '',
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
            policy: Array.isArray(values.policy) ? values.policy : [],
            details: undefined,
        };

        if (
            Array.isArray(values.galleryFiles) &&
            values.galleryFiles.length > 0
        ) {
            payload.gallery_files = values.galleryFiles;
        }

        saveMutation.mutate(payload as unknown as AdminRow, {
            onSuccess: () => {
                toast.success(
                    editing ? t('actions.saved') : t('actions.added'),
                );
                setEditing(null);
                setOpen(false);
                setErrors({});
            },
            onError: () => {
                toast.error(t('admin.saveFailed'));
            },
        });
    }
    const carSections: SectionDef[] = [
        {
            title: t('admin.carForm.coreDetails'),
            column: 'main',
            description: t('admin.carForm.coreDetailsHint'),
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="category_key"
                            className={`text-xs font-semibold ${errors.category_key ? 'text-destructive' : 'text-muted-foreground'}`}
                        >
                            {t('admin.category')}
                        </label>
                        <Select
                            value={String(values.category_key ?? '')}
                            onValueChange={(val) =>
                                syncCategoryFields(
                                    setField,
                                    dbCategories.find(
                                        (category) => category.key === val,
                                    ),
                                    val,
                                )
                            }
                        >
                            <SelectTrigger
                                id="category_key"
                                className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.category_key ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            >
                                <SelectValue
                                    placeholder={t('actions.select')}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {dbCategories.map((category) => (
                                    <SelectItem
                                        key={category.key}
                                        value={category.key}
                                    >
                                        {getCategoryLabel(category, activeLang)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category_key && (
                            <p className="text-xs text-destructive">
                                {errors.category_key}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            {
                                key: 'name',
                                label: t('admin.name'),
                                placeholder: t('admin.carForm.namePlaceholder'),
                                helpText: t('admin.carForm.nameHint'),
                            },
                            {
                                key: 'fuel',
                                label: t('admin.carForm.fuel'),
                                placeholder: t('admin.carForm.fuelPlaceholder'),
                                helpText: t('admin.carForm.fuelHint'),
                            },
                            {
                                key: 'transmission',
                                label: t('admin.carForm.transmission'),
                                placeholder: t(
                                    'admin.carForm.transmissionPlaceholder',
                                ),
                                helpText: t('admin.carForm.transmissionHint'),
                            },
                        ].map((field) => {
                            const localizedKey = `${field.key}_${activeLang}`;
                            const error = errors[localizedKey];

                            return (
                                <div key={localizedKey} className="space-y-2">
                                    <label
                                        htmlFor={localizedKey}
                                        className={`flex items-center gap-2 text-xs font-semibold ${error ? 'text-destructive' : 'text-muted-foreground'}`}
                                    >
                                        {field.label}
                                        <LangBadge lang={activeLang} />
                                    </label>
                                    <input
                                        id={localizedKey}
                                        value={String(
                                            values[localizedKey] ?? '',
                                        )}
                                        placeholder={field.placeholder}
                                        onChange={(event) =>
                                            setField(
                                                localizedKey,
                                                event.target.value,
                                            )
                                        }
                                        className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                    />
                                    {field.helpText && !error && (
                                        <p className="text-[10px] text-muted-foreground">
                                            {field.helpText}
                                        </p>
                                    )}
                                    {error && (
                                        <p className="text-xs text-destructive">
                                            {error}
                                        </p>
                                    )}
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
                                placeholder="0.00"
                                value={String(values.price ?? '')}
                                onChange={(event) =>
                                    setField('price', event.target.value)
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.price ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            />
                            {errors.price && (
                                <p className="text-xs text-destructive">
                                    {errors.price}
                                </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                                {t('admin.carForm.priceHint')}
                            </p>
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
                                placeholder={t(
                                    'admin.carForm.seatsPlaceholder',
                                )}
                                value={String(values.seats ?? '')}
                                onChange={(event) =>
                                    setField('seats', event.target.value)
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.seats ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            />
                            {errors.seats && (
                                <p className="text-xs text-destructive">
                                    {errors.seats}
                                </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                                {t('admin.carForm.seatsHint')}
                            </p>
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
                        `${t('admin.carForm.feature')} ${index + 1}`
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
                        `${t('admin.carForm.rule')} ${index + 1}`
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
                                                ? lang === 'ar'
                                                    ? 'text-right'
                                                    : 'text-left'
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
                                    className="border-b border-border text-center last:border-0 hover:bg-muted/20"
                                >
                                    <td className="flex justify-center px-4 py-3">
                                        <img
                                            src={asText(row.image)}
                                            alt={asText(row.name_en)}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td
                                        className={`px-4 py-3 text-sm font-semibold ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                    >
                                        {asText(row[`name_${lang}`]) ||
                                            asText(row.name_en)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {asText(row[`category_${lang}`]) ||
                                            asText(row.category_en) ||
                                            asText(row.category) ||
                                            categoryLabelByKey.get(
                                                asText(row.category_key),
                                            ) ||
                                            asText(row.category_key)}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        {Number(row.price).toLocaleString()} DT
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
                onOpenChange={handleOpenChange}
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
                errors={errors}
            />
        </AdminLayout>
    );
}
