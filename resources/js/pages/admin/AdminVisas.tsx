import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Edit,
    Plus,
    Trash2,
    Image as ImageIcon,
    Save,
    Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
} from '@/api/admin.api';
import type { PageHeroSlide } from '@/api/siteSettings.api';
import { HeroImagesManager } from '@/components/admin/HeroImagesManager';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
    EntityFormDialog,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cn } from '@/lib/utils';
import { LocationSelect } from '@/components/ui/LocationSelect';
import { findCountryByCodeOrEnglishName } from '@/data/locations';
import { countryCodeToFlag } from '@/lib/flagEmoji';

type VisaLang = 'en' | 'fr' | 'ar';

interface AdminVisa {
    id: string;
    code: string;
    name: string;
    name_en: string;
    name_fr: string;
    name_ar: string;
    flag: string;
    processing: string;
    processing_en: string;
    processing_fr: string;
    processing_ar: string;
    price: number;
    is_active: boolean;
    sort_order: number;
    date_from?: string;
    date_to?: string;
}

type VisaFormValues = Record<string, unknown> & {
    id?: string;
    code?: string;
    flag?: string;
    price?: number;
    is_active?: boolean;
    sort_order?: number;
};

function localizedKey(base: string, lang: VisaLang): string {
    return `${base}_${lang}`;
}

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function firstNonEmpty(...values: unknown[]): string {
    for (const value of values) {
        if (typeof value !== 'string') continue;
        const trimmed = value.trim();
        if (trimmed !== '') return trimmed;
    }
    return '';
}

