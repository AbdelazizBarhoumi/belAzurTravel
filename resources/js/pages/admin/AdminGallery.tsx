import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    LayoutGrid,
    List,
    Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    EntityFormDialog,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import LangBadge from '@/components/forms/LangBadge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    fetchGallery,
    createGalleryImage,
    updateGalleryImage,
    deleteGalleryImage,
    type GalleryImage,
} from '@/api/gallery.api';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useLanguage } from '@/contexts/LanguageContext';
import { tField } from '@/lib/i18n-field';
import { toast } from 'sonner';
import { t } from '@/i18n/translations';
import type { Lang } from '@/i18n/translations';

import { fetchCategories } from '@/api/categories.api';
import { CategoryManager } from '@/components/admin/CategoryManager';

type GalleryLocalizedText = Record<Lang, string>;

type GalleryFormValues = {
    title: GalleryLocalizedText;
    category: string;
    imageFile?: File | null;
    imagePath?: string;
};

const GALLERY_LANGUAGES: Lang[] = ['en', 'fr', 'ar'];

type ApiValidationError = {
    status?: number;
    data?: {
        message?: string;
        errors?: Record<string, string | string[]>;
    };
};

function flattenValidationErrors(
    error: unknown,
): Record<string, string> | null {
    const apiError = error as ApiValidationError | null | undefined;
    const validationErrors = apiError?.data?.errors;

    if (!validationErrors || typeof validationErrors !== 'object') {
        return null;
    }

    return Object.entries(validationErrors).reduce(
        (acc: Record<string, string>, [key, value]) => {
            if (Array.isArray(value)) {
                const firstMessage = value.find(
                    (item) => typeof item === 'string',
                );

                if (firstMessage) acc[key] = firstMessage;

                return acc;
            }

            if (typeof value === 'string') {
                acc[key] = value;
            }

            return acc;
        },
        {},
    );
}

function expandGalleryValidationErrors(
    errors: Record<string, string>,
): Record<string, string> {
    const next = { ...errors };

    if (next.title && !next.title_en && !next.title_fr && !next.title_ar) {
        next.title_fr = next.title;
        next.title_ar = next.title;
    }

    return next;
}

function normalizeLocalizedText(value: unknown): GalleryLocalizedText {
    if (typeof value === 'object' && value !== null) {
        const record = value as Record<string, unknown>;
        return {
            en: typeof record.en === 'string' ? record.en : '',
            fr: typeof record.fr === 'string' ? record.fr : '',
            ar: typeof record.ar === 'string' ? record.ar : '',
        };
    }

    return {
        en: typeof value === 'string' ? value : '',
        fr: '',
        ar: '',
    };
}

function appendLocalizedText(
    formData: FormData,
    key: string,
    value: GalleryLocalizedText,
) {
    formData.append(`${key}[en]`, value.en ?? '');
    formData.append(`${key}[fr]`, value.fr ?? '');
    formData.append(`${key}[ar]`, value.ar ?? '');
}

function buildGalleryFormData(values: GalleryFormValues): FormData {
    const formData = new FormData();
    appendLocalizedText(formData, 'title', values.title);

    if (values.category) {
        formData.append('category', values.category);
    }

    if (values.imageFile instanceof File) {
        formData.append('image', values.imageFile);
    }

    return formData;
}

