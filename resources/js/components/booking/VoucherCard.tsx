import { Printer } from 'lucide-react';
import type { ClientBookingRow } from '@/api/booking.api';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface VoucherCardProps {
    booking: ClientBookingRow;
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

/**
 * Printable voucher for a confirmed booking. Renders the booking + provider
 * reference and a payload summary (dates, nights, rooms/boarding, totals).
 * Print via the built-in browser dialog; the rest of the app is hidden by
 * the `.print-area` / `print:` utilities.
 */
export function VoucherCard({ booking }: VoucherCardProps) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';

    const breakdown = booking.provider_prebook?.breakdown ?? null;
    const currency = booking.currency ?? 'TND';
    const providerRef =
        booking.provider_booking_reference ||
        breakdown?.voucher?.Num ||
        booking.provider_booking_id ||
        null;

    const title =
        [booking.type, booking.item_slug, booking.item_id]
            .filter(Boolean)
            .join(' / ') || `#${booking.booking_ref}`;

    const formatDate = (value?: string | null) => {
        if (!value) return '—';
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString();
    };

    return (
        <div
            id={`voucher-${booking.id}`}
            className="print-area overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-card"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary/5 px-5 py-4">
                <div>
                    <h4 className="font-serif text-lg font-bold text-primary">
                        {t('voucher.title')}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        {t('voucher.subtitle')}
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 print:hidden"
                    onClick={() => window.print()}
                >
                    <Printer className="h-4 w-4" />
                    {t('voucher.print')}
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                        {t('voucher.bookingRef')}
                    </p>
                    <p className="font-bold text-foreground">
                        #{booking.booking_ref}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                        {t('voucher.item')}
                    </p>
                    <p className="font-semibold text-foreground">{title}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                        {t('voucher.dates')}
                    </p>
                    <p className="font-semibold text-foreground">
                        {formatDate(booking.start_date)}
                        {booking.end_date
                            ? ` — ${formatDate(booking.end_date)}`
                            : ''}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                        {t('voucher.total')}
                    </p>
                    <p className="font-serif text-xl font-bold text-primary">
                        {Number(booking.total_amount).toLocaleString()}{' '}
                        {currency}
                    </p>
                </div>

                {providerRef && (
                    <div className="space-y-1 sm:col-span-2">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                            {t('voucher.providerRef')}
                        </p>
                        <p className="break-all font-mono text-sm font-semibold text-foreground">
                            {providerRef}
                        </p>
                    </div>
                )}
            </div>

            {breakdown && breakdown.rooms && breakdown.rooms.length > 0 && (
                <div className="border-t border-border px-5 py-4">
                    <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                        {t('voucher.summary')}
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                                    <th className="px-2 py-1.5 font-medium">
                                        {t('voucher.room')}
                                    </th>
                                    <th className="px-2 py-1.5 font-medium">
                                        {t('voucher.boarding')}
                                    </th>
                                    {breakdown.nights !== undefined && (
                                        <th className="px-2 py-1.5 font-medium">
                                            {t('voucher.nights')}
                                        </th>
                                    )}
                                    <th className="px-2 py-1.5 font-medium">
                                        {t('voucher.total')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {breakdown.rooms.map((room, index) => (
                                    <tr
                                        key={room.id?.toString() ?? index}
                                        className="border-b border-border/60 last:border-0"
                                    >
                                        <td
                                            className={cn(
                                                'px-2 py-2 font-medium text-foreground',
                                                isRtl && 'text-right',
                                            )}
                                        >
                                            {t('voucher.room')} {index + 1}
                                        </td>
                                        <td className="px-2 py-2 text-muted-foreground">
                                            {boardingLabel(room.boarding)}
                                        </td>
                                        {breakdown.nights !== undefined && (
                                            <td className="px-2 py-2 text-muted-foreground">
                                                {breakdown.nights}
                                            </td>
                                        )}
                                        <td className="px-2 py-2 font-semibold text-foreground">
                                            {Number(
                                                room.total ?? 0,
                                            ).toLocaleString()}{' '}
                                            {room.currency ?? currency}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