const AdminVisas = () => {
    useAdminGuard();
    const queryClient = useQueryClient();
    const { t, lang, dir } = useLanguage();
    const { settings: siteSettings } = useSiteSettings();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminVisa | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminVisa | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Hero images state
    const existingHeroConfig = siteSettings?.content?.page_heroes?.visas;
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
                    visas: {
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

    const { data: visas = [] } = useQuery({
        queryKey: ['admin', 'visas'],
        queryFn: () => listAdminEntities<AdminVisa>('visas'),
    });

    const saveMutation = useMutation({
        mutationFn: (item: AdminVisa) => saveAdminEntity('visas', item),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('visas', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });

    const dialogInitial = useMemo<VisaFormValues | null>(() => {
        if (!editing) return null;

        return {
            id: editing.id,
            code: editing.code,
            name_en: editing.name_en,
            name_fr: editing.name_fr,
            name_ar: editing.name_ar,
            flag: editing.flag,
            processing: editing.processing_en || editing.processing || '',
            price: editing.price,
            is_active: editing.is_active,
            sort_order: editing.sort_order,
        };
    }, [editing]);

    const validate = (values: VisaFormValues): Record<string, string> => {
        const errs: Record<string, string> = {};
        const langs: VisaLang[] = ['fr'];

        langs.forEach((l) => {
            if (!values[`name_${l}`])
                errs[`name_${l}`] = t('admin.errors.required');
        });

        if (!values.code) errs.code = t('admin.errors.required');
        if (!values.flag) errs.flag = t('admin.errors.required');
        if (!values.price || Number(values.price) < 0)
            errs.price = t('admin.errors.required');

        return errs;
    };

    const handleDialogSubmit = (values: VisaFormValues) => {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        const payload: AdminVisa = {
            id: (values.id as string) || (editing?.id ?? ''),
            code: String(values.code).trim(),
            name: firstNonEmpty(values.name_en, values.name_fr, values.name_ar),
            name_en: firstNonEmpty(values.name_en),
            name_fr: firstNonEmpty(values.name_fr),
            name_ar: firstNonEmpty(values.name_ar),
            flag: String(values.flag).trim(),
            processing: firstNonEmpty(values.processing),
            processing_en: firstNonEmpty(values.processing),
            processing_fr: firstNonEmpty(values.processing),
            processing_ar: firstNonEmpty(values.processing),
            price: Number(values.price),
            is_active: values.is_active !== false,
            sort_order: Number(values.sort_order) || 0,
            date_from: String(values.dateFrom ?? ''),
            date_to: String(values.dateTo ?? ''),
        };

        saveMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(
                    editing ? t('admin.visaUpdated') : t('admin.visaAdded'),
                );
                setOpen(false);
                setEditing(null);
                setErrors({});
            },
        });
    };

    const visaSections: SectionDef[] = [
        {
            title: t('admin.visaForm.details'),
            description: t('admin.visaForm.detailsHint'),
            columns: 2,
            render: ({
                values,
                setField,
                activeLang,
                errors: dialogErrors,
            }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label
                                className={
                                    dialogErrors?.code
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                }
                            >
                                {t('admin.visaForm.country')}
                            </Label>
                            <LocationSelect
                                value={String(values.code ?? '')}
                                onChange={(val) => {
                                    setField('code', val);
                                    // LocationSelect passes the English country name;
                                    // look up its ISO code to generate the flag emoji
                                    const match =
                                        findCountryByCodeOrEnglishName(val);
                                    setField(
                                        'flag',
                                        countryCodeToFlag(match?.code ?? val),
                                    );
                                    setField('name_en', val);
                                    setField('name_fr', val);
                                    setField('name_ar', val);
                                }}
                                lang={lang}
                                placeholder={t('admin.visaForm.selectCountry')}
                                countryOnly
                            />
                            {dialogErrors?.code && (
                                <p className="text-[10px] text-destructive">
                                    {dialogErrors.code}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="visa-flag"
                                className={
                                    dialogErrors?.flag
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                }
                            >
                                {t('admin.visaForm.flag')}
                            </Label>
                            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                                <span className="text-2xl">
                                    {String(values.flag ?? '')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {values.code
                                        ? `${values.code}`
                                        : t('admin.visaForm.flagAuto')}
                                </span>
                            </div>
                            {dialogErrors?.flag && (
                                <p className="text-[10px] text-destructive">
                                    {dialogErrors.flag}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor={localizedKey(
                                    'name',
                                    activeLang as VisaLang,
                                )}
                                className={
                                    dialogErrors?.[`name_${activeLang}`]
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                }
                            >
                                {t('admin.visaForm.name')}
                            </Label>
                            <Input
                                id={localizedKey(
                                    'name',
                                    activeLang as VisaLang,
                                )}
                                value={asText(values[`name_${activeLang}`])}
                                onChange={(e) =>
                                    setField(
                                        `name_${activeLang}`,
                                        e.target.value,
                                    )
                                }
                                placeholder={t(
                                    'admin.visaForm.namePlaceholder',
                                )}
                                className={
                                    dialogErrors?.[`name_${activeLang}`]
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
                            />
                            {dialogErrors?.[`name_${activeLang}`] && (
                                <p className="text-[10px] text-destructive">
                                    {dialogErrors[`name_${activeLang}`]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label
                                className={
                                    dialogErrors?.processing
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                }
                            >
                                {t('admin.visaForm.processing')}
                            </Label>
                            <Input
                                value={String(values.processing ?? '')}
                                onChange={(e) =>
                                    setField('processing', e.target.value)
                                }
                                placeholder={t(
                                    'admin.visaForm.processingPlaceholder',
                                )}
                                className={
                                    dialogErrors?.processing
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
                            />
                            {dialogErrors?.processing && (
                                <p className="text-[10px] text-destructive">
                                    {dialogErrors.processing}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.dateRange'),
            fields: [
                {
                    key: 'dateFrom',
                    label: t('admin.dateRange'),
                    type: 'daterange',
                },
            ],
        },
        {
            title: t('admin.visaForm.pricingAndSettings'),
            description: t('admin.visaForm.pricingAndSettingsHint'),
            columns: 2,
            render: ({ values, setField, errors: dialogErrors }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label
                                htmlFor="visa-price"
                                className={
                                    dialogErrors?.price
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                }
                            >
                                {t('admin.visaForm.price')}
                            </Label>
                            <Input
                                id="visa-price"
                                type="number"
                                value={String(values.price ?? '')}
                                onChange={(e) =>
                                    setField('price', Number(e.target.value))
                                }
                                min={0}
                                placeholder="280"
                                className={
                                    dialogErrors?.price
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
                            />
                            {dialogErrors?.price && (
                                <p className="text-[10px] text-destructive">
                                    {dialogErrors.price}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="visa-sort"
                                className="text-muted-foreground"
                            >
                                {t('admin.visaForm.sortOrder')}
                            </Label>
                            <Input
                                id="visa-sort"
                                type="number"
                                value={String(values.sort_order ?? 0)}
                                onChange={(e) =>
                                    setField(
                                        'sort_order',
                                        Number(e.target.value),
                                    )
                                }
                                min={0}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Switch
                            checked={values.is_active !== false}
                            onCheckedChange={(v) => setField('is_active', v)}
                        />
                        <Label className="text-sm font-medium text-muted-foreground">
                            {t('admin.visaForm.active')}
                        </Label>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout
            title={t('admin.visas')}
            subtitle={t('admin.visasSubtitle')}
            actions={
                <Button
                    onClick={() => {
                        setEditing(null);
                        setOpen(true);
                    }}
                    className="gap-2 bg-primary text-primary-foreground"
                >
                    <Plus className="h-4 w-4" /> {t('actions.add')}
                </Button>
            }
        >
            {/* Hero Images Section */}
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
                        {isHeroSaving ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Save className="mr-1 h-3.5 w-3.5" />
                        )}{' '}
                        {t('admin.settings.save')}
                    </Button>
                </div>
                <HeroImagesManager
                    pageKey="visas"
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
                                    t('admin.visaTable.flag'),
                                    t('admin.visaTable.name'),
                                    t('admin.visaTable.processing'),
                                    t('admin.visaTable.price'),
                                    t('admin.visaTable.active'),
                                    t('admin.visaTable.actions'),
                                ].map((h, i) => (
                                    <th
                                        key={h}
                                        className={cn(
                                            'px-4 py-3 text-xs font-semibold uppercase text-muted-foreground',
                                            i <= 3
                                                ? dir === 'rtl'
                                                    ? 'text-right'
                                                    : 'text-left'
                                                : 'text-center',
                                        )}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visas.map((v) => (
                                <tr
                                    key={v.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 text-center text-2xl">
                                        {v.flag}
                                    </td>
                                    <td
                                        className={cn(
                                            'px-4 py-3 text-sm font-semibold',
                                            dir === 'rtl'
                                                ? 'text-right'
                                                : 'text-left',
                                        )}
                                    >
                                        <div>
                                            <span>
                                                {v[`${lang}_en`] || v.name}
                                            </span>
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({v.code})
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                        {v[`${lang}_processing`] ||
                                            v.processing}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-bold text-secondary">
                                        {v.price} DT
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                                v.is_active
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            {v.is_active
                                                ? t('admin.visaForm.active')
                                                : t('admin.visaForm.inactive')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(v);
                                                    setOpen(true);
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPendingDelete(v)
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
                    if (!isOpen) setPendingDelete(null);
                }}
                title={t('admin.deleteItemTitle')}
                description={
                    pendingDelete
                        ? `${t('admin.deleteItemPrompt')} "${pendingDelete.name}"? ${t('admin.deleteItemWarning')}`
                        : ''
                }
                confirmText={t('actions.delete')}
                cancelText={t('actions.cancel')}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    deleteMutation.mutate(pendingDelete.id);
                    setPendingDelete(null);
                }}
            />

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
                    editing ? t('admin.visaEditTitle') : t('admin.visaAddTitle')
                }
                subtitle={t('admin.visaForm.helper')}
                languages={['fr']}
                layout="grid-2"
                initial={dialogInitial}
                sections={visaSections}
                onSubmit={handleDialogSubmit}
            />
        </AdminLayout>
    );
};

export default AdminVisas;
