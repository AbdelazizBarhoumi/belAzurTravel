import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Lang } from '@/i18n/translations';

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
import {
    EntityFormDialog,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import LangBadge from '@/components/forms/LangBadge';
import {
    JsonListEditor,
    type JsonFieldDef,
} from '@/components/forms/JsonListEditor';
import { Button } from '@/components/ui/button';
import { fetchCategories } from '@/api/categories.api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import {
    categoryLabels,
    hotelLabels,
    localizeKnown,
} from '@/lib/adminI18n';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { CitySelect } from '@/components/ui/CitySelect';
import { useCountryByCode } from '@/hooks/useCountries';

type HotelCategory = {
    key: string;
    name: Record<string, string>;
};

type HotelFormValues = AdminRow & {
    category_key?: string;
    amenities?: string;
    gallery?: string;
    rooms?: any[];
    imagePath?: string;
    imageFile?: File | null;
    galleryFiles?: File[];
    galleryPaths?: string[];
};

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

const amenitySchema = (t: any): JsonFieldDef[] => [
    {
        key: 'name',
        labelKey: 'admin.hotelForm.amenityName',
        translatable: true,
    },
    {
        key: 'iconType',
        labelKey: 'admin.hotelForm.iconType',
        type: 'select',
        options: [
            { label: t('admin.iconType.predefined'), value: 'predefined' },
            { label: t('admin.iconType.custom'), value: 'custom' },
        ],
    },
    {
        key: 'icon',
        labelKey: 'admin.hotelForm.icon',
        type: 'select',
        options: [
            { label: t('admin.amenity.wifi'), value: 'wifi' },
            { label: t('admin.amenity.parking'), value: 'parking' },
            { label: t('admin.amenity.breakfast'), value: 'breakfast' },
            { label: t('admin.amenity.gym'), value: 'gym' },
            { label: t('admin.amenity.restaurant'), value: 'restaurant' },
            { label: t('admin.amenity.pool'), value: 'pool' },
        ],
    },
];

const roomSchema: JsonFieldDef[] = [
    { key: 'name', labelKey: 'admin.hotelForm.roomName', translatable: true },
    {
        key: 'description',
        labelKey: 'admin.description',
        type: 'textarea',
        translatable: true,
    },
    { key: 'pricePerNight', labelKey: 'admin.pricePerNight', type: 'number' },
    { key: 'capacity', labelKey: 'admin.hotelForm.capacity', type: 'number' },
    { key: 'size', labelKey: 'admin.hotelForm.size', type: 'number' },
    // Room features: newline-separated list (simple editor). These will be
    // converted to arrays before saving.
    {
        key: 'features',
        labelKey: 'admin.hotelForm.features',
        type: 'textarea',
        translatable: false,
    },
    // Room images: newline-separated image paths/URLs
    {
        key: 'images',
        labelKey: 'admin.hotelForm.roomImages',
        type: 'file',
        translatable: false,
    },
];

