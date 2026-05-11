import { Plus, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { FieldDef } from '@/components/admin/EntityFormDialog';
import { EntityFormDialog } from '@/components/admin/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { AdminHotel } from '@/hooks/useAdminStore';
import { useAdminStore, generateId } from '@/hooks/useAdminStore';
import { categoryLabels, countryLabels, hotelLabels, localizeKnown } from '@/lib/adminI18n';

const fields: FieldDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'location', label: 'Location' },
    {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: ['Luxury', 'Boutique', 'Resorts', 'Budget', 'Family'],
    },
    { key: 'price', label: 'Price / night (USD)', type: 'number' },
    { key: 'rating', label: 'Rating', type: 'number' },
    { key: 'image', label: 'Image URL' },
];

const AdminHotels = () => {
    useAdminGuard();
    const { state, upsert, remove } = useAdminStore();
    const { lang } = useLanguage();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminHotel | null>(null);

    const { t } = useLanguage();

    const handleSave = (values: AdminHotel) => {
        upsert('hotels', { ...values, id: editing?.id || generateId() });
        toast.success(editing ? t('admin.hotelUpdated') : t('admin.hotelAdded'));
        setEditing(null);
    };

    return (
        <AdminLayout
            title="Hotels"
            subtitle="Manage hotels in your catalog"
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
                                    'Category',
                                    'Price/night',
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
                            {state.hotels.map((d) => (
                                <tr
                                    key={d.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3">
                                        <img
                                            src={d.image}
                                            alt={localizeKnown(d.name, hotelLabels, lang)}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        {localizeKnown(d.name, hotelLabels, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {localizeKnown(d.location, countryLabels, lang)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                            {localizeKnown(d.category, categoryLabels, lang)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        ${d.price}
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
                                                    remove('hotels', d.id);
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

            <EntityFormDialog<AdminHotel>
                open={open}
                onOpenChange={setOpen}
                title={editing ? 'Edit Hotel' : 'Add Hotel'}
                fields={fields}
                initial={editing}
                onSubmit={handleSave}
            />
        </AdminLayout>
    );
};

export default AdminHotels;
