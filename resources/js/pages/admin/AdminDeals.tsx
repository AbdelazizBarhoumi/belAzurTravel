import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Settings, X, Image, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import {
    EntityFormDialog,
    type FieldDef,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';
import { localizeAdminValue } from '@/lib/adminI18n';

type Copy = Record<Lang, string>;

const copy = (en: string, fr: string, ar: string): Copy => ({ en, fr, ar });

function localizedFields(base: string, label: Copy, type?: FieldDef['type']) {
    return [
        { key: `${base}_en`, label: label.en, type, required: true },
        { key: `${base}_fr`, label: label.fr, type, required: true },
        { key: `${base}_ar`, label: label.ar, type, required: true },
    ];
}

const title = {
    en: 'Deals',
    fr: 'Offres',
    ar: 'العروض',
};
const subtitle = {
    en: 'Manage deals',
    fr: 'Gérer les offres',
    ar: 'إدارة العروض',
};

const columns: Array<{ key: string; label: Record<Lang, string> }> = [
    { key: 'title', label: { en: 'Title', fr: 'Titre', ar: 'العنوان' } },
    {
        key: 'discount',
        label: { en: 'Discount', fr: 'Remise', ar: 'الخصم' },
    },
    {
        key: 'expires',
        label: { en: 'Expires', fr: 'Expiration', ar: 'ينتهي' },
    },
    {
        key: 'category',
        label: { en: 'Category', fr: 'Catégorie', ar: 'الفئة' },
    },
];

export default function AdminDeals() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const { settings: siteSettings } = useSiteSettings();
    const isCodeEnabled =
        siteSettings?.config?.navigation?.enabled_dropdowns?.includes('deals');
    const [open, setOpen] = useState(false);
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    // Hero images state
    const existingHeroConfig = siteSettings?.content?.page_heroes?.deals;
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
                    deals: {
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

    const queryKey = useMemo(() => ['admin', 'deals'], []);
    const { data: categoryTypes = [] } = useCategoryTypes('deals');
    const { data: rows = [] } = useQuery<AdminRow[]>({
        queryKey,
        queryFn: async () => {
            const data = (await listAdminEntities<AdminRow>(
                'deals',
            )) as unknown as AdminRow[] | { data?: AdminRow[] };
            return Array.isArray(data) ? data : (data.data ?? []);
        },
    });

    const saveMutation = useMutation({
        mutationFn: (row: AdminRow) => saveAdminEntity('deals', row),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
        onError: (error: any) => {
            // Extract validation errors from the Laravel 422 response when possible
            if (error && error.data && error.data.errors) {
                const errs: Record<string, string> = {};
                for (const [k, v] of Object.entries(error.data.errors)) {
                    if (Array.isArray(v) && v.length > 0)
                        errs[k] = String(v[0]);
                }
                setErrors(errs);
                toast.error(t('admin.pleaseFixErrors'));
                return;
            }

            // Generic fallback
            console.error('Save failed', error);
            toast.error(t('admin.failedToSave') ?? 'Failed to save');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('deals', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    function firstNonEmpty(...vals: unknown[]) {
        for (const v of vals) {
            if (typeof v === 'string' && v.trim() !== '') return v;
            if (v && typeof v === 'object' && 'en' in v) return (v as any).en;
        }
        return '';
    }

    function resolveCategoryKey(...vals: unknown[]) {
        const candidates = vals
            .flatMap((v) => {
                if (typeof v === 'string' && v.trim() !== '') return [v.trim()];
                if (v && typeof v === 'object') {
                    const record = v as Record<string, unknown>;
                    return [record.en, record.fr, record.ar]
                        .filter(
                            (item): item is string =>
                                typeof item === 'string' && item.trim() !== '',
                        )
                        .map((item) => item.trim());
                }
                return [];
            })
            .filter(Boolean);

        return candidates[0] ?? '';
    }

    const dialogInitial = useMemo<AdminRow | null>(() => {
        if (!editing) return null;

        return {
            ...editing,
            category_key: resolveCategoryKey(
                editing.category_key,
                editing.category,
                editing.category_en,
                editing.category_fr,
                editing.category_ar,
            ) || editing.category_key || '',
            category_en:
                editing.category_en ??
                (editing.category && (editing.category as any).en) ??
                '',
            category_fr:
                editing.category_fr ??
                (editing.category && (editing.category as any).fr) ??
                '',
            category_ar:
                editing.category_ar ??
                (editing.category && (editing.category as any).ar) ??
                '',
            ...Object.fromEntries(
                categoryTypes.map((ct) => [
                    `category_${ct.key}`,
                    (editing as any).category_assignments?.[ct.key] || '',
                ]),
            ),
        } as AdminRow;
    }, [editing, categoryTypes]);

    const validate = (values: AdminRow) => {
        const errs: Record<string, string> = {};
        ['en', 'fr', 'ar'].forEach((lang) => {
            if (!values[`title_${lang}`])
                errs[`title_${lang}`] = t('admin.fieldRequired');
            if (!values[`description_${lang}`])
                errs[`description_${lang}`] = t('admin.fieldRequired');
        });
        if (!values.discount_en) errs.discount_en = t('admin.fieldRequired');
        if (!values.expires_en) errs.expires_en = t('admin.fieldRequired');
        if (!values.category_en) errs.category_en = t('admin.fieldRequired');
        return errs;
    };

    function handleSave(values: AdminRow) {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        // Filter out empty items from highlights and terms arrays
        const cleanedPayload = Object.entries(values).reduce(
            (acc, [key, val]) => {
                if (
                    [
                        'highlights_en',
                        'highlights_fr',
                        'highlights_ar',
                        'terms_en',
                        'terms_fr',
                        'terms_ar',
                    ].includes(key) &&
                    Array.isArray(val)
                ) {
                    acc[key] = (val as string[]).filter(
                        (item) => item.trim() !== '',
                    );
                } else {
                    acc[key] = val;
                }
                return acc;
            },
            {} as Record<string, unknown>,
        );

        // Normalize category fields so backend receives a consistent canonical value
        const normalized: Record<string, unknown> = { ...cleanedPayload };
        const resolvedCategoryKey =
            (normalized.category_key as string | null | undefined) ??
            resolveCategoryKey(
                normalized.category,
                normalized.category_en,
                normalized.category_fr,
                normalized.category_ar,
            ) ??
            (typeof normalized.category_en === 'string'
                ? normalized.category_en
                : typeof normalized.category === 'string'
                  ? normalized.category
                  : null);

        normalized.category_key = resolvedCategoryKey;

        // Add category assignments
        const categoryAssignments: Record<string, string> = {};
        categoryTypes.forEach((ct) => {
            const val = values[`category_${ct.key}`];
            if (val && typeof val === 'string' && val !== '') {
                categoryAssignments[ct.key] = val;
            }
        });
        normalized.category_assignments = categoryAssignments;

        saveMutation.mutate(
            { ...(normalized as AdminRow), id: editing?.id ?? '' } as AdminRow,
            {
                onSuccess: () => {
                    toast.success(
                        editing ? t('actions.saved') : t('actions.added'),
                    );
                    setEditing(null);
                    setOpen(false);
                    setErrors({});
                },
            },
        );
    }

    const DynamicListInput = ({
        label,
        baseKey,
        values,
        setField,
        activeLang,
        languages,
    }: {
        label: string;
        baseKey: string;
        values: Record<Lang, string[] | string>;
        setField: (key: string, value: unknown) => void;
        activeLang: Lang;
        languages: Lang[];
    }) => {
        const safeValues = useMemo(() => {
            const normalized: Record<Lang, string[]> = {
                en: [],
                fr: [],
                ar: [],
            };
            languages.forEach((l) => {
                const raw: unknown = values[l];
                if (Array.isArray(raw)) {
                    normalized[l] = raw;
                } else if (typeof raw === 'string' && raw.length > 0) {
                    normalized[l] = [raw]; // Fallback for legacy string data
                } else {
                    normalized[l] = [];
                }
            });
            return normalized;
        }, [values, languages]);

        const activeValues = safeValues[activeLang] || [];
        const maxCount = Math.max(
            ...languages.map((l) => (safeValues[l] || []).length),
        );

        const addItem = () => {
            languages.forEach((lang) => {
                const current = safeValues[lang] || [];
                setField(`${baseKey}_${lang}`, [...current, '']);
            });
        };

        const updateItem = (index: number, val: string) => {
            const current = safeValues[activeLang] || [];
            const next = [...current];
            next[index] = val;
            setField(`${baseKey}_${activeLang}`, next);
        };

        const removeItem = (index: number) => {
            languages.forEach((lang) => {
                const current = safeValues[lang] || [];
                setField(
                    `${baseKey}_${lang}`,
                    current.filter((_, i) => i !== index),
                );
            });
        };

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-muted-foreground">
                        {label}
                    </Label>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addItem}
                    >
                        <Plus className="mr-2 h-4 w-4" /> $
                        {t('admin.settings.addItem')}
                    </Button>
                </div>
                <div className="space-y-3">
                    {Array.from({ length: maxCount }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                placeholder={`Item ${i + 1}`}
                                value={activeValues[i] || ''}
                                onChange={(e) => updateItem(i, e.target.value)}
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => removeItem(i)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const dealSections: SectionDef[] = [
        {
            title: t('deals.promotionDetails'),
            description: t('deals.promotionDescription'),
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
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
                                    className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-sm`}
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

                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            {
                                key: `title_${activeLang}`,
                                label: t('deals.titleLabel'),
                            },
                            {
                                key: `discount_${activeLang}`,
                                label: t('deals.discountLabel'),
                            },
                            {
                                key: `expires_${activeLang}`,
                                label: t('deals.expiresLabel'),
                            },
                        ].map((f) => (
                            <div key={f.key} className="space-y-2">
                                <label
                                    htmlFor={f.key}
                                    className={`text-xs font-semibold ${errors[f.key] ? 'text-destructive' : 'text-muted-foreground'}`}
                                >
                                    {f.label}
                                    <LangBadge lang={activeLang} />
                                </label>
                                <input
                                    id={f.key}
                                    placeholder={
                                        f.key.startsWith('title_')
                                            ? t('deals.placeholder.title')
                                            : f.key.startsWith('discount_')
                                              ? t(
                                                    'deals.placeholder.discount',
                                                )
                                              : f.key.startsWith('expires_')
                                                ? t(
                                                      'deals.placeholder.expires',
                                                  )
                                                : ''
                                    }
                                    value={String(values[f.key] ?? '')}
                                    onChange={(e) =>
                                        setField(f.key, e.target.value)
                                    }
                                    className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ${errors[f.key] ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                />
                                {errors[f.key] && (
                                    <p className="text-xs text-destructive">
                                        {errors[f.key]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            title: t('deals.description'),
            description: t('deals.descriptionLong'),
            render: ({ values, setField, activeLang }) => {
                const key = `description_${activeLang}`;
                return (
                    <div className="space-y-2">
                        <label
                            htmlFor={key}
                            className={`text-xs font-semibold ${errors[key] ? 'text-destructive' : 'text-muted-foreground'}`}
                        >
                            {t('deals.description')}
                            <LangBadge lang={activeLang} />
                        </label>
                        <textarea
                            id={key}
                            value={String(values[key] ?? '')}
                            onChange={(e) => setField(key, e.target.value)}
                            className={`min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ${errors[key] ? 'border-destructive ring-1 ring-destructive' : ''}`}
                        />
                        {errors[key] && (
                            <p className="text-xs text-destructive">
                                {errors[key]}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            title: t('dealDetail.highlights'),
            render: ({ values, setField, activeLang, languages }) => (
                <DynamicListInput
                    label={t('dealDetail.highlights')}
                    baseKey="highlights"
                    values={{
                        en: (values['highlights_en'] as string[]) || [],
                        fr: (values['highlights_fr'] as string[]) || [],
                        ar: (values['highlights_ar'] as string[]) || [],
                    }}
                    setField={setField}
                    activeLang={activeLang}
                    languages={languages}
                />
            ),
        },
        {
            title: t('dealDetail.terms'),
            render: ({ values, setField, activeLang, languages }) => (
                <DynamicListInput
                    label={t('dealDetail.terms')}
                    baseKey="terms"
                    values={{
                        en: (values['terms_en'] as string[]) || [],
                        fr: (values['terms_fr'] as string[]) || [],
                        ar: (values['terms_ar'] as string[]) || [],
                    }}
                    setField={setField}
                    activeLang={activeLang}
                    languages={languages}
                />
            ),
        },
    ];

    return (
        <AdminLayout
            title={title[lang]}
            subtitle={subtitle[lang]}
            actions={
                <div className="flex gap-2">
                    {isCodeEnabled && (
                        <Button
                            variant="outline"
                            onClick={() => setCatManagerOpen(true)}
                            className="gap-2"
                        >
                            <Settings className="h-4 w-4" />{' '}
                            {t('deals.manageCategories')}
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
            <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Image className="h-4 w-4 text-muted-foreground" />
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
                    pageKey="deals"
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
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground"
                                    >
                                        {column.label[lang]}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground">
                                    {t('admin.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row: AdminRow) => (
                                <tr
                                    key={String(row.id)}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`max-w-64 truncate px-4 py-3 text-sm ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                        >
                                            {column.key === 'code'
                                                ? String(row[column.key] ?? '')
                                                : localizeAdminValue(
                                                      row,
                                                      column.key,
                                                      lang,
                                                  )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-center">
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
                        ? `${t('admin.deleteItemPrompt')} “${String(pendingDelete.title_en ?? '')}”? ${t('admin.deleteItemWarning')}`
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

            <CategoryTypeManager
                entityType="deals"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'category-types', 'deals'],
                    });
                }}
            />
        </AdminLayout>
    );
}
