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
import {
    EntityFormDialog,
    type FieldDef,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import EntityMediaInputs from '@/components/forms/EntityMediaInputs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';

type Copy = Record<Lang, string>;

const copy = (en: string, fr: string, ar: string): Copy => ({ en, fr, ar });

function localizedFields(base: string, label: Copy, type?: FieldDef['type']) {
    return [
        { key: `${base}_en`, label: `${label.en} (EN)`, type, required: true },
        { key: `${base}_fr`, label: `${label.fr} (FR)`, type, required: true },
        { key: `${base}_ar`, label: `${label.ar} (AR)`, type, required: true },
    ];
}

const title = copy('Events', 'Événements', 'الفعاليات');
const subtitle = copy(
    'Manage hosted travel events',
    'Gérer les événements de voyage',
    'إدارة فعاليات السفر',
);
const price = copy('Price', 'Prix', 'السعر');
const location = copy('Location', 'Localisation', 'الموقع');

const columns: Array<{ key: string; label: Copy }> = [
    { key: 'title_en', label: copy('Title', 'Titre', 'العنوان') },
    { key: 'location_en', label: location },
    { key: 'date_en', label: copy('Date', 'Date', 'التاريخ') },
    { key: 'price', label: price },
];

const sections: SectionDef[] = [
    {
        title: 'Core information',
        description:
            'Title, location and date appear in the event cards and schedule list.',
        columns: 2,
        fields: [
            ...localizedFields('title', copy('Title', 'Titre', 'العنوان')),
            ...localizedFields('location', location),
            ...localizedFields('date', copy('Date', 'Date', 'التاريخ')),
            { key: 'price', label: price.en, type: 'number' },
        ],
    },
    {
        title: 'Media and description',
        description: 'Image and detail copy for the event detail page.',
        fields: [
            {
                key: 'image',
                label: copy(
                    'Server image path',
                    'Chemin image serveur',
                    'مسار صورة الخادم',
                ).en,
            },
            ...localizedFields(
                'description',
                copy('Description', 'Description', 'الوصف'),
                'textarea',
            ),
        ],
    },
];

export default function AdminEvents() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

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
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('events', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    function mapRowToInitial(row: AdminRow | null): AdminRow | null {
        if (!row) return null;
        return {
            ...row,
            imagePath: (row.image as string) ?? '',
            imageFile: null,
            galleryPaths: Array.isArray(row.gallery)
                ? (row.gallery as string[])
                : row.gallery
                  ? String(row.gallery).split('\n')
                  : [],
            galleryFiles: [],
            schedule: row.schedule
                ? typeof row.schedule === 'string'
                    ? row.schedule
                    : JSON.stringify(row.schedule)
                : '',
        } as unknown as AdminRow;
    }

    function handleSave(values: AdminRow) {
        const payload = {
            ...(values || {}),
            id: editing?.id ?? '',
            image:
                (values.imageFile as unknown as File) ?? values.imagePath ?? '',
            gallery: Array.isArray(values.galleryPaths)
                ? (values.galleryPaths as string[]).join('\n')
                : (values.gallery ?? ''),
            gallery_files:
                (values.galleryFiles as unknown as File[]) ?? undefined,
            schedule: values.schedule ?? '',
        } as unknown as AdminRow;

        saveMutation.mutate(payload);
        toast.success(editing ? t('actions.saved') : t('actions.added'));
        setEditing(null);
    }

    const eventSections: SectionDef[] = [
        {
            title: 'Core information',
            description: 'Edit localized event fields one language at a time.',
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {['title', 'location', 'date'].map((k) => (
                            <div key={k} className="space-y-2">
                                <label
                                    htmlFor={`${k}_${activeLang}`}
                                    className="text-xs font-semibold text-muted-foreground"
                                >
                                    {k.replace(/^[a-z]/, (s) =>
                                        s.toUpperCase(),
                                    )}{' '}
                                    ({activeLang.toUpperCase()})
                                </label>
                                <input
                                    id={`${k}_${activeLang}`}
                                    value={String(
                                        values[`${k}_${activeLang}`] ?? '',
                                    )}
                                    onChange={(e) =>
                                        setField(
                                            `${k}_${activeLang}`,
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        ))}

                        <div className="space-y-2">
                            <label
                                htmlFor="event-price"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {price[lang]}
                            </label>
                            <input
                                id="event-price"
                                type="number"
                                value={String(values.price ?? '')}
                                onChange={(e) =>
                                    setField('price', e.target.value)
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Media and description',
            description: 'Image and detail copy for the event detail page.',
            render: ({ values, setField }) => (
                <div>
                    <EntityMediaInputs
                        showImage
                        showGallery
                        imageLabel="Main image"
                        galleryLabel="Gallery"
                        values={values}
                        setField={(k, v) => setField(k as string, v)}
                    />

                    <div className="mt-4">
                        <label className="text-xs font-semibold text-muted-foreground">
                            Schedule (JSON)
                        </label>
                        <textarea
                            value={String(values.schedule ?? '')}
                            onChange={(e) =>
                                setField('schedule', e.target.value)
                            }
                            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            rows={6}
                            placeholder='[{ "day": {"en":"Day 1"}, "activity": {"en":"Arrival"}, "details": {"en":"..."} }]'
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Provide schedule as JSON array or leave empty.
                        </p>
                    </div>
                </div>
            ),
        },
    ];

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
                            {rows.map((row: AdminRow) => (
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
                                                    setEditing(
                                                        mapRowToInitial(row),
                                                    );
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

            <EntityFormDialog<AdminRow>
                open={open}
                onOpenChange={setOpen}
                title={
                    editing
                        ? `${t('actions.edit')} ${title[lang]}`
                        : `${t('actions.add')} ${title[lang]}`
                }
                sections={eventSections}
                initial={editing}
                onSubmit={handleSave}
                languages={['en', 'fr', 'ar']}
            />
        </AdminLayout>
    );
}
