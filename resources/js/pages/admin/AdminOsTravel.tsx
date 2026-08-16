import { useMutation } from '@tanstack/react-query';
import {
    Eye,
    Loader2,
    Star,
    Trash2,
    Undo2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import {
    type OsTravelHotelRow,
    type OsTravelListFilters,
    type OsTravelStatus,
} from '@/api/osTravel.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import {
    osTravelKeys,
    useOsTravelAdmin,
    useOsTravelDashboard,
    useOsTravelHotelDetail,
    useOsTravelHotels,
    useOsTravelReferences,
} from '@/hooks/useOsTravelAdmin';
import { toLocalISODate } from '@/lib/utils';

const STATUSES: OsTravelStatus[] = [
    'pending',
    'approved',
    'rejected',
    'orphaned',
];

const STATUS_CARDS: (OsTravelStatus | 'all')[] = ['all', ...STATUSES];

const statusColors: Record<string, string> = {
    pending: 'bg-secondary/10 text-secondary',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-destructive/10 text-destructive',
    orphaned: 'bg-amber-100 text-amber-700',
};

const CURRENCIES = ['TND', 'EUR', 'USD', 'GBP'];

interface ApproveAllOptions {
    include_without_image: boolean;
}

const EMPTY_APPROVE_ALL_OPTIONS: ApproveAllOptions = {
    include_without_image: false,
};

const liveStatusMeta: Record<
    NonNullable<OsTravelHotelRow['live_status']>,
    { labelKey: string; className: string }
> = {
    available: {
        labelKey: 'osTravel.liveStatus.available',
        className: 'text-emerald-600',
    },
    no_availability: {
        labelKey: 'osTravel.liveStatus.noAvailability',
        className: 'text-amber-600',
    },
    stop_reservation: {
        labelKey: 'osTravel.liveStatus.stopReservation',
        className: 'text-red-600',
    },
    stop_sale: {
        labelKey: 'osTravel.liveStatus.stopSale',
        className: 'text-amber-600',
    },
    no_bookable_room: {
        labelKey: 'osTravel.liveStatus.noBookableRoom',
        className: 'text-amber-600',
    },
    min_stay: {
        labelKey: 'osTravel.liveStatus.minStay',
        className: 'text-amber-600',
    },
    provider_error: {
        labelKey: 'osTravel.liveStatus.providerError',
        className: 'text-destructive',
    },
};

interface PriceForm {
    markup: string;
    currency: string;
}

const emptyPriceForm: PriceForm = {
    markup: '20',
    currency: 'TND',
};

const displayDate = (value: string): string => {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime())
        ? value
        : `${parsed.getDate()}/${parsed.getMonth() + 1}/${parsed.getFullYear()}`;
};

