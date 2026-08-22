import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Edit,
    Plus,
    Trash2,
    Settings,
    Image as ImageIcon,
    Save,
} from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { CategoryTypeManager } from '@/components/admin/CategoryTypeManager';
import { HeroImagesManager } from '@/components/admin/HeroImagesManager';
import { useCategoryTypes, type CategoryType } from '@/hooks/useCategoryTypes';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
    type AdminRow,
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    FUEL_TYPES,
    TRANSMISSION_TYPES,
    getLocalizedLabel,
} from '@/data/adminSelectOptions';

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
    category: { key: string; name: Record<string, string> } | undefined,
    locale: Lang,
): string {
    if (!category) return '';

    return category.name[locale] || category.name.en || category.key;
}

function resolveCategoryKey(
    categories: Array<{ key: string; name: Record<string, string> }>,
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

    const { data: categoryTypes = [] } = useCategoryTypes('cars');

    // Hero images state
    const existingHeroConfig = siteSettings?.content?.page_heroes?.cars;
    const [heroSlides, setHeroSlides] = useState<PageHeroSlide[]>([]);
    const [heroInterval, setHeroInterval] = useState(6000);

    useEffect(() => {
        setHeroSlides(existingHeroConfig?.images ?? []);
        setHeroInterval(existingHeroConfig?.interval ?? 6000);
    }, [existingHeroConfig]);

    const saveHeroImages = useCallback(async () => {
        try {
            const filteredSlides = heroSlides.filter((s) => s.url);
            const content = {
                ...(siteSettings?.content ?? {}),
                page_heroes: {
                    ...(siteSettings?.content?.page_heroes ?? {}),
                    cars: {
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
        }
    }, [heroSlides, heroInterval, siteSettings?.content, t]);

    const { data: rows = [] } = useQuery<AdminRow[]>({
        queryKey,
        queryFn: async () => {
            const data = (await listAdminEntities<AdminRow>(
                'cars',
            )) as unknown as AdminRow[] | { data?: AdminRow[] };
            const result = Array.isArray(data) ? data : (data.data ?? []);
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

        // Convert fuel/transmission labels to keys if needed
        const resolveCarFieldKey = (
            value: string,
            options: typeof FUEL_TYPES,
        ): string => {
            if (!value) return '';
            if (options.some((o) => o.value === value)) return value;
            const match = options.find(
                (o) =>
                    o.label.en === value ||
                    o.label.fr === value ||
                    o.label.ar === value,
            );
            return match?.value || value;
        };

        const fuelKey = resolveCarFieldKey(
            asText(editing.fuel_en) || asText(editing.fuel),
            FUEL_TYPES,
        );
        const transmissionKey = resolveCarFieldKey(
            asText(editing.transmission_en) || asText(editing.transmission),
            TRANSMISSION_TYPES,
        );

        return {
            ...editing,
            category_key: asText(
                (editing as Record<string, unknown>).category_key,
            ),
            category: asText((editing as Record<string, unknown>).category),
            category_en: asText(
                (editing as Record<string, unknown>).category_en,
            ),
            category_fr: asText(
                (editing as Record<string, unknown>).category_fr,
            ),
            category_ar: asText(
                (editing as Record<string, unknown>).category_ar,
            ),
            ...Object.fromEntries(
                categoryTypes.map((ct) => [
                    `category_${ct.key}`,
                    (editing as any).category_assignments?.[ct.key] || '',
                ]),
            ),
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
            fuel_en: fuelKey,
            fuel_fr: fuelKey,
            fuel_ar: fuelKey,
            transmission_en: transmissionKey,
            transmission_fr: transmissionKey,
            transmission_ar: transmissionKey,
        };
    }, [categoryTypes, editing, lang]);

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

        const categoryAssignments: Record<string, string> = {};
        categoryTypes.forEach((ct) => {
            const val = values[`category_${ct.key}`];
            if (val && typeof val === 'string' && val !== '') {
                categoryAssignments[ct.key] = val;
            }
        });

        const payload: Record<string, unknown> = {
            ...values,
            id: editing?.id ?? '',
            category_key: asText(values.category_key),
            category: asText(values.category_en) || asText(values.category),
            category_en: asText(values.category_en),
            category_fr: asText(values.category_fr),
            category_ar: asText(values.category_ar),
            category_assignments: categoryAssignments,
            // Convert fuel/transmission keys to labels
            fuel_en: (() => {
                const key = asText(values.fuel_en);
                const opt = FUEL_TYPES.find((o) => o.value === key);
                return opt?.label.en || key;
            })(),
            fuel_fr: (() => {
                const key = asText(values.fuel_fr);
                const opt = FUEL_TYPES.find((o) => o.value === key);
                return opt?.label.fr || key;
            })(),
            fuel_ar: (() => {
                const key = asText(values.fuel_ar);
                const opt = FUEL_TYPES.find((o) => o.value === key);
                return opt?.label.ar || key;
            })(),
            transmission_en: (() => {
                const key = asText(values.transmission_en);
                const opt = TRANSMISSION_TYPES.find((o) => o.value === key);
                return opt?.label.en || key;
            })(),
            transmission_fr: (() => {
                const key = asText(values.transmission_fr);
                const opt = TRANSMISSION_TYPES.find((o) => o.value === key);
                return opt?.label.fr || key;
            })(),
            transmission_ar: (() => {
                const key = asText(values.transmission_ar);
                const opt = TRANSMISSION_TYPES.find((o) => o.value === key);
                return opt?.label.ar || key;
            })(),
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
                    {/* Category Types - dynamic dropdowns */}
                    {categoryTypes.map((catType) => (
                        <div key={catType.key} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    {catType.label[activeLang] ||
                                        catType.label.en}
                                </label>
                            </div>
                            <Select
                                value={String(
                                    values[`category_${catType.key}`] || '',
                                )}
                                onValueChange={(val) =>
                                    setField(`category_${catType.key}`, val)
                                }
                            >
                                <SelectTrigger
                                    className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20`}
                                >
                                    <SelectValue
                                        placeholder={t('actions.select')}
                                    />
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

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Name field - text input */}
                        <div className="space-y-2">
                            <label
                                htmlFor={`name_${activeLang}`}
                                className={`flex items-center gap-2 text-xs font-semibold ${errors[`name_${activeLang}`] ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                                {t('admin.name')}
                                <LangBadge lang={activeLang} />
                            </label>
                            <input
                                id={`name_${activeLang}`}
                                value={String(
                                    values[`name_${activeLang}`] ?? '',
                                )}
                                placeholder={t('admin.carForm.namePlaceholder')}
                                onChange={(event) =>
                                    setField(
                                        `name_${activeLang}`,
                                        event.target.value,
                                    )
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors[`name_${activeLang}`] ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {t('admin.carForm.nameHint')}
                            </p>
                            {errors[`name_${activeLang}`] && (
                                <p className="text-xs text-destructive">
                                    {errors[`name_${activeLang}`]}
                                </p>
                            )}
                        </div>

                        {/* Fuel type - radio group */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                {t('admin.carForm.fuel')}
                            </label>
                            <RadioGroup
                                value={String(
                                    values[`fuel_${activeLang}`] ?? '',
                                )}
                                onValueChange={(val) => {
                                    setField('fuel_en', val);
                                    setField('fuel_fr', val);
                                    setField('fuel_ar', val);
                                }}
                                className="flex flex-wrap gap-3"
                            >
                                {FUEL_TYPES.map((fuel) => (
                                    <div
                                        key={fuel.value}
                                        className="flex items-center space-x-2"
                                    >
                                        <RadioGroupItem
                                            value={fuel.value}
                                            id={`fuel-${fuel.value}`}
                                        />
                                        <Label
                                            htmlFor={`fuel-${fuel.value}`}
                                            className="cursor-pointer text-sm font-normal"
                                        >
                                            {getLocalizedLabel(
                                                fuel,
                                                activeLang,
                                            )}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            <p className="text-[10px] text-muted-foreground">
                                {t('admin.carForm.fuelHint')}
                            </p>
                        </div>

                        {/* Transmission type - radio group */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                {t('admin.carForm.transmission')}
                            </label>
                            <RadioGroup
                                value={String(
                                    values[`transmission_${activeLang}`] ?? '',
                                )}
                                onValueChange={(val) => {
                                    setField('transmission_en', val);
                                    setField('transmission_fr', val);
                                    setField('transmission_ar', val);
                                }}
                                className="flex flex-wrap gap-3"
                            >
                                {TRANSMISSION_TYPES.map((trans) => (
                                    <div
                                        key={trans.value}
                                        className="flex items-center space-x-2"
                                    >
                                        <RadioGroupItem
                                            value={trans.value}
                                            id={`transmission-${trans.value}`}
                                        />
                                        <Label
                                            htmlFor={`transmission-${trans.value}`}
                                            className="cursor-pointer text-sm font-normal"
                                        >
                                            {getLocalizedLabel(
                                                trans,
                                                activeLang,
                                            )}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            <p className="text-[10px] text-muted-foreground">
                                {t('admin.carForm.transmissionHint')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="car-price"
                                className={`text-xs font-semibold ${errors.price ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                                {t('admin.price')}
                            </label>
                            <Input
                                id="car-price"
                                type="number"
                                min={0}
                                step={1}
                                placeholder="0"
                                value={String(values.price ?? '')}
                                onChange={(e) =>
                                    setField('price', e.target.value)
                                }
                                className={
                                    errors.price
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
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
                                min="1"
                                max="15"
                                step="1"
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
            <CategoryTypeManager
                entityType="cars"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'category-types', 'cars'],
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
                        className="bg-primary text-primary-foreground"
                    >
                        <Save className="mr-1 h-3.5 w-3.5" />{' '}
                        {t('admin.settings.save')}
                    </Button>
                </div>
                <HeroImagesManager
                    pageKey="cars"
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
                                            asText(row.category_key)}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        {Number(row.price).toLocaleString()} TND
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
