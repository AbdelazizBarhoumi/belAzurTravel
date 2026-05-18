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
import { EntityFormDialog } from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';

type Copy = Record<Lang, string>;

const copy = (en: string, fr: string, ar: string): Copy => ({ en, fr, ar });

const title = copy('Blog', 'Blog', 'المدونة');
const subtitle = copy(
    'Manage blog posts',
    'Gérer les articles',
    'إدارة المقالات',
);

const columns: Array<{ key: string; label: Copy }> = [
    { key: 'title_en', label: copy('Title', 'Titre', 'العنوان') },
    { key: 'date', label: copy('Date', 'Date', 'التاريخ') },
    { key: 'category_en', label: copy('Category', 'Catégorie', 'الفئة') },
];

export default function AdminBlog() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const queryKey = useMemo(() => ['admin', 'blog-posts'], []);
    const { data: rows = [] } = useQuery<AdminRow[]>({
        queryKey,
        queryFn: () => listAdminEntities<AdminRow>('blog-posts'),
    });

    const saveMutation = useMutation({
        mutationFn: (row: Record<string, unknown>) =>
            saveAdminEntity('blog-posts', row as { id?: string | number | null }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('blog-posts', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    function handleSave(values: Record<string, unknown>) {
        saveMutation.mutate({ ...values, id: editing?.id ?? '' });
        toast.success(editing ? t('actions.saved') : t('actions.added'));
        setEditing(null);
    }

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
                                                onClick={() => setPendingDelete(row)}
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

            <EntityFormDialog
                open={open}
                onOpenChange={setOpen}
                title={
                    editing
                        ? `${t('actions.edit')} ${title[lang]}`
                        : `${t('actions.add')} ${title[lang]}`
                }
                layout="grid-2"
                initial={editing ?? undefined}
                sections={[
                    {
                        title: 'Core information',
                        columns: 2,
                        fields: [
                            { key: 'title_en', label: 'Title (EN)', type: 'text', required: true },
                            { key: 'title_fr', label: 'Title (FR)', type: 'text', required: true },
                            { key: 'title_ar', label: 'Title (AR)', type: 'text', required: true },
                            { key: 'date', label: 'Date', type: 'text' },
                            { key: 'category_en', label: 'Category (EN)', type: 'text' },
                            { key: 'category_fr', label: 'Category (FR)', type: 'text' },
                            { key: 'category_ar', label: 'Category (AR)', type: 'text' },
                        ],
                        render: ({ values, setField }) => {
                            const imageValue = values.image as string | File | undefined;
                            const imagePreview = imageValue instanceof File ? URL.createObjectURL(imageValue) : (typeof imageValue === 'string' ? imageValue : values.imagePath as string | undefined);

                            return (
                                <div className="md:col-span-2 space-y-3">
                                    <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
                                        <img src={imagePreview} alt={String(values.title_en ?? '')} className="w-full h-auto object-cover" />
                                    </div>
                                    <input type="file" accept="image/*" onChange={(e) => setField('image', e.target.files?.[0] ?? null)} />
                                </div>
                            );
                        },
                    },
                    {
                        title: 'Summary and body',
                        columns: 3,
                        render: ({ values, setField }) => {
                            const content = (values.content as any) || { body: { en: '', fr: '', ar: '' }, sections: [] };

                            const updateBody = (lang: string, next: string) => {
                                setField('content', { ...content, body: { ...content.body, [lang]: next } });
                            };

                            return (
                                <div className="md:col-span-2 space-y-4">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <textarea value={String(values.excerpt_en ?? '')} onChange={(e) => setField('excerpt_en', e.target.value)} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                                        <textarea value={String(values.excerpt_fr ?? '')} onChange={(e) => setField('excerpt_fr', e.target.value)} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                                        <textarea value={String(values.excerpt_ar ?? '')} onChange={(e) => setField('excerpt_ar', e.target.value)} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <textarea value={String(content.body.en ?? '')} onChange={(e) => updateBody('en', e.target.value)} className="min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Write the full article body in English..." />
                                        <textarea value={String(content.body.fr ?? '')} onChange={(e) => updateBody('fr', e.target.value)} className="min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Rédigez le corps complet de l'article en français..." />
                                        <textarea value={String(content.body.ar ?? '')} onChange={(e) => updateBody('ar', e.target.value)} className="min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="اكتب نص المقال الكامل بالعربية..." />
                                    </div>
                                </div>
                            );
                        },
                    },
                    {
                        title: 'Content sections',
                        render: ({ values, setField }) => {
                            const content = (values.content as any) || { body: { en: '', fr: '', ar: '' }, sections: [] };

                            const addSection = () => setField('content', { ...content, sections: [...(content.sections || []), { id: `section-${Math.random().toString(36).slice(2,9)}`, heading: { en: '', fr: '', ar: '' }, body: { en: '', fr: '', ar: '' } }] });
                            const removeSection = (index: number) => setField('content', { ...content, sections: (content.sections || []).filter((_: any, i: number) => i !== index) });
                            const moveSection = (from: number, to: number) => {
                                const sections = [...(content.sections || [])];
                                if (to < 0 || to >= sections.length) return;
                                const [moved] = sections.splice(from, 1);
                                sections.splice(to, 0, moved);
                                setField('content', { ...content, sections });
                            };
                            const updateSection = (index: number, part: 'heading'|'body', lang: string, next: string) => {
                                const sections = (content.sections || []).map((s: any, i: number) => i === index ? { ...s, [part]: { ...(s[part]||{}), [lang]: next } } : s);
                                setField('content', { ...content, sections });
                            };

                            return (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-foreground">Content sections</h3>
                                        <button type="button" onClick={addSection} className="text-sm">Add section</button>
                                    </div>

                                    {(!content.sections || content.sections.length === 0) ? (
                                        <p className="text-sm text-muted-foreground">No extra sections yet. Add one if this article needs more detail.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {(content.sections || []).map((section: any, index: number) => (
                                                <div key={section.id ?? index} className="space-y-4 rounded-xl border border-border bg-background p-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-semibold text-foreground">Section {index + 1}</h4>
                                                        <div className="flex items-center gap-1">
                                                            <button type="button" onClick={() => moveSection(index, index - 1)} disabled={index === 0}>↑</button>
                                                            <button type="button" onClick={() => moveSection(index, index + 1)} disabled={index === (content.sections || []).length - 1}>↓</button>
                                                            <button type="button" onClick={() => removeSection(index)} className="text-destructive">Remove</button>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-3">
                                                        <input value={section.heading.en} onChange={(e) => updateSection(index, 'heading', 'en', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                                                        <input value={section.heading.fr} onChange={(e) => updateSection(index, 'heading', 'fr', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                                                        <input value={section.heading.ar} onChange={(e) => updateSection(index, 'heading', 'ar', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-3">
                                                        <textarea value={section.body.en} onChange={(e) => updateSection(index, 'body', 'en', e.target.value)} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                                                        <textarea value={section.body.fr} onChange={(e) => updateSection(index, 'body', 'fr', e.target.value)} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                                                        <textarea value={section.body.ar} onChange={(e) => updateSection(index, 'body', 'ar', e.target.value)} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        },
                    },
                ]}
                onSubmit={(values) => {
                    // normalize payload similar to BlogAdminForm.handleSubmit
                    const content = values.content ?? { body: { en: '', fr: '', ar: '' }, sections: [] };
                    const imageValue = values.image as unknown;
                    const payload: Record<string, unknown> = {
                        ...values,
                        image:
                            typeof imageValue === 'object' && imageValue instanceof File
                                ? imageValue
                                : values.imagePath ?? values.image ?? '',
                        content,
                    };

                    handleSave(payload);
                }}
            />
        </AdminLayout>
    );
}

