import { Plus, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { FieldDef } from '@/components/admin/EntityFormDialog';
import { EntityFormDialog } from '@/components/admin/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { AdminTour } from '@/hooks/useAdminStore';
import { useAdminStore, generateId } from '@/hooks/useAdminStore';
import { countryLabels, localizeKnown, tourLabels } from '@/lib/adminI18n';

const fields: FieldDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'location', label: 'Location' },
    { key: 'duration', label: 'Duration' },
    { key: 'price', label: 'Price (USD)', type: 'number' },
    { key: 'rating', label: 'Rating', type: 'number' },
    { key: 'image', label: 'Image URL' },
];

const AdminTours = () => {
    useAdminGuard();
    const { state, upsert, remove } = useAdminStore();
    const { lang } = useLanguage();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminTour | null>(null);

    const { t } = useLanguage();

    const handleSave = (values: AdminTour) => {
        upsert('tours', { ...values, id: editing?.id || generateId() });
        toast.success(editing ? t('admin.tourUpdated') : t('admin.tourAdded'));
        setEditing(null);
    };

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
                            {state.tours.map((d) => (
                                <tr
                                    key={d.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3">
                                        <img
                                            src={d.image}
                                            alt={localizeKnown(d.name, tourLabels, lang)}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        {localizeKnown(d.name, tourLabels, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {localizeKnown(d.location, countryLabels, lang)}
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
                                                    onClick={() => {
                                                    remove('tours', d.id);
                                                    toast.success(t('actions.deleted'));
                                                }}
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

            <EntityFormDialog<AdminTour>
                open={open}
                onOpenChange={setOpen}
                title={editing ? 'Edit Tour' : 'Add Tour'}
                fields={fields}
                initial={editing}
                onSubmit={handleSave}
            />
        </AdminLayout>
    );
};

export default AdminTours;
