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
import type { Lang } from '@/i18n/translations';

const FLIGHT_NESTED_OBJECT_FIELDS = new Set([
    'airline',
    'to',
    'duration',
    'stops',
    'cabin',
    'aircraft',
    'baggage',
    'refund',
]);

function normalizeFlightPayload(
    values: Record<string, unknown>,
): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(values).filter(([key, value]) => {
            if (!FLIGHT_NESTED_OBJECT_FIELDS.has(key)) {
                return true;
            }

            return (
                value === null ||
                typeof value !== 'object' ||
                Array.isArray(value)
            );
        }),
    );
}

export default function AdminFlights() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [modalLang, setModalLang] = useState<Lang>('en');
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
    const localizedLanguages: Lang[] = ['en', 'fr', 'ar'];

    // Hero images state
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

    const getLocalizedValue = (
        row: AdminRow,
        key: string,
        locale: Lang,
    ): string => {
        const direct = row[`${key}_${locale}`];
        if (typeof direct === 'string' && direct.trim().length > 0) {
            return direct;
        }

        const nested = row[key];
        if (nested && typeof nested === 'object') {
            const localized = nested as Record<string, unknown>;
            const candidate = localized[locale] ?? localized.en;
            if (typeof candidate === 'string') {
                return candidate;
            }
        }

        const english = row[`${key}_en`];
        return typeof english === 'string' ? english : '';
    };

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
        if (!values.departure) errs.departure = t('validation.required');
        if (!values.arrival) errs.arrival = t('validation.required');
        if (!values.date) errs.date = t('validation.required');

        localizedLanguages.forEach((locale) => {
            if (!values[`airline_${locale}`]) {
                errs[`airline_${locale}`] = t('validation.required');
            }
            if (!values[`to_${locale}`]) {
                errs[`to_${locale}`] = t('validation.required');
            }
            if (!values[`duration_${locale}`]) {
                errs[`duration_${locale}`] = t('validation.required');
            }
            if (!values[`stops_${locale}`]) {
                errs[`stops_${locale}`] = t('validation.required');
            }
            if (!values[`cabin_${locale}`]) {
                errs[`cabin_${locale}`] = t('validation.required');
            }
        });

        if (
            values.price !== null &&
            values.price !== undefined &&
            Number(values.price) < 0
        ) {
            errs.price = t('validation.invalidPrice');
        }

        if (
            values.seats !== null &&
            values.seats !== undefined &&
            values.seats !== '' &&
            Number(values.seats) < 0
        ) {
            errs.seats = t('admin.invalidSeats');
        }

        return errs;
    };

    function renderLocalizedInputs(
        values: Record<string, unknown>,
        setField: (key: string, value: unknown) => void,
        activeLang: Lang,
        fields: Array<{ key: string; label: string; placeholder: string }>,
        sectionErrors: Record<string, string>,
    ) {
        return (
            <div className="grid gap-6 md:grid-cols-2">
                {localizedLanguages.map((locale) => (
                    <div
                        key={locale}
                        className={
                            activeLang === locale ? 'contents' : 'hidden'
                        }
                    >
                        {fields.map((field) => {
                            const fieldKey = `${field.key}_${locale}`;
                            const error = sectionErrors?.[fieldKey];

                            return (
                                <div key={fieldKey} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor={fieldKey}
                                            className={`text-xs font-semibold ${
                                                error
                                                    ? 'text-destructive'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {field.label}
                                        </label>
                                        <LangBadge lang={locale} />
                                    </div>
                                    <input
                                        id={fieldKey}
                                        value={String(values[fieldKey] ?? '')}
                                        placeholder={field.placeholder}
                                        onChange={(e) =>
                                            setField(fieldKey, e.target.value)
                                        }
                                        className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                                            error
                                                ? 'border-destructive ring-1 ring-destructive'
                                                : ''
                                        }`}
                                    />
                                    {error ? (
                                        <p className="text-xs text-destructive">
                                            {error}
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    }

    function handleSave(values: AdminRow) {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            return;
        }

        saveMutation.mutate(
            normalizeFlightPayload({
                ...values,
                id: editing?.id ?? '',
            }) as AdminRow,
        );
    }

    const flightSections: SectionDef[] = [
        {
            title: t('admin.flightForm.coreDetails'),
            description: t('admin.flightForm.coreDetailsHint'),
            render: ({ values, setField, activeLang, errors: sectionErrors }) =>
                renderLocalizedInputs(
                    values,
                    setField,
                    activeLang,
                    [
                        {
                            key: 'airline',
                            label: t('admin.airline'),
                            placeholder: t('admin.airlinePlaceholder'),
                        },
                        {
                            key: 'to',
                            label: t('admin.to'),
                            placeholder: t('admin.toPlaceholder'),
                        },
                        {
                            key: 'duration',
                            label: t('admin.duration'),
                            placeholder: t('label.duration'),
                        },
                        {
                            key: 'stops',
                            label: t('admin.stops'),
                            placeholder: t('admin.stops'),
                        },
                    ],
                    sectionErrors ?? {},
                ),
        },
        {
            title: t('admin.flightForm.routeAndAirline'),
            description: t('admin.flightForm.technicalInfo'),
            fields: [
                {
                    key: 'code',
                    label: t('admin.code'),
                    placeholder: t('admin.codePlaceholder'),
                },
                {
                    key: 'from',
                    label: t('admin.from'),
                    placeholder: t('admin.fromPlaceholder'),
                },
                {
                    key: 'price',
                    type: 'number',
                    label: t('admin.price'),
                    placeholder: t('admin.pricePlaceholder'),
                },
            ],
        },
        {
            title: t('admin.flightForm.schedule'),
            fields: [
                {
                    key: 'departure',
                    label: t('admin.flightForm.departureTime'),
                    placeholder: t('admin.flightForm.departurePlaceholder'),
                },
                {
                    key: 'arrival',
                    label: t('admin.flightForm.arrivalTime'),
                    placeholder: t('admin.flightForm.arrivalPlaceholder'),
                },
                {
                    key: 'seats',
                    type: 'number',
                    label: t('admin.flightForm.seats'),
                    placeholder: t('admin.flightForm.seatsPlaceholder'),
                },
            ],
            render: ({ values, setField }) => (
                <div className="space-y-2">
                    <label
                        htmlFor="flight-date"
                        className="text-xs font-semibold text-muted-foreground"
                    >
                        {t('admin.flightForm.travelDate')}
                    </label>
                    <DatePicker
                        placeholder={t('admin.datePlaceholder')}
                        date={
                            values.date
                                ? new Date(String(values.date))
                                : undefined
                        }
                        onDateChange={(date) =>
                            setField(
                                'date',
                                date ? format(date, 'yyyy-MM-dd') : '',
                            )
                        }
                    />
                </div>
            ),
        },
        {
            title: t('admin.flightForm.cabinAndServiceDetails'),
            render: ({ values, setField, activeLang, errors: sectionErrors }) =>
                renderLocalizedInputs(
                    values,
                    setField,
                    activeLang,
                    [
                        {
                            key: 'cabin',
                            label: t('label.cabin'),
                            placeholder: t('label.cabinPlaceholder'),
                        },
                        {
                            key: 'aircraft',
                            label: t('label.aircraft'),
                            placeholder: t('label.aircraftPlaceholder'),
                        },
                        {
                            key: 'baggage',
                            label: t('label.baggage'),
                            placeholder: t('label.baggage'),
                        },
                        {
                            key: 'refund',
                            label: t('admin.flightForm.refund'),
                            placeholder: t(
                                'admin.flightForm.refundPlaceholder',
                            ),
                        },
                    ],
                    sectionErrors ?? {},
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
                                    { key: 'code', label: t('admin.code') },
                                    {
                                        key: 'airline',
                                        label: t('admin.airline'),
                                    },
                                    { key: 'from', label: t('admin.from') },
                                    { key: 'to', label: t('admin.to') },
                                    { key: 'price', label: t('admin.price') },
                                    {
                                        key: 'actions',
                                        label: t('admin.actions'),
                                    },
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
                                    <td className="px-4 py-3 text-center text-sm">
                                        {row.code}
                                    </td>
                                    <td
                                        className={`px-4 py-3 text-sm font-semibold ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                    >
                                        {getLocalizedValue(
                                            row,
                                            'airline',
                                            lang,
                                        )}
                                    </td>
                                    <td
                                        className={`px-4 py-3 text-sm ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                    >
                                        {getLocalizedValue(row, 'from', lang)}
                                    </td>
                                    <td
                                        className={`px-4 py-3 text-sm ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                                    >
                                        {getLocalizedValue(row, 'to', lang)}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold">
                                        {Number(row.price).toLocaleString()} TND
                                    </td>
                                    <td className="flex justify-center px-4 py-3">
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
                languages={['en', 'fr', 'ar']}
                activeLang={modalLang}
                onActiveLangChange={setModalLang}
                isSubmitting={saveMutation.isPending}
            />
        </AdminLayout>
    );
}