const AdminGallery = () => {
    useAdminGuard();
    const { lang } = useLanguage();
    const queryClient = useQueryClient();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editing, setEditing] = useState<GalleryImage | null>(null);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [filter, setFilter] = useState('All');
    const [query, setQuery] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activeLang, setActiveLang] = useState<Lang>('en');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadGallery();
    }, []);

    const loadGallery = async () => {
        try {
            const data = await fetchGallery();
            setImages(data);
        } catch (e) {
            toast.error(t('admin.error.loadGallery', lang));
        }
    };

    const items = useMemo(() => {
        return images.filter((g) => {
            const matchCat = filter === 'All' || g.category === filter;
            const title = tField(g.title as any, lang).toLowerCase();
            const matchQ = !query || title.includes(query.toLowerCase());
            return matchCat && matchQ;
        });
    }, [images, filter, query, lang]);

    useEffect(() => {
        if (!open) setErrors({});
    }, [open]);

    const validate = (values: GalleryFormValues) => {
        const errs: Record<string, string> = {};
        if (!values.title?.fr) {
            errs.title_fr = t('admin.error.required', lang);
        }
        if (!values.title?.ar) {
            errs.title_ar = t('admin.error.required', lang);
        }
        if (!values.category) errs.category = t('admin.error.required', lang);
        if (!editing && !(values.imageFile instanceof File)) {
            errs.image = t('admin.error.required', lang);
        }
        return errs;
    };

    const handleSave = async (values: GalleryFormValues) => {
        if (isSaving) return;

        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.error.pleaseFixErrors', lang));
            return;
        }

        setIsSaving(true);
        try {
            setErrors({});
            const payload = buildGalleryFormData(values);

            if (editing) {
                await updateGalleryImage(editing.id, payload);
                toast.success(t('admin.imageUpdated', lang));
            } else {
                await createGalleryImage(payload);
                toast.success(t('admin.imageAdded', lang));
            }
            setEditing(null);
            setOpen(false);
            loadGallery();
        } catch (e) {
            const validationErrors = flattenValidationErrors(e);

            if (validationErrors) {
                setErrors(expandGalleryValidationErrors(validationErrors));
                toast.error(t('admin.error.pleaseFixErrors', lang));
            } else {
                toast.error(t('admin.error.saveImage', lang));
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (it: GalleryImage) => {
        setEditing(it);
        setErrors({});
        setActiveLang('en');
        setOpen(true);
    };

    const dialogInitial = useMemo<GalleryFormValues | null>(
        () =>
            editing
                ? {
                      title: normalizeLocalizedText(editing.title),
                      category: editing.category ?? '',
                      imagePath: editing.url,
                      imageFile: null,
                  }
                : null,
        [editing],
    );

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['admin', 'categories', 'gallery'],
        queryFn: () => fetchCategories('gallery'),
    });

    const gallerySections = useMemo<SectionDef[]>(() => {
        return [
            {
                title: t('admin.galleryForm.general', lang),
                column: 'main',
                render: ({
                    values,
                    setField,
                    activeLang: currentLang,
                    errors: sectionErrors,
                }) => {
                    const title = normalizeLocalizedText(values.title);
                    const fieldKey = `title_${currentLang}`;
                    const fieldError = sectionErrors?.[fieldKey];

                    return (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    {t('admin.title', lang)}{' '}
                                    <LangBadge lang={currentLang} />
                                </label>
                                <input
                                    id={fieldKey}
                                    dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
                                    value={title[currentLang]}
                                    onChange={(event) =>
                                        setField('title', {
                                            ...title,
                                            [currentLang]: event.target.value,
                                        })
                                    }
                                    className={`w-full rounded-lg border px-3 py-2 text-sm ${currentLang === 'ar' ? 'text-right' : 'text-left'} ${fieldError ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                                />
                            </div>

                            {fieldError ? (
                                <p className="text-xs text-destructive">
                                    {fieldError}
                                </p>
                            ) : null}
                        </div>
                    );
                },
            },
            {
                title: t('admin.galleryForm.classification', lang),
                column: 'side',
                render: ({
                    values,
                    setField,
                    activeLang: currentLang,
                    errors: sectionErrors,
                }) => (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.category', lang)}
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
                                        lang,
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {dbCategories.map((category: any) => (
                                    <SelectItem
                                        key={category.key}
                                        value={category.key}
                                    >
                                        {category.name?.[currentLang] ||
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
                    </div>
                ),
            },
            {
                title: t('admin.galleryForm.media', lang),
                column: 'side',
                render: ({ values, setField, errors: sectionErrors }) => (
                    <div className="space-y-3">
                        <EntityMediaInputs
                            values={values}
                            setField={setField}
                            imageLabel={t('admin.image', lang)}
                            showImage
                            showGallery={false}
                        />
                        {sectionErrors?.image ? (
                            <p className="text-xs text-destructive">
                                {sectionErrors.image}
                            </p>
                        ) : null}
                    </div>
                ),
            },
        ];
    }, [dbCategories, lang]);

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (deletingId) {
            try {
                await deleteGalleryImage(deletingId);
                toast.success(t('admin.imageDeleted', lang));
                loadGallery();
                setConfirmOpen(false);
                setDeletingId(null);
            } catch (e) {
                toast.error(t('admin.error.deleteImage', lang));
            }
        }
    };

    return (
        <AdminLayout
            title={t('admin.gallery', lang)}
            subtitle={`${images.length} ${t('admin.imagesInLibrary', lang)}`}
            actions={
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setCatManagerOpen(true)}
                        className="gap-2"
                    >
                        <Settings className="h-4 w-4" />{' '}
                        {t('admin.manageCategories', lang)}
                    </Button>
                    <Button
                        onClick={() => {
                            setEditing(null);
                            setErrors({});
                            setActiveLang('en');
                            setOpen(true);
                        }}
                        className="gap-2 bg-primary text-primary-foreground"
                    >
                        <Plus className="h-4 w-4" /> {t('admin.addImage', lang)}
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
                        placeholder={t('admin.searchByTitle', lang)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'All', label: t('admin.all', lang) },
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
                <div className="flex gap-1 rounded-lg border border-border p-1">
                    <button
                        onClick={() => setView('grid')}
                        className={`rounded p-1.5 ${view === 'grid' ? 'bg-muted' : ''}`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`rounded p-1.5 ${view === 'list' ? 'bg-muted' : ''}`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                    {t('admin.noImagesMatch', lang)}
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((it) => (
                        <div
                            key={it.id}
                            className="group relative overflow-hidden rounded-2xl border border-border bg-card"
                        >
                            <div className="aspect-square overflow-hidden bg-muted">
                                <img
                                    src={it.url}
                                    alt={tField(it.title as any, lang)}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                            </div>
                            <div className="p-3">
                                <div className="truncate text-sm font-semibold">
                                    {tField(it.title as any, lang)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {dbCategories.find(
                                        (c: any) => c.key === it.category,
                                    )?.name?.[lang] ?? it.category}
                                </div>
                            </div>
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                    onClick={() => handleEdit(it)}
                                    className="rounded-lg bg-card/90 p-1.5 backdrop-blur hover:bg-card"
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(it.id)}
                                    className="rounded-lg bg-card/90 p-1.5 backdrop-blur hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground">
                                    {t('admin.image', lang)}
                                </th>
                                <th
                                    className={`px-4 py-3 text-xs font-semibold uppercase text-muted-foreground ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                >
                                    {t('admin.title', lang)}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground">
                                    {t('admin.category', lang)}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground">
                                    {t('admin.actions', lang)}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr
                                    key={it.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="flex justify-center px-4 py-3">
                                        <img
                                            src={it.url}
                                            alt=""
                                            className="h-16 w-16 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td
                                        className={`px-4 py-3 text-sm font-semibold ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                    >
                                        {tField(it.title as any, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs">
                                            {dbCategories.find(
                                                (c: any) =>
                                                    c.key === it.category,
                                            )?.name?.[lang] ?? it.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(it)}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(it.id)
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
            )}

            <EntityFormDialog<GalleryFormValues>
                open={open}
                onOpenChange={setOpen}
                title={
                    editing
                        ? t('admin.editImage', lang)
                        : t('admin.addImage', lang)
                }
                subtitle={t('admin.imagesInLibrary', lang)}
                sections={gallerySections}
                initial={dialogInitial}
                onSubmit={handleSave}
                errors={errors}
                layout="grid-2"
                languages={GALLERY_LANGUAGES}
                activeLang={activeLang}
                onActiveLangChange={setActiveLang}
                isSubmitting={isSaving}
            />
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={t('admin.deleteItemTitle', lang)}
                description={t('admin.deleteItemFallback', lang)}
                onConfirm={confirmDelete}
            />

            <CategoryManager
                type="gallery"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'categories', 'gallery'],
                    });
                }}
            />
        </AdminLayout>
    );
};

export default AdminGallery;
