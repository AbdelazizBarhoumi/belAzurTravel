import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Settings, Image as ImageIcon, Save, Star } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
} from '@/api/admin.api';
import { apiFetch } from '@/api/http';
import type { PageHeroSlide } from '@/api/siteSettings.api';
import { CategoryTypeManager } from '@/components/admin/CategoryTypeManager';
import { HeroImagesManager } from '@/components/admin/HeroImagesManager';
import { useCategoryTypes, type CategoryType } from '@/hooks/useCategoryTypes';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import LangBadge from '@/components/forms/LangBadge';
import { EntityFormDialog } from '@/components/forms/EntityFormDialog';
import {
    JsonListEditor,
    type JsonFieldDef,
} from '@/components/forms/JsonListEditor';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { AdminDestination } from '@/hooks/useAdminStore';
import {
    categoryLabels,
    destinationLabels,
    localizeKnown,
} from '@/lib/adminI18n';
import { LocationSelect } from '@/components/ui/LocationSelect';
import {
    BEST_TIME_OPTIONS,
    LANGUAGES,
    CURRENCIES,
    WEATHER_OPTIONS,
    getLocalizedLabel,
} from '@/data/adminSelectOptions';

type DestinationFormValues = AdminDestination &
    Record<string, unknown> & {
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

function resolveCategoryKey(
    _categories: Array<{
        key: string;
        name: { en: string; fr: string; ar: string };
    }>,
    ...values: Array<unknown>
): string {
    const resolveFromCandidate = (candidate: string): string => {
        return candidate.trim();
    };

    for (const value of values) {
        if (typeof value === 'string' && value.trim() !== '') {
            return resolveFromCandidate(value);
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
                return resolveFromCandidate(candidate);
            }

            for (const localized of [record.en, record.fr, record.ar]) {
                if (typeof localized === 'string' && localized.trim() !== '') {
                    return resolveFromCandidate(localized);
                }
            }
        }
    }

    return '';
}

