import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
} from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import { EntityFormDialog } from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { AdminDestination } from '@/hooks/useAdminStore';
import {
    categoryLabels,
    countryLabels,
    destinationLabels,
    localizeKnown,
} from '@/lib/adminI18n';

type DestinationFormValues = AdminDestination & {
    imagePath?: string;
    imageFile?: File | null;
    galleryPaths?: string[];
    galleryFiles?: File[];
};

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

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

const AdminDestinations = () => {
    useAdminGuard();

    const queryClient = useQueryClient();
    const { t, lang } = useLanguage();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminDestination | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminDestination | null>(
        null,
    );
    const dialogInitial: DestinationFormValues | null = editing
        ? ({
              ...editing,
              imagePath: asText(editing.image),
              imageFile: null,
              galleryPaths: parseGallery(editing.gallery),
              galleryFiles: [],
          } as DestinationFormValues)
        : null;

    const { data: destinations = [] } = useQuery({
        queryKey: ['admin', 'destinations'],
        queryFn: () => listAdminEntities<AdminDestination>('destinations'),
    });

    const saveMutation = useMutation({
        mutationFn: (item: AdminDestination) =>
            saveAdminEntity('destinations', item),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('destinations', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });

    const handleSave = (values: DestinationFormValues) => {
        const item: Record<string, unknown> = {
            ...values,
            id: editing?.id || '',
            image:
                values.imageFile instanceof File
                    ? values.imageFile
                    : (values.imagePath ?? values.image ?? ''),
            gallery: Array.isArray(values.galleryPaths)
                ? values.galleryPaths
                      .filter(
                          (item): item is string => typeof item === 'string',
                      )
                      .join('\n')
                : (values.gallery ?? ''),
        };

        if (
            Array.isArray(values.galleryFiles) &&
            values.galleryFiles.length > 0
        ) {
            item.gallery_files = values.galleryFiles;
        }

        saveMutation.mutate(item as unknown as AdminDestination);
        toast.success(
            editing
                ? t('admin.destinationUpdated')
                : t('admin.destinationAdded'),
        );
        setEditing(null);
    };

    return (
        <AdminLayout
            title={t('admin.destinations')}
            subtitle={t('admin.destinationsSubtitle')}
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
                                    t('admin.destinationTable.image'),
                                    t('admin.destinationTable.name'),
                                    t('admin.destinationTable.country'),
                                    t('admin.destinationTable.category'),
                                    t('admin.destinationTable.price'),
                                    t('admin.destinationTable.rating'),
                                    t('admin.destinationTable.actions'),
                                ].map((header) => (
                                    <th
                                        key={header}
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {destinations.map((destination) => (
                                <tr
                                    key={destination.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3">
                                        <img
                                            src={destination.image}
                                            alt={localizeKnown(
                                                destination.name,
                                                destinationLabels,
                                                lang,
                                            )}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        {localizeKnown(
                                            destination.name,
                                            destinationLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {localizeKnown(
                                            destination.country,
                                            countryLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                            {localizeKnown(
                                                destination.category,
                                                categoryLabels,
                                                lang,
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        ${destination.price.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {destination.rating}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(destination);
                                                    setOpen(true);
                                                }}
                                                aria-label={`${t('actions.edit')} ${localizeKnown(
                                                    destination.name,
                                                    destinationLabels,
                                                    lang,
                                                )}`}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPendingDelete(
                                                        destination,
                                                    )
                                                }
                                                aria-label={`${t('actions.delete')} ${localizeKnown(
                                                    destination.name,
                                                    destinationLabels,
                                                    lang,
                                                )}`}
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

            <EntityFormDialog
                open={open}
                onOpenChange={setOpen}
                title={
                    editing
                        ? t('admin.destinationEditTitle')
                        : t('admin.destinationAddTitle')
                }
                subtitle={t('admin.destinationForm.helper')}
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
                initial={
                    dialogInitial as unknown as
                        | Record<string, unknown>
                        | undefined
                }
                sections={[
                    {
                        title: t('admin.destinationForm.coreInformation'),
                        description: t(
                            'admin.destinationForm.coreInformationHint',
                        ),
                        columns: 2,
                        fields: [
                            {
                                key: 'name_en',
                                label: t('admin.destinationForm.name'),
                                type: 'text',
                                required: true,
                            },
                            {
                                key: 'country_en',
                                label: t('admin.destinationForm.country'),
                                type: 'text',
                                required: true,
                            },
                            {
                                key: 'category_en',
                                label: t('admin.destinationForm.category'),
                                type: 'select',
                                options: Object.keys(categoryLabels).map(
                                    (k) => ({
                                        label:
                                            categoryLabels[
                                                k as keyof typeof categoryLabels
                                            ].en ?? String(k),
                                        value: String(k),
                                    }),
                                ),
                                required: true,
                            },
                            {
                                key: 'price',
                                label: t('admin.destinationForm.price'),
                                type: 'number',
                                required: true,
                            },
                            {
                                key: 'rating',
                                label: t('admin.destinationForm.rating'),
                                type: 'number',
                            },
                        ],
                    },
                    {
                        title: t('admin.destinationForm.mediaAndHighlights'),
                        description: t(
                            'admin.destinationForm.mediaAndHighlightsHint',
                        ),
                        render: ({ values, setField }) => (
                            <div className="space-y-6">
                                <EntityMediaInputs
                                    values={values}
                                    setField={setField}
                                    imageLabel={t(
                                        'admin.destinationForm.image',
                                    )}
                                    galleryLabel={t(
                                        'admin.destinationForm.gallery',
                                    )}
                                    showImage
                                    showGallery
                                />

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">
                                        {t('admin.destinationForm.highlights')}
                                    </label>
                                    <textarea
                                        value={String(
                                            (values.highlights as string) ?? '',
                                        )}
                                        onChange={(e) =>
                                            setField(
                                                'highlights',
                                                e.target.value,
                                            )
                                        }
                                        className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                        ),
                    },
                    {
                        title: t('admin.destinationForm.destinationFacts'),
                        columns: 4,
                        fields: [
                            {
                                key: 'bestTime_en',
                                label: t('admin.destinationForm.bestTime'),
                                type: 'text',
                            },
                            {
                                key: 'language_en',
                                label: t('admin.destinationForm.language'),
                                type: 'text',
                            },
                            {
                                key: 'currency_en',
                                label: t('admin.destinationForm.currency'),
                                type: 'text',
                            },
                            {
                                key: 'weather_en',
                                label: t('admin.destinationForm.weather'),
                                type: 'text',
                            },
                        ],
                        gridSpan: 2,
                    },
                ]}
                onSubmit={(values) => {
                    const item = {
                        ...values,
                        id: editing?.id ?? '',
                        name: values.name_en ?? '',
                        name_en: values.name_en ?? '',
                        name_fr: values.name_fr ?? '',
                        name_ar: values.name_ar ?? '',
                        country: values.country_en ?? '',
                        country_en: values.country_en ?? '',
                        country_fr: values.country_fr ?? '',
                        country_ar: values.country_ar ?? '',
                        category: values.category_en ?? '',
                        category_en: values.category_en ?? '',
                        category_fr: values.category_fr ?? '',
                        category_ar: values.category_ar ?? '',
                        price: Number(values.price) || 0,
                        rating: Number(values.rating) || 0,
                        image:
                            values.imageFile instanceof File
                                ? values.imageFile
                                : (values.imagePath ?? values.image ?? ''),
                        highlights: values.highlights ?? '',
                        gallery: Array.isArray(values.galleryPaths)
                            ? (values.galleryPaths as string[]).join('\n')
                            : (values.gallery ?? ''),
                        gallery_files: values.galleryFiles ?? undefined,
                    } as unknown as AdminDestination;

                    saveMutation.mutate(item);
                    toast.success(
                        editing
                            ? t('admin.destinationUpdated')
                            : t('admin.destinationAdded'),
                    );
                    setEditing(null);
                }}
            />

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
                        ? `${t('admin.deleteItemPrompt')} “${localizeKnown(
                              pendingDelete.name,
                              destinationLabels,
                              lang,
                          )}”? ${t('admin.deleteItemWarning')}`
                        : t('admin.deleteItemFallback')
                }
                confirmText={t('actions.delete')}
                cancelText={t('actions.cancel')}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    deleteMutation.mutate(pendingDelete.id);
                    setPendingDelete(null);
                }}
            />
        </AdminLayout>
    );
};

export default AdminDestinations;
