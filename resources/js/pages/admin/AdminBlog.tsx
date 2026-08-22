import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Edit,
    Plus,
    Trash2,
    Image as ImageIcon,
    Save,
    Settings,
} from 'lucide-react';
import { format } from 'date-fns';
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
import LangBadge from '@/components/forms/LangBadge';
import { EntityFormDialog } from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DatePicker } from '@/components/ui/DatePicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';
import { localizeAdminValue } from '@/lib/adminI18n';

const columns: Array<{ key: string; labelKey: string }> = [
    { key: 'image', labelKey: 'admin.image' },
    { key: 'title', labelKey: 'admin.title' },
    { key: 'date', labelKey: 'admin.date' },
    { key: 'category', labelKey: 'admin.category' },
];

type BlogFormValues = Record<string, unknown> & {
    imagePath?: string;
    imageFile?: File | null;
};

type BlogSection = {
    id?: string;
    heading?: Partial<Record<Lang, string>>;
    body?: Partial<Record<Lang, string>>;
};

type BlogContent = {
    body: Record<Lang, string>;
    sections: BlogSection[];
};

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function parseBlogDate(value: unknown): Date | undefined {
    if (typeof value !== 'string' || value.trim() === '') {
        return undefined;
    }

    const [year, month, day] = value.split('-').map((part) => Number(part));
    if (
        Number.isInteger(year) &&
        Number.isInteger(month) &&
        Number.isInteger(day) &&
        year > 0 &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
    ) {
        return new Date(year, month - 1, day, 12);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function serializeBlogDate(value: Date | undefined): string {
    return value ? format(value, 'yyyy-MM-dd') : '';
}

function formatBlogDate(date: string, lang: Lang): string {
    const locale = lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-US';

    try {
        return new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(date));
    } catch {
        return date;
    }
}

export default function AdminBlog() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);
    const { data: categoryTypes = [] } = useCategoryTypes('blog');

    // Hero images state
    const { settings: siteSettings } = useSiteSettings();
    const existingHeroConfig = siteSettings?.content?.page_heroes?.blog;
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
                    blog: {
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

    const dialogInitial: BlogFormValues | null = editing
        ? ({
              ...editing,
              imagePath: asText(editing.image ?? editing.imagePath),
              imageFile: null,
              ...Object.fromEntries(
                  categoryTypes.map((ct) => [
                      `category_${ct.key}`,
                      (editing as any).category_assignments?.[ct.key] || '',
                  ]),
              ),
          } as BlogFormValues)
        : null;

    const queryKey = useMemo(() => ['admin', 'blog-posts'], []);
    const { data: rows = [] } = useQuery<AdminRow[]>({
        queryKey,
        queryFn: () => listAdminEntities<AdminRow>('blog-posts'),
    });

    const saveMutation = useMutation({
        mutationFn: (row: Record<string, unknown>) =>
            saveAdminEntity(
                'blog-posts',
                row as { id?: string | number | null },
            ),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('blog-posts', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate(values: BlogFormValues): Record<string, string> {
        const errs: Record<string, string> = {};
        const requiredMessage = t('admin.required');

        if (!values.title_en) errs.title_en = requiredMessage;
        if (!values.category_key) errs.category_key = requiredMessage;
        if (!values.date) errs.date = requiredMessage;
        if (!values.imageFile && !values.imagePath)
            errs.image = requiredMessage;
        return errs;
    }

    function handleSave(values: BlogFormValues) {
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
            image:
                values.imageFile instanceof File
                    ? values.imageFile
                    : (values.imagePath ?? values.image ?? ''),
            category_assignments: categoryAssignments,
        };

        saveMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(
                    editing ? t('actions.saved') : t('actions.added'),
                );
                setEditing(null);
                setOpen(false);
                setErrors({});
            },
        });
    }

    return (
        <AdminLayout
            title={t('admin.blog')}
            subtitle={t('admin.blogSubtitle')}
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
                    pageKey="blog"
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
                                        className={`px-4 py-3 text-xs font-semibold uppercase text-muted-foreground ${
                                            column.key === 'title'
                                                ? lang === 'ar'
                                                    ? 'text-right'
                                                    : 'text-left'
                                                : 'text-center'
                                        }`}
                                    >
                                        {t(column.labelKey)}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground">
                                    {t('admin.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={String(row.id)}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`max-w-64 truncate px-4 py-3 text-sm ${
                                                column.key === 'title'
                                                    ? lang === 'ar'
                                                        ? 'text-right'
                                                        : 'text-left'
                                                    : column.key === 'image'
                                                      ? 'text-center'
                                                      : 'text-center'
                                            }`}
                                        >
                                            {column.key === 'image' ? (
                                                row.image ? (
                                                    <img
                                                        src={String(row.image)}
                                                        alt={String(
                                                            row.title_en ?? '',
                                                        )}
                                                        className="mx-auto h-12 w-12 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )
                                            ) : column.key === 'date' ? (
                                                formatBlogDate(
                                                    String(
                                                        row[column.key] ?? '',
                                                    ),
                                                    lang,
                                                )
                                            ) : (
                                                localizeAdminValue(
                                                    row,
                                                    column.key,
                                                    lang,
                                                )
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

            <EntityFormDialog
                open={open}
                onOpenChange={(isOpen) => {
                    setOpen(isOpen);
                    if (!isOpen) setErrors({});
                }}
                errors={errors}
                isSubmitting={saveMutation.isPending}
                title={
                    editing
                        ? `${t('actions.edit')} ${t('admin.blog')}`
                        : `${t('actions.add')} ${t('admin.blog')}`
                }
                layout="grid-2"
                initial={dialogInitial ?? undefined}
                sections={[
                    {
                        title: t('admin.blogForm.coreInformation'),
                        column: 'main',
                        description: t('admin.blogForm.coreInformationHint'),
                        render: ({ values, setField, activeLang }) => (
                            <div className="space-y-4">
                                {/* Category Types - dynamic dropdowns */}
                                {categoryTypes.map((catType) => (
                                    <div
                                        key={catType.key}
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-semibold text-muted-foreground">
                                                {catType.label[activeLang] ||
                                                    catType.label.en}
                                            </label>
                                        </div>
                                        <Select
                                            value={String(
                                                values[
                                                    `category_${catType.key}`
                                                ] || '',
                                            )}
                                            onValueChange={(val) =>
                                                setField(
                                                    `category_${catType.key}`,
                                                    val,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-sm`}
                                            >
                                                <SelectValue
                                                    placeholder={t(
                                                        'actions.select',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {catType.values.map((v) => (
                                                    <SelectItem
                                                        key={v.key}
                                                        value={v.key}
                                                    >
                                                        {v.name[activeLang] ||
                                                            v.name.en}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="blog-title"
                                            className="text-xs font-semibold text-muted-foreground"
                                        >
                                            {t('admin.title')}
                                            <LangBadge lang={activeLang} />
                                        </label>
                                        <input
                                            id="blog-title"
                                            placeholder={t(
                                                'admin.blogForm.titlePlaceholder',
                                            )}
                                            value={String(
                                                values[`title_${activeLang}`] ??
                                                    '',
                                            )}
                                            onChange={(event) =>
                                                setField(
                                                    `title_${activeLang}`,
                                                    event.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border ${errors[`title_${activeLang}`] ? 'border-destructive ring-1 ring-destructive' : 'border-border'} bg-background px-3 py-2 text-sm`}
                                        />
                                        {errors[`title_${activeLang}`] && (
                                            <p className="text-xs text-destructive">
                                                {errors[`title_${activeLang}`]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor="blog-date"
                                            className={`text-xs font-semibold ${errors.date ? 'text-destructive' : 'text-muted-foreground'}`}
                                        >
                                            {t('admin.date')}
                                        </label>
                                        <div className="space-y-1">
                                            <DatePicker
                                                date={parseBlogDate(
                                                    values.date,
                                                )}
                                                onDateChange={(date) =>
                                                    setField(
                                                        'date',
                                                        serializeBlogDate(date),
                                                    )
                                                }
                                                placeholder={t('admin.date')}
                                            />
                                            {errors.date && (
                                                <p className="text-xs text-destructive">
                                                    {errors.date}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1 md:col-span-2">
                                        <EntityMediaInputs
                                            values={values}
                                            setField={setField}
                                            imageLabel={t('admin.mainImage')}
                                            showGallery={false}
                                        />
                                        {(errors.image || errors.imagePath) && (
                                            <p className="text-xs text-destructive">
                                                {errors.image ||
                                                    errors.imagePath}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ),
                    },
                    {
                        title: t('admin.blogForm.summaryAndBody'),
                        column: 'side',
                        description: t('admin.blogForm.summaryAndBodyHint'),
                        render: ({ values, setField, activeLang }) => {
                            const content = (values.content as BlogContent) || {
                                body: { en: '', fr: '', ar: '' },
                                sections: [],
                            };

                            const updateBody = (next: string) => {
                                setField('content', {
                                    ...content,
                                    body: {
                                        ...content.body,
                                        [activeLang]: next,
                                    },
                                });
                            };

                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label
                                            htmlFor={`excerpt_${activeLang}`}
                                            className={`text-xs font-semibold ${errors[`excerpt_${activeLang}`] ? 'text-destructive' : 'text-muted-foreground'}`}
                                        >
                                            {t('admin.blogForm.excerpt')}
                                            <LangBadge lang={activeLang} />
                                        </label>
                                        <textarea
                                            id={`excerpt_${activeLang}`}
                                            placeholder={t(
                                                'admin.blogForm.excerptPlaceholder',
                                            )}
                                            value={String(
                                                values[
                                                    `excerpt_${activeLang}`
                                                ] ?? '',
                                            )}
                                            onChange={(event) =>
                                                setField(
                                                    `excerpt_${activeLang}`,
                                                    event.target.value,
                                                )
                                            }
                                            className={`min-h-24 w-full rounded-lg border ${errors[`excerpt_${activeLang}`] ? 'border-destructive ring-1 ring-destructive' : 'border-border'} bg-background px-3 py-2 text-sm`}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {t('admin.blogForm.excerptHint')}
                                        </p>
                                        {errors[`excerpt_${activeLang}`] && (
                                            <p className="text-xs text-destructive">
                                                {
                                                    errors[
                                                        `excerpt_${activeLang}`
                                                    ]
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor={`content_body_${activeLang}`}
                                            className="text-xs font-semibold text-muted-foreground"
                                        >
                                            {t('admin.blogForm.body')}
                                            <LangBadge lang={activeLang} />
                                        </label>
                                        <textarea
                                            id={`content_body_${activeLang}`}
                                            placeholder={t(
                                                'admin.blogForm.bodyPlaceholder',
                                            )}
                                            value={String(
                                                content.body?.[activeLang] ??
                                                    '',
                                            )}
                                            onChange={(event) =>
                                                updateBody(event.target.value)
                                            }
                                            className="min-h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {t('admin.blogForm.bodyHint')}
                                        </p>
                                    </div>
                                </div>
                            );
                        },
                    },
                    {
                        title: t('admin.blogForm.sections'),
                        column: 'main',
                        description: t('admin.blogForm.sectionsHint'),
                        render: ({ values, setField, activeLang }) => {
                            const content = (values.content as BlogContent) || {
                                body: { en: '', fr: '', ar: '' },
                                sections: [],
                            };

                            const addSection = () =>
                                setField('content', {
                                    ...content,
                                    sections: [
                                        ...(content.sections || []),
                                        {
                                            id: `section-${Math.random().toString(36).slice(2, 9)}`,
                                            heading: { en: '', fr: '', ar: '' },
                                            body: { en: '', fr: '', ar: '' },
                                        },
                                    ],
                                });
                            const removeSection = (index: number) =>
                                setField('content', {
                                    ...content,
                                    sections: (content.sections || []).filter(
                                        (_section, i: number) => i !== index,
                                    ),
                                });
                            const moveSection = (from: number, to: number) => {
                                const sections = [...(content.sections || [])];
                                if (to < 0 || to >= sections.length) return;
                                const [moved] = sections.splice(from, 1);
                                sections.splice(to, 0, moved);
                                setField('content', { ...content, sections });
                            };
                            const updateSection = (
                                index: number,
                                part: 'heading' | 'body',
                                next: string,
                            ) => {
                                const sections = (content.sections || []).map(
                                    (section, i: number) =>
                                        i === index
                                            ? {
                                                  ...section,
                                                  [part]: {
                                                      ...(section[part] || {}),
                                                      [activeLang]: next,
                                                  },
                                              }
                                            : section,
                                );
                                setField('content', { ...content, sections });
                            };

                            return (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-foreground">
                                            {t('admin.blogForm.sections')}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addSection}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            {t('admin.blogForm.addSection')}
                                        </button>
                                    </div>

                                    {!content.sections ||
                                    content.sections.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            {t('admin.blogForm.noSections')}
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            {(content.sections || []).map(
                                                (section, index: number) => (
                                                    <div
                                                        key={
                                                            section.id ?? index
                                                        }
                                                        className="space-y-4 rounded-xl border border-border bg-background p-4"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-sm font-semibold text-foreground">
                                                                {t(
                                                                    'admin.blogForm.section',
                                                                )}{' '}
                                                                {index + 1}
                                                            </h4>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        moveSection(
                                                                            index,
                                                                            index -
                                                                                1,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        index ===
                                                                        0
                                                                    }
                                                                    className="rounded p-1 hover:bg-muted"
                                                                >
                                                                    ↑
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        moveSection(
                                                                            index,
                                                                            index +
                                                                                1,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        index ===
                                                                        (
                                                                            content.sections ||
                                                                            []
                                                                        )
                                                                            .length -
                                                                            1
                                                                    }
                                                                    className="rounded p-1 hover:bg-muted"
                                                                >
                                                                    ↓
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeSection(
                                                                            index,
                                                                        )
                                                                    }
                                                                    className="ml-2 text-sm text-destructive hover:underline"
                                                                >
                                                                    {t(
                                                                        'actions.remove',
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-xs font-semibold text-muted-foreground">
                                                                {t(
                                                                    'admin.blogForm.sectionHeading',
                                                                )}
                                                                <LangBadge
                                                                    lang={
                                                                        activeLang
                                                                    }
                                                                />
                                                            </label>
                                                            <input
                                                                value={String(
                                                                    section
                                                                        .heading?.[
                                                                        activeLang
                                                                    ] ?? '',
                                                                )}
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateSection(
                                                                        index,
                                                                        'heading',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-xs font-semibold text-muted-foreground">
                                                                {t(
                                                                    'admin.blogForm.sectionBody',
                                                                )}
                                                                <LangBadge
                                                                    lang={
                                                                        activeLang
                                                                    }
                                                                />
                                                            </label>
                                                            <textarea
                                                                value={String(
                                                                    section
                                                                        .body?.[
                                                                        activeLang
                                                                    ] ?? '',
                                                                )}
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateSection(
                                                                        index,
                                                                        'body',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        },
                    },
                ]}
                onSubmit={(values) => {
                    // normalize payload similar to BlogAdminForm.handleSubmit
                    const content = values.content ?? {
                        body: { en: '', fr: '', ar: '' },
                        sections: [],
                    };
                    const imageValue = values.image as unknown;
                    const payload: Record<string, unknown> = {
                        ...values,
                        image:
                            typeof imageValue === 'object' &&
                            imageValue instanceof File
                                ? imageValue
                                : (values.imagePath ?? values.image ?? ''),
                        content,
                    };

                    handleSave(payload);
                }}
                languages={['en', 'fr', 'ar']}
            />

            <CategoryTypeManager
                entityType="blog"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'category-types', 'blog'],
                    });
                }}
            />
        </AdminLayout>
    );
}
