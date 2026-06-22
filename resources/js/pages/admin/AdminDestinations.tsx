import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import LangBadge from '@/components/forms/LangBadge';
import { EntityFormDialog } from '@/components/forms/EntityFormDialog';
import { CategoryManager } from '@/components/admin/CategoryManager';
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
import { CountrySelect } from '@/components/ui/CountrySelect';

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
    categories: Array<{
        key: string;
        name: { en: string; fr: string; ar: string };
    }>,
    ...values: Array<unknown>
): string {
    const resolveFromCandidate = (candidate: string): string => {
        const trimmed = candidate.trim();
        if (!trimmed) return '';

        const byKey = categories.find((category) => category.key === trimmed);
        if (byKey) return byKey.key;

        const byName = categories.find((category) =>
            [category.name.en, category.name.fr, category.name.ar].some(
                (name) => typeof name === 'string' && name.trim() === trimmed,
            ),
        );
        if (byName) return byName.key;

        return categories.length === 0 ? trimmed : '';
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

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['admin', 'categories', 'destinations'],
        queryFn: () => fetchCategories('destinations'),
    });

    const dialogInitial = useMemo<DestinationFormValues | null>(() => {
        if (!editing) return null;

        const editingRecord = editing as unknown as Record<string, unknown>;

        return {
            ...editing,
            category_key: resolveCategoryKey(
                dbCategories,
                editingRecord.category_key,
                editingRecord.category,
                editingRecord.category_en,
                editingRecord.category_fr,
                editingRecord.category_ar,
            ),
            imagePath: asText(editingRecord.image),
            imageFile: null,
            galleryPaths: parseGallery(editingRecord.gallery),
            galleryFiles: [],
            highlights: Array.isArray(editingRecord.highlights)
                ? editingRecord.highlights
                : [],
        } as DestinationFormValues;
    }, [editing, dbCategories]);

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
                                        <CountrySelect
                                            value={asText(
                                                values[`country_${activeLang}`],
                                            )}
                                            onChange={(_code, names) => {
                                                setField(
                                                    'country_en',
                                                    names.en,
                                                );
                                                setField(
                                                    'country_fr',
                                                    names.fr,
                                                );
                                                setField(
                                                    'country_ar',
                                                    names.ar,
                                                );
                                            }}
                                        />
                                        {errors?.[`country_${activeLang}`] && (
                                            <p className="text-[10px] text-destructive">
                                                {errors[`country_${activeLang}`]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="category_key"
                                            className={
                                                errors?.category_key
                                                    ? 'text-destructive'
                                                    : 'text-muted-foreground'
                                            }
                                        >
                                            {t('admin.destinationForm.category')}
                                        </Label>
                                        <Select
                                            value={String(
                                                values.category_key ?? '',
                                            )}
                                            onValueChange={(val) =>
                                                setField('category_key', val)
                                            }
                                        >
                                            <SelectTrigger
                                                id="category_key"
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
                                        {errors?.category_key && (
                                            <p className="text-[10px] text-destructive">
                                                {errors.category_key}
                                            </p>
                                        )}
                                    </div>

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

                                    <div className="space-y-2">
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
                                            value={String(values.price ?? '')}
                                            onChange={(e) =>
                                                setField(
                                                    'price',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            placeholder="0.00"
                                            className={
                                                errors?.price
                                                    ? 'border-destructive ring-1 ring-destructive'
                                                    : ''
                                            }
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

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="destination-rating"
                                            className="text-muted-foreground"
                                        >
                                            {t('admin.destinationForm.rating')}
                                        </Label>
                                        <Input
                                            id="destination-rating"
                                            type="number"
                                            value={String(values.rating ?? '')}
                                            onChange={(e) =>
                                                setField(
                                                    'rating',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="5.0"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                'admin.destinationForm.ratingHelp',
                                            )}
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
                                {[
                                    {
                                        key: 'bestTime',
                                        placeholder: t(
                                            'admin.destinationForm.bestTimePlaceholder',
                                        ),
                                    },
                                    {
                                        key: 'language',
                                        placeholder: t(
                                            'admin.destinationForm.languagePlaceholder',
                                        ),
                                    },
                                    {
                                        key: 'currency',
                                        placeholder: t(
                                            'admin.destinationForm.currencyPlaceholder',
                                        ),
                                    },
                                    {
                                        key: 'weather',
                                        placeholder: t(
                                            'admin.destinationForm.weatherPlaceholder',
                                        ),
                                    },
                                ].map((field) => {
                                    const fieldKey = localizedKey(
                                        field.key,
                                        activeLang,
                                    );
                                    return (
                                        <div
                                            key={fieldKey}
                                            className="space-y-2"
                                        >
                                            <Label
                                                htmlFor={fieldKey}
                                                className="text-muted-foreground"
                                            >
                                                {t(
                                                    `admin.destinationForm.${field.key}`,
                                                )}
                                                <LangBadge lang={activeLang} />
                                            </Label>
                                            <Input
                                                id={fieldKey}
                                                value={String(
                                                    values[fieldKey] ?? '',
                                                )}
                                                onChange={(e) =>
                                                    setField(
                                                        fieldKey,
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={field.placeholder}
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
                    const categoryKey = resolveCategoryKey(
                        dbCategories,
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
                        highlights: Array.isArray(values.highlights)
                            ? values.highlights
                            : [],
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
