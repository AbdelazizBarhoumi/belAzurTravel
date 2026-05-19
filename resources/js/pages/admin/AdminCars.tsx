function LangBadge({ lang }: { lang: Lang }) {
    return (
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {lang}
        </span>
    );
}
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
    type AdminRow,
} from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import {
    EntityFormDialog,
    type FieldDef,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';

type Copy = Record<Lang, string>;

const copy = (en: string, fr: string, ar: string): Copy => ({ en, fr, ar });

function localizedFields(base: string, label: Copy, type?: FieldDef['type']) {
    return [
        { key: `${base}_en`, label: label.en, type, required: true },
        { key: `${base}_fr`, label: label.fr, type, required: true },
        { key: `${base}_ar`, label: label.ar, type, required: true },
    ];
}

const name = copy('Name', 'Nom', 'الاسم');
const category = copy('Category', 'Catégorie', 'الفئة');
const price = copy('Price', 'Prix', 'السعر');
const seats = copy('Seats', 'Places', 'المقاعد');
const description = copy('Description', 'Description', 'الوصف');
const image = copy(
    'Server image path',
    'Chemin image serveur',
    'مسار صورة الخادم',
);

const title = copy('Cars', 'Voitures', 'السيارات');
const subtitle = copy(
    'Manage rental vehicles',
    'Gérer les véhicules de location',
    'إدارة سيارات التأجير',
);

const columns: Array<{ key: string; label: Copy }> = [
    { key: 'name_en', label: name },
    { key: 'category_en', label: category },
    { key: 'price', label: price },
    { key: 'seats', label: copy('Seats', 'Places', 'المقاعد') },
];

function parseGallery(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value === 'string') {
        return value
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

const sections: SectionDef[] = [
    {
        title: 'Core details',
        description:
            'Edit the translated car fields using the same language switching pattern as the destination modal.',
        render: () => null,
    },
    {
        title: 'Powertrain and trim',
        description:
            'Drivetrain details displayed in the admin edit form and future detail cards.',
        render: () => null,
    },
];

export default function AdminCars() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const queryKey = useMemo(() => ['admin', 'cars'], []);
    const { data: rows = [] } = useQuery<AdminRow[]>({
        queryKey,
        queryFn: () => listAdminEntities<AdminRow>('cars'),
    });

    const saveMutation = useMutation({
        mutationFn: (row: Record<string, unknown>) =>
            saveAdminEntity('cars', row as { id?: string | number | null }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('cars', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    const dialogInitial: Record<string, unknown> | null = editing
        ? {
              ...editing,
              imagePath: typeof editing.image === 'string' ? editing.image : '',
              imageFile: null,
              galleryPaths: parseGallery(editing.gallery),
              galleryFiles: [],
          }
        : null;

    function handleSave(values: Record<string, unknown>) {
        const gallery = Array.isArray(values.galleryPaths)
            ? values.galleryPaths
                  .filter((item): item is string => typeof item === 'string')
                  .join('\n')
            : typeof values.gallery === 'string'
              ? values.gallery
              : '';

        const payload: Record<string, unknown> = {
            ...values,
            id: editing?.id ?? '',
            image:
                values.imageFile instanceof File
                    ? values.imageFile
                    : ((values.imagePath as string | undefined) ??
                      (values.image as string | undefined) ??
                      ''),
            gallery,
        };

        if (
            Array.isArray(values.galleryFiles) &&
            values.galleryFiles.length > 0
        ) {
            payload.gallery_files = values.galleryFiles;
        }

        saveMutation.mutate(payload);
        toast.success(editing ? t('actions.saved') : t('actions.added'));
        setEditing(null);
    }

    const translatedCarFields: SectionDef = {
        title: 'Core details',
        description:
            'Switch language to edit the translated car copy one locale at a time.',
        render: ({ values, setField, activeLang }) => (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    {[
                        { key: 'name', label: name },
                        { key: 'category', label: category },
                        {
                            key: 'fuel',
                            label: copy('Fuel', 'Carburant', 'الوقود'),
                        },
                        {
                            key: 'transmission',
                            label: copy(
                                'Transmission',
                                'Transmission',
                                'ناقل الحركة',
                            ),
                        },
                    ].map((field) => {
                        const localizedKey = `${field.key}_${activeLang}`;

                        return (
                            <div key={localizedKey} className="space-y-2">
                                <label
                                    htmlFor={localizedKey}
                                    className="text-xs font-semibold text-muted-foreground"
                                >
                                    {field.label.en}
                                    <LangBadge lang={activeLang} />
                                </label>
                                <input
                                    id={localizedKey}
                                    value={String(values[localizedKey] ?? '')}
                                    onChange={(event) =>
                                        setField(
                                            localizedKey,
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                        );
                    })}

                    <div className="space-y-2">
                        <label
                            htmlFor="car-price"
                            className="text-xs font-semibold text-muted-foreground"
                        >
                            {price.en}
                        </label>
                        <input
                            id="car-price"
                            type="number"
                            value={String(values.price ?? '')}
                            onChange={(event) =>
                                setField('price', event.target.value)
                            }
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="car-seats"
                            className="text-xs font-semibold text-muted-foreground"
                        >
                            {seats.en}
                        </label>
                        <input
                            id="car-seats"
                            type="number"
                            value={String(values.seats ?? '')}
                            onChange={(event) =>
                                setField('seats', event.target.value)
                            }
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label
                            htmlFor={`car-description-${activeLang}`}
                            className="text-xs font-semibold text-muted-foreground"
                        >
                            {description.en}
                            <LangBadge lang={activeLang} />
                        </label>
                        <textarea
                            id={`car-description-${activeLang}`}
                            value={String(
                                values[`description_${activeLang}`] ?? '',
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
    };

    const mediaSection: SectionDef = {
        title: 'Media and notes',
        description:
            'Upload media files directly (destination-style) and keep text notes for features and policy.',
        fields: [
            {
                key: 'features',
                label: 'Features (one per line)',
                type: 'textarea',
                rows: 4,
                placeholder: 'Air conditioning\nGPS navigation\nLeather seats',
            },
            {
                key: 'policy',
                label: 'Rental Policy (one per line)',
                type: 'textarea',
                rows: 4,
                placeholder:
                    'Driver age 25+\nFull tank required\nInsurance included',
            },
        ],
        render: ({ values, setField, activeLang }) => (
            <EntityMediaInputs
                values={values}
                setField={setField}
                imageLabel={image[activeLang]}
                galleryLabel={
                    activeLang === 'ar'
                        ? 'المعرض'
                        : activeLang === 'fr'
                          ? 'Galerie'
                          : 'Gallery'
                }
                showImage
                showGallery
            />
        ),
    };

    const carSections = [translatedCarFields, mediaSection];

    return (
        <AdminLayout
            title={title[lang]}
            subtitle={subtitle[lang]}
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
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground"
                                    >
                                        {column.label[lang]}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
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
                                            className="max-w-64 truncate px-4 py-3 text-sm"
                                        >
                                            {String(row[column.key] ?? '')}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
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
                        ? `${t('admin.deleteItemPrompt')} “${String(pendingDelete.name_en ?? pendingDelete.name ?? '')}”? ${t('admin.deleteItemWarning')}`
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

            <EntityFormDialog<Record<string, unknown>>
                open={open}
                onOpenChange={setOpen}
                title={
                    editing
                        ? `${t('actions.edit')} ${title[lang]}`
                        : `${t('actions.add')} ${title[lang]}`
                }
                sections={carSections}
                initial={dialogInitial}
                onSubmit={handleSave}
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
            />
        </AdminLayout>
    );
}
