import { useMutation } from '@tanstack/react-query';
import { Eye, RefreshCw, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { type OsTravelHotelRow, type OsTravelStatus } from '@/api/osTravel.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
} from '@/hooks/useOsTravelAdmin';

const STATUSES: OsTravelStatus[] = [
    'pending',
    'approved',
    'published',
    'rejected',
    'orphaned',
];

const statusColors: Record<string, string> = {
    pending: 'bg-secondary/10 text-secondary',
    approved: 'bg-blue-100 text-blue-700',
    published: 'bg-primary/10 text-primary',
    rejected: 'bg-destructive/10 text-destructive',
    orphaned: 'bg-amber-100 text-amber-700',
};

const CURRENCIES = ['TND', 'EUR', 'USD', 'GBP'];

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

const AdminOsTravel = () => {
    useAdminGuard();
    const { t, dir } = useLanguage();
    const admin = useOsTravelAdmin();

    const [status, setStatus] = useState<OsTravelStatus | ''>('pending');
    const [city, setCity] = useState('');
    const [starsFilter, setStarsFilter] = useState('');
    const [detailId, setDetailId] = useState<string | null>(null);
    const [priceForm, setPriceForm] = useState<PriceForm>(emptyPriceForm);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [approveAllOpen, setApproveAllOpen] = useState(false);

    const { data: dashboard } = useOsTravelDashboard();
    const { data: hotels = [], isLoading } = useOsTravelHotels(status, city);
    const { data: detail } = useOsTravelHotelDetail(detailId);

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
        mutationFn: () => admin.approveAll({}),
        onSuccess: (result) => {
            setApproveAllOpen(false);
            const summary = [
                t('osTravel.publishedCount').replace(
                    '{count}',
                    String(result.published_count),
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
            if (result.skipped_over_cap_count > 0) {
                summary.push(
                    t('osTravel.skippedOverCap').replace(
                        '{count}',
                        String(result.skipped_over_cap_count),
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

    const activeHotel = hotels.find((h) => h.id === detailId) ?? null;
    const preview = detail?.mapped_preview ?? null;

    const filteredHotels = useMemo(() => {
        if (!starsFilter) return hotels;
        return hotels.filter((h) => String(h.stars) === starsFilter);
    }, [hotels, starsFilter]);

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
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                            {STATUSES.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={`rounded-xl border p-3 text-start transition-colors ${
                                        status === s
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-background hover:bg-muted/20'
                                    }`}
                                >
                                    <p className="text-2xl font-bold text-foreground">
                                        {counts[s] ?? 0}
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
                    <select
                        value={starsFilter}
                        onChange={(e) => setStarsFilter(e.target.value)}
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
                            onClick={() => setApproveAllOpen(true)}
                            disabled={
                                approveAllMutation.isPending ||
                                hotels.length === 0
                            }
                        >
                            {t('osTravel.approveAll')}
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    {[
                                        t('admin.name'),
                                        t('admin.location'),
                                        t('admin.stars'),
                                        t('admin.category'),
                                        t('admin.basePrice'),
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
                                {(isLoading ? [] : filteredHotels).map((h) => (
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
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {h.name}
                                                    </p>
                                                    {!h.has_base_price && (
                                                        <p className="text-[10px] font-semibold text-destructive">
                                                            {t(
                                                                'osTravel.missingPrice',
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {h.city_name}
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
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[h.status] || ''}`}
                                            >
                                                {t(
                                                    `osTravel.status.${h.status}`,
                                                )}
                                            </span>
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
                                                {h.status !== 'published' && (
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
                    {!isLoading && filteredHotels.length === 0 && (
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
                            {preview?.image && (
                                <img
                                    src={preview.image}
                                    alt={preview.name}
                                    className="h-44 w-full rounded-xl object-cover"
                                />
                            )}

                            {preview && preview.gallery.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto">
                                    {preview.gallery.map((url) => (
                                        <img
                                            key={url}
                                            src={url}
                                            alt=""
                                            className="h-20 w-28 shrink-0 rounded-lg object-cover"
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
                                <p className="text-xs font-semibold uppercase text-muted-foreground">
                                    {t('osTravel.priceSection')}
                                </p>
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
                                    {t('osTravel.missingPrice')}
                                </p>
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
                            {activeHotel?.status === 'pending' && (
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

                {/* Approve-all confirm */}
                <ConfirmDialog
                    open={approveAllOpen}
                    onOpenChange={(open) => !open && setApproveAllOpen(false)}
                    title={t('osTravel.approveAllTitle')}
                    description={t('osTravel.approveAllDescription')}
                    confirmText={t('osTravel.approveAll')}
                    cancelText={t('actions.cancel')}
                    dir={dir}
                    onConfirm={() => approveAllMutation.mutate()}
                >
                    <div className="space-y-2 px-6">
                        {pendingWithoutPrice > 0 && (
                            <p className="text-sm text-destructive">
                                {t('osTravel.preflightSkip').replace(
                                    '{count}',
                                    String(pendingWithoutPrice),
                                )}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {t('osTravel.capWarning')}
                        </p>
                    </div>
                </ConfirmDialog>
            </div>
        </AdminLayout>
    );
};

export default AdminOsTravel;
