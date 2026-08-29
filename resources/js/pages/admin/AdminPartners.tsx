import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Settings, Search } from 'lucide-react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { ImagePicker } from '@/components/ui/ImagePicker';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
} from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import type { SectionDef } from '@/components/forms/EntityFormDialog';
import { EntityFormDialog } from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/api/entities.api';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import type { AdminPartner } from '@/types/admin';
import { fetchCategories } from '@/api/categories.api';
import { CategoryManager } from '@/components/admin/CategoryManager';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const PARTNER_LANGUAGES: Lang[] = ['fr'];

type PartnerFormValues = {
    name: { en: string; fr: string; ar: string };
    description: { en: string; fr: string; ar: string };
    website: string;
    category: string;
    imageFile?: File | null;
    imagePath?: string;
};

function normalizeLocalizedText(value: unknown): {
    en: string;
    fr: string;
    ar: string;
} {
    if (typeof value === 'object' && value !== null) {
        const record = value as Record<string, unknown>;
        return {
            en: typeof record.en === 'string' ? record.en : '',
            fr: typeof record.fr === 'string' ? record.fr : '',
            ar: typeof record.ar === 'string' ? record.ar : '',
        };
    }
    return { en: '', fr: '', ar: '' };
}

const AdminPartners = () => {
    useAdminGuard();
    const queryClient = useQueryClient();
    const { t, dir, lang } = useLanguage();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminPartner | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminPartner | null>(
        null,
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewRef = useRef<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activeLang, setActiveLang] = useState<Lang>('en');
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    const [filter, setFilter] = useState('All');
    const [query, setQuery] = useState('');

    const { data: partners = [] } = useQuery({
        queryKey: ['admin', 'partners'],
        queryFn: () => listAdminEntities<AdminPartner>('partners'),
    });

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['admin', 'categories', 'partners'],
        queryFn: () => fetchCategories('partners'),
    });

    const saveMutation = useMutation({
        mutationFn: (item: AdminPartner) => saveAdminEntity('partners', item),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('partners', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });

    const filtered = useMemo(() => {
        return partners.filter((p) => {
            const matchCat = filter === 'All' || p.category === filter;
            const name = localizeText(
                { en: p.name_en, fr: p.name_fr, ar: p.name_ar },
                lang,
            ).toLowerCase();
            const matchQ = !query || name.includes(query.toLowerCase());
            return matchCat && matchQ;
        });
    }, [partners, filter, query, lang]);

    useEffect(() => {
        if (!open) setErrors({});
    }, [open]);

    const dialogInitial = useMemo<PartnerFormValues | null>(
        () =>
            editing
                ? {
                      name: normalizeLocalizedText({
                          en: editing.name_en,
                          fr: editing.name_fr,
                          ar: editing.name_ar,
                      }),
                      description: normalizeLocalizedText({
                          en: editing.description_en,
                          fr: editing.description_fr,
                          ar: editing.description_ar,
                      }),
                      website: editing.website ?? '',
                      category: editing.category ?? '',
                      imagePath: editing.image,
                      imageFile: null,
                  }
                : null,
        [editing],
    );

    const validate = (values: PartnerFormValues) => {
        const errs: Record<string, string> = {};
        if (!values.name?.fr) errs.name_fr = t('admin.error.required');
        if (!values.category) errs.category = t('admin.error.required');
        if (values.website && !/^https?:\/\/.+/.test(values.website)) {
            errs.website = t('admin.invalidUrl');
        }
        if (!values.imageFile && (!editing || !editing.image)) {
            errs.imageFile = t('admin.error.required');
        }
        return errs;
    };

    const handleSave = (values: PartnerFormValues) => {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        const payload: Record<string, unknown> = {
            name_en: values.name?.en ?? '',
            name_fr: values.name?.fr ?? '',
            name_ar: values.name?.ar ?? '',
            description_en: values.description?.en ?? '',
            description_fr: values.description?.fr ?? '',
            description_ar: values.description?.ar ?? '',
            website: values.website || null,
            category: values.category || null,
            id: editing?.id || '',
            image:
                values.imageFile instanceof File
                    ? values.imageFile
                    : values.imagePath,
        };

        saveMutation.mutate(payload as unknown as AdminPartner);
        toast.success(
            editing ? t('admin.partnerUpdated') : t('admin.partnerAdded'),
        );
        setEditing(null);
        setOpen(false);
        setErrors({});
        if (previewRef.current) {
            try {
                URL.revokeObjectURL(previewRef.current);
            } catch {}
            previewRef.current = null;
            setPreviewUrl(null);
        }
    };

    const partnerSections = useMemo<SectionDef[]>(() => {
        return [
            {
                title: t('admin.partnerForm.coreDetails'),
                description: t('admin.partnerForm.coreDetailsHint'),
                column: 'main',
                render: ({
                    values,
                    setField,
                    activeLang: currentLang,
                    errors: sectionErrors,
                }) => {
                    const name = normalizeLocalizedText(values.name);
                    const fieldKey = `name_${currentLang}`;
                    const fieldError = sectionErrors?.[fieldKey];

                    return (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">
                                     {t('admin.partnerForm.name')}{' '}
                                </label>
                                <input
                                    id={fieldKey}
                                    dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
                                    value={name[currentLang]}
                                    onChange={(event) =>
                                        setField('name', {
                                            ...name,
                                            [currentLang]: event.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        'admin.partnerForm.namePlaceholder',
                                    )}
                                    className={`w-full rounded-lg border px-3 py-2 text-sm ${currentLang === 'ar' ? 'text-right' : 'text-left'} ${fieldError ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                                />
                                {fieldError ? (
                                    <p className="text-xs text-destructive">
                                        {fieldError}
                                    </p>
                                ) : null}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">
                                     {t('admin.partnerForm.description')}{' '}
                                </label>
                                <textarea
                                    dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
                                    value={
                                        normalizeLocalizedText(
                                            values.description,
                                        )[currentLang]
                                    }
                                    onChange={(event) => {
                                        const desc = normalizeLocalizedText(
                                            values.description,
                                        );
                                        setField('description', {
                                            ...desc,
                                            [currentLang]: event.target.value,
                                        });
                                    }}
                                    placeholder={t(
                                        'admin.partnerForm.descriptionPlaceholder',
                                    )}
                                    rows={3}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    {t('admin.partnerForm.website')}
                                </label>
                                <input
                                    value={String(values.website ?? '')}
                                    onChange={(e) =>
                                        setField('website', e.target.value)
                                    }
                                    placeholder="https://example.com"
                                    className={`w-full rounded-lg border px-3 py-2 text-sm ${sectionErrors?.website ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                                />
                                {sectionErrors?.website ? (
                                    <p className="text-xs text-destructive">
                                        {sectionErrors.website}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    );
                },
            },
            {
                title: t('admin.galleryForm.classification'),
                column: 'side',
                render: ({ values, setField, errors: sectionErrors }) => (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.category')}
                        </label>
                        <Select
                            value={String(values.category ?? '')}
                            onValueChange={(val) => setField('category', val)}
                        >
                            <SelectTrigger
                                className={`w-full rounded-lg border px-3 py-2 text-sm ${sectionErrors?.category ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                            >
                                <SelectValue
                                    placeholder={t(
                                        'admin.blogForm.selectCategory',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {dbCategories.map((category: any) => (
                                    <SelectItem
                                        key={category.key}
                                        value={category.key}
                                    >
                                        {category.name?.[lang] ||
                                            category.name?.en ||
                                            category.key}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {sectionErrors?.category ? (
                            <p className="text-xs text-destructive">
                                {sectionErrors.category}
                            </p>
                        ) : null}

                        <div className="mt-4">
                            <ImagePicker
                                label={t('admin.partnerForm.logo')}
                                value={
                                    (values.imageFile as File | null) ??
                                    (values.imagePath as string) ??
                                    editing?.image ??
                                    null
                                }
                                onChange={(file) => setField('imageFile', file)}
                                error={sectionErrors?.imageFile}
                            />
                        </div>
                    </div>
                ),
            },
        ];
    }, [dbCategories, lang]);

    return (
        <AdminLayout
            title={t('admin.partners')}
            subtitle={`${partners.length} ${t('admin.partnerSubtitle')}`}
            actions={
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setCatManagerOpen(true)}
                        className="gap-2"
                    >
                        <Settings className="h-4 w-4" />{' '}
                        {t('admin.manageCategories')}
                    </Button>
                    <Button
                        onClick={() => {
                            setEditing(null);
                            setErrors({});
                            setActiveLang('en');
                            if (previewRef.current) {
                                try {
                                    URL.revokeObjectURL(previewRef.current);
                                } catch {}
                                previewRef.current = null;
                            }
                            setPreviewUrl(null);
                            setOpen(true);
                        }}
                        className="gap-2 bg-primary text-primary-foreground"
                    >
                        <Plus className="h-4 w-4" /> {t('admin.actions')}
                    </Button>
                </div>
            }
        >
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('admin.searchByTitle')}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'All', label: t('admin.all') },
                        ...((dbCategories || []).map((c: any) => ({
                            key: c.key,
                            label: c.name?.[lang] || c.name?.en || c.key,
                        })) as any),
                    ].map((c: any) => (
                        <button
                            key={c.key}
                            onClick={() => setFilter(c.key)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === c.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    t('admin.partnerTable.logo'),
                                    t('admin.partnerTable.name'),
                                    t('admin.category'),
                                    t('admin.partnerTable.website'),
                                    t('admin.partnerTable.actions'),
                                ].map((h, i) => (
                                    <th
                                        key={h}
                                        className={cn(
                                            'px-4 py-3 text-xs font-semibold uppercase text-muted-foreground',
                                            i === 1
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
                            {filtered.map((d) => (
                                <tr
                                    key={d.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 text-center">
                                        <img
                                            src={d.image}
                                            alt={d.name}
                                            className="mx-auto h-12 w-12 rounded-lg object-contain"
                                        />
                                    </td>
                                    <td
                                        className={cn(
                                            'px-4 py-3 text-sm font-semibold',
                                            dir === 'rtl'
                                                ? 'text-right'
                                                : 'text-left',
                                        )}
                                    >
                                        {localizeText(
                                            {
                                                en: d.name_en,
                                                fr: d.name_fr,
                                                ar: d.name_ar,
                                            },
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs">
                                            {dbCategories.find(
                                                (c: any) =>
                                                    c.key === d.category,
                                            )?.name?.[lang] ??
                                                d.category ??
                                                '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                        {d.website ? (
                                            <a
                                                href={d.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                {d.website}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(d);
                                                    setErrors({});
                                                    setActiveLang('en');
                                                    if (previewRef.current) {
                                                        try {
                                                            URL.revokeObjectURL(
                                                                previewRef.current,
                                                            );
                                                        } catch {}
                                                        previewRef.current =
                                                            null;
                                                    }
                                                    setPreviewUrl(null);
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

            <EntityFormDialog<PartnerFormValues>
                open={open}
                onOpenChange={(isOpen) => {
                    setOpen(isOpen);
                    if (!isOpen) {
                        setErrors({});
                        if (previewRef.current) {
                            try {
                                URL.revokeObjectURL(previewRef.current);
                            } catch {}
                            previewRef.current = null;
                        }
                        setPreviewUrl(null);
                        setEditing(null);
                    }
                }}
                title={
                    editing
                        ? t('admin.partnerEditTitle')
                        : t('admin.partnerAddTitle')
                }
                sections={partnerSections}
                initial={dialogInitial}
                onSubmit={(values) => handleSave(values as PartnerFormValues)}
                errors={errors}
                languages={PARTNER_LANGUAGES}
                activeLang={activeLang}
                onActiveLangChange={setActiveLang}
                layout="grid-2"
                isSubmitting={saveMutation.isPending}
            />

            <CategoryManager
                type="partners"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'categories', 'partners'],
                    });
                }}
            />
        </AdminLayout>
    );
};

export default AdminPartners;
