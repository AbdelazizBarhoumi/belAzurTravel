import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Settings } from 'lucide-react';
import { useState } from 'react';
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
import { JsonListEditor, type JsonFieldDef } from '@/components/forms/JsonListEditor';
import { Button } from '@/components/ui/button';
import { fetchCategories } from '@/api/categories.api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';
import {
    categoryLabels,
    countryLabels,
    hotelLabels,
    localizeKnown,
} from '@/lib/adminI18n';

const copy = (en: string, fr: string, ar: string) => ({ en, fr, ar });

type HotelFormValues = AdminRow & {
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

function localizedFields(
    base: string,
    label: ReturnType<typeof copy>,
    type?: 'text' | 'number' | 'textarea',
) {
    return [
        { key: `${base}_en`, label: label.en, type, required: true },
        { key: `${base}_fr`, label: label.fr, type, required: true },
        { key: `${base}_ar`, label: label.ar, type, required: true },
    ];
}

const amenitySchema: JsonFieldDef[] = [
    { key: 'name', labelKey: 'admin.hotelForm.amenityName', translatable: true },
];

const roomSchema: JsonFieldDef[] = [
    { key: 'name', labelKey: 'admin.hotelForm.roomName', translatable: true },
    { key: 'description', labelKey: 'admin.description', type: 'textarea', translatable: true },
    { key: 'pricePerNight', labelKey: 'admin.pricePerNight', type: 'number' },
    { key: 'capacity', labelKey: 'admin.hotelForm.capacity', type: 'number' },
    { key: 'size', labelKey: 'admin.hotelForm.size', type: 'number' },
];

const AdminHotels = () => {
    useAdminGuard();

    const queryClient = useQueryClient();
    const { settings: siteSettings } = useSiteSettings();
    const isCodeEnabled =
        siteSettings?.config?.navigation?.enabled_dropdowns?.includes(
            'hotels',
        );
    const [catManagerOpen, setCatManagerOpen] = useState(false);
    const { data: hotels = [] } = useQuery({
        queryKey: ['admin', 'hotels'],
        queryFn: () => listAdminEntities<AdminRow>('hotels'),
    });
    const { data: dbCategories = [] } = useQuery({
        queryKey: ['admin', 'categories', 'hotels'],
        queryFn: () => fetchCategories('hotels'),
    });

    const saveMutation = useMutation({
        mutationFn: (item: HotelFormValues) =>
            saveAdminEntity('hotels', item as unknown as AdminRow),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('hotels', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });

    const { lang, setLang, t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const dialogInitial: HotelFormValues | null = editing
        ? ({
              ...editing,
              destinationSlug: editing.destinationSlug,
              imagePath: asText(editing.image),
              imageFile: null,
              galleryPaths: Array.isArray(editing.gallery) ? editing.gallery : [],
              galleryFiles: [] as File[],
              amenities: Array.isArray(editing.amenities) ? editing.amenities : [],
              rooms: Array.isArray(editing.rooms)
                  ? editing.rooms
                  : typeof editing.rooms === 'string' && editing.rooms
                    ? JSON.parse(editing.rooms)
                    : [],
              address: (editing.details as any)?.address ?? '',
              phone: (editing.details as any)?.phone ?? '',
              whatsapp: (editing.details as any)?.whatsapp ?? '',
          } as unknown as HotelFormValues)
        : null;

    const hotelSections: SectionDef[] = [
        {
            title: t('admin.hotelForm.coreDetails'),
            column: 'main',
            description: t('admin.hotelForm.coreDetailsHint'),
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { key: 'name', label: t('admin.name') },
                            {
                                key: 'location',
                                label: t('admin.location'),
                            },
                            {
                                key: 'category',
                                label: t('admin.category'),
                            },
                            { key: 'city', label: t('admin.city') },
                            {
                                key: 'country',
                                label: t('admin.country'),
                            },
                        ].map((field) => {
                            const localizedKey = `${field.key}_${activeLang}`;
                            const value = asText(values[localizedKey]);

                            return (
                                <div key={localizedKey} className="space-y-2">
                                    <label
                                        htmlFor={localizedKey}
                                        className="text-xs font-semibold text-muted-foreground"
                                    >
                                        {field.label}
                                        <LangBadge lang={activeLang} />
                                    </label>
                                    {field.key === 'category' &&
                                    dbCategories.length > 0 ? (
                                        <Select
                                            value={String(value)}
                                            onValueChange={(val) =>
                                                setField(localizedKey, val)
                                            }
                                        >
                                            <SelectTrigger
                                                id={localizedKey}
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            >
                                                <SelectValue
                                                    placeholder={t('actions.select')}
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
                                    ) : (
                                        <input
                                            id={localizedKey}
                                            value={value}
                                            onChange={(event) =>
                                                setField(
                                                    localizedKey,
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            required={
                                                field.key !== 'city' &&
                                                field.key !== 'country'
                                            }
                                        />
                                    )}
                                </div>
                            );
                        })}

                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor={`description_${activeLang}`}
                                className="text-xs font-semibold text-muted-foreground"
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
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.hotelForm.pricing'),
            columns: 2,
            column: 'main',
            fields: [
                {
                    key: 'price',
                    label: `${t('admin.pricePerNight')} (USD)`,
                    type: 'number',
                },
                {
                    key: 'rating',
                    label: t('admin.rating'),
                    type: 'number',
                },
                {
                    key: 'destinationSlug',
                    label: t('admin.destinationSlug'),
                },
                {
                    key: 'stars',
                    label: t('admin.stars'),
                    type: 'number',
                },
                {
                    key: 'reviews',
                    label: t('admin.reviews'),
                    type: 'number',
                },
            ],
        },
        {
            title: t('admin.hotelForm.contact'),
            column: 'main',
            description: t('admin.hotelForm.contactHint'),
            columns: 2,
            fields: [
                { key: 'city_en', label: `${t('admin.city')} (EN)` },
                { key: 'city_fr', label: `${t('admin.city')} (FR)` },
                { key: 'city_ar', label: `${t('admin.city')} (AR)` },
                { key: 'country_en', label: `${t('admin.country')} (EN)` },
                { key: 'country_fr', label: `${t('admin.country')} (FR)` },
                { key: 'country_ar', label: `${t('admin.country')} (AR)` },
                { key: 'address', label: t('admin.address') },
                { key: 'phone', label: t('admin.phone') },
                { key: 'whatsapp', label: t('admin.whatsapp') },
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

                    <div className="pt-4 border-t border-border">
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
                            schema={amenitySchema}
                            activeLang={activeLang}
                            addButtonLabel={t('admin.hotelForm.addAmenity')}
                            itemLabel={(item, index) =>
                                (item.name as Record<string, string> | undefined)?.[activeLang] || `${t('admin.hotelForm.amenity')} ${index + 1}`
                            }
                        />
                    </div>

                    <div className="pt-4 border-t border-border">
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
                                (item.name as Record<string, string> | undefined)?.[activeLang] || `${t('admin.hotelForm.room')} ${index + 1}`
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
        if (!values.name_en) errs.name_en = t('admin.fieldRequired');
        if (!values.name_fr) errs.name_fr = t('admin.fieldRequired');
        if (!values.name_ar) errs.name_ar = t('admin.fieldRequired');
        // Add more validations as needed...
        return errs;
    };

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
            address,
            phone,
            whatsapp,
            ...rest
        } = values;

        const payload = {
            ...rest,
            id: editing?.id || '',
            image: imageFile ?? imagePath?.trim() ?? asText(editing?.image),
            amenities: Array.isArray(amenities) ? amenities : [],
            rooms: Array.isArray(rooms) ? rooms : [],
            gallery: galleryPaths ?? [],
            details: {
                address,
                phone,
                whatsapp,
            },
            ...(galleryFiles && galleryFiles.length > 0
                ? { gallery_files: galleryFiles }
                : {}),
        } as unknown as HotelFormValues;

        saveMutation.mutate(payload, {
            onSuccess: () => {
                setEditing(null);
                setOpen(false);
                setErrors({});
                toast.success(
                    editing ? t('admin.hotelUpdated') : t('admin.hotelAdded'),
                );
            },
        });
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
                            <Settings className="h-4 w-4" /> {t('admin.manageCategories')}
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
            <div className="overflow-hidden rounded-2xl border border-border bg-card" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
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
                                        {localizeKnown(
                                            asText(d.location),
                                            countryLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs">
                                            {localizeKnown(
                                                asText(d.category),
                                                categoryLabels,
                                                lang,
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold">
                                        ${String(d.price ?? 0)}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {String(d.rating ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(d);
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
                    deleteMutation.mutate(String(pendingDelete.id ?? ''));
                    setPendingDelete(null);
                }}
            />

            <EntityFormDialog<HotelFormValues>
                open={open}
                onOpenChange={setOpen}
                title={
                    editing
                        ? `${t('actions.edit')} ${t('admin.hotels')}`
                        : `${t('actions.add')} ${t('admin.hotels')}`
                }
                sections={hotelSections}
                initial={dialogInitial}
                onSubmit={handleSave}
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
                activeLang={lang}
                onActiveLangChange={setLang}
                isSubmitting={saveMutation.isPending}
            />

            <CategoryManager
                type="hotels"
                isOpen={catManagerOpen}
                onClose={() => {
                    setCatManagerOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['admin', 'categories', 'hotels'] });
                }}
            />
        </AdminLayout>
    );
};

export default AdminHotels;
