import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
} from '@/api/admin.api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EntityFormDialog, type SectionDef } from '@/components/forms/EntityFormDialog';
import LangBadge from '@/components/forms/LangBadge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { cn } from '@/lib/utils';
import { LocationSelect } from '@/components/ui/LocationSelect';
import { countryCodeToFlag } from '@/lib/flagEmoji';
import { VISA_REGIONS, getLocalizedLabel } from '@/data/adminSelectOptions';

type VisaLang = 'en' | 'fr' | 'ar';

interface AdminVisa {
    id: string;
    code: string;
    name: string;
    name_en: string;
    name_fr: string;
    name_ar: string;
    flag: string;
    region: string;
    region_en: string;
    region_fr: string;
    region_ar: string;
    processing: string;
    processing_en: string;
    processing_fr: string;
    processing_ar: string;
    price: number;
    is_active: boolean;
    sort_order: number;
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
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminVisa | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminVisa | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

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

        const regionKey = (() => {
            const raw = editing.region_en || editing.region || '';
            if (VISA_REGIONS.some((r) => r.value === raw)) return raw;
            const match = VISA_REGIONS.find(
                (r) => r.label.en === raw || r.label.fr === raw || r.label.ar === raw,
            );
            return match?.value || raw;
        })();

        return {
            id: editing.id,
            code: editing.code,
            name_en: editing.name_en,
            name_fr: editing.name_fr,
            name_ar: editing.name_ar,
            flag: editing.flag,
            region: regionKey,
            processing: editing.processing_en || editing.processing || '',
            price: editing.price,
            is_active: editing.is_active,
            sort_order: editing.sort_order,
        };
    }, [editing]);

    const validate = (values: VisaFormValues): Record<string, string> => {
        const errs: Record<string, string> = {};
        const langs: VisaLang[] = ['en', 'fr', 'ar'];

        langs.forEach((l) => {
            if (!values[`name_${l}`]) errs[`name_${l}`] = t('admin.errors.required');
        });

        if (!values.code) errs.code = t('admin.errors.required');
        if (!values.flag) errs.flag = t('admin.errors.required');
        if (!values.region) errs.region = t('admin.errors.required');
        if (!values.processing) errs.processing = t('admin.errors.required');
        if (!values.price || Number(values.price) < 0) errs.price = t('admin.errors.required');

        return errs;
    };

    const handleDialogSubmit = (values: VisaFormValues) => {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        const regionKey = String(values.region || '').trim();
        const regionOption = VISA_REGIONS.find((r) => r.value === regionKey);

        const payload: AdminVisa = {
            id: (values.id as string) || (editing?.id ?? ''),
            code: String(values.code).trim(),
            name: firstNonEmpty(values.name_en, values.name_fr, values.name_ar),
            name_en: firstNonEmpty(values.name_en),
            name_fr: firstNonEmpty(values.name_fr),
            name_ar: firstNonEmpty(values.name_ar),
            flag: String(values.flag).trim(),
            region: regionOption?.label.en || regionKey,
            region_en: regionOption?.label.en || regionKey,
            region_fr: regionOption?.label.fr || regionKey,
            region_ar: regionOption?.label.ar || regionKey,
            processing: firstNonEmpty(values.processing),
            processing_en: firstNonEmpty(values.processing),
            processing_fr: firstNonEmpty(values.processing),
            processing_ar: firstNonEmpty(values.processing),
            price: Number(values.price),
            is_active: values.is_active !== false,
            sort_order: Number(values.sort_order) || 0,
        };

        saveMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(editing ? t('admin.visaUpdated') : t('admin.visaAdded'));
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
            render: ({ values, setField, activeLang, errors: dialogErrors }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label
                                className={dialogErrors?.code ? 'text-destructive' : 'text-muted-foreground'}
                            >
                                {t('admin.visaForm.country')}
                            </Label>
                            <LocationSelect
                                value={String(values.code ?? '')}
                                onChange={(val) => {
                                    setField('code', val);
                                    setField('flag', countryCodeToFlag(val));
                                    setField('name_en', val);
                                    setField('name_fr', val);
                                    setField('name_ar', val);
                                }}
                                lang={lang}
                                placeholder={t('admin.visaForm.selectCountry')}
                                countryOnly
                            />
                            {dialogErrors?.code && (
                                <p className="text-[10px] text-destructive">{dialogErrors.code}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="visa-flag"
                                className={dialogErrors?.flag ? 'text-destructive' : 'text-muted-foreground'}
                            >
                                {t('admin.visaForm.flag')}
                            </Label>
                            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                                <span className="text-2xl">{String(values.flag ?? '')}</span>
                                <span className="text-muted-foreground text-xs">
                                    {values.code ? `${values.code}` : t('admin.visaForm.flagAuto')}
                                </span>
                            </div>
                            {dialogErrors?.flag && (
                                <p className="text-[10px] text-destructive">{dialogErrors.flag}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor={localizedKey('name', activeLang as VisaLang)}
                                className={dialogErrors?.[`name_${activeLang}`] ? 'text-destructive' : 'text-muted-foreground'}
                            >
                                {t('admin.visaForm.name')}
                                <LangBadge lang={activeLang} />
                            </Label>
                            <Input
                                id={localizedKey('name', activeLang as VisaLang)}
                                value={asText(values[`name_${activeLang}`])}
                                onChange={(e) => setField(`name_${activeLang}`, e.target.value)}
                                placeholder={t('admin.visaForm.namePlaceholder')}
                                className={dialogErrors?.[`name_${activeLang}`] ? 'border-destructive ring-1 ring-destructive' : ''}
                            />
                            {dialogErrors?.[`name_${activeLang}`] && (
                                <p className="text-[10px] text-destructive">{dialogErrors[`name_${activeLang}`]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                className={dialogErrors?.region ? 'text-destructive' : 'text-muted-foreground'}
                            >
                                {t('admin.visaForm.region')}
                            </Label>
                            <Select
                                value={String(values.region ?? '')}
                                onValueChange={(val) => setField('region', val)}
                            >
                                <SelectTrigger className={dialogErrors?.region ? 'border-destructive ring-1 ring-destructive' : ''}>
                                    <SelectValue placeholder={t('admin.visaForm.regionPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {VISA_REGIONS.map((region) => (
                                        <SelectItem key={region.value} value={region.value}>
                                            {getLocalizedLabel(region, lang as 'en' | 'fr' | 'ar')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {dialogErrors?.region && (
                                <p className="text-[10px] text-destructive">{dialogErrors.region}</p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label
                                className={dialogErrors?.processing ? 'text-destructive' : 'text-muted-foreground'}
                            >
                                {t('admin.visaForm.processing')}
                            </Label>
                            <Input
                                value={String(values.processing ?? '')}
                                onChange={(e) => setField('processing', e.target.value)}
                                placeholder={t('admin.visaForm.processingPlaceholder')}
                                className={dialogErrors?.processing ? 'border-destructive ring-1 ring-destructive' : ''}
                            />
                            {dialogErrors?.processing && (
                                <p className="text-[10px] text-destructive">{dialogErrors.processing}</p>
                            )}
                        </div>
                    </div>
                </div>
            ),
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
                                className={dialogErrors?.price ? 'text-destructive' : 'text-muted-foreground'}
                            >
                                {t('admin.visaForm.price')} (DT)
                            </Label>
                            <Input
                                id="visa-price"
                                type="number"
                                value={String(values.price ?? '')}
                                onChange={(e) => setField('price', Number(e.target.value))}
                                min={0}
                                placeholder="280"
                                className={dialogErrors?.price ? 'border-destructive ring-1 ring-destructive' : ''}
                            />
                            {dialogErrors?.price && (
                                <p className="text-[10px] text-destructive">{dialogErrors.price}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="visa-sort" className="text-muted-foreground">
                                {t('admin.visaForm.sortOrder')}
                            </Label>
                            <Input
                                id="visa-sort"
                                type="number"
                                value={String(values.sort_order ?? 0)}
                                onChange={(e) => setField('sort_order', Number(e.target.value))}
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
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    t('admin.visaTable.flag'),
                                    t('admin.visaTable.name'),
                                    t('admin.visaTable.region'),
                                    t('admin.visaTable.processing'),
                                    t('admin.visaTable.price'),
                                    t('admin.visaTable.active'),
                                    t('admin.visaTable.actions'),
                                ].map((h, i) => (
                                    <th
                                        key={h}
                                        className={cn(
                                            'px-4 py-3 text-xs font-semibold uppercase text-muted-foreground',
                                            i <= 4
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
                                    <td className="px-4 py-3 text-center text-2xl">{v.flag}</td>
                                    <td className={cn(
                                        'px-4 py-3 text-sm font-semibold',
                                        dir === 'rtl' ? 'text-right' : 'text-left',
                                    )}>
                                        <div>
                                            <span>{v[`${lang}_en`] || v.name}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">({v.code})</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                        {(() => {
                                            const regionKey = v.region_en || v.region || '';
                                            const regionOption = VISA_REGIONS.find((r) => r.value === regionKey);
                                            return regionOption ? getLocalizedLabel(regionOption, lang as 'en' | 'fr' | 'ar') : regionKey;
                                        })()}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                        {v[`${lang}_processing`] || v.processing}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-bold text-secondary">
                                        {v.price} DT
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={cn(
                                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                            v.is_active
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-muted text-muted-foreground',
                                        )}>
                                            {v.is_active ? t('admin.visaForm.active') : t('admin.visaForm.inactive')}
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
                                                onClick={() => setPendingDelete(v)}
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
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
                initial={dialogInitial}
                sections={visaSections}
                onSubmit={handleDialogSubmit}
            />
        </AdminLayout>
    );
};

export default AdminVisas;
