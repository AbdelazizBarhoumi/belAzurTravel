import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
} from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import type { FieldDef, SectionDef } from '@/components/forms/EntityFormDialog';
import { EntityFormDialog } from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { AdminTour } from '@/hooks/useAdminStore';
import type { Lang } from '@/i18n/translations';
import { countryLabels, localizeKnown, tourLabels } from '@/lib/adminI18n';

const fields: FieldDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'location', label: 'Location' },
    { key: 'duration', label: 'Duration' },
    { key: 'price', label: 'Price (USD)', type: 'number' },
    { key: 'rating', label: 'Rating', type: 'number' },
    { key: 'image', label: 'Image URL' },
];

type TourFormContext = {
    values: Record<string, unknown>;
    setField: (key: string, value: unknown) => void;
};

const AdminTours = () => {
    useAdminGuard();
    const queryClient = useQueryClient();
    const { data: tours = [] } = useQuery({
        queryKey: ['admin', 'tours'],
        queryFn: () => listAdminEntities<AdminTour>('tours'),
    });
    const saveMutation = useMutation({
        mutationFn: (item: AdminTour) => saveAdminEntity('tours', item),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('tours', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });
    const { lang } = useLanguage();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminTour | null>(null);
    const [activeLang, setActiveLang] = useState<Lang>('en');
    const [pendingDelete, setPendingDelete] = useState<AdminTour | null>(null);

    const { t } = useLanguage();

    const handleSave = (values: AdminTour) => {
        saveMutation.mutate({ ...values, id: editing?.id || '' });
        toast.success(editing ? t('admin.tourUpdated') : t('admin.tourAdded'));
        setEditing(null);
    };

    const tourSections: SectionDef[] = [
        {
            title: 'Core details',
            description: 'Edit localized tour fields one language at a time.',
            render: ({ values, setField }: TourFormContext) => (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {(['en','fr','ar'] as Lang[]).map((code) => (
                            <Button key={code} type="button" variant={activeLang === code ? 'default' : 'outline'} onClick={() => setActiveLang(code)}>{code.toUpperCase()}</Button>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {['name','location','description'].map((k) => (
                            <div key={k} className="space-y-2">
                                <label htmlFor={`${k}_${activeLang}`} className="text-xs font-semibold text-muted-foreground">{k.replace(/^[a-z]/, s => s.toUpperCase())} ({activeLang.toUpperCase()})</label>
                                <input id={`${k}_${activeLang}`} value={String(values[`${k}_${activeLang}`] ?? '')} onChange={(e) => setField(`${k}_${activeLang}`, e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                            </div>
                        ))}

                        <div className="space-y-2">
                            <label htmlFor="tour-price" className="text-xs font-semibold text-muted-foreground">Price (USD)</label>
                            <input id="tour-price" type="number" value={String(values.price ?? '')} onChange={(e) => setField('price', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Other details',
            fields: [
                { key: 'duration', label: 'Duration' },
                { key: 'rating', label: 'Rating', type: 'number' },
                { key: 'image', label: 'Image URL' },
                {
                    key: 'gallery',
                    label: 'Gallery (one image path per line)',
                    type: 'textarea',
                    rows: 4,
                    placeholder: '/images/tour1.jpg\n/images/tour2.jpg',
                },
            ],
            render: ({ values }: TourFormContext) => {
                const galleryRaw = values.gallery ?? '';
                const items = typeof galleryRaw === 'string'
                    ? galleryRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
                    : [];

                if (items.length === 0) return null;

                return (
                    <div className="space-y-3 border-t border-border pt-4">
                        <h4 className="text-sm font-semibold text-foreground">Gallery preview</h4>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {items.map((src) => (
                                <div key={src} className="overflow-hidden rounded-2xl border border-border bg-background">
                                    <div className="aspect-[4/3] bg-muted"><img src={src} alt={src} className="h-full w-full object-cover"/></div>
                                    <div className="px-3 py-2 text-xs text-muted-foreground">{src}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
        },
    ];

    return (
        <AdminLayout
            title="Tours"
            subtitle="Manage guided tours"
            actions={
                <Button
                    onClick={() => {
                        setEditing(null);
                        setOpen(true);
                    }}
                    className="gap-2 bg-primary text-primary-foreground"
                >
                    <Plus className="h-4 w-4" /> Add
                </Button>
            }
        >
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    'Image',
                                    'Name',
                                    'Location',
                                    'Duration',
                                    'Price',
                                    'Rating',
                                    'Actions',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tours.map((d) => (
                                <tr
                                    key={d.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3">
                                        <img
                                            src={d.image}
                                            alt={localizeKnown(
                                                d.name,
                                                tourLabels,
                                                lang,
                                            )}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        {localizeKnown(
                                            d.name,
                                            tourLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {localizeKnown(
                                            d.location,
                                            countryLabels,
                                            lang,
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {d.duration}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        ${d.price.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {d.rating}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(d);
                                                    setOpen(true);
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => setPendingDelete(d)}
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
                    if (!isOpen) {
                        setPendingDelete(null);
                    }
                }}
                title={t('admin.deleteItemTitle')}
                description={
                    pendingDelete
                        ? `${t('admin.deleteItemPrompt')} “${localizeKnown(pendingDelete.name, tourLabels, lang)}”? ${t('admin.deleteItemWarning')}`
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

            <EntityFormDialog<Record<string, unknown>>
                open={open}
                onOpenChange={setOpen}
                title={editing ? 'Edit Tour' : 'Add Tour'}
                sections={tourSections}
                initial={editing as unknown as Record<string, unknown> | undefined}
                onSubmit={(values) => handleSave(values as unknown as AdminTour)}
                languages={['en','fr','ar']}
                layout="grid-2"
            />
        </AdminLayout>
    );
};

export default AdminTours;