const highlightSchema: JsonFieldDef[] = [
    {
        key: 'name',
        labelKey: 'admin.destinationForm.highlightName',
        translatable: true,
    },
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

    const validate = (
        values: DestinationFormValues,
    ): Record<string, string> => {
        const errs: Record<string, string> = {};
        const langs: DestinationLang[] = ['en', 'fr', 'ar'];

        langs.forEach((l) => {
            if (!values[`name_${l}`])
                errs[`name_${l}`] = t('admin.errors.required');
            if (!values[`country_${l}`])
                errs[`country_${l}`] = t('admin.errors.required');
        });

        if (!values.category_key)
            errs.category_key = t('admin.errors.required');
        if (!values.price || Number(values.price) <= 0)
            errs.price = t('admin.errors.required');

        return errs;
    };

    const isCodeEnabled =
        siteSettings?.config?.navigation?.enabled_dropdowns?.includes(
            'destinations',
        );

    const { data: destinations = [] } = useQuery({
        queryKey: ['admin', 'destinations'],
        queryFn: () => listAdminEntities<AdminDestination>('destinations'),
    });

    const { data: categoryTypes = [] } = useCategoryTypes('destinations');

    // Hero images state
    const existingHeroConfig = siteSettings?.content?.page_heroes?.destinations;
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
                    destinations: {
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

    const dialogInitial = useMemo<DestinationFormValues | null>(() => {
        if (!editing) return null;

        const editingRecord = editing as unknown as Record<string, unknown>;

        // Convert fact labels to keys if needed
        const resolveFactKey = (
            value: string,
            options: typeof BEST_TIME_OPTIONS,
        ): string => {
            if (!value) return '';
            if (options.some((o) => o.value === value)) return value;
            const match = options.find(
                (o) => o.label.en === value || o.label.fr === value || o.label.ar === value,
            );
            return match?.value || value;
        };

        const bestTimeKey = resolveFactKey(
            asText(editingRecord.bestTime_en),
            BEST_TIME_OPTIONS,
        );
        const languageKey = resolveFactKey(
            asText(editingRecord.language_en),
            LANGUAGES,
        );
        const currencyKey = resolveFactKey(
            asText(editingRecord.currency_en),
            CURRENCIES,
        );

        return {
            ...editing,
            category_key: resolveCategoryKey(
                [],
                editingRecord.category_key,
                editingRecord.category,
                editingRecord.category_en,
                editingRecord.category_fr,
                editingRecord.category_ar,
            ),
            ...Object.fromEntries(
                categoryTypes.map((ct) => [
                    `category_${ct.key}`,
                    (editing as any).category_assignments?.[ct.key] || '',
                ]),
            ),
            imagePath: asText(editingRecord.image),
            imageFile: null,
            galleryPaths: parseGallery(editingRecord.gallery),
            galleryFiles: [],
            highlights: Array.isArray(editingRecord.highlights)
                ? editingRecord.highlights
                : [],
            bestTime_en: bestTimeKey,
            bestTime_fr: bestTimeKey,
            bestTime_ar: bestTimeKey,
            language_en: languageKey,
            language_fr: languageKey,
            language_ar: languageKey,
            currency_en: currencyKey,
            currency_fr: currencyKey,
            currency_ar: currencyKey,
        } as DestinationFormValues;
    }, [editing, categoryTypes]);

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
                            <Settings className="h-4 w-4" />{' '}
                            {t('admin.manageCategories')}
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
                entityType="destinations"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'category-types', 'destinations'],
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
                    pageKey="destinations"
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
                                                ? lang === 'ar'
                                                    ? 'text-right'
                                                    : 'text-left'
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
                                    <td
                                        className={`px-4 py-3 text-sm font-semibold ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                    >
                                        {localizeKnown(
                                            destination.name,
                                            destinationLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                        {typeof destination.country === 'object' && destination.country !== null
                                            ? (destination.country as any)[lang] || (destination.country as any).en || ''
                                            : asText(destination.country)}
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
                                    <td className="px-4 py-3 text-center text-sm font-semibold">
                                        {destination.price.toLocaleString()} TND
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
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
                onOpenChange={(isOpen) => {
                    setOpen(isOpen);
                    if (!isOpen) {
                        setErrors({});
                        setEditing(null);
                    }
                }}
                errors={errors}
                isSubmitting={saveMutation.isPending}
                validate={validate}
                title={
                    editing
                        ? t('admin.destinationEditTitle')
                        : t('admin.destinationAddTitle')
                }
                subtitle={t('admin.destinationForm.helper')}
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
                initial={dialogInitial}
                sections={[
                    {
                        title: t('admin.destinationForm.coreInformation'),
                        description: t(
                            'admin.destinationForm.coreInformationHint',
                        ),
                        columns: 2,
                        render: ({ values, setField, activeLang, errors }) => (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`name_${activeLang}`}
                                            className={
                                                errors?.[`name_${activeLang}`]
                                                    ? 'text-destructive'
                                                    : 'text-muted-foreground'
                                            }
                                        >
                                            {t('admin.destinationForm.name')}
                                            <LangBadge lang={activeLang} />
                                        </Label>
                                        <Input
                                            id={`name_${activeLang}`}
                                            value={asText(
                                                values[`name_${activeLang}`],
                                            )}
                                            onChange={(e) =>
                                                setField(
                                                    `name_${activeLang}`,
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                'admin.destinationForm.namePlaceholder',
                                            )}
                                        />
                                        {errors?.[`name_${activeLang}`] && (
                                            <p className="text-[10px] text-destructive">
                                                {errors[`name_${activeLang}`]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`country_${activeLang}`}
                                            className={
                                                errors?.[`country_${activeLang}`]
                                                    ? 'text-destructive'
                                                    : 'text-muted-foreground'
                                            }
                                        >
                                            {t('admin.destinationForm.country')}
                                            <LangBadge lang={activeLang} />
                                        </Label>
                                        <LocationSelect
                                            value={asText(
                                                values[`country_${activeLang}`],
                                            )}
                                            onChange={(val) => {
                                                setField('country_en', val);
                                                setField('country_fr', val);
                                                setField('country_ar', val);
                                            }}
                                            lang={activeLang}
                                            countryOnly
                                        />
                                        {errors?.[`country_${activeLang}`] && (
                                            <p className="text-[10px] text-destructive">
                                                {errors[`country_${activeLang}`]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Category Types - dynamic dropdowns */}
                                    {categoryTypes.map((catType) => (
                                        <div key={catType.key} className="space-y-2">
                                            <Label
                                                className="text-muted-foreground"
                                            >
                                                {catType.label[activeLang] || catType.label.en}
                                            </Label>
                                            <Select
                                                value={String(values[`category_${catType.key}`] || '')}
                                                onValueChange={(val) => setField(`category_${catType.key}`, val)}
                                            >
                                                <SelectTrigger
                                                    className={
                                                        errors?.category_key
                                                            ? 'border-destructive ring-1 ring-destructive'
                                                            : ''
                                                    }
                                                >
                                                    <SelectValue
                                                        placeholder={t(
                                                            'actions.select',
                                                        )}
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

                                    <div className="space-y-2 md:col-span-2">
                                        <Label
                                            htmlFor={localizedKey(
                                                'description',
                                                activeLang,
                                            )}
                                            className={
                                                errors?.[
                                                    localizedKey(
                                                        'description',
                                                        activeLang,
                                                    )
                                                ]
                                                    ? 'text-destructive'
                                                    : 'text-muted-foreground'
                                            }
                                        >
                                            {t('admin.description')}
                                            <LangBadge lang={activeLang} />
                                        </Label>
                                        <Textarea
                                            id={localizedKey(
                                                'description',
                                                activeLang,
                                            )}
                                            value={String(
                                                values[
                                                    localizedKey(
                                                        'description',
                                                        activeLang,
                                                    )
                                                ] ?? '',
                                            )}
                                            onChange={(e) =>
                                                setField(
                                                    localizedKey(
                                                        'description',
                                                        activeLang,
                                                    ),
                                                    e.target.value,
                                                )
                                            }
                                            rows={4}
                                            placeholder={t(
                                                'admin.destinationForm.descriptionHelp',
                                            )}
                                            className={
                                                errors?.[
                                                    localizedKey(
                                                        'description',
                                                        activeLang,
                                                    )
                                                ]
                                                    ? 'border-destructive ring-1 ring-destructive'
                                                    : ''
                                            }
                                        />
                                        {errors?.[
                                            localizedKey(
                                                'description',
                                                activeLang,
                                            )
                                        ] && (
                                            <p className="text-xs text-destructive">
                                                {
                                                    errors[
                                                        localizedKey(
                                                            'description',
                                                            activeLang,
                                                        )
                                                    ]
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label
                                            htmlFor={localizedKey(
                                                'about',
                                                activeLang,
                                            )}
                                            className={
                                                errors?.[
                                                    localizedKey(
                                                        'about',
                                                        activeLang,
                                                    )
                                                ]
                                                    ? 'text-destructive'
                                                    : 'text-muted-foreground'
                                            }
                                        >
                                            {t('admin.destinationForm.about')}
                                            <LangBadge lang={activeLang} />
                                        </Label>
                                        <Textarea
                                            id={localizedKey(
                                                'about',
                                                activeLang,
                                            )}
                                            value={String(
                                                values[
                                                    localizedKey(
                                                        'about',
                                                        activeLang,
                                                    )
                                                ] ?? '',
                                            )}
                                            onChange={(e) =>
                                                setField(
                                                    localizedKey(
                                                        'about',
                                                        activeLang,
                                                    ),
                                                    e.target.value,
                                                )
                                            }
                                            rows={4}
                                            placeholder={t(
                                                'admin.destinationForm.aboutHelp',
                                            )}
                                            className={
                                                errors?.[
                                                    localizedKey(
                                                        'about',
                                                        activeLang,
                                                    )
                                                ]
                                                    ? 'border-destructive ring-1 ring-destructive'
                                                    : ''
                                            }
                                        />
                                        {errors?.[
                                            localizedKey('about', activeLang)
                                        ] && (
                                            <p className="text-xs text-destructive">
                                                {
                                                    errors[
                                                        localizedKey(
                                                            'about',
                                                            activeLang,
                                                        )
                                                    ]
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <Label
                                            htmlFor="destination-price"
                                            className={
                                                errors?.price
                                                    ? 'text-destructive'
                                                    : 'text-muted-foreground'
                                            }
                                        >
                                            {t('admin.destinationForm.price')}
                                        </Label>
                                        <Input
                                            id="destination-price"
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={String(values.price ?? '')}
                                            placeholder="0.00"
                                            onChange={(e) => setField('price', e.target.value)}
                                            className={errors?.price ? 'border-destructive ring-1 ring-destructive' : ''}
                                        />
                                        {errors?.price && (
                                            <p className="text-xs text-destructive">
                                                {errors.price}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                'admin.destinationForm.priceHelp',
                                            )}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label
                                            className="text-muted-foreground"
                                        >
                                            {t('admin.destinationForm.rating')}
                                        </Label>
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
                                                className="w-20"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {t('admin.destinationForm.ratingHelp')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ),
                    },
                    {
                        title: t('admin.destinationForm.mediaAndHighlights'),
                        description: t(
                            'admin.destinationForm.mediaAndHighlightsHint2',
                        ),
                        render: ({ values, setField, activeLang }) => (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">
                                        {t('admin.destinationForm.images')}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {t('admin.destinationForm.mediaHelp')}
                                    </p>
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
                                </div>

                                <div className="border-t border-border pt-4">
                                    <JsonListEditor
                                        title={t(
                                            'admin.destinationForm.highlights',
                                        )}
                                        items={
                                            Array.isArray(values.highlights)
                                                ? values.highlights
                                                : []
                                        }
                                        onItemsChange={(items) =>
                                            setField('highlights', items)
                                        }
                                        schema={highlightSchema}
                                        activeLang={activeLang}
                                        addButtonLabel={t(
                                            'admin.destinationForm.addHighlight',
                                        )}
                                        itemLabel={(item, index) =>
                                            (
                                                item.name as
                                                    | Record<string, string>
                                                    | undefined
                                            )?.[activeLang] ||
                                            `${t('admin.destinationForm.highlight')} ${index + 1}`
                                        }
                                    />
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {t(
                                            'admin.destinationForm.highlightsHelp',
                                        )}
                                    </p>
                                </div>
                            </div>
                        ),
                    },
                    {
                        title: t('admin.destinationForm.destinationFacts'),
                        description: t(
                            'admin.destinationForm.destinationFactsHint',
                        ),
                        columns: 2,
                        render: ({ values, setField, activeLang }) => (
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Best Time - dropdown */}
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">
                                        {t('admin.destinationForm.bestTime')}
                                        <LangBadge lang={activeLang} />
                                    </Label>
                                    <Select
                                        value={String(values[`bestTime_${activeLang}`] ?? '')}
                                        onValueChange={(val) => {
                                            setField('bestTime_en', val);
                                            setField('bestTime_fr', val);
                                            setField('bestTime_ar', val);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('admin.destinationForm.bestTimePlaceholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BEST_TIME_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {getLocalizedLabel(opt, activeLang)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Language - dropdown */}
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">
                                        {t('admin.destinationForm.language')}
                                        <LangBadge lang={activeLang} />
                                    </Label>
                                    <Select
                                        value={String(values[`language_${activeLang}`] ?? '')}
                                        onValueChange={(val) => {
                                            setField('language_en', val);
                                            setField('language_fr', val);
                                            setField('language_ar', val);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('admin.destinationForm.languagePlaceholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LANGUAGES.map((lang) => (
                                                <SelectItem key={lang.value} value={lang.value}>
                                                    {getLocalizedLabel(lang, activeLang)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Currency - dropdown */}
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">
                                        {t('admin.destinationForm.currency')}
                                        <LangBadge lang={activeLang} />
                                    </Label>
                                    <Select
                                        value={String(values[`currency_${activeLang}`] ?? '')}
                                        onValueChange={(val) => {
                                            setField('currency_en', val);
                                            setField('currency_fr', val);
                                            setField('currency_ar', val);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('admin.destinationForm.currencyPlaceholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CURRENCIES.map((curr) => (
                                                <SelectItem key={curr.value} value={curr.value}>
                                                    {getLocalizedLabel(curr, activeLang)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Weather - dropdown */}
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">
                                        {t('admin.destinationForm.weather')}
                                        <LangBadge lang={activeLang} />
                                    </Label>
                                    <Select
                                        value={String(values[`weather_${activeLang}`] ?? '')}
                                        onValueChange={(val) => {
                                            setField('weather_en', val);
                                            setField('weather_fr', val);
                                            setField('weather_ar', val);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('admin.destinationForm.weatherPlaceholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WEATHER_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {getLocalizedLabel(opt, activeLang)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
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
                    const categoryKey = resolveCategoryKey(
                        [],
                        values.category_key,
                        values.category,
                        values.category_en,
                        values.category_fr,
                        values.category_ar,
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

                    const about = firstNonEmpty(
                        values.about_en,
                        values.about_fr,
                        values.about_ar,
                        values.about,
                    );

                    // Resolve bestTime, language, currency keys to labels
                    const resolveFactLabel = (
                        key: string,
                        options: typeof BEST_TIME_OPTIONS,
                    ): { en: string; fr: string; ar: string } => {
                        const match = options.find((o) => o.value === key);
                        return match?.label ?? { en: key, fr: key, ar: key };
                    };
                    const bestTimeKey = String(values.bestTime_en ?? '').trim();
                    const languageKey = String(values.language_en ?? '').trim();
                    const currencyKey = String(values.currency_en ?? '').trim();
                    const bestTimeLabels = resolveFactLabel(bestTimeKey, BEST_TIME_OPTIONS);
                    const languageLabels = resolveFactLabel(languageKey, LANGUAGES);
                    const currencyLabels = resolveFactLabel(currencyKey, CURRENCIES);

                    const categoryAssignments: Record<string, string> = {};
                    categoryTypes.forEach((ct) => {
                        const val = values[`category_${ct.key}`];
                        if (val && typeof val === 'string' && val !== '') {
                            categoryAssignments[ct.key] = val;
                        }
                    });

                    const item = {
                        ...values,
                        id: editing?.id ?? '',
                        name,
                        name_en: firstNonEmpty(values.name_en, values.name),
                        name_fr: values.name_fr ?? '',
                        name_ar: values.name_ar ?? '',
                        country,
                        country_en: firstNonEmpty(
                            values.country_en,
                            values.country,
                        ),
                        country_fr: values.country_fr ?? '',
                        country_ar: values.country_ar ?? '',
                        category,
                        category_key: categoryKey,
                        category_en: firstNonEmpty(
                            values.category_en,
                            values.category,
                        ),
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
                        about,
                        about_en: firstNonEmpty(values.about_en, values.about),
                        about_fr: values.about_fr ?? '',
                        about_ar: values.about_ar ?? '',
                        bestTime_en: bestTimeLabels.en,
                        bestTime_fr: bestTimeLabels.fr,
                        bestTime_ar: bestTimeLabels.ar,
                        language_en: languageLabels.en,
                        language_fr: languageLabels.fr,
                        language_ar: languageLabels.ar,
                        currency_en: currencyLabels.en,
                        currency_fr: currencyLabels.fr,
                        currency_ar: currencyLabels.ar,
                        highlights: Array.isArray(values.highlights)
                            ? values.highlights
                            : [],
                        category_assignments: categoryAssignments,
                        gallery,
                        gallery_files: values.galleryFiles ?? undefined,
                    } as unknown as AdminDestination;

                    saveMutation.mutate(item, {
                        onSuccess: () => {
                            toast.success(
                                editing
                                    ? t('admin.destinationUpdated')
                                    : t('admin.destinationAdded'),
                            );
                            setOpen(false);
                            setEditing(null);
                        },
                        onError: () => {
                            toast.error(t('errors.generic'));
                        },
                    });

                    setOpen(false);
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
