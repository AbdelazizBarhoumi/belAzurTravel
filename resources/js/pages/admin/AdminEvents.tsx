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
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import EntityMediaInputs from '@/components/forms/EntityMediaInputs';
import LangBadge from '@/components/forms/LangBadge';
import { JsonListEditor, type JsonFieldDef } from '@/components/forms/JsonListEditor';
import { DatePicker } from '@/components/ui/DatePicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';

export default function AdminEvents() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (values: AdminRow) => {
        const errs: Record<string, string> = {};
        if (!values.title_en) errs.title_en = t('admin.error.required');
        if (!values.location_en) errs.location_en = t('admin.error.required');
        if (!values.date) errs.date = t('admin.error.required');
        if (!values.price || Number(values.price) <= 0) errs.price = t('admin.error.invalidPrice');
        return errs;
    };

    const scheduleSchema = useMemo((): JsonFieldDef[] => [
        { key: 'day', label: t('admin.day'), translatable: true },
        { key: 'activity', label: t('admin.activity'), translatable: true },
        { key: 'details', label: t('admin.details'), type: 'textarea', translatable: true },
    ], [t]);


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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            setErrors({});
            setEditing(null);
            setOpen(false);
            toast.success(editing ? t('actions.saved') : t('actions.added'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('events', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    const dialogInitial = useMemo(() => {
        if (!editing) return null;
        
        let schedule = [];
        try {
            schedule = typeof editing.schedule === 'string' 
                ? JSON.parse(editing.schedule) 
                : (Array.isArray(editing.schedule) ? editing.schedule : []);
        } catch {
            schedule = [];
        }

        return {
            ...editing,
            imagePath: (editing.image as string) ?? '',
            imageFile: null,
            galleryPaths: Array.isArray(editing.gallery)
                ? (editing.gallery as string[])
                : [],
            galleryFiles: [],
            schedule,
        };
    }, [editing]);

    function handleSave(values: AdminRow) {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        const payload = {
            ...(values || {}),
            id: editing?.id ?? '',
            image:
                (values.imageFile as unknown as File) ?? values.imagePath ?? '',
            gallery: Array.isArray(values.galleryPaths)
                ? (values.galleryPaths as string[])
                : [],
            gallery_files:
                (values.galleryFiles as unknown as File[]) ?? undefined,
            details: {
                schedule: values.schedule ?? [],
            },
        } as unknown as AdminRow;

        saveMutation.mutate(payload);
    }

    const eventSections: SectionDef[] = [
        {
            title: t('admin.eventForm.coreDetails'),
            description: t('admin.eventForm.coreDetailsHint'),
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { key: 'title', label: t('admin.title') },
                            { key: 'location', label: t('admin.location') },
                        ].map((field) => {
                            const fieldKey = `${field.key}_${activeLang}`;
                            return (
                                <div key={fieldKey} className="space-y-2">
                                    <label
                                        htmlFor={fieldKey}
                                        className="text-xs font-semibold text-muted-foreground"
                                    >
                                        {field.label}
                                        <LangBadge lang={activeLang} />
                                    </label>
                                    <input
                                        id={fieldKey}
                                        value={String(values[fieldKey] ?? '')}
                                        onChange={(e) =>
                                            setField(fieldKey, e.target.value)
                                        }
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                            );
                        })}

                        <div className="space-y-2">
                            <label
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.date')}
                            </label>
                            <DatePicker
                                date={values.date ? new Date(values.date as string) : undefined}
                                onDateChange={(date) =>
                                    setField(
                                        'date',
                                        date ? date.toISOString().split('T')[0] : '',
                                    )
                                }
                                placeholder={t('admin.date')}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                {t('admin.price')}
                            </label>
                            <input
                                type="number"
                                value={String(values.price ?? '')}
                                onChange={(e) => setField('price', e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor={`description_${activeLang}`}
                            className="text-xs font-semibold text-muted-foreground"
                        >
                            {t('admin.description')}
                            <LangBadge lang={activeLang} />
                        </label>
                        <textarea
                            id={`description_${activeLang}`}
                            value={String(values[`description_${activeLang}`] ?? '')}
                            onChange={(e) => setField(`description_${activeLang}`, e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.eventForm.schedule'),
            column: 'main',
            render: ({ values, setField, activeLang }) => (
                <JsonListEditor
                    title={t('admin.eventForm.schedule')}
                    items={Array.isArray(values.schedule) ? values.schedule : []}
                    onItemsChange={(items) => setField('schedule', items)}
                    schema={scheduleSchema}
                    activeLang={activeLang}
                    addButtonLabel={t('admin.eventForm.addDay')}
                    itemLabel={(item, index) => 
                        (item.day as Record<string, string> | undefined)?.[activeLang] || `${t('admin.day')} ${index + 1}`
                    }
                />
            ),
        },
    ];

    return (
        <AdminLayout
            title={t('admin.events')}
            subtitle={t('admin.eventsSubtitle')}
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
                                    { key: 'image', label: t('admin.image') },
                                    { key: 'title', label: t('admin.title') },
                                    { key: 'location', label: t('admin.location') },
                                    { key: 'date', label: t('admin.date') },
                                    { key: 'price', label: t('admin.price') },
                                    { key: 'actions', label: t('admin.actions') },
                                ].map((column) => (
                                    <th
                                        key={column.key}
                                        className={`px-4 py-3 text-xs font-semibold uppercase text-muted-foreground ${
                                            column.key === 'title' 
                                                ? (lang === 'ar' ? 'text-right' : 'text-left') 
                                                : 'text-center'
                                        }`}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={String(row.id ?? '')}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 flex justify-center">
                                        <img
                                            src={String(row.image ?? '')}
                                            alt={String(row[`title_${lang}`] ?? '')}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-semibold ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                                        {String(row[`title_${lang}`] ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">
                                        {String(row[`location_${lang}`] ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">{row.date}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-center">
                                        ${Number(row.price).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(row);
                                                    setOpen(true);
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPendingDelete(row)
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
            </div>

            <EntityFormDialog
                open={open}
                onOpenChange={setOpen}
                title={editing ? t('actions.edit') : t('actions.add')}
                languages={['en', 'fr', 'ar']}
                initial={editing ?? undefined}
                sections={eventSections}
                onSubmit={handleSave}
                errors={errors}
                isSubmitting={saveMutation.isPending}
            />

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(isOpen) => {
                    if (!isOpen) setPendingDelete(null);
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
        </AdminLayout>
    );
}
