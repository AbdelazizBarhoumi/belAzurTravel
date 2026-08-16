import { useMutation } from '@tanstack/react-query';
import {
    Eye,
    Image as ImageIcon,
    Loader2,
    RefreshCw,
    Star,
    Trash2,
    Undo2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import {
    type OsTravelCatalogBoarding,
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
import { earliestCheckIn, toLocalISODate } from '@/lib/utils';

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
    include_without_price: boolean;
    include_without_image: boolean;
}

const EMPTY_APPROVE_ALL_OPTIONS: ApproveAllOptions = {
    include_without_price: false,
    include_without_image: false,
};

const priceStatusMeta: Record<
    NonNullable<OsTravelHotelRow['price_status']>,
    { labelKey: string; className: string }
> = {
    never_refreshed: {
        labelKey: 'osTravel.priceReason.neverRefreshed',
        className: 'text-muted-foreground',
    },
    no_availability: {
        labelKey: 'osTravel.priceReason.noAvailability',
        className: 'text-amber-600',
    },
    provider_error: {
        labelKey: 'osTravel.priceReason.providerError',
        className: 'text-destructive',
    },
    has_price: {
        labelKey: 'osTravel.priceReason.hasPrice',
        className: 'text-muted-foreground',
    },
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
    provider_error: {
        labelKey: 'osTravel.liveStatus.providerError',
        className: 'text-destructive',
    },
};

const availabilityStatusMeta: Record<
    NonNullable<OsTravelHotelRow['availability_status']>,
    { labelKey: string; className: string }
> = {
    available: {
        labelKey: 'osTravel.availability.available',
        className: 'text-emerald-600',
    },
    stop_reservation: {
        labelKey: 'osTravel.availability.stopReservation',
        className: 'text-red-600',
    },
    stop_sale: {
        labelKey: 'osTravel.availability.stopSale',
        className: 'text-amber-600',
    },
    no_bookable_room: {
        labelKey: 'osTravel.availability.noBookableRoom',
        className: 'text-amber-600',
    },
    not_returned: {
        labelKey: 'osTravel.availability.notReturned',
        className: 'text-amber-600',
    },
};

interface PriceForm {
    basePrice: string;
    markup: string;
    currency: string;
}

const emptyPriceForm: PriceForm = {
    basePrice: '',
    markup: '20',
    currency: 'TND',
};

const hotelLabel = (
    externalId: string,
    hotels: OsTravelHotelRow[],
): string => {
    const match = hotels.find((h) => h.external_id === externalId);
    return match ? match.name : `#${externalId}`;
};

const displayDate = (value: string): string => {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime())
        ? value
        : `${parsed.getDate()}/${parsed.getMonth() + 1}/${parsed.getFullYear()}`;
};

