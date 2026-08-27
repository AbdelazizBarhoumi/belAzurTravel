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
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
    type AdminRow,
} from '@/api/admin.api';
import { apiFetch } from '@/api/http';
import type { PageHeroSlide } from '@/api/siteSettings.api';
import { HeroImagesManager } from '@/components/admin/HeroImagesManager';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
    EntityFormDialog,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LocationSelect } from '@/components/ui/LocationSelect';
import { Input } from '@/components/ui/input';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import LangBadge from '@/components/forms/LangBadge';
import {
    JsonListEditor,
    type JsonFieldDef,
} from '@/components/forms/JsonListEditor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/utils';
import type { Lang } from '@/i18n/translations';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useCategoryTypes, type CategoryType } from '@/hooks/useCategoryTypes';
import { CategoryTypeManager } from '@/components/admin/CategoryTypeManager';

export default function AdminEvents() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const { data: categoryTypes = [] } = useCategoryTypes('events');
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [modalLang, setModalLang] = useState<Lang>('en');
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setErrors({});
            setEditing(null);
        }
        setOpen(nextOpen);
    };

    // Hero images state
    const { settings: siteSettings } = useSiteSettings();
    const existingHeroConfig = siteSettings?.content?.page_heroes?.events;
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
                    events: {
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

    const validate = (values: AdminRow) => {
        const errs: Record<string, string> = {};
        ['en', 'fr', 'ar'].forEach((lang) => {
            if (!values[`title_${lang}`])
                errs[`title_${lang}`] = t('admin.error.required');
        });
        if (!values.location) errs.location = t('admin.error.required');
        if (!values.category_key) errs.category_key = t('admin.error.required');
        if (!values.date) errs.date = t('admin.error.required');
        if (!values.price || Number(values.price) <= 0)
            errs.price = t('admin.error.invalidPrice');
        return errs;
    };

    const scheduleSchema = useMemo(
        (): JsonFieldDef[] => [
            { key: 'day', label: t('admin.day'), translatable: true },
            { key: 'activity', label: t('admin.activity'), translatable: true },
            {
                key: 'details',
                label: t('admin.details'),
                type: 'textarea',
                translatable: true,
            },
        ],
        [t],
    );

    const queryKey = useMemo(() => ['admin', 'events'], []);
    const { data: rows = [] } = useQuery<AdminRow[]>({
        queryKey,
        queryFn: async () => {
            const data = (await listAdminEntities<AdminRow>(
                'events',
            )) as unknown as AdminRow[] | { data?: AdminRow[] };
            return Array.isArray(data) ? data : (data.data ?? []);
        },
    });

    const saveMutation = useMutation({
        mutationFn: (row: AdminRow) => saveAdminEntity('events', row),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            setErrors({});
            setEditing(null);
            setOpen(false);
            toast.success(editing ? t('actions.saved') : t('actions.added'));
        },
        onError: (error: Error & { data?: Record<string, unknown> }) => {
            // Extract backend validation errors if present
            const errorMsg = String(
                error?.data?.message ||
                    error?.message ||
                    'An error occurred while saving',
            );
            toast.error(errorMsg);
            // If there are field-specific validation errors, set them in form state
            if (error?.data?.errors && typeof error.data.errors === 'object') {
                setErrors(error.data.errors as Record<string, string>);
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('events', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    const dialogInitial = useMemo(() => {
        if (!editing) return null;

        let schedule = [];
        try {
            schedule =
                typeof editing.schedule === 'string'
                    ? JSON.parse(editing.schedule)
                    : Array.isArray(editing.schedule)
                      ? editing.schedule
                      : [];
        } catch {
            schedule = [];
        }

        return {
            ...editing,
            imagePath: (editing.image as string) ?? '',
            imageFile: null,
            image: (editing.image as string) ?? '',
            galleryPaths: Array.isArray(editing.gallery)
                ? (editing.gallery as string[])
                : [],
            galleryFiles: [],
            schedule,
            ...Object.fromEntries(
                categoryTypes.map((ct) => [
                    `category_${ct.key}`,
                    (editing as any).category_assignments?.[ct.key] || '',
                ]),
            ),
        };
    }, [editing, categoryTypes]);

    function handleSave(values: AdminRow) {
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

        const payload = {
            ...(values || {}),
            id: editing?.id ?? '',
            image:
                (values.imageFile as unknown as File) ?? values.imagePath ?? '',
            gallery: Array.isArray(values.galleryPaths)
                ? (values.galleryPaths as string[])
                : Array.isArray(values.gallery)
                  ? (values.gallery as string[])
                  : [],
            category_assignments: categoryAssignments,
            details: {
                schedule: values.schedule ?? [],
            },
        } as unknown as AdminRow;

        if (
            Array.isArray(values.galleryFiles) &&
            values.galleryFiles.length > 0
        ) {
            payload.gallery_files = values.galleryFiles;
        }

        saveMutation.mutate(payload);
    }

    const eventSections: SectionDef[] = [
        {
            title: t('admin.eventForm.coreDetails'),
            description: t('admin.eventForm.coreDetailsHint'),
            fields: [
                {
                    key: 'dateFrom',
                    label: t('admin.dateRange'),
                    type: 'daterange',
                },
            ],
            render: ({ values, setField, activeLang, errors }) => (
                <div className="space-y-6">
                    <EntityMediaInputs values={values} setField={setField} />
                    {/* Category Types - dynamic dropdowns */}
                    {categoryTypes.map((catType) => (
                        <div key={catType.key} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    {catType.label[activeLang] ||
                                        catType.label.en}
                                </label>
                            </div>
                            <Select
                                value={String(
                                    values[`category_${catType.key}`] || '',
                                )}
                                onValueChange={(val) =>
                                    setField(`category_${catType.key}`, val)
                                }
                            >
                                <SelectTrigger
                                    className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm`}
                                >
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
                        {[{ key: 'title', label: t('admin.title') }].map(
                            (field) => {
                                const fieldKey = `${field.key}_${activeLang}`;
                                const error = errors?.[fieldKey];
                                return (
                                    <div key={fieldKey} className="space-y-2">
                                        <label
                                            htmlFor={fieldKey}
                                            className={`text-xs font-semibold ${error ? 'text-destructive' : 'text-muted-foreground'}`}
                                        >
                                            {field.label}
                                            <LangBadge lang={activeLang} />
                                        </label>
                                        <input
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
                                            placeholder={t(
                                                'admin.titlePlaceholder',
                                            )}
                                            className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ${error ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                        />
                                        {error && (
                                            <p className="text-xs text-destructive">
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                );
                            },
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                {t('admin.location')}
                            </label>
                            <LocationSelect
                                value={String(values.location ?? '')}
                                onChange={(val) => setField('location', val)}
                                lang={activeLang}
                                placeholder={t('admin.locationPlaceholder')}
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                className={`text-xs font-semibold ${errors?.price ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                                {t('admin.price')}
                            </label>
                            <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0.00"
                                value={String(values.price ?? '')}
                                onChange={(e) =>
                                    setField('price', e.target.value)
                                }
                                className={
                                    errors?.price
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {t('admin.priceHint')}
                            </p>
                            {errors?.price && (
                                <p className="text-xs text-destructive">
                                    {errors.price}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor={`description_${activeLang}`}
                            className="text-xs font-semibold text-muted-foreground"
                        >
                            {t('admin.description')}
                            <LangBadge lang={activeLang} />
                        </label>
                        <textarea
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
                            placeholder={t('admin.descriptionPlaceholder')}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                htmlFor={`about_${activeLang}`}
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.eventForm.about')}
                                <LangBadge lang={activeLang} />
                            </label>
                            <textarea
                                id={`about_${activeLang}`}
                                value={String(
                                    values[`about_${activeLang}`] ?? '',
                                )}
                                onChange={(e) =>
                                    setField(
                                        `about_${activeLang}`,
                                        e.target.value,
                                    )
                                }
                                rows={4}
                                placeholder={t('admin.eventForm.about')}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor={`attendees_${activeLang}`}
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.eventForm.attendees')}
                                <LangBadge lang={activeLang} />
                            </label>
                            <input
                                id={`attendees_${activeLang}`}
                                value={String(
                                    values[`attendees_${activeLang}`] ?? '',
                                )}
                                onChange={(e) =>
                                    setField(
                                        `attendees_${activeLang}`,
                                        e.target.value,
                                    )
                                }
                                placeholder={t('admin.eventForm.attendees')}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.eventForm.schedule'),
            column: 'main',
            render: ({ values, setField, activeLang }) => (
                <JsonListEditor
                    title={t('admin.eventForm.schedule')}
                    items={
                        Array.isArray(values.schedule) ? values.schedule : []
                    }
                    onItemsChange={(items) => setField('schedule', items)}
                    schema={scheduleSchema}
                    activeLang={activeLang}
                    addButtonLabel={t('admin.eventForm.addDay')}
                    itemLabel={(item, index) =>
                        (item.day as Record<string, string> | undefined)?.[
                            activeLang
                        ] || `${t('admin.day')} ${index + 1}`
                    }
                />
            ),
        },
    ];

    return (
        <AdminLayout
            title={t('admin.events')}
            subtitle={t('admin.eventsSubtitle')}
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
            <CategoryTypeManager
                entityType="events"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'category-types', 'events'],
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
                    pageKey="events"
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
                                    { key: 'image', label: t('admin.image') },
                                    {
                                        key: 'category',
                                        label: t('admin.category'),
                                    },
                                    { key: 'title', label: t('admin.title') },
                                    {
                                        key: 'location',
                                        label: t('admin.location'),
                                    },
                                    { key: 'date', label: t('admin.date') },
                                    { key: 'price', label: t('admin.price') },
                                    {
                                        key: 'actions',
                                        label: t('admin.actions'),
                                    },
                                ].map((column) => (
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
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={String(row.id ?? '')}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="flex justify-center px-4 py-3">
                                        <img
                                            src={String(row.image ?? '')}
                                            alt={String(
                                                row[`title_${lang}`] ?? '',
                                            )}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {String(
                                            (typeof row.category === 'object' &&
                                            row.category !== null
                                                ? (row.category as any)[lang] ||
                                                  (row.category as any).en
                                                : null) ??
                                                row.category_key ??
                                                '',
                                        )}
                                    </td>
                                    <td
                                        className={`px-4 py-3 text-sm font-semibold ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                    >
                                        {String(row[`title_${lang}`] ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {String(row[`location_${lang}`] ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {row.date}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold">
                                        {formatPrice(row.price, 'TND')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(row);
                                                    setOpen(true);
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPendingDelete(row)
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

            <EntityFormDialog
                open={open}
                onOpenChange={handleOpenChange}
                title={
                    editing
                        ? `${t('actions.edit')} ${t('admin.events')}`
                        : `${t('actions.add')} ${t('admin.events')}`
                }
                sections={eventSections}
                initial={dialogInitial}
                onSubmit={(values) => handleSave(values as unknown as AdminRow)}
                errors={errors}
                languages={['en', 'fr', 'ar']}
                activeLang={modalLang}
                onActiveLangChange={setModalLang}
                isSubmitting={saveMutation.isPending}
            />
        </AdminLayout>
    );
}
