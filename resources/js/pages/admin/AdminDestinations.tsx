import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteAdminEntity, listAdminEntities, saveAdminEntity } from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
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

const AdminDestinations = () => {
    useAdminGuard();

    const queryClient = useQueryClient();
    const { t, lang } = useLanguage();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminDestination | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminDestination | null>(null);

    const { data: destinations = [] } = useQuery({
        queryKey: ['admin', 'destinations'],
        queryFn: () => listAdminEntities<AdminDestination>('destinations'),
    });

    const saveMutation = useMutation({
        mutationFn: (item: AdminDestination) => saveAdminEntity('destinations', item),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('destinations', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });

    const handleSave = (values: AdminDestination) => {
        const item = { ...values, id: editing?.id || '' };
        saveMutation.mutate(item);
        toast.success(editing ? t('admin.destinationUpdated') : t('admin.destinationAdded'));
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
                                            alt={localizeKnown(destination.name, destinationLabels, lang)}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        {localizeKnown(destination.name, destinationLabels, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {localizeKnown(destination.country, countryLabels, lang)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                            {localizeKnown(destination.category, categoryLabels, lang)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        ${destination.price.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{destination.rating}</td>
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
                                                onClick={() => setPendingDelete(destination)}
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
                title={editing ? t('admin.destinationEditTitle') : t('admin.destinationAddTitle')}
                subtitle={t('admin.destinationForm.helper')}
                languages={["en", "fr", "ar"]}
                layout="grid-2"
                initial={editing as unknown as Record<string, unknown> | undefined}
                sections={[
                    {
                        title: t('admin.destinationForm.coreInformation'),
                        description: t('admin.destinationForm.coreInformationHint'),
                        columns: 2,
                        fields: [
                            { key: 'name_en', label: t('admin.destinationForm.name'), type: 'text', required: true },
                            { key: 'country_en', label: t('admin.destinationForm.country'), type: 'text', required: true },
                            { key: 'category_en', label: t('admin.destinationForm.category'), type: 'select', options: Object.keys(categoryLabels).map(k => ({ label: categoryLabels[k as keyof typeof categoryLabels].en ?? String(k), value: String(k) })), required: true },
                            { key: 'price', label: t('admin.destinationForm.price'), type: 'number', required: true },
                            { key: 'rating', label: t('admin.destinationForm.rating'), type: 'number' },
                        ],
                    },
                    {
                        title: t('admin.destinationForm.mediaAndHighlights'),
                        description: t('admin.destinationForm.mediaAndHighlightsHint'),
                        render: ({ values, setField }) => {
                            const imageValue = values.image as string | File | undefined;
                            const imagePreview = imageValue instanceof File ? URL.createObjectURL(imageValue) : (typeof imageValue === 'string' ? imageValue : values.imagePath as string | undefined);

                            return (
                                <div className="space-y-3">
                                    <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
                                        <img src={imagePreview} alt={String(values.name_en ?? '')} className="w-full h-auto object-cover" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground">{t('admin.destinationForm.image')}</label>
                                        <input
                                            type="text"
                                            value={String(values.imagePath ?? values.image ?? '')}
                                            onChange={(e) => setField('imagePath', e.target.value)}
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setField('image', e.target.files?.[0] ?? null)}
                                            className="w-full"
                                        />
                                        <p className="text-xs text-muted-foreground">{t('admin.destinationForm.imageHelper')}</p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground">{t('admin.destinationForm.highlights')}</label>
                                        <textarea
                                            value={String((values.highlights as string) ?? '')}
                                            onChange={(e) => setField('highlights', e.target.value)}
                                            className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-muted-foreground">{t('admin.destinationForm.gallery')}</label>
                                            <span className="text-xs text-muted-foreground">{t('admin.destinationForm.galleryUploadHint')}</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => setField('gallery_files', Array.from(e.target.files ?? []))}
                                            className="w-full"
                                        />
                                        <textarea
                                            value={Array.isArray(values.gallery) ? (values.gallery as string[]).join('\n') : String(values.gallery ?? '')}
                                            onChange={(e) => setField('gallery', e.target.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean))}
                                            className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-2"
                                        />
                                    </div>
                                </div>
                            );
                        },
                    },
                    {
                        title: t('admin.destinationForm.destinationFacts'),
                        columns: 4,
                        fields: [
                            { key: 'bestTime_en', label: t('admin.destinationForm.bestTime'), type: 'text' },
                            { key: 'language_en', label: t('admin.destinationForm.language'), type: 'text' },
                            { key: 'currency_en', label: t('admin.destinationForm.currency'), type: 'text' },
                            { key: 'weather_en', label: t('admin.destinationForm.weather'), type: 'text' },
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
                        image: values.image ?? values.imagePath ?? '',
                        highlights: values.highlights ?? '',
                        gallery: Array.isArray(values.gallery) ? (values.gallery as string[]).join('\n') : values.gallery ?? '',
                        // If files were uploaded via gallery_files or image (File), keep them as-is so admin.api sends FormData
                        gallery_files: values.gallery_files ?? undefined,
                    } as unknown as AdminDestination;

                    saveMutation.mutate(item);
                    toast.success(editing ? t('admin.destinationUpdated') : t('admin.destinationAdded'));
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
