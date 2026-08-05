import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Image as ImageIcon, Save } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
    type AdminRow,
} from '@/api/admin.api';
import { apiFetch } from '@/api/http';
import type { PageHeroSlide } from '@/api/siteSettings.api';
import { HeroImagesManager } from '@/components/admin/HeroImagesManager';
import { useSiteSettings } from '@/hooks/useSiteSettings';

import { AdminLayout } from '@/components/layout/AdminLayout';
import {
    EntityFormDialog,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AIRPORTS } from '@/data/airports';
import {
    AIRLINE_NAMES,
    CABIN_CLASSES,
    FLIGHT_STOPS,
    getLocalizedLabel,
} from '@/data/adminSelectOptions';

export default function AdminFlights() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setErrors({});
            setEditing(null);
        }
        setOpen(nextOpen);
    };

    const queryKey = useMemo(() => ['admin', 'flights'], []);
    const { data: rows = [] } = useQuery<AdminRow[] | any[]>({
        queryKey,
        queryFn: () => listAdminEntities<AdminRow>('flights'),
        select: (data: any) =>
            Array.isArray(data) ? data : (data?.data ?? []),
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const { settings: siteSettings } = useSiteSettings();
    const existingHeroConfig = siteSettings?.content?.page_heroes?.flights;
    const [heroSlides, setHeroSlides] = useState<PageHeroSlide[]>([]);
    const [heroInterval, setHeroInterval] = useState(6000);

    useEffect(() => {
        setHeroSlides(existingHeroConfig?.images ?? []);
        setHeroInterval(existingHeroConfig?.interval ?? 6000);
    }, [existingHeroConfig]);

    const saveHeroImages = useCallback(async () => {
        try {
            const filteredSlides = heroSlides.filter((s) => s.url);
            const content = {
                ...(siteSettings?.content ?? {}),
                page_heroes: {
                    ...(siteSettings?.content?.page_heroes ?? {}),
                    flights: {
                        images: filteredSlides,
                        interval: heroInterval,
                    },
                },
            };
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({ content }),
            });
            window.dispatchEvent(new CustomEvent('site-settings-updated'));
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        }
    }, [heroSlides, heroInterval, siteSettings?.content, t]);

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

    const validate = (
        values: Record<string, unknown>,
    ): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (!values.code) errs.code = t('validation.required');
        if (!values.from) errs.from = t('validation.required');
        if (!values.to) errs.to = t('validation.required');
        if (!values.airline) errs.airline = t('validation.required');
        if (!values.departure) errs.departure = t('validation.required');
        if (!values.arrival) errs.arrival = t('validation.required');
        if (!values.date) errs.date = t('validation.required');
        if (!values.duration) errs.duration = t('validation.required');
        if (!values.stops) errs.stops = t('validation.required');
        if (!values.cabin) errs.cabin = t('validation.required');
        if (
            values.price !== null &&
            values.price !== undefined &&
            Number(values.price) < 0
        ) {
            errs.price = t('validation.invalidPrice');
        }
        return errs;
    };

    function handleSave(values: AdminRow) {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }
        saveMutation.mutate({ ...values, id: editing?.id ?? '' } as AdminRow);
    }

    const flightSections: SectionDef[] = [
        {
            title: t('admin.flightForm.coreDetails'),
            description: t('admin.flightForm.coreDetailsHint'),
            columns: 2,
            render: ({ values, setField, errors: sectionErrors }) => (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.airline')}
                        </label>
                        <Select
                            value={String(values.airline ?? '')}
                            onValueChange={(val) => setField('airline', val)}
                        >
                            <SelectTrigger
                                className={
                                    sectionErrors?.airline
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
                            >
                                <SelectValue
                                    placeholder={t('admin.airlinePlaceholder')}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {AIRLINE_NAMES.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>
                                        {getLocalizedLabel(a, lang)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.to')}
                        </label>
                        <Select
                            value={String(values.to ?? '')}
                            onValueChange={(val) => setField('to', val)}
                        >
                            <SelectTrigger
                                className={
                                    sectionErrors?.to
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
                            >
                                <SelectValue
                                    placeholder={t('admin.toPlaceholder')}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {AIRPORTS.map((a) => (
                                    <SelectItem
                                        key={a.iata}
                                        value={`${a.city} (${a.iata})`}
                                    >
                                        {a.city} - {a.iata}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.duration')}
                        </label>
                        <Input
                            value={String(values.duration ?? '')}
                            placeholder={t('label.duration')}
                            onChange={(e) =>
                                setField('duration', e.target.value)
                            }
                            className={
                                sectionErrors?.duration
                                    ? 'border-destructive ring-1 ring-destructive'
                                    : ''
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.stops')}
                        </label>
                        <Select
                            value={String(values.stops ?? '')}
                            onValueChange={(val) => setField('stops', val)}
                        >
                            <SelectTrigger
                                className={
                                    sectionErrors?.stops
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
                            >
                                <SelectValue placeholder={t('admin.stops')} />
                            </SelectTrigger>
                            <SelectContent>
                                {FLIGHT_STOPS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {getLocalizedLabel(s, lang)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.flightForm.routeAndAirline'),
            description: t('admin.flightForm.technicalInfo'),
            columns: 2,
            render: ({ values, setField }) => (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.code')}
                        </label>
                        <Input
                            value={String(values.code ?? '')}
                            placeholder={t('admin.codePlaceholder')}
                            onChange={(e) => setField('code', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.from')}
                        </label>
                        <Select
                            value={String(values.from ?? '')}
                            onValueChange={(val) => setField('from', val)}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={t('admin.fromPlaceholder')}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {AIRPORTS.map((a) => (
                                    <SelectItem
                                        key={a.iata}
                                        value={`${a.city} (${a.iata})`}
                                    >
                                        {a.city} - {a.iata}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.price')}
                        </label>
                        <Input
                            type="number"
                            min={0}
                            value={String(values.price ?? '')}
                            placeholder={t('admin.pricePlaceholder')}
                            onChange={(e) => setField('price', e.target.value)}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.flightForm.schedule'),
            columns: 2,
            fields: [
                {
                    key: 'dateFrom',
                    label: t('admin.flightForm.travelDate'),
                    type: 'daterange',
                },
            ],
            render: ({ values, setField }) => (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.flightForm.departureTime')}
                        </label>
                        <Input
                            value={String(values.departure ?? '')}
                            placeholder={t(
                                'admin.flightForm.departurePlaceholder',
                            )}
                            onChange={(e) =>
                                setField('departure', e.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.flightForm.arrivalTime')}
                        </label>
                        <Input
                            value={String(values.arrival ?? '')}
                            placeholder={t(
                                'admin.flightForm.arrivalPlaceholder',
                            )}
                            onChange={(e) =>
                                setField('arrival', e.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.flightForm.seats')}
                        </label>
                        <Input
                            type="number"
                            min={0}
                            value={String(values.seats ?? '')}
                            placeholder={t('admin.flightForm.seatsPlaceholder')}
                            onChange={(e) => setField('seats', e.target.value)}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.flightForm.cabinAndServiceDetails'),
            columns: 2,
            render: ({ values, setField, errors: sectionErrors }) => (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('label.cabin')}
                        </label>
                        <Select
                            value={String(values.cabin ?? '')}
                            onValueChange={(val) => setField('cabin', val)}
                        >
                            <SelectTrigger
                                className={
                                    sectionErrors?.cabin
                                        ? 'border-destructive ring-1 ring-destructive'
                                        : ''
                                }
                            >
                                <SelectValue
                                    placeholder={t('label.cabinPlaceholder')}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {CABIN_CLASSES.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {getLocalizedLabel(c, lang)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('label.aircraft')}
                        </label>
                        <Input
                            value={String(values.aircraft ?? '')}
                            placeholder={t('label.aircraftPlaceholder')}
                            onChange={(e) =>
                                setField('aircraft', e.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('label.baggage')}
                        </label>
                        <Input
                            value={String(values.baggage ?? '')}
                            placeholder={t('label.baggage')}
                            onChange={(e) =>
                                setField('baggage', e.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.flightForm.refund')}
                        </label>
                        <Input
                            value={String(values.refund ?? '')}
                            placeholder={t(
                                'admin.flightForm.refundPlaceholder',
                            )}
                            onChange={(e) => setField('refund', e.target.value)}
                        />
                    </div>
                </div>
            ),
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
            <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                            {t('admin.heroImages')}
                        </h3>
                    </div>
                    <Button
                        size="sm"
                        onClick={saveHeroImages}
                        className="bg-primary text-primary-foreground"
                    >
                        <Save className="mr-1 h-3.5 w-3.5" />{' '}
                        {t('admin.settings.save')}
                    </Button>
                </div>
                <HeroImagesManager
                    pageKey="flights"
                    slides={heroSlides}
                    onSlidesChange={setHeroSlides}
                    interval={heroInterval}
                    onIntervalChange={setHeroInterval}
                />
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {[
                                    t('admin.code'),
                                    t('admin.airline'),
                                    t('admin.from'),
                                    t('admin.to'),
                                    t('admin.price'),
                                    t('admin.actions'),
                                ].map((label) => (
                                    <th
                                        key={label}
                                        className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground"
                                    >
                                        {label}
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
                                    <td className="px-4 py-3 text-center text-sm">
                                        {row.code}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {AIRLINE_NAMES.find(
                                            (a) => a.value === row.airline,
                                        )
                                            ? getLocalizedLabel(
                                                  AIRLINE_NAMES.find(
                                                      (a) =>
                                                          a.value ===
                                                          row.airline,
                                                  )!,
                                                  lang,
                                              )
                                            : String(row.airline ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {String(row.from ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        {String(row.to ?? '')}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold">
                                        {Number(row.price).toLocaleString()} TND
                                    </td>
                                    <td className="px-4 py-3 text-center">
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

            <EntityFormDialog
                open={open}
                onOpenChange={handleOpenChange}
                title={
                    editing
                        ? `${t('actions.edit')} ${t('admin.flights')}`
                        : `${t('actions.add')} ${t('admin.flights')}`
                }
                sections={flightSections}
                initial={editing ? { ...editing } : null}
                onSubmit={(values) => handleSave(values as AdminRow)}
                errors={errors}
                isSubmitting={saveMutation.isPending}
            />
        </AdminLayout>
    );
}
