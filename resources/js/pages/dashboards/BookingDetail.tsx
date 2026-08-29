import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    Clock,
    Hotel,
    Info,
    Ruler,
    ShieldCheck,
    User,
    Users,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    cancelBooking,
    getBooking,
    type BookingDetailRow,
} from '@/api/booking.api';
import { VoucherCard } from '@/components/booking/VoucherCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { bookingStatusLabels } from '@/lib/adminI18n';
import { cn, formatPrice } from '@/lib/utils';

const statusColors: Record<string, string> = {
    Pending: 'bg-secondary/10 text-secondary',
    Approved: 'bg-blue-100 text-blue-700',
    Confirmed: 'bg-primary/10 text-primary',
    Rejected: 'bg-destructive/10 text-destructive',
    Cancelled: 'bg-destructive/10 text-destructive',
    Expired: 'bg-muted text-muted-foreground',
    Completed: 'bg-green-100 text-green-700',
};

function formatDate(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

function formatDateTime(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

/** OS-TRAVEL boarding fields can be {Id, Code, Name} objects or plain strings. */
function boardingLabel(value: unknown): string {
    if (!value) return '—';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        if (typeof obj.Name === 'string') return obj.Name;
        return JSON.stringify(obj);
    }
    return String(value);
}

function bookingTitle(booking: BookingDetailRow): string {
    if (booking.details?.room_name) {
        const parts = [booking.item_slug ?? booking.item_id];
        if (booking.details.room_name) parts.push(booking.details.room_name);
        if (booking.details.boarding_name)
            parts.push(booking.details.boarding_name);
        return parts.filter(Boolean).join(' / ') || `#${booking.booking_ref}`;
    }
    return (
        [
            booking.type,
            booking.item_slug,
            booking.item_id,
            booking.items
                .map((item) => item.slug ?? item.id)
                .filter(Boolean)
                .join(', '),
        ]
            .filter(Boolean)
            .join(' / ') || `#${booking.booking_ref}`
    );
}

export default function BookingDetail() {
    const { id } = useParams<{ id: string }>();
    const bookingId = id;
    const { lang, t } = useLanguage();
    const { data: user } = useAuthUser();
    const queryClient = useQueryClient();

    const {
        data: booking,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['booking', bookingId],
        queryFn: () => getBooking(bookingId!),
        enabled: !!bookingId,
    });

    const cancelMutation = useMutation({
        mutationFn: () => cancelBooking(bookingId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client'] });
            queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
            toast.success(
                t('booking.cancelled') || 'Booking cancelled successfully.',
            );
        },
        onError: () => {
            toast.error(t('booking.error') || 'Failed to cancel the booking.');
        },
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <Skeleton className="h-8 w-64 rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        );
    }

    if (isError || !booking) {
        return (
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div className="rounded-2xl border border-border bg-card p-10 text-center">
                    <p className="text-muted-foreground">
                        {t('bookingDetail.notFound') || 'Booking not found.'}
                    </p>
                    <Link to="/client/dashboard" className="mt-4 inline-block">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            {t('bookingDetail.back') || 'Back to my bookings'}
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const status = booking.status;
    const statusLabel = bookingStatusLabels[status]?.[lang] ?? status;
    const currency = booking.details?.currency ?? booking.currency ?? 'TND';
    const total = Number(booking.total_amount ?? booking.amount ?? 0);
    const breakdown = booking.provider_prebook?.breakdown ?? null;
    const notes = booking.notes;
    const details = booking.details;

    const renderStatusBanner = () => {
        if (status === 'Pending') {
            return (
                <div className="flex items-start gap-2 rounded-2xl border border-secondary/30 bg-secondary/5 px-4 py-3 text-sm">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <p className="text-muted-foreground">
                        {t('client.bookingDecisionWindow')}{' '}
                        <span className="font-semibold text-foreground">
                            {formatDateTime(booking.expires_at)}
                        </span>
                    </p>
                </div>
            );
        }

        if (status === 'Approved') {
            return (
                <div className="flex items-start gap-2 rounded-2xl border border-blue-300/50 bg-blue-50 px-4 py-3 text-sm">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <p className="text-blue-900">
                        {t('bookingDetail.approvedNote') ||
                            'Your booking is approved. Waiting for the hotel to confirm.'}
                    </p>
                </div>
            );
        }

        if (status === 'Rejected' && booking.reject_reason) {
            return (
                <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-muted-foreground">
                        <span className="font-semibold text-destructive">
                            {t('client.bookingRejectedReason')}:
                        </span>{' '}
                        {booking.reject_reason}
                    </p>
                </div>
            );
        }

        if (status === 'Cancelled' && booking.cancel_reason) {
            return (
                <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-muted-foreground">
                        <span className="font-semibold text-destructive">
                            {t('client.bookingCancelledReason')}:
                        </span>{' '}
                        {booking.cancel_reason}
                    </p>
                </div>
            );
        }

        if (status === 'Expired') {
            return (
                <div className="flex items-start gap-2 rounded-2xl border border-muted bg-muted/40 px-4 py-3 text-sm">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        {t('bookingDetail.expiredNote') ||
                            'This booking request expired before a decision was made.'}
                    </p>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/client/dashboard">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('bookingDetail.back')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="font-serif text-2xl font-bold text-foreground">
                            {t('bookingDetail.title') || 'Booking details'}{' '}
                            <span className="text-muted-foreground">
                                #{booking.booking_ref}
                            </span>
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {bookingTitle(booking)}
                        </p>
                    </div>
                </div>
                <span
                    className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        statusColors[status] ??
                            'bg-secondary/10 text-secondary',
                    )}
                >
                    {statusLabel}
                </span>
            </div>

            {renderStatusBanner()}

            {/* Summary */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-5"
            >
                <div className="flex items-center gap-4">
                    {details?.image ? (
                        <img
                            src={details.image}
                            alt=""
                            className="h-14 w-16 shrink-0 rounded-2xl object-cover"
                        />
                    ) : (
                        <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                            <Hotel className="h-5 w-5 text-primary" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate font-semibold text-foreground">
                            {bookingTitle(booking)}
                        </h2>
                        {details?.room_name && (
                            <p className="text-sm text-muted-foreground">
                                {details.room_name}
                                {details.boarding_name
                                    ? ` · ${details.boarding_name}`
                                    : ''}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {[booking.start_date, booking.end_date]
                                .filter(Boolean)
                                .map(formatDate)
                                .join(' — ') || formatDate(booking.created_at)}
                            {details?.nights
                                ? ` · ${details.nights} nights`
                                : ''}
                        </p>
                    </div>
                    <div className="text-right">
                        {details?.base_price && details?.promo_rate ? (
                            <p className="text-xs font-medium text-muted-foreground line-through">
                                {formatPrice(details.base_price, currency)}
                            </p>
                        ) : null}
                        <p className="font-serif text-2xl font-bold text-primary">
                            {formatPrice(total, currency)}
                        </p>
                        {details?.promo_rate ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                {details.promo_rate}
                            </span>
                        ) : null}
                        {details?.price_per_night && details?.nights ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatPrice(details.price_per_night, currency)} / night
                            </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                            {t('bookingDetail.bookedOn') || 'Booked on'}{' '}
                            {formatDateTime(booking.created_at)}
                        </p>
                    </div>
                </div>

                {/* Room details row */}
                {(details?.room_size ||
                    details?.room_capacity ||
                    details?.room_features?.length ||
                    details?.not_refundable ||
                    details?.free_cancellation_until) && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                        {details?.room_size ? (
                            <span className="inline-flex items-center gap-1">
                                <Ruler className="h-3 w-3" />
                                {details.room_size} m²
                            </span>
                        ) : null}
                        {details?.room_capacity ? (
                            <span className="inline-flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {details.room_capacity}{' '}
                                {t('hotelDetail.guests') || 'guests'}
                            </span>
                        ) : null}
                        {details?.room_features?.slice(0, 3).map((feature) => (
                            <span
                                key={feature}
                                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
                            >
                                {feature}
                            </span>
                        ))}
                        {details?.not_refundable && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                {t('hotelDetail.nonRefundable') ||
                                    'Non-refundable'}
                            </span>
                        )}
                        {details?.free_cancellation_until && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                <ShieldCheck className="h-3 w-3" />
                                {t('hotelDetail.freeCancellationUntil') ||
                                    'Free cancellation until'}{' '}
                                {details.free_cancellation_until}
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                            {t('bookingDetail.client') || 'Client'}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                            {booking.client?.name || user?.name || '—'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {booking.client?.email || '—'}
                        </p>
                        {booking.client?.phone ? (
                            <p className="text-sm text-muted-foreground">
                                {booking.client.phone}
                            </p>
                        ) : null}
                    </div>

                    {booking.promo_code ? (
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Promo
                            </p>
                            <p className="text-sm font-semibold text-primary">
                                {booking.promo_code}
                            </p>
                        </div>
                    ) : null}

                    {booking.expires_at && status === 'Pending' ? (
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                {t('bookingDetail.decisionBy') || 'Decision by'}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                                {formatDateTime(booking.expires_at)}
                            </p>
                        </div>
                    ) : null}
                </div>
            </motion.div>

            {/* Guests */}
            {booking.guests && booking.guests.length > 0 ? (
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="mb-3 font-serif text-lg font-bold text-foreground">
                        {t('bookingDetail.guests') || 'Guests'}
                    </h3>
                    <ul className="space-y-2">
                        {booking.guests.map((guest, index) => (
                            <li
                                key={index}
                                className="flex items-center gap-3 text-sm text-foreground"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </span>
                                {guest.name || `#${index + 1}`}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {/* Supplements */}
            {details?.supplements && details.supplements.length > 0 ? (
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="mb-3 font-serif text-lg font-bold text-foreground">
                        {t('bookingDetail.supplements') || 'Supplements'}
                    </h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {details.supplements.map((supplement, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between"
                            >
                                <span>
                                    {supplement.name}
                                    {supplement.perNight
                                        ? ` (${t('hotelDetail.pernight') || 'per night'})`
                                        : ''}
                                </span>
                                <span className="font-semibold text-foreground">
                                    +{supplement.price.toLocaleString()}{' '}
                                    {currency}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {/* Notes */}
            {notes ? (
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="mb-2 font-serif text-lg font-bold text-foreground">
                        {t('label.notes') || 'Notes'}
                    </h3>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                        {notes}
                    </p>
                </div>
            ) : null}

            {/* Price breakdown */}
            {breakdown ? (
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="mb-3 font-serif text-lg font-bold text-foreground">
                        {t('bookingDetail.priceBreakdown') || 'Price breakdown'}
                    </h3>
                    {breakdown.rooms && breakdown.rooms.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                                        <th className="px-2 py-1.5 font-medium">
                                            {t('voucher.room') || 'Room'}
                                        </th>
                                        <th className="px-2 py-1.5 font-medium">
                                            {t('voucher.boarding') ||
                                                'Boarding'}
                                        </th>
                                        <th className="px-2 py-1.5 font-medium">
                                            {t('voucher.nights') || 'Nights'}
                                        </th>
                                        <th className="px-2 py-1.5 text-right font-medium">
                                            {t('voucher.total') || 'Total'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdown.rooms.map((room, index) => (
                                        <tr
                                            key={room.id?.toString() ?? index}
                                            className="border-b border-border/60 last:border-0"
                                        >
                                            <td className="px-2 py-2 font-medium text-foreground">
                                                {t('voucher.room') || 'Room'}{' '}
                                                {index + 1}
                                            </td>
                                            <td className="px-2 py-2 text-muted-foreground">
                                                {boardingLabel(room.boarding)}
                                            </td>
                                            <td className="px-2 py-2 text-muted-foreground">
                                                {breakdown.nights ?? '—'}
                                            </td>
                                            <td className="px-2 py-2 text-right font-semibold text-foreground">
                                                {(() => {
                                                    const roomTotal = Number(
                                                        room.total ?? 0,
                                                    );
                                                    const displayTotal =
                                                        roomTotal > 0
                                                            ? roomTotal
                                                            : Number(
                                                                  breakdown.total ??
                                                                      total,
                                                              );
                                                    return (
                                                        <>
                                                            {formatPrice(displayTotal, room.currency ?? currency)}
                                                        </>
                                                    );
                                                })()}
                                                {room.price_per_night ? (
                                                    <span className="block text-xs font-normal text-muted-foreground">
                                                        ~{formatPrice(room.price_per_night, room.currency ?? currency)}{' '}
                                                        {t(
                                                            'bookingDetail.perNight',
                                                        ) || 'per night'}
                                                    </span>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border">
                                        <td
                                            colSpan={3}
                                            className="px-2 py-2 text-right text-sm font-semibold text-muted-foreground"
                                        >
                                            {t('voucher.total') || 'Total'}
                                        </td>
                                        <td className="px-2 py-2 text-right font-serif text-lg font-bold text-primary">
                                            {formatPrice(total, currency)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm font-semibold text-foreground">
                            {formatPrice(total, currency)}
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
                    <span className="text-sm text-muted-foreground">
                        {t('voucher.total') || 'Total'}
                    </span>
                    <span className="font-serif text-2xl font-bold text-primary">
                        {formatPrice(total, currency)}
                    </span>
                </div>
            )}

            {/* Cancellation policy */}
            {(
                breakdown?.cancellation_policy?.length
                    ? breakdown.cancellation_policy
                    : details?.cancellation_policy?.length
                      ? details.cancellation_policy
                      : null
            ) ? (
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="mb-3 font-serif text-lg font-bold text-foreground">
                        {t('bookingDetail.cancellationPolicy') ||
                            'Cancellation policy'}
                    </h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {(breakdown?.cancellation_policy?.length
                            ? breakdown.cancellation_policy
                            : details!.cancellation_policy!
                        ).map((entry, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                                <span>
                                    {entry.description ||
                                        (entry.type === 'PERCENT'
                                            ? `${entry.fees}%`
                                            : `${entry.fees} ${currency}`)}
                                    {entry.from_date
                                        ? ` — ${formatDate(entry.from_date)}`
                                        : ''}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {/* Voucher */}
            {status === 'Confirmed' && <VoucherCard booking={booking} />}

            {/* Actions */}
            {booking.can_cancel ? (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        className="gap-2"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate()}
                    >
                        <AlertCircle className="h-4 w-4" />
                        {cancelMutation.isPending
                            ? t('common.processing') || 'Processing...'
                            : t('actions.cancel') || 'Cancel booking'}
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
