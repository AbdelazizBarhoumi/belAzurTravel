import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { fetchCategories } from '@/api/categories.api';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { AdminTour } from '@/hooks/useAdminStore';
import type { Lang } from '@/i18n/translations';
import { localizeKnown, tourLabels } from '@/lib/adminI18n';

type TourCategory = {
    key: string;
    name: Record<string, string>;
};

type TourFormValues = AdminTour &
    Record<string, unknown> & {
        imagePath?: string;
        imageFile?: File | null;
        gallery?: string;
        galleryPaths?: string[];
        galleryFiles?: File[];
        duration_days?: number;
        duration_nights?: number;
        max_group?: number;
        rating?: number;
        category_key?: string;
        category_en?: string;
        category_fr?: string;
        category_ar?: string;
    };

function resolveCategoryKey(...values: Array<unknown>): string {
    for (const value of values) {
        if (typeof value === 'string' && value.trim() !== '') {
            return value.trim();
        }

        if (value && typeof value === 'object') {
            const record = value as Record<string, unknown>;
            const candidate =
                typeof record.key === 'string'
                    ? record.key
                    : typeof record.category_key === 'string'
                      ? record.category_key
                      : '';

            if (candidate.trim() !== '') {
                return candidate.trim();
            }

            for (const localized of [record.en, record.fr, record.ar]) {
                if (typeof localized === 'string' && localized.trim() !== '') {
                    return localized.trim();
                }
            }
        }
    }

    return '';
}

function syncCategoryFields(
    setField: (field: string, value: unknown) => void,
    category: TourCategory | undefined,
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

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
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
    { key: 'name', labelKey: 'admin.tourForm.itemName', translatable: true },
];

const itinerarySchema: JsonFieldDef[] = [
    { key: 'title', labelKey: 'admin.title', translatable: true },
    {
        key: 'details',
        labelKey: 'admin.description',
        type: 'textarea',
        translatable: true,
    },
];