const boardingLabel = (
    boardingId: number | null,
    boardings: OsTravelCatalogBoarding[],
): string => {
    const match = boardings.find((b) => b.id === boardingId);
    return match?.name ?? '';
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
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [approveAllOpen, setApproveAllOpen] = useState(false);
    const [approveAllOptions, setApproveAllOptions] =
        useState<ApproveAllOptions>(EMPTY_APPROVE_ALL_OPTIONS);
    const [refreshResult, setRefreshResult] = useState<{
        omitted_ids: string[];
        failed_ids: string[];
        updated: number;
    } | null>(null);
    const [refreshProgress, setRefreshProgress] = useState<{
        done: number;
        total: number;
    } | null>(null);

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

    const computedPrice = useMemo(() => {
        const base = Number.parseFloat(priceForm.basePrice);
        const markup = Number.parseFloat(priceForm.markup);
        if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(markup)) {
            return null;
        }
        return Math.round(base * (1 + markup / 100));
    }, [priceForm.basePrice, priceForm.markup]);

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
                basePrice:
                    detail.base_price !== null ? String(detail.base_price) : '',
                markup: detail.markup_percentage ?? '20',
                currency: detail.currency ?? 'TND',
            });
        }
    }, [detail, detailId]);

    const pendingWithoutPrice = useMemo(
        () => hotels.filter((h) => !h.has_base_price).length,
        [hotels],
    );

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
                base_price:
                    priceForm.basePrice === ''
                        ? undefined
                        : Number(priceForm.basePrice),
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
                base_price:
                    priceForm.basePrice === ''
                        ? null
                        : Number(priceForm.basePrice),
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
            if (result.skipped_no_price_count > 0) {
                summary.push(
                    t('osTravel.skippedNoPrice').replace(
                        '{count}',
                        String(result.skipped_no_price_count),
                    ),
                );
            }
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

    const refreshAllMutation = useMutation({
        mutationFn: (data?: {
            ids?: string[];
            check_in?: string;
            check_out?: string;
        }) =>
            admin.refreshPrices(data, (done, total) =>
                setRefreshProgress({ done, total }),
            ),
        onMutate: () => {
            setRefreshProgress(null);
        },
        onSuccess: (result) => {
            toast.success(
                t('osTravel.refreshAllDone')
                    .replace('{updated}', String(result.updated))
                    .replace('{omitted}', String(result.omitted)),
            );
            setRefreshResult({
                omitted_ids: result.omitted_ids,
                failed_ids: result.failed_ids,
                updated: result.updated,
            });
            setRefreshProgress(null);
        },
        onError: (err: unknown) => {
            setRefreshProgress(null);
            toast.error(admin.toErrorMessage(err, 'osTravel.refreshFailed'));
        },
    });

    const refreshPriceMutation = useMutation({
        mutationFn: (id: string) => admin.refreshPrice(id),
        onMutate: (id) => {
            setRefreshingId(id);
        },
        onSuccess: (row) => {
            if (row.base_price !== null) {
                hydratedIdRef.current = detailId;
                setPriceForm((p) => ({
                    ...p,
                    basePrice: String(row.base_price),
                    currency: row.currency ?? p.currency,
                }));
                toast.success(
                    t('osTravel.priceRefreshed')
                        .replace('{price}', String(row.base_price))
                        .replace('{currency}', row.currency ?? 'TND'),
                );
            } else {
                toast.info(t('osTravel.noAvailability'));
            }
        },
        onError: (err: unknown) => {
            toast.error(admin.toErrorMessage(err, 'osTravel.refreshFailed'));
        },
        onSettled: () => {
            setRefreshingId(null);
        },
    });

    const activeHotel = hotels.find((h) => h.id === detailId) ?? null;
    const preview = detail?.mapped_preview ?? null;

    const filteredHotels = useMemo(() => hotels, [hotels]);

    // The date filter drives the live probe; block any pick before the
    // earliest day any displayed hotel is available from (and never allow
    // a same-day check-in, which the provider cannot book).
    const pickerMinDate = useMemo(
        () =>
            earliestCheckIn(filteredHotels.map((h) => h.first_available_at)),
        [filteredHotels],
    );

    const availableCities = useMemo(() => {
        if (!references) return [];
        if (!countryId) return references.cities;
        return references.cities.filter((c) => c.country_id === countryId);
    }, [references, countryId]);

    const formatDate = (date: Date) => toLocalISODate(date) ?? '';

    const hasDateFilter = Boolean(dateRange?.from && dateRange.to);

    const dateFilterValues = useMemo(() => {
        if (!dateRange?.from || !dateRange.to) return null;
        return {
            check_in: formatDate(dateRange.from),
            check_out: formatDate(dateRange.to),
        };
    }, [dateRange]);

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
                        fromDate={pickerMinDate}
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
                    <Button
                        variant="outline"
                        onClick={() =>
                            refreshAllMutation.mutate({
                                ids: hotels.map((h) => h.id),
                                ...dateFilterValues,
                            })
                        }
                        disabled={
                            refreshAllMutation.isPending ||
                            hotels.length === 0
                        }
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${
                                refreshAllMutation.isPending
                                    ? 'animate-spin'
                                    : ''
                            }`}
                        />
                        {refreshAllMutation.isPending
                            ? refreshProgress &&
                              refreshProgress.total > 1
                                ? `${t('osTravel.refreshing')} (${refreshProgress.done}/${refreshProgress.total})`
                                : t('osTravel.refreshing')
                            : t('osTravel.refreshPrices')}
                    </Button>
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
                                        t('admin.minPrice'),
                                        t('admin.finalPrice'),
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
                                                  <Skeleton className="h-3.5 w-16" />
                                              </td>
                                              <td className="px-4 py-3">
                                                  <Skeleton className="h-3.5 w-16" />
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
                                                    {!h.has_base_price && (
                                                        <p
                                                            className={`text-[10px] font-semibold ${
                                                                h.price_status &&
                                                                priceStatusMeta[
                                                                    h.price_status
                                                                ]
                                                                    ? priceStatusMeta[
                                                                          h
                                                                              .price_status
                                                                      ].className
                                                                    : 'text-destructive'
                                                            }`}
                                                        >
                                                            {h.price_status &&
                                                            priceStatusMeta[
                                                                h.price_status
                                                            ]
                                                                ? t(
                                                                      priceStatusMeta[
                                                                          h
                                                                              .price_status
                                                                      ]
                                                                          .labelKey,
                                                                  )
                                                                : t(
                                                                      'osTravel.missingPrice',
                                                                  )}
                                                        </p>
                                                    )}
                                                    {h.has_base_price && (
                                                        <p className="text-[10px] font-semibold text-muted-foreground">
                                                            {t(
                                                                'osTravel.priceReason.hasPrice',
                                                            )}
                                                        </p>
                                                    )}
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
                                            {h.base_price !== null ? (
                                                <span className="font-medium">
                                                    {h.base_price}{' '}
                                                    {h.currency ?? 'TND'}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                            {h.base_price === null &&
                                                h.availability_status &&
                                                availabilityStatusMeta[
                                                    h.availability_status
                                                ] && (
                                                    <p
                                                        className={`mt-0.5 text-[10px] font-semibold ${availabilityStatusMeta[h.availability_status].className}`}
                                                    >
                                                        {t(
                                                            availabilityStatusMeta[
                                                                h
                                                                    .availability_status
                                                            ].labelKey,
                                                        )}
                                                    </p>
                                                )}
                                            {h.first_available_at && (
                                                <p className="mt-0.5 text-[10px] font-semibold text-primary">
                                                    {t(
                                                        'osTravel.availableFrom',
                                                    )}{' '}
                                                    {displayDate(
                                                        h.first_available_at,
                                                    )}
                                                    {h.min_nights &&
                                                        h.min_nights > 1 &&
                                                        ` · ${t('osTravel.minNights')} ${h.min_nights} ${t('osTravel.nightsShort')}`}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {h.final_price !== null ? (
                                                <span className="font-semibold text-emerald-600">
                                                    {h.final_price}{' '}
                                                    {h.live_currency ??
                                                        h.currency ??
                                                        'TND'}
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
                                                    {h.live_until && (
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
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        refreshPriceMutation.mutate(
                                                            h.id,
                                                        )
                                                    }
                                                    disabled={
                                                        refreshPriceMutation.isPending
                                                    }
                                                    aria-label={t(
                                                        'osTravel.refreshPrice',
                                                    )}
                                                >
                                                    <RefreshCw
                                                        className={`h-4 w-4 ${
                                                            refreshingId === h.id
                                                                ? 'animate-spin'
                                                                : ''
                                                        }`}
                                                    />
                                                    <span className="sr-only">
                                                        {t(
                                                            'osTravel.refreshPrice',
                                                        )}
                                                    </span>
                                                </Button>
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

                            {preview &&
                                (preview.promotion?.rate ||
                                    preview.free_child.length > 0 ||
                                    preview.recommended) && (
                                    <div className="flex flex-wrap gap-2">
                                        {preview.promotion?.rate && (
                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                                {t('osTravel.promotion')}{' '}
                                                {preview.promotion.title}
                                            </span>
                                        )}
                                        {preview.free_child.length > 0 && (
                                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                {t('osTravel.freeChild')}
                                            </span>
                                        )}
                                        {preview.recommended && (
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                                                {t('osTravel.recommended')}
                                            </span>
                                        )}
                                    </div>
                                )}

                            {preview && preview.rooms_catalog.length > 0 && (
                                <div className="rounded-xl border border-border bg-muted/20 p-4">
                                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                                        {t('osTravel.roomsCatalog')}
                                    </p>
                                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                                        {preview.rooms_catalog.map((room, i) => {
                                            const boarding = boardingLabel(
                                                room.boarding_id,
                                                preview.boardings,
                                            );
                                            return (
                                                <li
                                                    key={`${room.name}-${room.boarding_id}-${i}`}
                                                    className="flex items-start gap-3"
                                                >
                                                    {room.photo ? (
                                                        <img
                                                            src={room.photo}
                                                            alt={room.name}
                                                            className="h-14 w-20 shrink-0 rounded-lg object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display =
                                                                    'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                                                            <ImageIcon className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {room.name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {[boarding]
                                                                .filter(Boolean)
                                                                .concat(
                                                                    room.min_stay >
                                                                        1
                                                                        ? [
                                                                              `${t('osTravel.minStay')} ${room.min_stay} ${t('osTravel.nightsShort')}`,
                                                                          ]
                                                                        : [],
                                                                )
                                                                .join(' · ')}
                                                        </p>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* Price section */}
                            <div className="rounded-xl border border-border bg-muted/20 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                                        {t('osTravel.priceSection')}
                                    </p>
                                    {activeHotel && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    refreshPriceMutation.mutate(
                                                        activeHotel.id,
                                                    )
                                                }
                                                disabled={
                                                    refreshPriceMutation.isPending
                                                }
                                            >
                                                <RefreshCw
                                                    className={`h-3.5 w-3.5 ${
                                                        refreshingId ===
                                                        activeHotel.id
                                                            ? 'animate-spin'
                                                            : ''
                                                    }`}
                                                />
                                                {t('osTravel.fetchPrice')}
                                            </Button>
                                        )}
                                </div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            {t('admin.basePrice')}
                                        </label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={priceForm.basePrice}
                                            placeholder="0"
                                            aria-label={t('admin.basePrice')}
                                            onChange={(e) =>
                                                setPriceForm((p) => ({
                                                    ...p,
                                                    basePrice: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
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
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            {t('osTravel.computedPrice')}
                                        </label>
                                        <div className="flex h-10 items-center rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground">
                                            {computedPrice !== null
                                                ? `${computedPrice} ${
                                                      priceForm.currency ||
                                                      'TND'
                                                  }`
                                                : '—'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {activeHotel && !activeHotel.has_base_price && (
                                <p className="text-xs text-destructive">
                                    {activeHotel.price_status &&
                                    priceStatusMeta[activeHotel.price_status]
                                        ? t(
                                              priceStatusMeta[
                                                  activeHotel.price_status
                                              ].labelKey,
                                          )
                                        : t('osTravel.missingPrice')}
                                </p>
                            )}

                            {activeHotel?.first_available_at && (
                                <p className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-foreground">
                                    <span className="font-medium text-muted-foreground">
                                        {t('osTravel.availableFrom')}:{' '}
                                    </span>
                                    {displayDate(
                                        activeHotel.first_available_at,
                                    )}
                                    {activeHotel.min_nights &&
                                        activeHotel.min_nights > 1 &&
                                        ` · ${t('osTravel.minNights')} ${activeHotel.min_nights} ${t('osTravel.nightsShort')}`}
                                </p>
                            )}
                                </>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                disabled={savePriceMutation.isPending}
                                onClick={() => savePriceMutation.mutate()}
                            >
                                <RefreshCw className="h-4 w-4" />
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
                        {pendingWithoutPrice > 0 && (
                            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                                <Checkbox
                                    id="approve-without-price"
                                    checked={
                                        approveAllOptions.include_without_price
                                    }
                                    onCheckedChange={(checked) =>
                                        setApproveAllOptions((prev) => ({
                                            ...prev,
                                            include_without_price:
                                                checked === true,
                                        }))
                                    }
                                    className="mt-0.5"
                                />
                                <Label
                                    htmlFor="approve-without-price"
                                    className="cursor-pointer text-sm font-normal leading-relaxed"
                                >
                                    {t('osTravel.preflightIncludePrice').replace(
                                        '{count}',
                                        String(pendingWithoutPrice),
                                    )}
                                </Label>
                            </div>
                        )}
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

                {/* Refresh result: omitted / failed hotels */}
                <Dialog
                    open={refreshResult !== null}
                    onOpenChange={(open) => !open && setRefreshResult(null)}
                >
                    <DialogContent className="max-w-lg" dir={dir}>
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                {t('osTravel.refreshResultTitle')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('osTravel.refreshResultSummary').replace(
                                    '{updated}',
                                    String(refreshResult?.updated ?? 0),
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
                            {refreshResult &&
                                refreshResult.omitted_ids.length > 0 && (
                                    <div>
                                        <p className="mb-1 text-xs font-semibold text-amber-600">
                                            {t(
                                                'osTravel.refreshOmitted',
                                            ).replace(
                                                '{count}',
                                                String(
                                                    refreshResult.omitted_ids
                                                        .length,
                                                ),
                                            )}
                                        </p>
                                        <ul className="space-y-1 text-sm text-muted-foreground">
                                            {refreshResult.omitted_ids.map(
                                                (externalId) => (
                                                    <li key={externalId}>
                                                        {hotelLabel(
                                                            externalId,
                                                            hotels,
                                                        )}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                )}
                            {refreshResult &&
                                refreshResult.failed_ids.length > 0 && (
                                    <div>
                                        <p className="mb-1 text-xs font-semibold text-destructive">
                                            {t('osTravel.refreshFailedList').replace(
                                                '{count}',
                                                String(
                                                    refreshResult.failed_ids
                                                        .length,
                                                ),
                                            )}
                                        </p>
                                        <ul className="space-y-1 text-sm text-muted-foreground">
                                            {refreshResult.failed_ids.map(
                                                (externalId) => (
                                                    <li key={externalId}>
                                                        {hotelLabel(
                                                            externalId,
                                                            hotels,
                                                        )}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                )}
                            {refreshResult &&
                                refreshResult.omitted_ids.length === 0 &&
                                refreshResult.failed_ids.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {t('osTravel.refreshNoIssues')}
                                    </p>
                                )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setRefreshResult(null)}
                            >
                                {t('actions.close')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AdminOsTravel;
