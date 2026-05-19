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
import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';

type Copy = Record<Lang, string>;

const copy = (en: string, fr: string, ar: string): Copy => ({ en, fr, ar });

const price = copy('Price', 'Prix', 'السعر');
const title = copy('Flights', 'Vols', 'الرحلات');
const subtitle = copy(
    'Manage flight offers',
    'Gérer les offres de vols',
    'إدارة عروض الرحلات',
);

const columns: Array<{ key: string; label: Copy }> = [
    { key: 'code', label: copy('Code', 'Code', 'الرمز') },
    {
        key: 'airline_en',
        label: copy('Airline', 'Compagnie', 'شركة الطيران'),
    },
    { key: 'from', label: copy('From', 'Départ', 'من') },
    { key: 'to_en', label: copy('To', 'Arrivée', 'إلى') },
    { key: 'price', label: price },
];

export default function AdminFlights() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const queryKey = useMemo(() => ['admin', 'flights'], []);
    const { data: rows = [] } = useQuery<AdminRow[] | any[]>({
        queryKey,
        queryFn: () => listAdminEntities<AdminRow>('flights'),
        // backend may return { data: [...] } or raw array
        // explicitly type `data` as any to avoid strict inference issues
        select: (data: any) =>
            Array.isArray(data) ? data : (data?.data ?? []),
    });

    const saveMutation = useMutation({
        mutationFn: (row: AdminRow) => saveAdminEntity('flights', row),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('flights', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    function handleSave(values: AdminRow) {
        saveMutation.mutate({ ...values, id: editing?.id ?? '' });
        toast.success(editing ? t('actions.saved') : t('actions.added'));
        setEditing(null);
    }

    const flightSections: SectionDef[] = [
        {
            title: 'Core details',
            description: 'Edit localized flight copy one language at a time.',
            render: ({ values, setField, activeLang }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {['airline', 'to', 'duration', 'stops'].map((key) => {
                            const displayName =
                                key === 'to'
                                    ? 'Destination'
                                    : String(key).replace(/^[a-z]/, (s) =>
                                          s.toUpperCase(),
                                      );
                            const fieldKey = `${key}_${activeLang}`;

                            return (
                                <div key={fieldKey} className="space-y-2">
                                    <label
                                        htmlFor={fieldKey}
                                        className="text-xs font-semibold text-muted-foreground"
                                    >
                                        {displayName} (
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
                                htmlFor="flight-price"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {price[lang]}
                            </label>
                            <input
                                id="flight-price"
                                type="number"
                                value={String(values.price ?? '')}
                                onChange={(e) =>
                                    setField(
                                        'price',
                                        e.target.value === ''
                                            ? null
                                            : Number(e.target.value),
                                    )
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="flight-date"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                Date
                            </label>
                            <input
                                id="flight-date"
                                value={String(values.date ?? '')}
                                onChange={(e) =>
                                    setField('date', e.target.value)
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Route and airline',
            columns: 2,
            fields: [
                { key: 'code', label: 'Code' },
                { key: 'from', label: 'From' },
                { key: 'departure', label: 'Departure time' },
                { key: 'arrival', label: 'Arrival time' },
            ],
        },
        {
            title: 'Schedule',
            columns: 2,
            fields: [
                { key: 'date', label: 'Travel date' },
                { key: 'seats', label: 'Seats', type: 'number' },
            ],
        },
        {
            title: 'Cabin and service details',
            description: 'Localized cabin/aircraft/baggage/refund texts.',
            render: ({ values, setField, activeLang }) => (
                <div className="grid gap-4 md:grid-cols-2">
                    {['cabin', 'aircraft', 'baggage', 'refund'].map((key) => {
                        const fieldKey = `${key}_${activeLang}`;

                        return (
                            <div key={fieldKey} className="space-y-2">
                                <label
                                    htmlFor={fieldKey}
                                    className="text-xs font-semibold text-muted-foreground"
                                >
                                    {String(key).replace(/^[a-z]/, (s) =>
                                        s.toUpperCase(),
                                    )}{' '}
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
                        ? `${t('admin.deleteItemPrompt')} “${String(pendingDelete.code ?? pendingDelete.airline_en ?? '')}”? ${t('admin.deleteItemWarning')}`
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
                sections={flightSections}
                initial={editing}
                onSubmit={handleSave}
                languages={['en', 'fr', 'ar']}
            />
        </AdminLayout>
    );
}
