import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    EntityFormDialog,
    FieldDef,
} from '@/components/admin/EntityFormDialog';
import { useAdminStore, generateId } from '@/hooks/useAdminStore';
import type { AdminGalleryItem } from '@/types/admin';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useLanguage } from '@/contexts/LanguageContext';
import { tField } from '@/lib/i18n-field';
import { toast } from 'sonner';

const CATEGORIES = [
    'All',
    'Beach',
    'City',
    'Nature',
    'Luxury',
    'Adventure',
    'Culture',
];

const fields: FieldDef[] = [
    { key: 'title', label: 'Title (FR / AR / EN)', type: 'i18n' },
    {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: CATEGORIES.filter((c) => c !== 'All'),
    },
    { key: 'image', label: 'Image', type: 'image' },
];

const AdminGallery = () => {
    useAdminGuard();
    const { lang } = useLanguage();
    const { state, upsert, remove } = useAdminStore();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminGalleryItem | null>(null);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [filter, setFilter] = useState('All');
    const [query, setQuery] = useState('');

    const items = useMemo(() => {
        return state.gallery.filter((g) => {
            const matchCat = filter === 'All' || g.category === filter;
            const title = tField(g.title as any, lang).toLowerCase();
            const matchQ = !query || title.includes(query.toLowerCase());
            return matchCat && matchQ;
        });
    }, [state.gallery, filter, query, lang]);

    const handleSave = (values: any) => {
        if (!values.image) {
            toast.error('Image is required');
            return;
        }
        upsert('gallery', { ...values, id: editing?.id || generateId() });
        toast.success(editing ? 'Image updated' : 'Image added');
        setEditing(null);
    };

    const handleEdit = (it: AdminGalleryItem) => {
        setEditing(it);
        setOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this image?')) {
            remove('gallery', id);
            toast.success('Image deleted');
        }
    };

    return (
        <AdminLayout
            title="Gallery"
            subtitle={`${state.gallery.length} images in your library`}
            actions={
                <Button
                    onClick={() => {
                        setEditing(null);
                        setOpen(true);
                    }}
                    className="gap-2 bg-primary text-primary-foreground"
                >
                    <Plus className="h-4 w-4" /> Add Image
                </Button>
            }
        >
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by title..."
                        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            onClick={() => setFilter(c)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1 rounded-lg border border-border p-1">
                    <button
                        onClick={() => setView('grid')}
                        className={`rounded p-1.5 ${view === 'grid' ? 'bg-muted' : ''}`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`rounded p-1.5 ${view === 'list' ? 'bg-muted' : ''}`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                    No images match your filters. Click "Add Image" to upload
                    one.
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((it) => (
                        <div
                            key={it.id}
                            className="group relative overflow-hidden rounded-2xl border border-border bg-card"
                        >
                            <div className="aspect-square overflow-hidden bg-muted">
                                <img
                                    src={it.image}
                                    alt={tField(it.title as any, lang)}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                            </div>
                            <div className="p-3">
                                <div className="truncate text-sm font-semibold">
                                    {tField(it.title as any, lang)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {it.category}
                                </div>
                            </div>
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                    onClick={() => handleEdit(it)}
                                    className="rounded-lg bg-card/90 p-1.5 backdrop-blur hover:bg-card"
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(it.id)}
                                    className="rounded-lg bg-card/90 p-1.5 backdrop-blur hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                    Image
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                    Title
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr
                                    key={it.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3">
                                        <img
                                            src={it.image}
                                            alt=""
                                            className="h-16 w-16 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        {tField(it.title as any, lang)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                            {it.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(it)}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(it.id)
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
            )}

            <EntityFormDialog
                open={open}
                onOpenChange={setOpen}
                title={editing ? 'Edit Image' : 'Add Image'}
                fields={fields}
                initial={editing}
                onSubmit={handleSave}
            />
        </AdminLayout>
    );
};

export default AdminGallery;
