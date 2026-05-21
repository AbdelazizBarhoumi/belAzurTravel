import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
} from '@/api/admin.api';
import { fetchCategories } from '@/api/categories.api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import LangBadge from '@/components/forms/LangBadge';
import { EntityFormDialog } from '@/components/forms/EntityFormDialog';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { JsonListEditor, type JsonFieldDef } from '@/components/forms/JsonListEditor';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { AdminDestination } from '@/hooks/useAdminStore';
import {
    categoryLabels,
    countryLabels,
    destinationLabels,
    localizeKnown,
} from '@/lib/adminI18n';

type DestinationFormValues = AdminDestination & {
    imagePath?: string;
    imageFile?: File | null;
    galleryPaths?: string[];
    galleryFiles?: File[];
};

type DestinationLang = 'en' | 'fr' | 'ar';

function localizedKey(base: string, lang: DestinationLang): string {
    return `${base}_${lang}`;
}

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function firstNonEmpty(...values: unknown[]): string {
    for (const value of values) {
        if (typeof value !== 'string') continue;

        const trimmed = value.trim();
        if (trimmed !== '') {
            return trimmed;
        }
    }

    return '';
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

const highlightSchema: JsonFieldDef[] = [
    { key: 'name', labelKey: 'admin.destinationForm.highlightName', translatable: true },
];

const AdminDestinations = () => {
    useAdminGuard();

    const queryClient = useQueryClient();
    const { t, lang } = useLanguage();
    const { settings: siteSettings } = useSiteSettings();
    const [open, setOpen] = useState(false);
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    const [editing, setEditing] = useState<AdminDestination | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminDestination | null>(
        null,
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (values: DestinationFormValues): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (!firstNonEmpty(values.name_en, values.name_fr, values.name_ar, values.name)) errs.name_en = t('admin.errors.required');
        if (!firstNonEmpty(values.country_en, values.country_fr, values.country_ar, values.country)) errs.country_en = t('admin.errors.required');
        if (!values.category_key) errs.category_key = t('admin.errors.required');
        return errs;
    };

    const isCodeEnabled =
        siteSettings?.config?.navigation?.enabled_dropdowns?.includes(
            'destinations',
        );

    const dialogInitial: DestinationFormValues | null = editing
        ? ({
              ...editing,
              imagePath: asText(editing.image),
              imageFile: null,
              galleryPaths: parseGallery(editing.gallery),
              galleryFiles: [],
              highlights: Array.isArray(editing.highlights) ? editing.highlights : [],
          } as DestinationFormValues)
        : null;

    const { data: destinations = [] } = useQuery({
        queryKey: ['admin', 'destinations'],
        queryFn: () => listAdminEntities<AdminDestination>('destinations'),
    });

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['admin', 'categories', 'destinations'],
        queryFn: () => fetchCategories('destinations'),
    });

    const saveMutation = useMutation({
        mutationFn: (item: AdminDestination) =>
            saveAdminEntity('destinations', item),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('destinations', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });

    const handleSave = (values: DestinationFormValues) => {
        const item: Record<string, unknown> = {
            ...values,
            id: editing?.id || '',
            image:
                values.imageFile instanceof File
                    ? values.imageFile
                    : (values.imagePath ?? values.image ?? ''),
            gallery: Array.isArray(values.galleryPaths)
                ? values.galleryPaths
                : [],
            highlights: Array.isArray(values.highlights) ? values.highlights : [],
        };

        if (
            Array.isArray(values.galleryFiles) &&
            values.galleryFiles.length > 0
        ) {
            item.gallery_files = values.galleryFiles;
        }

        saveMutation.mutate(item as unknown as AdminDestination);
        toast.success(
            editing
                ? t('admin.destinationUpdated')
                : t('admin.destinationAdded'),
        );
        setEditing(null);
    };

    return (
        <AdminLayout
            title={t('admin.destinations')}
            subtitle={t('admin.destinationsSubtitle')}
            actions={
                <div className="flex gap-2">
                    {isCodeEnabled && (
                        <Button
                            variant="outline"
                            onClick={() => setCatManagerOpen(true)}
                            className="gap-2"
                        >
                            <Settings className="h-4 w-4" /> {t('admin.manageCategories')}
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
                type="destinations"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'categories', 'destinations'],
                    });
                }}
            />
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    t('admin.destinationTable.image'),
                                    t('admin.destinationTable.name'),
                                    t('admin.destinationTable.country'),
                                    t('admin.destinationTable.category'),
                                    t('admin.destinationTable.price'),
                                    t('admin.destinationTable.rating'),
                                    t('admin.destinationTable.actions'),
                                ].map((header, index) => (
                                    <th
                                        key={header}
                                        className={`px-4 py-3 text-xs font-semibold uppercase text-muted-foreground ${
                                            index === 1 
                                                ? (lang === 'ar' ? 'text-right' : 'text-left') 
                                                : 'text-center'
                                        }`}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {destinations.map((destination) => (
                                <tr
                                    key={destination.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">
                                            <img
                                                src={destination.image}
                                                alt={localizeKnown(
                                                    destination.name,
                                                    destinationLabels,
                                                    lang,
                                                )}
                                                className="h-12 w-12 rounded-lg object-cover"
                                            />
                                        </div>
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-semibold ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                                        {localizeKnown(
                                            destination.name,
                                            destinationLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground text-center">
                                        {localizeKnown(
                                            destination.country,
                                            countryLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs">
                                            {typeof destination.category ===
                                                'object' &&
                                            destination.category !== null
                                                ? (destination.category as any)[
                                                      lang
                                                  ] ||
                                                  (destination.category as any)
                                                      .en
                                                : localizeKnown(
                                                      String(
                                                          destination.category,
                                                      ),
                                                      categoryLabels,
                                                      lang,
                                                  )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-center">
                                        ${destination.price.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">
                                        {destination.rating}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(destination);
                                                    setOpen(true);
                                                }}
                                                aria-label={`${t('actions.edit')} ${localizeKnown(
                                                    destination.name,
                                                    destinationLabels,
                                                    lang,
                                                )}`}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPendingDelete(
                                                        destination,
                                                    )
                                                }
                                                aria-label={`${t('actions.delete')} ${localizeKnown(
                                                    destination.name,
                                                    destinationLabels,
                                                    lang,
                                                )}`}
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

            <EntityFormDialog
                open={open}
                onOpenChange={setOpen}
                errors={errors}
                isSubmitting={saveMutation.isPending}
                validate={(values) => {
                    const errs = validate(values as DestinationFormValues);
                    setErrors(errs);
                    return errs;
                }}
                title={
                    editing
                        ? t('admin.destinationEditTitle')
                        : t('admin.destinationAddTitle')
                }
                subtitle={t('admin.destinationForm.helper')}
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
                initial={
                    dialogInitial as unknown as
                        | Record<string, unknown>
                        | undefined
                }
                sections={[
                    {
                        title: t('admin.destinationForm.coreInformation'),
                        description: t(
                            'admin.destinationForm.coreInformationHint',
                        ),
                        columns: 2,
                        render: ({ values, setField, activeLang }) => (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {[
                                        {
                                            key: 'name',
                                            label: t(
                                                'admin.destinationForm.name',
                                            ),
                                            type: 'text' as const,
                                            required: true,
                                        },
                                        {
                                            key: 'country',
                                            label: t(
                                                'admin.destinationForm.country',
                                            ),
                                            type: 'text' as const,
                                            required: true,
                                        },
                                        {
                                            key: 'category_key',
                                            label: t(
                                                'admin.destinationForm.category',
                                            ),
                                            type: 'select' as const,
                                            options:
                                                dbCategories.length > 0
                                                    ? dbCategories.map((c) => ({
                                                          label:
                                                              c.name[
                                                                  activeLang
                                                              ] || c.name.en,
                                                          value: c.key,
                                                      }))
                                                    : Object.keys(
                                                          categoryLabels,
                                                      ).map((k) => ({
                                                          label:
                                                              categoryLabels[
                                                                  k as keyof typeof categoryLabels
                                                              ][activeLang] ??
                                                              String(k),
                                                          value: String(k),
                                                      })),
                                            required: true,
                                        },
                                    ].map((field) => {
                                        const key = field.key;
                                        const valueKey = field.key === 'category_key' 
                                            ? 'category_key' 
                                            : localizedKey(field.key, activeLang);

                                        return (
                                            <div
                                                key={valueKey}
                                                className="space-y-2"
                                            >
                                                <label
                                                    htmlFor={valueKey}
                                                    className="text-xs font-semibold text-muted-foreground"
                                                >
                                                    {field.label}
                                                    <LangBadge
                                                        lang={activeLang}
                                                    />
                                                </label>
                                                {field.type === 'select' ? (
                                                    <Select
                                                        value={String(
                                                            values[valueKey] ?? '',
                                                        )}
                                                        onValueChange={(val) =>
                                                            setField(valueKey, val)
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id={valueKey}
                                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                                                        >
                                                            <SelectValue
                                                                placeholder={t(
                                                                    'actions.select',
                                                                )}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {field.options?.map(
                                                                (option) => (
                                                                    <SelectItem
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <input
                                                        id={valueKey}
                                                        value={String(
                                                            values[valueKey] ?? '',
                                                        )}
                                                        onChange={(event) =>
                                                            setField(
                                                                valueKey,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        required={
                                                            field.required
                                                        }
                                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div className="space-y-2 md:col-span-2">
                                        <label
                                            htmlFor={localizedKey('description', activeLang)}
                                            className="text-xs font-semibold text-muted-foreground"
                                        >
                                            {t('admin.description')}
                                            <LangBadge lang={activeLang} />
                                        </label>
                                        <textarea
                                            id={localizedKey('description', activeLang)}
                                            value={String(values[localizedKey('description', activeLang)] ?? '')}
                                            onChange={(e) => setField(localizedKey('description', activeLang), e.target.value)}
                                            rows={4}
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor="destination-price"
                                            className="text-xs font-semibold text-muted-foreground"
                                        >
                                            {t('admin.destinationForm.price')}
                                        </label>
                                        <input
                                            id="destination-price"
                                            type="number"
                                            value={String(values.price ?? '')}
                                            onChange={(event) =>
                                                setField(
                                                    'price',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor="destination-rating"
                                            className="text-xs font-semibold text-muted-foreground"
                                        >
                                            {t('admin.destinationForm.rating')}
                                        </label>
                                        <input
                                            id="destination-rating"
                                            type="number"
                                            value={String(values.rating ?? '')}
                                            onChange={(event) =>
                                                setField(
                                                    'rating',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ),
                    },
                    {
                        title: t('admin.destinationForm.mediaAndHighlights'),
                        description: t('admin.destinationForm.mediaAndHighlightsHint2'),
                        render: ({ values, setField, activeLang }) => (
                            <div className="space-y-6">
                                <EntityMediaInputs
                                    values={values}
                                    setField={setField}
                                    imageLabel={t(
                                        'admin.destinationForm.image',
                                    )}
                                    galleryLabel={t(
                                        'admin.destinationForm.gallery',
                                    )}
                                    showImage
                                    showGallery
                                />

                                <div className="pt-4 border-t border-border">
                                    <JsonListEditor
                                        title={t('admin.destinationForm.highlights')}
                                        items={Array.isArray(values.highlights) ? values.highlights : []}
                                        onItemsChange={(items) => setField('highlights', items)}
                                        schema={highlightSchema}
                                        activeLang={activeLang}
                                        addButtonLabel={t('admin.destinationForm.addHighlight')}
                                        itemLabel={(item, index) => 
                                            (item.name as Record<string, string> | undefined)?.[activeLang] || `${t('admin.destinationForm.highlight')} ${index + 1}`
                                        }
                                    />
                                </div>
                            </div>
                        ),
                    },
                    {
                        title: t('admin.destinationForm.destinationFacts'),
                        columns: 4,
                        column: 'main',
                        render: ({ values, setField, activeLang }) => (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    'bestTime',
                                    'language',
                                    'currency',
                                    'weather',
                                ].map((key) => {
                                    const fieldKey = localizedKey(
                                        key,
                                        activeLang,
                                    );
                                    const label = t(
                                        `admin.destinationForm.${key}`,
                                    );

                                    return (
                                        <div
                                            key={fieldKey}
                                            className="space-y-2"
                                        >
                                            <label
                                                htmlFor={fieldKey}
                                                className="text-xs font-semibold text-muted-foreground"
                                            >
                                                {label}
                                                <LangBadge lang={activeLang} />
                                            </label>
                                            <input
                                                id={fieldKey}
                                                value={String(
                                                    values[fieldKey] ?? '',
                                                )}
                                                onChange={(event) =>
                                                    setField(
                                                        fieldKey,
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ),
                    },
                ]}
                onSubmit={(values) => {
                    const gallery = Array.isArray(values.galleryPaths)
                        ? (values.galleryPaths as string[]).join('\n')
                        : typeof values.gallery === 'string'
                          ? values.gallery
                          : '';

                    const name = firstNonEmpty(
                        values.name_en,
                        values.name_fr,
                        values.name_ar,
                        values.name,
                    );
                    const country = firstNonEmpty(
                        values.country_en,
                        values.country_fr,
                        values.country_ar,
                        values.country,
                    );
                    const category = firstNonEmpty(
                        values.category_en,
                        values.category_fr,
                        values.category_ar,
                        values.category,
                    );
                    const description = firstNonEmpty(
                        values.description_en,
                        values.description_fr,
                        values.description_ar,
                        values.description,
                    );

                    const item = {
                        ...values,
                        id: editing?.id ?? '',
                        name,
                        name_en: firstNonEmpty(values.name_en, values.name),
                        name_fr: values.name_fr ?? '',
                        name_ar: values.name_ar ?? '',
                        country,
                        country_en: firstNonEmpty(values.country_en, values.country),
                        country_fr: values.country_fr ?? '',
                        country_ar: values.country_ar ?? '',
                        category,
                        category_key: category,
                        category_en: firstNonEmpty(values.category_en, values.category),
                        category_fr: values.category_fr ?? '',
                        category_ar: values.category_ar ?? '',
                        price: Number(values.price) || 0,
                        rating: Number(values.rating) || 0,
                        image:
                            values.imageFile instanceof File
                                ? values.imageFile
                                : (values.imagePath ?? values.image ?? ''),
                        description,
                        description_en: firstNonEmpty(
                            values.description_en,
                            values.description,
                        ),
                        description_fr: values.description_fr ?? '',
                        description_ar: values.description_ar ?? '',
                        highlights: Array.isArray(values.highlights) ? values.highlights : [],
                        gallery,
                        gallery_files: values.galleryFiles ?? undefined,
                    } as unknown as AdminDestination;

                    saveMutation.mutate(item);
                    toast.success(
                        editing
                            ? t('admin.destinationUpdated')
                            : t('admin.destinationAdded'),
                    );
                    setEditing(null);
                }}
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
                        ? `${t('admin.deleteItemPrompt')} “${localizeKnown(
                              pendingDelete.name,
                              destinationLabels,
                              lang,
                          )}”? ${t('admin.deleteItemWarning')}`
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

export default AdminDestinations;