// Helper for splitting newline-delimited input into array items
function splitLines(value: unknown): string[] {
    if (Array.isArray(value)) return value as string[];
    if (typeof value !== 'string') return [];
    return value
        .split(/\r\n|\r|\n/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function roomHasMeaningfulContent(room: Record<string, unknown>): boolean {
    for (const key of ['name', 'description']) {
        const value = room[key];

        if (typeof value === 'string' && value.trim() !== '') {
            return true;
        }

        if (value && typeof value === 'object') {
            const record = value as Record<string, unknown>;

            if (
                ['en', 'fr', 'ar'].some(
                    (lang) =>
                        typeof record[lang] === 'string' &&
                        String(record[lang]).trim() !== '',
                )
            ) {
                return true;
            }
        }
    }

    for (const key of ['pricePerNight', 'capacity', 'size']) {
        const raw = room[key];

        if (typeof raw === 'number' && raw > 0) {
            return true;
        }

        if (typeof raw === 'string' && raw.trim() !== '' && Number(raw) > 0) {
            return true;
        }
    }

    for (const key of ['features', 'images']) {
        const raw = room[key];

        if (!Array.isArray(raw)) {
            continue;
        }

        if (
            raw.some((item) => {
                if (typeof item === 'string') {
                    return item.trim() !== '';
                }

                if (item && typeof item === 'object') {
                    return Object.values(item as Record<string, unknown>).some(
                        (value) => {
                            if (typeof value === 'string') {
                                return value.trim() !== '';
                            }

                            if (Array.isArray(value)) {
                                return value.some((nested) =>
                                    typeof nested === 'string'
                                        ? nested.trim() !== ''
                                        : Boolean(nested),
                                );
                            }

                            return Boolean(value);
                        },
                    );
                }

                return Boolean(item);
            })
        ) {
            return true;
        }
    }

    return false;
}

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

function getCategoryLabel(
    category: HotelCategory | undefined,
    lang: Lang,
): string {
    if (!category) {
        return '';
    }

    return category.name[lang] || category.name.en || category.key;
}

function syncCategoryFields(
    setField: (field: string, value: unknown) => void,
    category: HotelCategory | undefined,
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

const baseFieldClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
        hasError
            ? 'border-destructive ring-1 ring-destructive'
            : 'border-border'
    }`;

const AdminHotels = () => {
    useAdminGuard();

    const queryClient = useQueryClient();
    const queryKey = ['admin', 'hotels'] as const;
    const { settings: siteSettings } = useSiteSettings();
    const isCodeEnabled =
        siteSettings?.config?.navigation?.enabled_dropdowns?.includes('hotels');
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    const { data: hotels = [] } = useQuery({
        queryKey,
        queryFn: () => listAdminEntities<AdminRow>('hotels'),
    });
    const { data: dbCategories = [] } = useQuery<HotelCategory[]>({
        queryKey: ['admin', 'categories', 'hotels'],
        queryFn: () => fetchCategories('hotels'),
    });

    const { lang, t } = useLanguage();
    const categoryLabelByKey = useMemo(
        () =>
            new Map(
                dbCategories.map((category) => [
                    category.key,
                    getCategoryLabel(category, lang),
                ]),
            ),
        [dbCategories, lang],
    );

    const saveMutation = useMutation({
        mutationFn: (item: HotelFormValues) =>
            saveAdminEntity('hotels', item as unknown as AdminRow),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            setEditing(null);
            setOpen(false);
            setErrors({});
            toast.success(
                editing ? t('admin.hotelUpdated') : t('admin.hotelAdded'),
            );
        },
        onError: (err: any) => {
            console.error('[AdminHotels] Save failed:', err);
            if (err.status === 422 && err.data?.errors) {
                console.log(
                    '[AdminHotels] Validation errors:',
                    err.data.errors,
                );
                setErrors(err.data.errors);
                toast.error(t('admin.pleaseFixErrors'));
            } else {
                toast.error(t('admin.saveFailed'));
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('hotels', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    const [modalLang, setModalLang] = useState<Lang>('en');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const dialogInitial: HotelFormValues | null = editing
        ? ({
              ...editing,
              destinationSlug: editing.destinationSlug,
              category_key: resolveCategoryKey(
                  (editing as any).category_key,
                  editing.category,
                  editing.category_en,
                  editing.category_fr,
                  editing.category_ar,
                  (editing.details as any)?.category,
              ),
              category_en:
                  (editing as any).category_en ??
                  (typeof (editing as any).category === 'object' &&
                  (editing as any).category !== null
                      ? (editing as any).category.en
                      : '') ??
                  '',
              category_fr:
                  (editing as any).category_fr ??
                  (typeof (editing as any).category === 'object' &&
                  (editing as any).category !== null
                      ? (editing as any).category.fr
                      : '') ??
                  '',
              category_ar:
                  (editing as any).category_ar ??
                  (typeof (editing as any).category === 'object' &&
                  (editing as any).category !== null
                      ? (editing as any).category.ar
                      : '') ??
                  '',
              imagePath: asText(editing.image),
              imageFile: null,
              galleryPaths: Array.isArray(editing.gallery)
                  ? editing.gallery
                  : [],
              galleryFiles: [] as File[],
              amenities: Array.isArray(editing.amenities)
                  ? editing.amenities
                  : [],
              rooms: Array.isArray((editing as any).rooms)
                  ? (editing as any).rooms
                  : [],
              city_en: asText(editing.city_en),
              city_fr: asText(editing.city_fr),
              city_ar: asText(editing.city_ar),
              country_en: asText(editing.country_en),
              country_fr: asText(editing.country_fr),
              country_ar: asText(editing.country_ar),
              description_en: asText(editing.description_en),
              description_fr: asText(editing.description_fr),
              description_ar: asText(editing.description_ar),
          } as unknown as HotelFormValues)
        : null;

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setErrors({});
            setEditing(null);
        }
        setOpen(nextOpen);
    };

    const hotelSections: SectionDef[] = [
        {
            title: t('admin.hotelForm.coreDetails'),
            column: 'main',
            description: t('admin.hotelForm.coreDetailsHint'),
            render: ({ values, setField, activeLang, errors }) => {
                const selectedCountryCode = asText(values.country_en);
                const country = useCountryByCode(selectedCountryCode || null);

                return (
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                {
                                    key: 'name',
                                    label: t('admin.name'),
                                    placeholder: t(
                                        'admin.hotelForm.namePlaceholder',
                                    ),
                                    helpText: t('admin.hotelForm.nameHelp'),
                                },
                                {
                                    key: 'location',
                                    label: t('admin.location'),
                                    placeholder: t(
                                        'admin.hotelForm.locationPlaceholder',
                                    ),
                                    helpText: t('admin.hotelForm.locationHelp'),
                                },
                                {
                                    key: 'category',
                                    label: t('admin.category'),
                                    helpText: t('admin.hotelForm.categoryHelp'),
                                },
                            ].map((field) => {
                                const localizedKey = `${field.key}_${activeLang}`;
                                const categoryKey = resolveCategoryKey(
                                    values.category_key,
                                    values.category,
                                    values.category_en,
                                    values.category_fr,
                                    values.category_ar,
                                );
                                const value =
                                    field.key === 'category'
                                        ? categoryKey
                                        : asText(values[localizedKey]);
                                const error =
                                    field.key === 'category'
                                        ? errors?.category_key
                                        : errors?.[localizedKey];

                                return (
                                    <div key={localizedKey} className="space-y-2">
                                        <label
                                            htmlFor={localizedKey}
                                            className={`flex items-center gap-2 text-xs font-semibold ${error ? 'text-destructive' : 'text-muted-foreground'}`}
                                        >
                                            {field.label}
                                            {field.key !== 'category' && (
                                                <LangBadge lang={activeLang} />
                                            )}
                                        </label>
                                        {field.key === 'category' &&
                                        dbCategories.length > 0 ? (
                                            <Select
                                                value={String(value)}
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
                                                    id={localizedKey}
                                                    className={baseFieldClass(
                                                        Boolean(error),
                                                    )}
                                                    aria-invalid={Boolean(error)}
                                                >
                                                    <SelectValue
                                                        placeholder={t(
                                                            'actions.select',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dbCategories.map((c) => (
                                                        <SelectItem
                                                            key={c.key}
                                                            value={c.key}
                                                        >
                                                            {getCategoryLabel(
                                                                c,
                                                                activeLang,
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="space-y-1">
                                                <input
                                                    id={localizedKey}
                                                    value={value}
                                                    placeholder={field.placeholder}
                                                    onChange={(event) =>
                                                        setField(
                                                            localizedKey,
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={baseFieldClass(
                                                        Boolean(error),
                                                    )}
                                                    aria-invalid={Boolean(error)}
                                                    required
                                                />
                                                {error ? (
                                                    <p
                                                        id={`${localizedKey}-error`}
                                                        className="text-[10px] text-destructive"
                                                    >
                                                        {error}
                                                    </p>
                                                ) : field.helpText ? (
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {field.helpText}
                                                    </p>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="space-y-2">
                                <label
                                    htmlFor={`country_${activeLang}`}
                                    className={`flex items-center gap-2 text-xs font-semibold ${errors?.[`country_${activeLang}`] ? 'text-destructive' : 'text-muted-foreground'}`}
                                >
                                    {t('admin.country')}
                                    <LangBadge lang={activeLang} />
                                </label>
                                <CountrySelect
                                    value={selectedCountryCode}
                                    onChange={(_code, names) => {
                                        setField('country_en', names.en);
                                        setField('country_fr', names.fr);
                                        setField('country_ar', names.ar);
                                        setField('city_en', '');
                                        setField('city_fr', '');
                                        setField('city_ar', '');
                                    }}
                                    className={baseFieldClass(
                                        Boolean(errors?.[`country_${activeLang}`]),
                                    )}
                                />
                                {errors?.[`country_${activeLang}`] ? (
                                    <p className="text-[10px] text-destructive">
                                        {errors[`country_${activeLang}`]}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor={`city_${activeLang}`}
                                    className={`flex items-center gap-2 text-xs font-semibold ${errors?.[`city_${activeLang}`] ? 'text-destructive' : 'text-muted-foreground'}`}
                                >
                                    {t('admin.city')}
                                    <LangBadge lang={activeLang} />
                                </label>
                                <CitySelect
                                    countryCode={selectedCountryCode || null}
                                    value={asText(values[`city_${activeLang}`])}
                                    onChange={(names) => {
                                        setField('city_en', names.en);
                                        setField('city_fr', names.fr);
                                        setField('city_ar', names.ar);
                                    }}
                                    className={baseFieldClass(
                                        Boolean(errors?.[`city_${activeLang}`]),
                                    )}
                                />
                                {errors?.[`city_${activeLang}`] ? (
                                    <p className="text-[10px] text-destructive">
                                        {errors[`city_${activeLang}`]}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label
                                    htmlFor={`description_${activeLang}`}
                                    className={`text-xs font-semibold ${errors?.[`description_${activeLang}`] ? 'text-destructive' : 'text-muted-foreground'}`}
                                >
                                    {t('admin.description')}
                                    <LangBadge lang={activeLang} />
                                </label>
                                <textarea
                                    id={`description_${activeLang}`}
                                    value={asText(
                                        values[`description_${activeLang}`],
                                    )}
                                    onChange={(event) =>
                                        setField(
                                            `description_${activeLang}`,
                                            event.target.value,
                                        )
                                    }
                                    rows={5}
                                    className={baseFieldClass(
                                        Boolean(
                                            errors?.[`description_${activeLang}`],
                                        ),
                                    )}
                                    aria-invalid={Boolean(
                                        errors?.[`description_${activeLang}`],
                                    )}
                                />
                                {errors?.[`description_${activeLang}`] ? (
                                    <p
                                        id={`description_${activeLang}-error`}
                                        className="text-[10px] text-destructive"
                                    >
                                        {errors[`description_${activeLang}`]}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: t('admin.hotelForm.pricing'),
            columns: 2,
            column: 'main',
            fields: [
                {
                    key: 'price',
                    label: t('admin.pricePerNight'),
                    type: 'number',
                    placeholder: t('admin.hotelForm.pricePlaceholder'),
                    helpText: t('admin.hotelForm.priceHelp'),
                },
                {
                    key: 'rating',
                    label: t('admin.rating'),
                    type: 'number',
                    placeholder: t('admin.hotelForm.ratingPlaceholder'),
                    helpText: t('admin.hotelForm.ratingHelp'),
                },
                {
                    key: 'destinationSlug',
                    label: t('admin.destinationSlug'),
                    placeholder: t('admin.hotelForm.slugPlaceholder'),
                    helpText: t('admin.hotelForm.slugHelp'),
                },
                {
                    key: 'stars',
                    label: t('admin.stars'),
                    type: 'number',
                    placeholder: t('admin.hotelForm.starsPlaceholder'),
                    helpText: t('admin.hotelForm.starsHelp'),
                },
                {
                    key: 'reviews',
                    label: t('admin.reviews'),
                    type: 'number',
                    placeholder: t('admin.hotelForm.reviewsPlaceholder'),
                    helpText: t('admin.hotelForm.reviewsHelp'),
                },
            ],
        },
        {
            title: t('admin.hotelForm.media'),
            column: 'side',
            description: t('admin.hotelForm.mediaHint'),
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-6">
                    <EntityMediaInputs
                        values={values}
                        setField={setField}
                        imageLabel={t('admin.image')}
                        galleryLabel={t('admin.gallery')}
                        showImage
                        showGallery
                    />

                    <div className="border-t border-border pt-4">
                        <JsonListEditor
                            title={t('admin.hotelForm.amenities')}
                            items={
                                Array.isArray(values.amenities)
                                    ? values.amenities
                                    : []
                            }
                            onItemsChange={(items) =>
                                setField('amenities', items)
                            }
                            schema={amenitySchema(t)}
                            activeLang={activeLang}
                            itemLabel={(item, index) =>
                                (
                                    item.name as
                                        | Record<string, string>
                                        | undefined
                                )?.[activeLang] ||
                                `${t('admin.hotelForm.amenity')} ${index + 1}`
                            }
                        />{' '}
                    </div>

                    <div className="border-t border-border pt-4">
                        <JsonListEditor
                            title={t('admin.hotelForm.rooms')}
                            items={
                                Array.isArray(values.rooms) ? values.rooms : []
                            }
                            onItemsChange={(items) => setField('rooms', items)}
                            schema={roomSchema}
                            activeLang={activeLang}
                            addButtonLabel={t('admin.hotelForm.addRoom')}
                            itemLabel={(item, index) =>
                                (
                                    item.name as
                                        | Record<string, string>
                                        | undefined
                                )?.[activeLang] ||
                                `${t('admin.hotelForm.room')} ${index + 1}`
                            }
                        />
                    </div>
                </div>
            ),
        },
    ];

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (values: HotelFormValues): Record<string, string> => {
        const errs: Record<string, string> = {};

        // Basic required checks
        if (!values.name_en) errs.name_en = t('admin.required');
        if (!values.name_fr) errs.name_fr = t('admin.required');
        if (!values.name_ar) errs.name_ar = t('admin.required');

        if (!values.location_en) errs.location_en = t('admin.required');
        if (!values.location_fr) errs.location_fr = t('admin.required');
        if (!values.location_ar) errs.location_ar = t('admin.required');

        if (!values.city_en) errs.city_en = t('admin.required');
        if (!values.city_fr) errs.city_fr = t('admin.required');
        if (!values.city_ar) errs.city_ar = t('admin.required');

        if (!values.country_en) errs.country_en = t('admin.required');
        if (!values.country_fr) errs.country_fr = t('admin.required');
        if (!values.country_ar) errs.country_ar = t('admin.required');

        if (
            !resolveCategoryKey(
                values.category_key,
                values.category,
                values.category_en,
                values.category_fr,
                values.category_ar,
            )
        ) {
            errs.category_key = t('admin.required');
        }
        if (!values.price || Number(values.price) <= 0)
            errs.price = t('admin.invalidPrice');
        if (!values.destinationSlug) errs.destinationSlug = t('admin.required');

        return errs;
    };

    useEffect(() => {
        if (!open) {
            setErrors({});
        }
    }, [open]);

    useEffect(() => {
        setErrors({});
    }, [editing]);

    const handleSave = (values: HotelFormValues) => {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        const {
            imageFile,
            imagePath,
            galleryFiles,
            galleryPaths,
            amenities,
            rooms,
            ...rest
        } = values;

        const categoryKey = resolveCategoryKey(
            values.category_key,
            values.category,
            values.category_en,
            values.category_fr,
            values.category_ar,
        );

        const selectedCategory = dbCategories.find(
            (category) => category.key === categoryKey,
        );
        const selectedCategoryLabel =
            selectedCategory?.name.en ??
            selectedCategory?.name.fr ??
            selectedCategory?.name.ar ??
            values.category_en ??
            '';

        const payload = {
            ...rest,
            id: editing?.id || '',
            category_key: selectedCategory?.key ?? categoryKey ?? '',
            category: selectedCategoryLabel,
            category_en:
                selectedCategory?.name.en ??
                values.category_en ??
                selectedCategoryLabel,
            category_fr:
                selectedCategory?.name.fr ??
                values.category_fr ??
                selectedCategoryLabel,
            category_ar:
                selectedCategory?.name.ar ??
                values.category_ar ??
                selectedCategoryLabel,
            image: imageFile ?? imagePath?.trim() ?? asText(editing?.image),
            amenities: Array.isArray(amenities) ? amenities : [],
            rooms: Array.isArray(rooms)
                ? rooms
                      .filter(
                          (room) =>
                              room &&
                              typeof room === 'object' &&
                              roomHasMeaningfulContent(room),
                      )
                      .map((room) => ({
                          ...room,
                          features: Array.isArray(room?.features)
                              ? room.features
                              : splitLines(room?.features),
                          images: Array.isArray(room?.images)
                              ? room.images
                              : splitLines(room?.images),
                      }))
                : [],
            gallery: galleryPaths ?? [],
            description_en: values.description_en,
            description_fr: values.description_fr,
            description_ar: values.description_ar,
            city_en: values.city_en,
            city_fr: values.city_fr,
            city_ar: values.city_ar,
            country_en: values.country_en,
            country_fr: values.country_fr,
            country_ar: values.country_ar,
            details: {},
            ...(galleryFiles && galleryFiles.length > 0
                ? { gallery_files: galleryFiles }
                : {}),
        } as unknown as HotelFormValues;

        saveMutation.mutate(payload);
    };

    return (
        <AdminLayout
            title={t('admin.hotels')}
            subtitle={t('admin.hotelsSubtitle')}
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
                            setOpen(true);
                        }}
                        className="gap-2 bg-primary text-primary-foreground"
                    >
                        <Plus className="h-4 w-4" /> {t('actions.add')}
                    </Button>
                </div>
            }
        >
            <div
                className="overflow-hidden rounded-2xl border border-border bg-card"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    t('admin.image'),
                                    t('admin.name'),
                                    t('admin.location'),
                                    t('admin.category'),
                                    t('admin.pricePerNight'),
                                    t('admin.rating'),
                                    t('admin.actions'),
                                ].map((h, i) => (
                                    <th
                                        key={h}
                                        className={`px-4 py-3 text-xs font-semibold uppercase text-muted-foreground ${
                                            i === 1
                                                ? lang === 'ar'
                                                    ? 'text-right'
                                                    : 'text-left'
                                                : 'text-center'
                                        }`}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {hotels.map((d) => (
                                <tr
                                    key={String(d.id ?? '')}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="flex justify-center px-4 py-3">
                                        <img
                                            src={
                                                asText(d.image) ||
                                                '/images/hero-travel.jpg'
                                            }
                                            alt={localizeKnown(
                                                asText(d.name),
                                                hotelLabels,
                                                lang,
                                            )}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td
                                        className={`px-4 py-3 text-sm font-semibold ${
                                            lang === 'ar'
                                                ? 'text-right'
                                                : 'text-left'
                                        }`}
                                    >
                                        {localizeKnown(
                                            asText(d.name),
                                            hotelLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                        {asText(d.location)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs">
                                            {(() => {
                                                const catKey =
                                                    resolveCategoryKey(
                                                        (d as any).category_key,
                                                        d.category,
                                                        d.category_en,
                                                        d.category_fr,
                                                        d.category_ar,
                                                    );
                                                const cat = dbCategories.find(
                                                    (c) => c.key === catKey,
                                                );
                                                if (cat) {
                                                    return getCategoryLabel(
                                                        cat,
                                                        lang,
                                                    );
                                                }
                                                // Fallback to hotel object fields if not in dbCategories
                                                const category = (d as any)
                                                    .category;
                                                if (
                                                    typeof category ===
                                                        'object' &&
                                                    category !== null
                                                ) {
                                                    return (
                                                        category[lang] ||
                                                        category.en ||
                                                        ''
                                                    );
                                                }
                                                return localizeKnown(
                                                    asText(d.category),
                                                    categoryLabels,
                                                    lang,
                                                );
                                            })()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold">
                                        {String(d.price ?? 0)} TND
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {String(d.rating ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(d);
                                                    setErrors({});
                                                    setOpen(true);
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                                aria-label={t('actions.edit')}
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPendingDelete(d)
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
                        ? `${t('admin.deleteItemPrompt')} “${String(pendingDelete.name ?? '')}”? ${t('admin.deleteItemWarning')}`
                        : t('admin.deleteItemFallback')
                }
                confirmText={t('actions.delete')}
                cancelText={t('actions.cancel')}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    const id = pendingDelete.id;
                    if (!id) {
                        toast.error(t('admin.deleteFailed'));
                        setPendingDelete(null);
                        return;
                    }

                    deleteMutation.mutate(String(id));
                    setPendingDelete(null);
                }}
            />

            <EntityFormDialog<HotelFormValues>
                open={open}
                onOpenChange={handleOpenChange}
                title={
                    editing
                        ? `${t('actions.edit')} ${t('admin.hotels')}`
                        : `${t('actions.add')} ${t('admin.hotels')}`
                }
                sections={hotelSections}
                initial={dialogInitial}
                onSubmit={handleSave}
                errors={errors}
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
                activeLang={modalLang}
                onActiveLangChange={setModalLang}
                isSubmitting={saveMutation.isPending}
            />

            <CategoryManager
                type="hotels"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'categories', 'hotels'],
                    });
                }}
            />
        </AdminLayout>
    );
};

export default AdminHotels;
