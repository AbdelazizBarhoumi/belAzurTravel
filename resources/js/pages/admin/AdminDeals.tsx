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
import { useCategoryTypes } from '@/hooks/useCategoryTypes';
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
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';

const title = { en: 'Deals', fr: 'Offres', ar: 'العروض' };
const subtitle = {
    en: 'Manage deals',
    fr: 'Gérer les offres',
    ar: 'إدارة العروض',
};

export default function AdminDeals() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const { settings: siteSettings } = useSiteSettings();
    const isCodeEnabled =
        siteSettings?.config?.navigation?.enabled_dropdowns?.includes('deals');
    const [open, setOpen] = useState(false);
    const [modalLang, setModalLang] = useState<Lang>('en');
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setErrors({});
            setEditing(null);
        }
        setOpen(nextOpen);
    };

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
                    deals: { images: filteredSlides, interval: heroInterval },
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
            if (error?.data?.errors) {
                const errs: Record<string, string> = {};
                for (const [k, v] of Object.entries(error.data.errors)) {
                    if (Array.isArray(v) && v.length > 0)
                        errs[k] = String(v[0]);
                }
                setErrors(errs);
                toast.error(t('admin.pleaseFixErrors'));
                return;
            }
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

    function resolveCategoryKey(...vals: unknown[]) {
        for (const v of vals) {
            if (typeof v === 'string' && v.trim() !== '') return v.trim();
            if (v && typeof v === 'object') {
                const r = v as Record<string, unknown>;
                for (const localized of [r.en, r.fr, r.ar]) {
                    if (
                        typeof localized === 'string' &&
                        localized.trim() !== ''
                    )
                        return localized.trim();
                }
            }
        }
        return '';
    }

    const dialogInitial = useMemo<AdminRow | null>(() => {
        if (!editing) return null;

        const resolvedDealCategory =
            resolveCategoryKey(
                editing.category_key,
                editing.category,
                editing.category_en,
                editing.category_fr,
                editing.category_ar,
            ) ||
            editing.category_key ||
            '';

        return {
            ...editing,
            category_key: resolvedDealCategory,
            category_en:
                editing.category_en ?? (editing.category as any)?.en ?? '',
            category_fr:
                editing.category_fr ?? (editing.category as any)?.fr ?? '',
            category_ar:
                editing.category_ar ?? (editing.category as any)?.ar ?? '',
            ...Object.fromEntries(
                categoryTypes.map((ct) => [
                    `category_${ct.key}`,
                    (editing as any).category_assignments?.[ct.key] ||
                        (ct.values.some((v) => v.key === resolvedDealCategory)
                            ? resolvedDealCategory
                            : ''),
                ]),
            ),
        } as AdminRow;
    }, [editing, categoryTypes]);

    const validate = (values: AdminRow) => {
        const errs: Record<string, string> = {};
        ['en', 'fr', 'ar'].forEach((l) => {
            if (!values[`title_${l}`])
                errs[`title_${l}`] = t('admin.fieldRequired');
            if (!values[`description_${l}`])
                errs[`description_${l}`] = t('admin.fieldRequired');
        });
        if (!values.discount_en) errs.discount_en = t('admin.fieldRequired');
        if (!values.expires_en) errs.expires_en = t('admin.fieldRequired');
        const hasCategory = categoryTypes.some((ct) => {
            const val = values[`category_${ct.key}`];
            return typeof val === 'string' && val.trim() !== '';
        });
        if (!hasCategory) errs.category_key = t('admin.fieldRequired');
        return errs;
    };

    function handleSave(values: AdminRow) {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

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

        const normalized: Record<string, unknown> = { ...cleanedPayload };

        const categoryAssignments: Record<string, string> = {};
        categoryTypes.forEach((ct) => {
            const val = values[`category_${ct.key}`];
            if (val && typeof val === 'string' && val !== '')
                categoryAssignments[ct.key] = val;
        });
        normalized.category_assignments = categoryAssignments;

        const selectedKey = Object.values(categoryAssignments)[0] || '';
        normalized.category_key =
            resolveCategoryKey(
                normalized.category_key,
                normalized.category,
                normalized.category_en,
                normalized.category_fr,
                normalized.category_ar,
            ) ||
            selectedKey ||
            '';
        normalized.category =
            String(normalized.category_key || '') ||
            String(normalized.category_en ?? '') ||
            '';

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

    const dealSections: SectionDef[] = [
        {
            title: t('deals.promotionDetails'),
            description: t('deals.promotionDescription'),
            columns: 2,
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    {categoryTypes.map((catType) => (
                        <div key={catType.key} className="space-y-2">
                            <label
                                htmlFor={`category-${catType.key}`}
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {catType.label[activeLang] || catType.label.en}
                            </label>
                            <Select
                                value={String(
                                    values[`category_${catType.key}`] || '',
                                )}
                                onValueChange={(val) =>
                                    setField(`category_${catType.key}`, val)
                                }
                            >
                                <SelectTrigger id={`category-${catType.key}`}>
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
                        <div className="space-y-2">
                            <label
                                htmlFor={`title_${activeLang}`}
                                className={`text-xs font-semibold ${errors[`title_${activeLang}`] ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                                {t('deals.titleLabel')}{' '}
                                <LangBadge lang={activeLang} />
                            </label>
                            <Input
                                id={`title_${activeLang}`}
                                value={String(
                                    values[`title_${activeLang}`] ?? '',
                                )}
                                placeholder={t('deals.placeholder.title')}
                                onChange={(e) =>
                                    setField(
                                        `title_${activeLang}`,
                                        e.target.value,
                                    )
                                }
                                className={
                                    errors[`title_${activeLang}`]
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
                            />
                            {errors[`title_${activeLang}`] && (
                                <p className="text-xs text-destructive">
                                    {errors[`title_${activeLang}`]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="discount_en"
                                className={`text-xs font-semibold ${errors.discount_en ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                                {t('deals.discountLabel')}
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="discount_en"
                                    type="text"
                                    value={String(values.discount_en ?? '')}
                                    placeholder="20%"
                                    onChange={(e) =>
                                        setField('discount_en', e.target.value)
                                    }
                                    className={
                                        errors.discount_en
                                            ? 'border-destructive ring-1 ring-destructive'
                                            : ''
                                    }
                                />
                                <span className="text-sm font-medium text-muted-foreground">
                                    %
                                </span>
                            </div>
                            {errors.discount_en && (
                                <p className="text-xs text-destructive">
                                    {errors.discount_en}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="expires_en"
                                className={`text-xs font-semibold ${errors.expires_en ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                                {t('deals.expiresLabel')}
                            </label>
                            <Input
                                id="expires_en"
                                type="text"
                                placeholder="2026-06-30"
                                value={String(values.expires_en ?? '')}
                                onChange={(e) =>
                                    setField('expires_en', e.target.value)
                                }
                                className={
                                    errors.expires_en
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
                            />
                            {errors.expires_en && (
                                <p className="text-xs text-destructive">
                                    {errors.expires_en}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: t('deals.description'),
            description: t('deals.descriptionLong'),
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-2">
                    <label
                        htmlFor={`description_${activeLang}`}
                        className={`text-xs font-semibold ${errors[`description_${activeLang}`] ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                        {t('deals.description')} <LangBadge lang={activeLang} />
                    </label>
                    <Textarea
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
                        className={
                            errors[`description_${activeLang}`]
                                ? 'border-destructive ring-1 ring-destructive'
                                : ''
                        }
                    />
                    {errors[`description_${activeLang}`] && (
                        <p className="text-xs text-destructive">
                            {errors[`description_${activeLang}`]}
                        </p>
                    )}
                </div>
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
                                {[
                                    t('deals.titleLabel'),
                                    t('deals.discountLabel'),
                                    t('deals.expiresLabel'),
                                    t('admin.category'),
                                    t('admin.actions'),
                                ].map((label) => (
                                    <th
                                        key={label}
                                        className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={String(row.id)}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td
                                        className={`px-4 py-3 text-sm ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                    >
                                        {String(
                                            (row as any)[`title_${lang}`] ??
                                                row.title_en ??
                                                '',
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold">
                                        {row.discount
                                            ? `${row.discount}%`
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {row.expires
                                            ? String(row.expires)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {String(
                                            row.category_en ??
                                                row.category ??
                                                '',
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(row);
                                                    setOpen(true);
                                                }}
                                                aria-label={t('actions.edit')}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPendingDelete(row)
                                                }
                                                aria-label={t('actions.delete')}
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
                    if (!isOpen) setPendingDelete(null);
                }}
                title={t('admin.deleteItemTitle')}
                description={
                    pendingDelete
                        ? `${t('admin.deleteItemPrompt')} "${String(pendingDelete.title_en ?? '')}"? ${t('admin.deleteItemWarning')}`
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

            <EntityFormDialog
                open={open}
                onOpenChange={handleOpenChange}
                title={
                    editing
                        ? `${t('actions.edit')} ${t('admin.deals')}`
                        : `${t('actions.add')} ${t('admin.deals')}`
                }
                sections={dealSections}
                initial={dialogInitial}
                onSubmit={(values) => handleSave(values as AdminRow)}
                errors={errors}
                languages={['en', 'fr', 'ar']}
                preserveArrayKeys={[
                    'highlights_en',
                    'highlights_fr',
                    'highlights_ar',
                    'terms_en',
                    'terms_fr',
                    'terms_ar',
                ]}
                activeLang={modalLang}
                onActiveLangChange={setModalLang}
                isSubmitting={saveMutation.isPending}
            />
        </AdminLayout>
    );
}