const AdminTours = () => {
    useAdminGuard();
    const queryClient = useQueryClient();
    const { settings: siteSettings } = useSiteSettings();
    const isCodeEnabled =
        siteSettings?.config?.navigation?.enabled_dropdowns?.includes('tours');
    const [open, setOpen] = useState(false);
    const [catManagerOpen, setCatManagerOpen] = useState(false);

    const { data: tours = [] } = useQuery({
        queryKey: ['admin', 'tours'],
        queryFn: () => listAdminEntities<AdminTour>('tours'),
    });

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['admin', 'categories', 'tours'],
        queryFn: () => fetchCategories('tours'),
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

    const { lang, t } = useLanguage();
    const [modalLang, setModalLang] = useState<Lang>(lang);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [editing, setEditing] = useState<AdminTour | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminTour | null>(null);

    // validate function defined later (keeps numeric checks)

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setErrors({});
            setEditing(null);
        }
        setOpen(isOpen);
    };

    const validate = (values: TourFormValues): Record<string, string> => {
        const errs: Record<string, string> = {};

        // Language-specific field validation
        ['en', 'fr', 'ar'].forEach((lang) => {
            if (!values[`name_${lang}`])
                errs[`name_${lang}`] = t('admin.required');
        });

        if (!values.price || Number(values.price) <= 0)
            errs.price = t('admin.invalidPrice');
        if (!values.duration_days || Number(values.duration_days) <= 0)
            errs.duration_days = t('admin.invalidDays');
        if (!values.duration_nights || Number(values.duration_nights) <= 0)
            errs.duration_nights = t('admin.invalidNights');
        if (!values.max_group || Number(values.max_group) <= 0)
            errs.max_group = t('admin.invalidGroup');
        if (
            !values.rating ||
            Number(values.rating) < 0 ||
            Number(values.rating) > 5
        )
            errs.rating = t('admin.invalidRating');

        return errs;
    };

    const handleSave = (values: TourFormValues) => {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        const {
            imageFile,
            imagePath,
            galleryPaths,
            galleryFiles,
            gallery: _legacyGallery,
            images: _staleImages,
            category_en,
            category_fr,
            category_ar,
            ...rest
        } = values;

        const selectedCategory = dbCategories.find(
            (category) =>
                category.key === resolveCategoryKey(values.category_key),
        );

        const payload: Record<string, unknown> = {
            ...rest,
            id: editing?.id || '',
            image:
                imageFile instanceof File
                    ? imageFile
                    : (imagePath ?? values.image ?? ''),
            images: Array.isArray(galleryPaths) ? galleryPaths : [],
            itinerary: Array.isArray(values.itinerary) ? values.itinerary : [],
            includes: Array.isArray(values.includes) ? values.includes : [],
            excludes: Array.isArray(values.excludes) ? values.excludes : [],
            category_key: selectedCategory?.key ?? values.category_key ?? '',
            category_en: selectedCategory?.name.en ?? category_en ?? '',
            category_fr: selectedCategory?.name.fr ?? category_fr ?? '',
            category_ar: selectedCategory?.name.ar ?? category_ar ?? '',
        };

        if (Array.isArray(galleryFiles) && galleryFiles.length > 0) {
            payload.gallery_files = galleryFiles;
        }

        saveMutation.mutate(payload as unknown as AdminTour, {
            onSuccess: () => {
                toast.success(
                    editing ? t('admin.tourUpdated') : t('admin.tourAdded'),
                );
                setOpen(false);
                setEditing(null);
                setErrors({});
            },
        });
    };

    const dialogInitial: TourFormValues | null = editing
        ? ({
              ...editing,
              imagePath: asText(editing.image),
              imageFile: null,
              gallery: '',
              galleryPaths: parseGallery(
                  (editing as unknown as Record<string, unknown>).gallery ??
                      (editing as unknown as Record<string, unknown>).images,
              ),
              galleryFiles: [],
              itinerary: Array.isArray(editing.itinerary)
                  ? editing.itinerary
                  : [],
              includes: Array.isArray(editing.includes) ? editing.includes : [],
              excludes: Array.isArray(editing.excludes) ? editing.excludes : [],
              duration_nights: (editing as any).duration_nights ?? undefined,
              rating: (editing as any).rating ?? undefined,
              category_key: (editing as any).category_key ?? '',
              category_en: (editing as any).category_en ?? '',
              category_fr: (editing as any).category_fr ?? '',
              category_ar: (editing as any).category_ar ?? '',
          } as unknown as TourFormValues)
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
                            {
                                key: 'name',
                                label: t('admin.name'),
                                placeholder: t(
                                    'admin.tourForm.namePlaceholder',
                                ),
                            },
                            {
                                key: 'location',
                                label: t('admin.location'),
                                placeholder: t(
                                    'admin.tourForm.locationPlaceholder',
                                ),
                            },
                            {
                                key: 'duration',
                                label: t('admin.duration'),
                                placeholder: t(
                                    'admin.tourForm.durationPlaceholder',
                                ),
                            },
                            {
                                key: 'category',
                                label: t('admin.category'),
                            },
                        ].map((k) => (
                            <div key={k.key} className="space-y-2">
                                <label
                                    htmlFor={`${k.key}_${activeLang}`}
                                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
                                >
                                    {k.label}
                                    {k.key !== 'category' && (
                                        <LangBadge lang={activeLang} />
                                    )}
                                </label>
                                {k.key === 'category' ? (
                                    <>
                                        <Select
                                            value={String(
                                                values.category_key ?? '',
                                            )}
                                            onValueChange={(val) =>
                                                syncCategoryFields(
                                                    setField,
                                                    dbCategories.find(
                                                        (c) => c.key === val,
                                                    ),
                                                    val,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="tour-category-key"
                                                className={`${errors.category_key ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                            >
                                                <SelectValue
                                                    placeholder={t(
                                                        'admin.tourForm.selectCategory',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dbCategories.map((cat) => (
                                                    <SelectItem
                                                        key={cat.key}
                                                        value={cat.key}
                                                    >
                                                        {cat.name[activeLang] ||
                                                            cat.name.en}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <input
                                            type="hidden"
                                            value={String(
                                                values.category_en ?? '',
                                            )}
                                            onChange={(e) =>
                                                setField(
                                                    'category_en',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <input
                                            type="hidden"
                                            value={String(
                                                values.category_fr ?? '',
                                            )}
                                            onChange={(e) =>
                                                setField(
                                                    'category_fr',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <input
                                            type="hidden"
                                            value={String(
                                                values.category_ar ?? '',
                                            )}
                                            onChange={(e) =>
                                                setField(
                                                    'category_ar',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </>
                                ) : (
                                    <input
                                        id={`${k.key}_${activeLang}`}
                                        value={String(
                                            values[`${k.key}_${activeLang}`] ??
                                                '',
                                        )}
                                        placeholder={k.placeholder}
                                        onChange={(e) =>
                                            setField(
                                                `${k.key}_${activeLang}`,
                                                e.target.value,
                                            )
                                        }
                                        className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors[`${k.key}_${activeLang}`] ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                    />
                                )}
                                {errors[`${k.key}_${activeLang}`] && (
                                    <p className="text-xs text-destructive">
                                        {errors[`${k.key}_${activeLang}`]}
                                    </p>
                                )}
                            </div>
                        ))}

                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor={`description_${activeLang}`}
                                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.description')}
                                <LangBadge lang={activeLang} />
                            </label>
                            <textarea
                                id={`description_${activeLang}`}
                                value={String(
                                    values[`description_${activeLang}`] ?? '',
                                )}
                                placeholder={t(
                                    'admin.tourForm.descriptionPlaceholder',
                                )}
                                onChange={(e) =>
                                    setField(
                                        `description_${activeLang}`,
                                        e.target.value,
                                    )
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors[`description_${activeLang}`] ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            />
                            {errors[`description_${activeLang}`] && (
                                <p className="text-xs text-destructive">
                                    {errors[`description_${activeLang}`]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="tour-price"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.price')} (
                                {t('admin.tourForm.priceUnit')})
                            </label>
                            <input
                                id="tour-price"
                                type="number"
                                placeholder={t(
                                    'admin.tourForm.pricePlaceholder',
                                )}
                                value={String(values.price ?? '')}
                                onChange={(e) =>
                                    setField('price', e.target.value)
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.price ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            />
                            {errors.price && (
                                <p className="text-xs text-destructive">
                                    {errors.price}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="tour-rating"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.rating')} (0-5)
                            </label>
                            <input
                                id="tour-rating"
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                placeholder={t(
                                    'admin.tourForm.ratingPlaceholder',
                                )}
                                value={String(values.rating ?? '')}
                                onChange={(e) =>
                                    setField(
                                        'rating',
                                        e.target.value === ''
                                            ? null
                                            : Number(e.target.value),
                                    )
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.rating ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            />
                            {errors.rating && (
                                <p className="text-xs text-destructive">
                                    {errors.rating}
                                </p>
                            )}
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
                                placeholder={t(
                                    'admin.tourForm.durationDaysPlaceholder',
                                )}
                                value={String(values.duration_days ?? '')}
                                onChange={(e) =>
                                    setField(
                                        'duration_days',
                                        e.target.value === ''
                                            ? null
                                            : Number(e.target.value),
                                    )
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.duration_days ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            />
                            {errors.duration_days && (
                                <p className="text-xs text-destructive">
                                    {errors.duration_days}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="tour-duration-nights"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.tourForm.durationNights')}
                            </label>
                            <input
                                id="tour-duration-nights"
                                type="number"
                                placeholder={t(
                                    'admin.tourForm.durationNightsPlaceholder',
                                )}
                                value={String(values.duration_nights ?? '')}
                                onChange={(e) =>
                                    setField(
                                        'duration_nights',
                                        e.target.value === ''
                                            ? null
                                            : Number(e.target.value),
                                    )
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.duration_nights ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            />
                            {errors.duration_nights && (
                                <p className="text-xs text-destructive">
                                    {errors.duration_nights}
                                </p>
                            )}
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
                                placeholder={t(
                                    'admin.tourForm.maxGroupPlaceholder',
                                )}
                                value={String(values.max_group ?? '')}
                                onChange={(e) =>
                                    setField(
                                        'max_group',
                                        e.target.value === ''
                                            ? null
                                            : Number(e.target.value),
                                    )
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.max_group ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            />
                            {errors.max_group && (
                                <p className="text-xs text-destructive">
                                    {errors.max_group}
                                </p>
                            )}
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
                        (item.title as Record<string, string> | undefined)?.[
                            activeLang
                        ] || `${t('admin.tourForm.day')} ${index + 1}`
                    }
                />
            ),
        },
        {
            title: t('admin.tourForm.inclusions'),
            column: 'main',
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
                            (item.name as Record<string, string> | undefined)?.[
                                activeLang
                            ] || `${t('admin.tourForm.item')} ${index + 1}`
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
                            (item.name as Record<string, string> | undefined)?.[
                                activeLang
                            ] || `${t('admin.tourForm.item')} ${index + 1}`
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
                            <Settings className="h-4 w-4" />{' '}
                            {t('admin.manageCategories')}
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            setEditing(null);
                            setErrors({});
                            setModalLang(lang);
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
                                    {
                                        label: t('admin.image'),
                                        align: 'center',
                                    },
                                    {
                                        label: t('admin.name'),
                                        align: lang === 'ar' ? 'right' : 'left',
                                    },
                                    {
                                        label: t('admin.location'),
                                        align: 'center',
                                    },
                                    {
                                        label: t('admin.category'),
                                        align: 'center',
                                    },
                                    {
                                        label: t('admin.duration'),
                                        align: 'center',
                                    },
                                    {
                                        label: t('admin.price'),
                                        align: 'center',
                                    },
                                    {
                                        label: t('admin.rating'),
                                        align: 'center',
                                    },
                                    {
                                        label: t('admin.actions'),
                                        align: 'center',
                                    },
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
                                    <td
                                        className={`px-4 py-3 text-sm font-semibold text-${lang === 'ar' ? 'right' : 'left'}`}
                                    >
                                        {localizeKnown(
                                            d.name,
                                            tourLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                        {typeof d.location === 'object' && d.location !== null
                                            ? (d.location as any)[lang] || (d.location as any).en || ''
                                            : String(d.location ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {(() => {
                                            const cat = dbCategories.find(
                                                (c) => c.key === d.category_key,
                                            );
                                            return cat
                                                ? cat.name[lang] || cat.name.en
                                                : (d as any).category_en || '';
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {d.duration}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold">
                                        {d.price.toLocaleString()} DT
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {d.rating}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(d);
                                                    setModalLang(lang);
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
                onOpenChange={handleOpenChange}
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
                activeLang={modalLang}
                onActiveLangChange={setModalLang}
                preserveArrayKeys={['images']}
            />
        </AdminLayout>
    );
};

export default AdminTours;
