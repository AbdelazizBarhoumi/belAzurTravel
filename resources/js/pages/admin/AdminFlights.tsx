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
import { DatePicker } from '@/components/ui/DatePicker';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
    EntityFormDialog,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';

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
        select: (data: any) =>
            Array.isArray(data) ? data : (data?.data ?? []),
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const saveMutation = useMutation({
        mutationFn: (row: AdminRow) => saveAdminEntity('flights', row),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            setEditing(null);
            setOpen(false);
            setErrors({});
            toast.success(editing ? t('actions.saved') : t('actions.added'));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('flights', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    const validate = (values: any): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (!values.code) errs.code = t('validation.required');
        if (!values.airline_en) errs.airline_en = t('validation.required');
        if (!values.to_en) errs.to_en = t('validation.required');
        if (values.price !== null && Number(values.price) < 0) errs.price = t('validation.invalidPrice');
        return errs;
    };

    function handleSave(values: AdminRow) {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }
        saveMutation.mutate({ ...values, id: editing?.id ?? '' });
    }

    const flightSections: SectionDef[] = [
        {
            title: t('admin.flightForm.coreDetails'),
            description: t('admin.flightForm.coreDetailsHint'),
            render: ({ values, setField, activeLang, errors }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { key: 'airline', label: t('admin.airline') },
                            { key: 'to', label: t('admin.to') },
                            { key: 'duration', label: t('admin.duration') },
                            { key: 'stops', label: t('label.stops') },
                        ].map((field) => {
                            const fieldKey = `${field.key}_${activeLang}`;
                            const error = errors?.[fieldKey];

                            return (
                                <div key={fieldKey} className="space-y-2">
                                    <label
                                        htmlFor={fieldKey}
                                        className={`text-xs font-semibold ${error ? 'text-destructive' : 'text-muted-foreground'}`}
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
                                        className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ${error ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                    />
                                    {error && <p className="text-xs text-destructive">{error}</p>}
                                </div>
                            );
                        })}

                        <div className="space-y-2">
                            <label
                                htmlFor="flight-price"
                                className={`text-xs font-semibold ${errors?.price ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                                {t('admin.price')}
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
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ${errors?.price ? 'border-destructive ring-1 ring-destructive' : ''}`}
                            />
                            {errors?.price && <p className="text-xs text-destructive">{errors.price}</p>}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="flight-date"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.date')}
                            </label>
                            <DatePicker
                                date={values.date ? new Date(String(values.date)) : undefined}
                                onDateChange={(date) =>
                                    setField(
                                        'date',
                                        date
                                            ? format(date, 'yyyy-MM-dd')
                                            : '',
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.technicalInfo'),
            fields: [
                { key: 'code', label: t('admin.code') },
                { key: 'from', label: t('admin.from') },
                { key: 'aircraft', label: t('label.aircraft') },
                { key: 'cabin', label: t('label.cabin') },
            ],
        },
    ];

    return (
        <AdminLayout
            title={t('admin.flights')}
            subtitle={t('admin.flightsSubtitle')}
            actions={
                <Button
                    onClick={() => {
                        setEditing(null);
                        setOpen(true);
                        setErrors({});
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
                                    { key: 'code', label: t('admin.code') },
                                    { key: 'airline', label: t('admin.airline') },
                                    { key: 'from', label: t('admin.from') },
                                    { key: 'to', label: t('admin.to') },
                                    { key: 'price', label: t('admin.price') },
                                    { key: 'actions', label: t('admin.actions') },
                                ].map((column) => (
                                    <th
                                        key={column.key}
                                        className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground"
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 text-center text-sm">{row.code}</td>
                                    <td className={`px-4 py-3 text-sm font-semibold ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                                        {row[`airline_${lang}`] || row.airline_en}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">{row.from}</td>
                                    <td className={`px-4 py-3 text-sm ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                                        {row[`to_${lang}`] || row.to_en}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold">
                                        ${Number(row.price).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 flex justify-center">
                                        <div className="flex items-center gap-2">
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
                onOpenChange={(val) => {
                    setOpen(val);
                    if (!val) setErrors({});
                }}
                title={editing ? t('actions.edit') : t('actions.add')}
                languages={['en', 'fr', 'ar']}
                initial={editing ?? undefined}
                sections={flightSections}
                onSubmit={handleSave}
                errors={errors}
                isSubmitting={saveMutation.isPending}
            />

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(isOpen) => {
                    if (!isOpen) setPendingDelete(null);
                }}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    deleteMutation.mutate(String(pendingDelete.id));
                    setPendingDelete(null);
                }}
            />
        </AdminLayout>
    );
}