const AdminOsTravel = () => {
    useAdminGuard();
    const { t, dir } = useLanguage();
    const admin = useOsTravelAdmin();

    const [status, setStatus] = useState<OsTravelStatus | ''>('');
    const [city, setCity] = useState('');
    const [countryId, setCountryId] = useState('');
    const [cityId, setCityId] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [starsFilter, setStarsFilter] = useState('');
    const [detailId, setDetailId] = useState<string | null>(null);
    const [priceForm, setPriceForm] = useState<PriceForm>(emptyPriceForm);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [unapproveId, setUnapproveId] = useState<string | null>(null);
    const [approveAllOpen, setApproveAllOpen] = useState(false);
    const [approveAllOptions, setApproveAllOptions] =
        useState<ApproveAllOptions>(EMPTY_APPROVE_ALL_OPTIONS);

    const { data: dashboard } = useOsTravelDashboard();
    const { data: references } = useOsTravelReferences();
    const filters = useMemo<OsTravelListFilters>(() => {
        const f: OsTravelListFilters = {};
        if (status) f.status = status;
        if (city.trim()) f.city = city.trim();
        if (countryId) f.country_id = countryId;
        if (cityId) f.city_id = cityId;
        if (starsFilter) f.stars = Number(starsFilter);
        if (dateRange?.from && dateRange.to) {
            f.check_in = toLocalISODate(dateRange.from);
            f.check_out = toLocalISODate(dateRange.to);
        }
        return f;
    }, [status, city, countryId, cityId, starsFilter, dateRange]);
    const { data: hotels = [], isLoading, isFetching } =
        useOsTravelHotels(filters);
    const { data: detail, isFetching: detailLoading } =
        useOsTravelHotelDetail(detailId);

    useEffect(() => {
        if (detailId) {
            setPriceForm(emptyPriceForm);
        }
    }, [detailId]);

    const hydratedIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (detail && detailId && hydratedIdRef.current !== detailId) {
            hydratedIdRef.current = detailId;
            setPriceForm({
                markup: detail.markup_percentage ?? '20',
                currency: detail.currency ?? 'TND',
            });
        }
    }, [detail, detailId]);

    const pendingWithoutImage = useMemo(
        () => hotels.filter((h) => !h.image).length,
        [hotels],
    );

    const openPreview = (hotel: OsTravelHotelRow) => {
        setDetailId(hotel.id);
    };

    const closePreview = () => {
        setDetailId(null);
        hydratedIdRef.current = null;
    };

    const approveMutation = useMutation({
        mutationFn: () =>
            admin.approve(detailId as string, {
                markup_percentage:
                    priceForm.markup === ''
                        ? undefined
                        : Number(priceForm.markup),
                currency: priceForm.currency || undefined,
            }),
        onSuccess: () => {
            toast.success(t('osTravel.approved'));
            closePreview();
        },
        onError: (err: unknown) => {
            toast.error(admin.toErrorMessage(err, 'osTravel.approveFailed'));
        },
    });

    const savePriceMutation = useMutation({
        mutationFn: () =>
            admin.savePrice(detailId as string, {
                markup_percentage:
                    priceForm.markup === '' ? null : Number(priceForm.markup),
                currency: priceForm.currency || null,
            }),
        onSuccess: () => {
            toast.success(t('osTravel.priceSaved'));
            closePreview();
        },
        onError: (err: unknown) => {
            toast.error(admin.toErrorMessage(err, 'osTravel.savePriceFailed'));
        },
    });

    const approveAllMutation = useMutation({
        mutationFn: (options: ApproveAllOptions & OsTravelListFilters) =>
            admin.approveAll(options),
        onSuccess: (result) => {
            setApproveAllOpen(false);
            const summary = [
                t('osTravel.approvedCount').replace(
                    '{count}',
                    String(result.approved_count),
                ),
            ];
            if (result.skipped_no_image_count > 0) {
                summary.push(
                    t('osTravel.skippedNoImage').replace(
                        '{count}',
                        String(result.skipped_no_image_count),
                    ),
                );
            }
            if (result.failed_count > 0) {
                summary.push(
                    t('osTravel.failedCount').replace(
                        '{count}',
                        String(result.failed_count),
                    ),
                );
            }
            toast.success(summary.join(' · '));
        },
        onError: (err: unknown) => {
            setApproveAllOpen(false);
            toast.error(admin.toErrorMessage(err, 'osTravel.approveAllFailed'));
        },
    });

    const rejectMutation = useMutation({
        mutationFn: () => admin.reject(rejectId as string),
        onSuccess: () => {
            setRejectId(null);
            toast.success(t('osTravel.rejected'));
        },
        onError: (err: unknown) => {
            setRejectId(null);
            toast.error(admin.toErrorMessage(err, 'osTravel.rejectFailed'));
        },
    });

    const unapproveMutation = useMutation({
        mutationFn: () => admin.unapprove(unapproveId as string),
        onSuccess: () => {
            setUnapproveId(null);
            toast.success(t('osTravel.unapproved'));
        },
        onError: (err: unknown) => {
            setUnapproveId(null);
            toast.error(admin.toErrorMessage(err, 'osTravel.unapproveFailed'));
        },
    });

    const activeHotel = hotels.find((h) => h.id === detailId) ?? null;
    const preview = detail?.mapped_preview ?? null;

    const filteredHotels = useMemo(() => hotels, [hotels]);

    const availableCities = useMemo(() => {
        if (!references) return [];
        if (!countryId) return references.cities;
        return references.cities.filter((c) => c.country_id === countryId);
    }, [references, countryId]);

    const hasDateFilter = Boolean(dateRange?.from && dateRange.to);

    const handleCountryChange = (value: string) => {
        setCountryId(value);
        setCityId('');
    };

    const counts = dashboard?.counts;

    return (
        <AdminLayout
            title={t('admin.osTravel')}
            subtitle={t('admin.osTravelSubtitle')}
        >
            <div className="space-y-4">
                {/* Sync status card */}
                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                {t('osTravel.lastSync')}
                            </p>
                            {dashboard?.last_sync ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {dashboard.last_sync.finished_at
                                        ? new Date(
                                              dashboard.last_sync.finished_at,
                                          ).toLocaleString()
                                        : t('osTravel.syncRunning')}
                                    {dashboard.last_sync.error
                                        ? ` · ${dashboard.last_sync.error}`
                                        : ''}
                                </p>
                            ) : (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('osTravel.noSync')}
                                </p>
                            )}
                        </div>
                        {dashboard?.last_sync?.orphaned_count != null &&
                            dashboard.last_sync.orphaned_count > 0 && (
                                <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                                    {t('osTravel.orphanedBadge').replace(
                                        '{count}',
                                        String(dashboard.last_sync.orphaned_count),
                                    )}
                                </span>
                            )}
                        {dashboard?.last_sync?.reactivated_count != null &&
                            dashboard.last_sync.reactivated_count > 0 && (
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    {t('osTravel.reactivated').replace(
                                        '{count}',
                                        String(
                                            dashboard.last_sync
                                                .reactivated_count,
                                        ),
                                    )}
                                </span>
                            )}
                    </div>
                    {counts && (
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
                            {STATUS_CARDS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s === 'all' ? '' : s)}
                                    className={`rounded-xl border p-3 text-start transition-colors ${
                                        status === (s === 'all' ? '' : s)
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-background hover:bg-muted/20'
                                    }`}
                                >
                                    <p className="text-2xl font-bold text-foreground">
                                        {s === 'all'
                                            ? (counts.all ?? 0)
                                            : (counts[s] ?? 0)}
                                    </p>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {t(`osTravel.status.${s}`)}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filters + bulk actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('osTravel.filterCity')}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-sm"
                    />
                    <Select
                        value={countryId}
                        onValueChange={handleCountryChange}
                    >
                        <SelectTrigger className="w-44" aria-label={t('osTravel.filterCountry')}>
                            <SelectValue placeholder={t('osTravel.filterCountry')} />
                        </SelectTrigger>
                        <SelectContent>
                            {references?.countries.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name ?? c.id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={cityId}
                        onValueChange={setCityId}
                        disabled={Boolean(countryId) && availableCities.length === 0}
                    >
                        <SelectTrigger className="w-44" aria-label={t('osTravel.filterCitySelect')}>
                            <SelectValue placeholder={t('osTravel.filterCitySelect')} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableCities.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name ?? c.id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        placeholderFrom={t('osTravel.filterFrom')}
                        placeholderTo={t('osTravel.filterTo')}
                        placeholderEmpty={t('osTravel.filterDates')}
                    />
                    <select
                        value={starsFilter}
                        onChange={(e) => setStarsFilter(e.target.value)}
                        aria-label={t('osTravel.filterStars')}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-sm"
                    >
                        <option value="">{t('osTravel.allStars')}</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                                {n} {t('admin.stars')}
                            </option>
                        ))}
                    </select>
                    {status === 'pending' && (
                        <Button
                            onClick={() => {
                                setApproveAllOptions(EMPTY_APPROVE_ALL_OPTIONS);
                                setApproveAllOpen(true);
                            }}
                            disabled={
                                approveAllMutation.isPending ||
                                hotels.length === 0
                            }
                        >
                            {t('osTravel.approveAll')}
                        </Button>
                    )}
                    {hasDateFilter && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {t('osTravel.liveCheckActive')}
                        </span>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    {isFetching && !isLoading && (
                        <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-4 py-2 text-xs font-medium text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {t('osTravel.fetching')}
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    {[
                                        t('admin.name'),
                                        t('admin.location'),
                                        t('admin.country'),
                                        t('admin.stars'),
                                        t('admin.category'),
                                        t('osTravel.liveStatus.live'),
                                        t('admin.status'),
                                        t('admin.actions'),
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
                                {isLoading
                                    ? Array.from({ length: 6 }).map((_, i) => (
                                          <tr
                                              key={`os-travel-skeleton-${i}`}
                                              className="border-b border-border last:border-0"
                                          >
                                              <td className="px-4 py-3">
                                                  <div className="flex items-center gap-3">
                                                      <Skeleton className="h-10 w-14 rounded-lg" />
                                                      <div className="space-y-2">
                                                          <Skeleton className="h-3.5 w-40" />
                                                          <Skeleton className="h-3 w-24" />
                                                      </div>
                                                  </div>
                                              </td>
                                              <td className="px-4 py-3">
                                                  <Skeleton className="h-3.5 w-24" />
                                              </td>
                                              <td className="px-4 py-3">
                                                  <Skeleton className="h-3.5 w-24" />
                                              </td>
                                              <td className="px-4 py-3">
                                                  <Skeleton className="h-3.5 w-8" />
                                              </td>
                                              <td className="px-4 py-3">
                                                  <Skeleton className="h-3.5 w-28" />
                                              </td>
                                              <td className="px-4 py-3">
                                                  <Skeleton className="h-5 w-20 rounded-full" />
                                              </td>
                                              <td className="px-4 py-3">
                                                  <div className="flex items-center gap-2">
                                                      <Skeleton className="h-8 w-8 rounded-lg" />
                                                      <Skeleton className="h-8 w-8 rounded-lg" />
                                                  </div>
                                              </td>
                                          </tr>
                                      ))
                                    : filteredHotels.map((h) => (
                                    <tr
                                        key={h.id}
                                        className="border-b border-border last:border-0 hover:bg-muted/20"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {h.image && (
                                                    <img
                                                        src={h.image}
                                                        alt={h.name}
                                                        className="h-10 w-14 rounded-lg object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display =
                                                                'none';
                                                        }}
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {h.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {h.city_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {h.country_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                {h.stars}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {h.category_title}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {h.live_price !== null ? (
                                                <span className="font-semibold text-emerald-600">
                                                    {h.live_price}{' '}
                                                    {h.live_currency ?? 'TND'}
                                                </span>
                                            ) : h.live_status &&
                                              liveStatusMeta[h.live_status] ? (
                                                <div
                                                    className="flex flex-col gap-0.5"
                                                    title={
                                                        h.live_reason ??
                                                        undefined
                                                    }
                                                >
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-semibold ${liveStatusMeta[h.live_status].className}`}
                                                    >
                                                        {t(
                                                            liveStatusMeta[
                                                                h.live_status
                                                            ].labelKey,
                                                        )}
                                                    </span>
                                                    {h.live_status ===
                                                        'stop_sale' &&
                                                        h.live_until && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {t(
                                                                    'osTravel.liveStatus.availableFrom',
                                                                )}{' '}
                                                                {displayDate(
                                                                    h.live_until,
                                                                )}
                                                            </span>
                                                        )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[h.status] || ''}`}
                                                >
                                                    {t(
                                                        `osTravel.status.${h.status}`,
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openPreview(h)
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        {t('osTravel.preview')}
                                                    </span>
                                                </Button>
                                                {h.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            openPreview(h)
                                                        }
                                                    >
                                                        {t('osTravel.approve')}
                                                    </Button>
                                                )}
                                                {h.status === 'approved' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setUnapproveId(
                                                                h.id,
                                                            )
                                                        }
                                                        aria-label={t(
                                                            'osTravel.unapprove',
                                                        )}
                                                    >
                                                        <Undo2 className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            {t(
                                                                'osTravel.unapprove',
                                                            )}
                                                        </span>
                                                    </Button>
                                                )}
                                                {!h.hotel_id && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            setRejectId(h.id)
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            {t(
                                                                'osTravel.reject',
                                                            )}
                                                        </span>
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!isLoading && !isFetching && filteredHotels.length === 0 && (
                        <p className="p-8 text-center text-muted-foreground">
                            {t('osTravel.emptyState')}
                        </p>
                    )}
                </div>

                {/* Preview dialog */}
                <Dialog open={detailId !== null} onOpenChange={closePreview}>
                    <DialogContent className="max-w-2xl" dir={dir}>
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                {preview?.name ?? activeHotel?.name ?? ''}
                            </DialogTitle>
                            <DialogDescription>
                                {preview
                                    ? [
                                          preview.city,
                                          preview.country,
                                          preview.category,
                                      ]
                                          .filter(Boolean)
                                          .join(' · ')
                                    : activeHotel?.city_name}
                                {activeHotel?.stars
                                    ? ` · ${activeHotel.stars}★`
                                    : ''}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 overflow-y-auto pr-1">
                            {detailLoading ? (
                                <>
                                    <Skeleton className="h-44 w-full rounded-xl" />
                                    <div className="flex gap-2 overflow-x-auto">
                                        {Array.from({ length: 4 }).map(
                                            (_, i) => (
                                                <Skeleton
                                                    key={i}
                                                    className="h-20 w-28 shrink-0 rounded-lg"
                                                />
                                            ),
                                        )}
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-8 w-28 rounded-lg" />
                                        </div>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-4">
                                            {Array.from({ length: 4 }).map(
                                                (_, i) => (
                                                    <div
                                                        key={i}
                                                        className="space-y-1"
                                                    >
                                                        <Skeleton className="h-3 w-16" />
                                                        <Skeleton className="h-10 rounded-xl" />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                            {preview?.image && (
                                <img
                                    src={preview.image}
                                    alt={preview.name}
                                    className="h-44 w-full rounded-xl object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}

                            {preview && preview.gallery.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto">
                                    {preview.gallery.map((url, i) => (
                                        <img
                                            key={`${url}-${i}`}
                                            src={url}
                                            alt=""
                                            className="h-20 w-28 shrink-0 rounded-lg object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display =
                                                    'none';
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {preview?.description && (
                                <p className="text-sm text-muted-foreground">
                                    {preview.description}
                                </p>
                            )}

                            {preview && preview.boarding.length > 0 && (
                                <p className="text-sm text-foreground">
                                    <span className="font-medium text-muted-foreground">
                                        {t('osTravel.boarding')}:{' '}
                                    </span>
                                    {preview.boarding.join(', ')}
                                </p>
                            )}

                            {/* Price section */}
                            <div className="rounded-xl border border-border bg-muted/20 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                                        {t('osTravel.priceSection')}
                                    </p>
                                </div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            {t('admin.markupPercentage')}
                                        </label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={priceForm.markup}
                                            placeholder="20"
                                            aria-label={t(
                                                'admin.markupPercentage',
                                            )}
                                            onChange={(e) =>
                                                setPriceForm((p) => ({
                                                    ...p,
                                                    markup: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            {t('admin.currency')}
                                        </label>
                                        <Select
                                            value={priceForm.currency}
                                            onValueChange={(v) =>
                                                setPriceForm((p) => ({
                                                    ...p,
                                                    currency: v,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CURRENCIES.map((c) => (
                                                    <SelectItem
                                                        key={c}
                                                        value={c}
                                                    >
                                                        {c}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                                </>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                disabled={savePriceMutation.isPending}
                                onClick={() => savePriceMutation.mutate()}
                            >
                                {t('osTravel.savePrice')}
                            </Button>
                            {(activeHotel?.status === 'pending' ||
                                (activeHotel?.status === 'approved' &&
                                    !activeHotel?.hotel_id)) && (
                                <Button
                                    disabled={approveMutation.isPending}
                                    onClick={() => approveMutation.mutate()}
                                >
                                    {t('osTravel.approve')}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reject confirm */}
                <ConfirmDialog
                    open={rejectId !== null}
                    onOpenChange={(open) => !open && setRejectId(null)}
                    title={t('osTravel.rejectTitle')}
                    description={t('osTravel.rejectDescription')}
                    confirmText={t('osTravel.reject')}
                    cancelText={t('actions.cancel')}
                    dir={dir}
                    onConfirm={() => rejectMutation.mutate()}
                />

                {/* Unapprove confirm */}
                <ConfirmDialog
                    open={unapproveId !== null}
                    onOpenChange={(open) => !open && setUnapproveId(null)}
                    title={t('osTravel.unapproveTitle')}
                    description={t('osTravel.unapproveDescription')}
                    confirmText={t('osTravel.unapprove')}
                    cancelText={t('actions.cancel')}
                    dir={dir}
                    onConfirm={() => unapproveMutation.mutate()}
                />

                {/* Approve-all confirm */}
                <ConfirmDialog
                    open={approveAllOpen}
                    onOpenChange={(open) => !open && setApproveAllOpen(false)}
                    title={t('osTravel.approveAllTitle')}
                    description={t('osTravel.approveAllDescription')}
                    confirmText={t('osTravel.approveAll')}
                    cancelText={t('actions.cancel')}
                    dir={dir}
                    onConfirm={() =>
                        approveAllMutation.mutate({
                            ...approveAllOptions,
                            ...filters,
                        })
                    }
                >
                    <div className="space-y-3 px-6">
                        {pendingWithoutImage > 0 && (
                            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                                <Checkbox
                                    id="approve-without-image"
                                    checked={
                                        approveAllOptions.include_without_image
                                    }
                                    onCheckedChange={(checked) =>
                                        setApproveAllOptions((prev) => ({
                                            ...prev,
                                            include_without_image:
                                                checked === true,
                                        }))
                                    }
                                    className="mt-0.5"
                                />
                                <Label
                                    htmlFor="approve-without-image"
                                    className="cursor-pointer text-sm font-normal leading-relaxed"
                                >
                                    {t('osTravel.preflightIncludeImage').replace(
                                        '{count}',
                                        String(pendingWithoutImage),
                                    )}
                                </Label>
                            </div>
                        )}
                    </div>
                </ConfirmDialog>
            </div>
        </AdminLayout>
    );
};

export default AdminOsTravel;
