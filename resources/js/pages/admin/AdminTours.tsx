import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Settings, Image as ImageIcon, Save, Star, Loader2 } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { CategoryTypeManager } from '@/components/admin/CategoryTypeManager';
import { HeroImagesManager } from '@/components/admin/HeroImagesManager';
import { useCategoryTypes } from '@/hooks/useCategoryTypes';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
} from '@/api/admin.api';
import { apiFetch } from '@/api/http';
import type { PageHeroSlide } from '@/api/siteSettings.api';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LocationSelect } from '@/components/ui/LocationSelect';
import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { AdminTour } from '@/hooks/useAdminStore';
import type { Lang } from '@/i18n/translations';
import { localizeKnown, tourLabels } from '@/lib/adminI18n';

type TourFormValues = AdminTour &
    Record<string, unknown> & {
        imagePath?: string;
        imageFile?: File | null;
        gallery?: string;
        galleryPaths?: string[];
        galleryFiles?: File[];
        duration_value?: number | null;
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
    category: { key: string; name: Record<string, string> } | undefined,
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

const PRESERVE_ARRAY_KEYS = ['images'];

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
    const { lang, t } = useLanguage();
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

    const { data: categoryTypes = [] } = useCategoryTypes('tours');

    // Hero images state
    const existingHeroConfig = siteSettings?.content?.page_heroes?.tours;
    const [heroSlides, setHeroSlides] = useState<PageHeroSlide[]>([]);
    const [heroInterval, setHeroInterval] = useState(6000);
    const [isHeroSaving, setIsHeroSaving] = useState(false);

    useEffect(() => {
        setHeroSlides(existingHeroConfig?.images ?? []);
        setHeroInterval(existingHeroConfig?.interval ?? 6000);
    }, [existingHeroConfig]);

    const saveHeroImages = useCallback(async () => {
        setIsHeroSaving(true);
        try {
            const filteredSlides = heroSlides.filter((s) => s.url);
            const content = {
                ...(siteSettings?.content ?? {}),
                page_heroes: {
                    ...(siteSettings?.content?.page_heroes ?? {}),
                    tours: {
                        images: filteredSlides,
                        interval: heroInterval,
                    },
                },
            };
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({ content }),
            });
            window.dispatchEvent(new CustomEvent('site-settings-updated'));
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        } finally {
            setIsHeroSaving(false);
        }
    }, [heroSlides, heroInterval, siteSettings?.content, t]);

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

        if (!values.location)
            errs.location = t('admin.required');
        if (!values.price || Number(values.price) <= 0)
            errs.price = t('admin.invalidPrice');
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

        const categoryAssignments: Record<string, string> = {};
        categoryTypes.forEach((ct) => {
            const val = values[`category_${ct.key}`];
            if (val && typeof val === 'string' && val !== '') {
                categoryAssignments[ct.key] = val;
            }
        });

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
            category_key: values.category_key ?? '',
            category_en: category_en ?? '',
            category_fr: category_fr ?? '',
            category_ar: category_ar ?? '',
            category_assignments: categoryAssignments,
        };

        const days = Number(values.duration_value) || 0;
        payload.duration_days = days > 0 ? days : null;
        payload.duration_nights = days > 0 ? Math.max(0, days - 1) : null;

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
            onError: (error: unknown) => {
                const errData = (error as { data?: { errors?: Record<string, unknown>; message?: string }; message?: string }).data;
                const serverErrors = errData?.errors;
                if (serverErrors && typeof serverErrors === 'object') {
                    const mapped: Record<string, string> = {};
                    Object.entries(serverErrors).forEach(([key, value]) => {
                        const displayKey =
                            key === 'duration_days' || key === 'duration_nights'
                                ? 'duration'
                                : key;
                        mapped[displayKey] = Array.isArray(value)
                            ? String(value[0])
                            : String(value);
                    });
                    setErrors(mapped);
                }
                toast.error(errData?.message || (error as Error).message || t('admin.saveError'));
            },
        });
    };

    const dialogInitial: TourFormValues | null = useMemo(() => {
        if (!editing) return {} as TourFormValues;

        // Parse duration string like "5 days" into value + type
        const rawDuration = String((editing as any).duration ?? '').trim();
        let durationValue: number | null = null;
        if (rawDuration) {
            const match = rawDuration.match(/^(\d+)\s*days?\s*\/\s*(\d+)\s*nights?$/i);
            if (match) {
                durationValue = Number(match[1]);
            } else {
                const singleMatch = rawDuration.match(/^(\d+)\s*(days?|nights?)$/i);
                if (singleMatch) {
                    durationValue = Number(singleMatch[1]);
                }
            }
        }

        return {
            ...editing,
            location: asText(
                (editing as any).location ??
                    (editing as any).location_en ??
                    '',
            ),
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
            duration_value: durationValue,
            duration: rawDuration || (durationValue != null && durationValue > 0 ? `${durationValue} ${t('common.days')} / ${durationValue - 1} ${t('common.nights')}` : ''),
            duration_nights: (editing as any).duration_nights ?? undefined,
            rating: (editing as any).rating ?? undefined,
            category_key: (editing as any).category_key ?? '',
            category_en: (editing as any).category_en ?? '',
            category_fr: (editing as any).category_fr ?? '',
            category_ar: (editing as any).category_ar ?? '',
            ...Object.fromEntries(
                categoryTypes.map((ct) => [
                    `category_${ct.key}`,
                    (editing as any).category_assignments?.[ct.key] || '',
                ]),
            ),
        } as unknown as TourFormValues;
    },
        [editing, categoryTypes],
    );

    const tourSections: SectionDef[] = [
        {
            title: t('admin.tourForm.coreDetails'),
            column: 'main',
            description: t('admin.tourForm.coreDetailsHint'),
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                htmlFor={`name_${activeLang}`}
                                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.name')}
                                <LangBadge lang={activeLang} />
                            </label>
                            <Input
                                id={`name_${activeLang}`}
                                value={String(values[`name_${activeLang}`] ?? '')}
                                placeholder={t('admin.tourForm.namePlaceholder')}
                                onChange={(e) => setField(`name_${activeLang}`, e.target.value)}
                                className={errors[`name_${activeLang}`] ? 'border-destructive ring-1 ring-destructive' : ''}
                            />
                            {errors[`name_${activeLang}`] && (
                                <p className="text-xs text-destructive">
                                    {errors[`name_${activeLang}`]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                {t('admin.duration')}
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={1}
                                    value={String(values.duration_value ?? '')}
                                    placeholder="0"
                                    onChange={(e) => {
                                        const days = e.target.value === '' ? null : Number(e.target.value);
                                        setField('duration_value', days);
                                        setField('duration', days != null && days > 0 ? `${days} ${t('common.days')} / ${days - 1} ${t('common.nights')}` : '');
                                    }}
                                    className={`w-24 ${errors.duration ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {String(values.duration || '—')}
                                </span>
                            </div>
                            {errors.duration && (
                                <p className="text-xs text-destructive">
                                    {errors.duration}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                {t('admin.location')}
                            </label>
                            <LocationSelect
                                value={String(values.location ?? '')}
                                onChange={(val) => setField('location', val)}
                                lang={activeLang}
                                placeholder={t('admin.tourForm.locationPlaceholder')}
                            />
                            {errors.location && (
                                <p className="text-xs text-destructive">
                                    {errors.location}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor={`description_${activeLang}`}
                                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.description')}
                                <LangBadge lang={activeLang} />
                            </label>
                            <Textarea
                                id={`description_${activeLang}`}
                                value={String(values[`description_${activeLang}`] ?? '')}
                                placeholder={t('admin.tourForm.descriptionPlaceholder')}
                                onChange={(e) => setField(`description_${activeLang}`, e.target.value)}
                                rows={4}
                                className={errors[`description_${activeLang}`] ? 'border-destructive ring-1 ring-destructive' : ''}
                            />
                            {errors[`description_${activeLang}`] && (
                                <p className="text-xs text-destructive">
                                    {errors[`description_${activeLang}`]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="tour-price" className="text-xs font-semibold text-muted-foreground">
                                {t('admin.price')} ({t('admin.tourForm.priceUnit')})
                            </label>
                            <Input
                                id="tour-price"
                                type="number"
                                placeholder={t('admin.tourForm.pricePlaceholder')}
                                value={String(values.price ?? '')}
                                onChange={(e) => setField('price', e.target.value)}
                                className={errors.price ? 'border-destructive ring-1 ring-destructive' : ''}
                            />
                            {errors.price && (
                                <p className="text-xs text-destructive">{errors.price}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                {t('admin.rating')} (0-5)
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center">
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const starNum = i + 1;
                                        const currentRating = Number(values.rating ?? 0);
                                        const fillLevel = currentRating >= starNum ? 1 : currentRating >= starNum - 0.5 ? 0.5 : 0;
                                        return (
                                            <div key={starNum} className="relative h-5 w-5">
                                                <Star className="absolute inset-0 h-5 w-5 text-muted stroke-muted-foreground/30" />
                                                {fillLevel === 1 && (
                                                    <Star className="absolute inset-0 h-5 w-5 fill-amber-400 text-amber-400" />
                                                )}
                                                {fillLevel === 0.5 && (
                                                    <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                                                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    className="absolute inset-0 z-10 cursor-pointer"
                                                    style={{ clipPath: 'inset(0 50% 0 0)' }}
                                                    onClick={() => setField('rating', currentRating === starNum - 0.5 ? starNum - 0.5 : starNum - 0.5)}
                                                    aria-label={`${starNum - 0.5} stars`}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-0 z-10 cursor-pointer"
                                                    style={{ clipPath: 'inset(0 0 0 50%)' }}
                                                    onClick={() => setField('rating', currentRating === starNum ? starNum : starNum)}
                                                    aria-label={`${starNum} stars`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <Input
                                    type="number"
                                    min={0}
                                    max={5}
                                    step={0.5}
                                    value={String(values.rating ?? '')}
                                    onChange={(e) => setField('rating', e.target.value === '' ? null : Number(e.target.value))}
                                    className={`w-20 ${errors.rating ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                />
                            </div>
                            {errors.rating && (
                                <p className="text-xs text-destructive">{errors.rating}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="tour-max-group"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.tourForm.maxGroup')}
                            </label>
                            <Input
                                id="tour-max-group"
                                type="number"
                                min={1}
                                max={50}
                                step={1}
                                placeholder="0"
                                value={String(values.max_group ?? '')}
                                onChange={(e) =>
                                    setField(
                                        'max_group',
                                        e.target.value === ''
                                            ? null
                                            : Number(e.target.value),
                                    )
                                }
                                className={errors.max_group ? 'border-destructive ring-1 ring-destructive' : ''}
                            />
                            {errors.max_group && (
                                <p className="text-xs text-destructive">
                                    {errors.max_group}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Category Types - dynamic dropdowns */}
                    {categoryTypes.map((catType) => (
                        <div key={catType.key} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <label
                                    className="text-xs font-semibold text-muted-foreground"
                                >
                                    {catType.label[activeLang] || catType.label.en}
                                </label>
                            </div>
                            <Select
                                value={String(values[`category_${catType.key}`] || '')}
                                onValueChange={(val) => setField(`category_${catType.key}`, val)}
                            >
                                <SelectTrigger
                                    className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20`}
                                >
                                    <SelectValue placeholder={t('actions.select')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {catType.values.map((v) => (
                                        <SelectItem key={v.key} value={v.key}>
                                            {v.name[activeLang] || v.name.en}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: t('admin.dateRange'),
            column: 'main',
            fields: [
                {
                    key: 'dateFrom',
                    label: t('admin.dateRange'),
                    type: 'daterange',
                },
            ],
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
            <CategoryTypeManager
                entityType="tours"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'category-types', 'tours'],
                    });
                }}
            />
            <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                            {t('admin.heroImages')}
                        </h3>
                    </div>
                    <Button
                        size="sm"
                        onClick={saveHeroImages}
                        disabled={isHeroSaving}
                        className="bg-primary text-primary-foreground"
                    >
                        {isHeroSaving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}{' '}
                        {t('admin.settings.save')}
                    </Button>
                </div>
                <HeroImagesManager
                    pageKey="tours"
                    slides={heroSlides}
                    onSlidesChange={setHeroSlides}
                    interval={heroInterval}
                    onIntervalChange={setHeroInterval}
                />
            </div>
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
                                            const category = (d as any).category;
                                            if (typeof category === 'object' && category !== null) {
                                                return category[lang] || category.en || '';
                                            }
                                            return (d as any).category_en || '';
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {d.duration}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold">
                                        {d.price.toLocaleString()} TND
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
                preserveArrayKeys={PRESERVE_ARRAY_KEYS}
            />
        </AdminLayout>
    );
};

export default AdminTours;
