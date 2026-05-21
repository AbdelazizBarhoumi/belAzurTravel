import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { useState } from 'react';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
} from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import { EntityFormDialog, type SectionDef } from '@/components/forms/EntityFormDialog';
import { JsonListEditor, type JsonFieldDef } from '@/components/forms/JsonListEditor';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { AdminTour } from '@/hooks/useAdminStore';
import type { Lang } from '@/i18n/translations';
import { countryLabels, localizeKnown, tourLabels } from '@/lib/adminI18n';

type TourFormValues = AdminTour & {
    imagePath?: string;
    imageFile?: File | null;
    gallery?: string;
    galleryPaths?: string[];
    galleryFiles?: File[];
};

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
    { key: 'name', labelKey: 'admin.tourForm.itemName', translatable: true },
];

const itinerarySchema: JsonFieldDef[] = [
    { key: 'title', labelKey: 'admin.title', translatable: true },
    { key: 'details', labelKey: 'admin.description', type: 'textarea', translatable: true },
];

const AdminTours = () => {
    useAdminGuard();
    const queryClient = useQueryClient();
    const { settings: siteSettings } = useSiteSettings();
    const isCodeEnabled =
        siteSettings?.config?.navigation?.enabled_dropdowns?.includes(
            'tours',
        );
    const [open, setOpen] = useState(false);
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    
    const { data: tours = [] } = useQuery({
        queryKey: ['admin', 'tours'],
        queryFn: () => listAdminEntities<AdminTour>('tours'),
    });

    const saveMutation = useMutation({
        mutationFn: (item: AdminTour) => saveAdminEntity('tours', item),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('tours', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });

    const { lang, setLang, t } = useLanguage();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [editing, setEditing] = useState<AdminTour | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminTour | null>(null);

    const validate = (values: TourFormValues): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (!values.name_en) errs.name_en = t('admin.required');
        if (!values.price) errs.price = t('admin.required');
        return errs;
    };

    const handleSave = (values: TourFormValues) => {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        const payload: Record<string, unknown> = {
            ...values,
            id: editing?.id || '',
            image:
                values.imageFile instanceof File
                    ? values.imageFile
                    : (values.imagePath ?? values.image ?? ''),
            gallery: Array.isArray(values.galleryPaths)
                ? values.galleryPaths
                : [],
            itinerary: Array.isArray(values.itinerary) ? values.itinerary : [],
            includes: Array.isArray(values.includes) ? values.includes : [],
            excludes: Array.isArray(values.excludes) ? values.excludes : [],
        };

        if (
            Array.isArray(values.galleryFiles) &&
            values.galleryFiles.length > 0
        ) {
            payload.gallery_files = values.galleryFiles;
        }

        saveMutation.mutate(payload as unknown as AdminTour);
        toast.success(editing ? t('admin.tourUpdated') : t('admin.tourAdded'));
        setOpen(false);
        setEditing(null);
        setErrors({});
    };

    const dialogInitial: TourFormValues | null = editing
        ? ({
              ...editing,
              imagePath: asText(editing.image),
              imageFile: null,
              gallery: '',
              galleryPaths: parseGallery(
                  (editing as unknown as Record<string, unknown>).gallery,
              ),
              galleryFiles: [],
              itinerary: Array.isArray(editing.itinerary) ? editing.itinerary : [],
              includes: Array.isArray(editing.includes) ? editing.includes : [],
              excludes: Array.isArray(editing.excludes) ? editing.excludes : [],
          } as TourFormValues)
        : ({} as TourFormValues);

    const tourSections: SectionDef[] = [
        {
            title: t('admin.tourForm.coreDetails'),
            column: 'main',
            description: t('admin.tourForm.coreDetailsHint'),
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { key: 'name', label: t('admin.name') },
                            {
                                key: 'location',
                                label: t('admin.location'),
                            },
                            {
                                key: 'duration',
                                label: t('admin.duration'),
                            },
                        ].map((k) => (
                            <div key={k.key} className="space-y-2">
                                <label
                                    htmlFor={`${k.key}_${activeLang}`}
                                    className="text-xs font-semibold text-muted-foreground"
                                >
                                    {k.label}
                                    <LangBadge lang={activeLang} />
                                </label>
                                <input
                                    id={`${k.key}_${activeLang}`}
                                    value={String(
                                        values[`${k.key}_${activeLang}`] ?? '',
                                    )}
                                    onChange={(e) =>
                                        setField(
                                            `${k.key}_${activeLang}`,
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        ))}

                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor={`description_${activeLang}`}
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.description')}
                                <LangBadge lang={activeLang} />
                            </label>
                            <textarea
                                id={`description_${activeLang}`}
                                value={String(
                                    values[`description_${activeLang}`] ?? '',
                                )}
                                onChange={(e) =>
                                    setField(
                                        `description_${activeLang}`,
                                        e.target.value,
                                    )
                                }
                                rows={4}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="tour-price"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.price')}
                            </label>
                            <input
                                id="tour-price"
                                type="number"
                                value={String(values.price ?? '')}
                                onChange={(e) =>
                                    setField('price', e.target.value)
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="tour-duration-days"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.tourForm.durationDays')}
                            </label>
                            <input
                                id="tour-duration-days"
                                type="number"
                                value={String(values.duration_days ?? '')}
                                onChange={(e) =>
                                    setField(
                                        'duration_days',
                                        e.target.value === ''
                                            ? null
                                            : Number(e.target.value),
                                    )
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="tour-max-group"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.tourForm.maxGroup')}
                            </label>
                            <input
                                id="tour-max-group"
                                type="number"
                                value={String(values.max_group ?? '')}
                                onChange={(e) =>
                                    setField(
                                        'max_group',
                                        e.target.value === ''
                                            ? null
                                            : Number(e.target.value),
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
            title: t('admin.tourForm.media'),
            column: 'side',
            description: t('admin.tourForm.mediaHint'),
            render: ({ values, setField }) => (
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
            title: t('admin.tourForm.itinerary'),
            column: 'main',
            description: t('admin.tourForm.itineraryHint'),
            render: ({ values, setField, activeLang }) => (
                <JsonListEditor
                    title={t('admin.tourForm.itinerary')}
                    items={
                        Array.isArray(values.itinerary) ? values.itinerary : []
                    }
                    onItemsChange={(items) => setField('itinerary', items)}
                    schema={itinerarySchema}
                    activeLang={activeLang}
                    addButtonLabel={t('admin.tourForm.addDay')}
                    itemLabel={(item, index) =>
                        (item.title as Record<string, string> | undefined)?.[activeLang] || `${t('admin.tourForm.day')} ${index + 1}`
                    }
                />
            ),
        },
        {
            title: t('admin.tourForm.inclusions'),
            column: 'side',
            description: t('admin.tourForm.inclusionsHint'),
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-6">
                    <JsonListEditor
                        title={t('admin.tourForm.includes')}
                        items={
                            Array.isArray(values.includes)
                                ? values.includes
                                : []
                        }
                        onItemsChange={(items) => setField('includes', items)}
                        schema={simpleLocalizedSchema}
                        activeLang={activeLang}
                        addButtonLabel={t('admin.tourForm.addInclusion')}
                        itemLabel={(item, index) =>
                            (item.name as Record<string, string> | undefined)?.[activeLang] || `${t('admin.tourForm.item')} ${index + 1}`
                        }
                    />
                    <JsonListEditor
                        title={t('admin.tourForm.excludes')}
                        items={
                            Array.isArray(values.excludes)
                                ? values.excludes
                                : []
                        }
                        onItemsChange={(items) => setField('excludes', items)}
                        schema={simpleLocalizedSchema}
                        activeLang={activeLang}
                        addButtonLabel={t('admin.tourForm.addExclusion')}
                        itemLabel={(item, index) =>
                            (item.name as Record<string, string> | undefined)?.[activeLang] || `${t('admin.tourForm.item')} ${index + 1}`
                        }
                    />
                </div>
            ),
        },
    ];

    return (
        <AdminLayout
            title={t('admin.tours')}
            subtitle={t('admin.toursSubtitle')}
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
                type="tours"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'categories', 'tours'],
                    });
                }}
            />
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    { label: t('admin.image'), align: 'center' },
                                    { label: t('admin.name'), align: lang === 'ar' ? 'right' : 'left' },
                                    { label: t('admin.location'), align: 'center' },
                                    { label: t('admin.duration'), align: 'center' },
                                    { label: t('admin.price'), align: 'center' },
                                    { label: t('admin.rating'), align: 'center' },
                                    { label: t('admin.actions'), align: 'center' },
                                ].map((col) => (
                                    <th
                                        key={col.label}
                                        className={`px-4 py-3 text-xs font-semibold uppercase text-muted-foreground text-${col.align}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tours.map((d) => (
                                <tr
                                    key={d.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">
                                            <img
                                                src={d.image}
                                                alt={localizeKnown(
                                                    d.name,
                                                    tourLabels,
                                                    lang,
                                                )}
                                                className="h-12 w-12 rounded-lg object-cover"
                                            />
                                        </div>
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-semibold text-${lang === 'ar' ? 'right' : 'left'}`}>
                                        {localizeKnown(
                                            d.name,
                                            tourLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground text-center">
                                        {localizeKnown(
                                            d.location,
                                            countryLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">
                                        {d.duration}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-center">
                                        ${d.price.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">
                                        {d.rating}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(d);
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
                    if (!isOpen) {
                        setPendingDelete(null);
                    }
                }}
                title={t('admin.deleteItemTitle')}
                description={
                    pendingDelete
                        ? `${t('admin.deleteItemPrompt')} “${localizeKnown(pendingDelete.name, tourLabels, lang)}”? ${t('admin.deleteItemWarning')}`
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

            <EntityFormDialog<Record<string, unknown>>
                open={open}
                onOpenChange={setOpen}
                title={
                    editing
                        ? `${t('actions.edit')} ${t('admin.tours')}`
                        : `${t('actions.add')} ${t('admin.tours')}`
                }
                sections={tourSections}
                errors={errors}
                initial={dialogInitial}
                isSubmitting={saveMutation.isPending}
                onSubmit={(values) =>
                    handleSave(values as unknown as TourFormValues)
                }
                languages={['en', 'fr', 'ar']}
                activeLang={lang}
                onActiveLangChange={setLang}
                tabHighlight={(lang) =>
                    Object.keys(errors).some((key) => key.endsWith(`_${lang}`))
                }
            />
        </AdminLayout>
    );
};

export default AdminTours;
