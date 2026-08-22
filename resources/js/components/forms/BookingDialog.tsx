import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    BedDouble,
    CalendarDays,
    Check,
    Clock,
    Mail,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/DatePicker';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { api } from '@/hooks/useBooking';
import { toLocalISODate } from '@/lib/utils';

type Civility = 'Mr' | 'Mrs' | 'Ms';

interface GuestRow {
    civility: Civility;
    firstName: string;
    lastName: string;
    // Children carry an age for the provider's age-based pricing.
    age: number | null;
    passportNumber: string;
    passportExpiry: string;
}

interface BookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'destination' | 'hotel' | 'tour' | 'flight' | 'car' | 'travel';
    itemSlug?: string;
    itemId?: string;
    itemName: string;
    amount: number;
    /** Earliest selectable start date (hotels: the probe's nearest available day). */
    minDate?: Date;
    /** When true, this is a request booking for an unavailable hotel — no provider context. */
    isRequest?: boolean;
    /** Price before any promo discount — the "was" price. */
    basePrice?: number;
    /** Promo rate string (e.g. "10%") applied to this offer. */
    promoRate?: string | null;
    // OS-TRAVEL live-search context captured on the hotel detail page.
    provider?: {
        token?: string | null;
        source?: string | null;
        rooms?: Array<{
            id?: string | null;
            boardingId?: number | null;
            viewIds?: number[];
            supplements?: unknown[];
        }>;
        adults?: number;
        children?: number;
        childrenAges?: number[];
        // The date window the offer was priced for; the booking is locked to it.
        checkIn?: string;
        checkOut?: string;
        // Booking preferences (HotelDetail `Option[]`) the guest may select.
        options?: Array<{ id: number; title: string }>;
    };
    // -- Booking summary card (all optional, all degrade gracefully) --
    /** Thumbnail shown next to the item name in the summary card. */
    image?: string;
    /** Currency code shown next to amounts. Defaults to 'TND' to match the rest of the app. */
    currency?: string;
    /** When provided, shows a "N nights · price/night" breakdown line under the total. */
    pricePerNight?: number;
    /** e.g. the selected boarding/rate plan name — shown as a subtitle under the item name. */
    subLabel?: string;
    notRefundable?: boolean;
    /** ISO date string — renders a "free cancellation until …" trust badge. */
    freeCancellationUntil?: string;
    // -- Room details passed through to the booking `details` payload --
    roomName?: string;
    boardingName?: string;
    roomSize?: number;
    roomCapacity?: number;
    roomFeatures?: string[];
    cancellationPolicy?: Array<{
        fees: number;
        type: string | null;
        nature: string | null;
        description: string | null;
        from_date: string | null;
    }>;
    supplements?: Array<{ name: string; price: number; perNight?: boolean }>;
}

function emptyGuest(age: number | null): GuestRow {
    return {
        civility: 'Mr',
        firstName: '',
        lastName: '',
        age,
        passportNumber: '',
        passportExpiry: '',
    };
}

function formatShortDate(date: Date, lang: string): string {
    return date.toLocaleDateString(
        lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-TN' : 'en-GB',
        { day: 'numeric', month: 'short' },
    );
}

function formatShortDateFromISO(value: string, lang: string): string {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return formatShortDate(date, lang);
}

export function BookingDialog({
    open,
    onOpenChange,
    type,
    itemSlug,
    itemId,
    itemName,
    amount,
    minDate,
    isRequest,
    provider,
    image,
    currency = 'TND',
    pricePerNight,
    subLabel,
    notRefundable,
    freeCancellationUntil,
    roomName,
    boardingName,
    roomSize,
    roomCapacity,
    roomFeatures,
    cancellationPolicy,
    supplements,
    basePrice,
    promoRate,
}: BookingDialogProps) {
    const { t, lang } = useLanguage();
    const { data: user } = useAuthUser();
    const { pathname } = useLocation();
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [notes, setNotes] = useState('');
    const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
    const [guests, setGuests] = useState<GuestRow[]>([]);
    // Step 2: booking created — the request is awaiting admin approval.
    const [submittedBooking, setSubmittedBooking] = useState<{
        id: number;
        total: number;
        currency: string;
    } | null>(null);

    const hasProviderOffer = !isRequest && Boolean(
        provider?.token &&
            provider.rooms?.length &&
            provider.checkIn &&
            provider.checkOut,
    );

    // Hotels booked from a live offer are locked to the searched dates; the
    // token prices that exact window and cannot be re-booked for others.
    // Request bookings have no offer, so dates are never locked.
    const lockDates =
        !isRequest &&
        type === 'hotel' &&
        Boolean(provider?.token && provider.checkIn && provider.checkOut);

    // Locked dates are derived straight from the offer (never editable); local
    // state only drives the unlocked case.
    const effectiveStartDate =
        lockDates && provider?.checkIn
            ? new Date(`${provider.checkIn}T00:00:00`)
            : startDate;
    const effectiveEndDate =
        lockDates && provider?.checkOut
            ? new Date(`${provider.checkOut}T00:00:00`)
            : endDate;

    const adultCount = hasProviderOffer ? Math.max(1, provider?.adults ?? 1) : 0;
    const childCount = hasProviderOffer
        ? Math.max(0, provider?.children ?? 0)
        : 0;

    // Drives the summary card shown as soon as the dialog opens, and is
    // reused on the post-submit confirmation screen so the guest sees the
    // same recap throughout instead of the total appearing out of nowhere.
    const nights = useMemo(() => {
        if (!effectiveStartDate || !effectiveEndDate) return null;
        const ms = effectiveEndDate.getTime() - effectiveStartDate.getTime();
        const value = Math.round(ms / 86_400_000);
        return value > 0 ? value : null;
    }, [effectiveStartDate, effectiveEndDate]);

    const summaryDatesLabel = useMemo(() => {
        if (!effectiveStartDate || !effectiveEndDate) return null;
        const nightsWord =
            nights === 1
                ? t('hotelDetail.nightLabel') || 'night'
                : t('hotelDetail.nightsLabel') || 'nights';
        const nightsPart = nights ? ` · ${nights} ${nightsWord}` : '';
        return `${formatShortDate(effectiveStartDate, lang)} – ${formatShortDate(effectiveEndDate, lang)}${nightsPart}`;
    }, [effectiveStartDate, effectiveEndDate, nights, lang, t]);

    useEffect(() => {
        setSelectedOptionIds([]);
    }, [open]);

    useEffect(() => {
        if (open && user) {
            // Defer state updates to avoid synchronous setState within effect
            setTimeout(() => {
                setName(user.name || '');
                setEmail(user.email || '');
            }, 0);
        }
    }, [open, user]);

    // Rebuild the per-guest rows whenever the dialog opens with a
    // (possibly changed) offer occupancy.
    useEffect(() => {
        if (!open || !hasProviderOffer) {
            return;
        }
        const childrenAges = provider?.childrenAges ?? [];
        const rows: GuestRow[] = [];
        for (let i = 0; i < adultCount; i++) {
            rows.push(emptyGuest(null));
        }
        for (let i = 0; i < childCount; i++) {
            rows.push(emptyGuest(childrenAges[i] ?? 8));
        }
        setGuests(rows);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, adultCount, childCount]);

    const updateGuest = (index: number, patch: Partial<GuestRow>) => {
        setGuests((prev) =>
            prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        );
    };

    const mutation = useMutation({
        mutationFn: (payload: Record<string, unknown>) =>
            api.createBooking(payload) as Promise<{
                id: number;
                status?: string;
                total_amount?: number;
                provider_prebook?: { currency?: string };
            }>,
        onSuccess: async (data) => {
            toast.success(
                t('booking.success') ||
                    'Booking request submitted successfully!',
            );
            queryClient.invalidateQueries({
                queryKey: ['client', 'dashboard'],
            });

            // Every reservation goes through admin approval now — no payment
            // session to start. Surface the submitted request until it's
            // confirmed.
            if (data.status === 'Confirmed') {
                onOpenChange(false);
                return;
            }

            setSubmittedBooking({
                id: data.id,
                total: data.total_amount ?? amount,
                currency: data.provider_prebook?.currency ?? currency,
            });
        },
        onError: () => {
            toast.error(
                t('booking.error') || 'Failed to submit booking request.',
            );
        },
    });

    const guestPayload = useMemo(() => {
        const adults = guests
            .filter((row) => row.age === null)
            .map((row, index) => ({
                Civility: row.civility || 'Mr',
                Name: row.firstName.trim() || 'Guest',
                Surname: row.lastName.trim() || 'Traveler',
                Holder: index === 0,
            }));
        const children = guests
            .filter((row) => row.age !== null)
            .map((row) => ({
                Name: row.firstName.trim() || 'Child',
                Surname: row.lastName.trim() || 'Traveler',
                Age: row.age ?? 8,
            }));
        return { adults, children };
    }, [guests]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
            return;
        }

        const payload: Record<string, unknown> = {
            type,
            item_slug: itemSlug,
            item_id: itemId,
            start_date: toLocalISODate(effectiveStartDate),
            end_date: toLocalISODate(effectiveEndDate),
            client: {
                name,
                email,
                phone,
            },
            notes,
            amount,
            is_request: isRequest || undefined,
            guests: guests
                .map((row) => `${row.firstName} ${row.lastName}`.trim())
                .filter(Boolean)
                .map((line) => ({ name: line })),
            details: roomName || boardingName || cancellationPolicy?.length
                ? {
                    room_name: roomName ?? null,
                    boarding_name: boardingName ?? null,
                    image: image ?? null,
                    price_per_night: pricePerNight ?? null,
                    nights: nights ?? null,
                    currency,
                    base_price: basePrice ?? null,
                    final_price: amount,
                    promo_rate: promoRate ?? null,
                    not_refundable: notRefundable ?? false,
                    free_cancellation_until: freeCancellationUntil ?? null,
                    cancellation_policy: cancellationPolicy?.length
                        ? cancellationPolicy
                        : null,
                    supplements: supplements?.length ? supplements : null,
                    room_size: roomSize ?? null,
                    room_capacity: roomCapacity ?? null,
                    room_features: roomFeatures?.length ? roomFeatures : null,
                }
                : undefined,
        };

        if (provider?.token && provider.rooms?.length) {
            payload.provider = {
                token: provider.token,
                source: provider.source ?? 'OS-TRAVEL-DIRECT',
                rooms: provider.rooms.map((room) => ({
                    id: room.id ? Number(room.id) : undefined,
                    boarding_id: room.boardingId ?? undefined,
                    view_ids: room.viewIds ?? [],
                    supplements: room.supplements ?? [],
                })),
                pax: guestPayload,
                options: selectedOptionIds,
                search: {
                    check_in:
                        toLocalISODate(effectiveStartDate) ?? provider.checkIn,
                    check_out:
                        toLocalISODate(effectiveEndDate) ?? provider.checkOut,
                },
            };
        }

        mutation.mutate(payload);
    };

    const civilityOptions: { value: Civility; label: string }[] = [
        { value: 'Mr', label: t('booking.civilityMr') || 'Mr' },
        { value: 'Mrs', label: t('booking.civilityMrs') || 'Mrs' },
        { value: 'Ms', label: t('booking.civilityMs') || 'Ms' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                {submittedBooking ? (
                    <>
                        <div className="flex flex-col items-center gap-3 pb-1 pt-2 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                                <Check className="h-7 w-7 text-emerald-600" />
                            </div>
                            <div>
                                <DialogTitle className="font-serif text-xl font-bold">
                                    {t('booking.submittedTitle') ||
                                        'Request submitted'}
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    {t('booking.submittedDescription') ||
                                        "We've received your request. You'll be notified once it's confirmed."}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="space-y-3 py-3">
                            <div className="rounded-2xl border border-border bg-muted/30 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {itemName}
                                        </p>
                                        {summaryDatesLabel && (
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {summaryDatesLabel}
                                            </p>
                                        )}
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className="text-xs text-muted-foreground">
                                            {t('booking.submittedTotal') ||
                                                'Estimated total'}
                                        </span>
                                        <p className="font-serif text-xl font-bold text-primary">
                                            {submittedBooking.total.toLocaleString()}{' '}
                                            {submittedBooking.currency}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                    {t('booking.referenceLabel') || 'Reference'}{' '}
                                    #{submittedBooking.id}
                                </p>
                            </div>

                            <div className="space-y-2.5 rounded-2xl border border-border p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {t('booking.whatsNext') || "What's next"}
                                </p>
                                <div className="flex items-start gap-2.5 text-sm text-foreground">
                                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span>
                                        {t('booking.nextStepEmail') ||
                                            "You'll receive a confirmation email shortly."}
                                    </span>
                                </div>
                                <div className="flex items-start gap-2.5 text-sm text-foreground">
                                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span>
                                        {t('booking.nextStepReview') ||
                                            'Our team reviews availability, usually within 24 hours.'}
                                    </span>
                                </div>
                                <div className="flex items-start gap-2.5 text-sm text-foreground">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span>
                                        {t('booking.nextStepPayment') ||
                                            'No payment is taken until your booking is confirmed.'}
                                    </span>
                                </div>
                                <div className="flex items-start gap-2.5 text-sm text-foreground">
                                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span>
                                        {t('booking.nextStepContact') || 'For any questions, contact us at'}{' '}
                                        <a
                                            href="mailto:contact@belazurtravel.com"
                                            className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                                        >
                                            contact@belazurtravel.com
                                        </a>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={() => onOpenChange(false)}
                                className="w-full sm:w-auto"
                            >
                                {t('booking.submittedDone') || 'Done'}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>
                                {t('booking.titleGeneric') ||
                                    'Complete your booking'}
                            </DialogTitle>
                            <DialogDescription>
                                {t('booking.description') ||
                                    'Fill in the details below to request a booking.'}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Booking summary — visible the instant the dialog
                            opens, so the guest sees exactly what they're
                            reserving and for how much before typing
                            anything. This is what used to be missing: the
                            form appeared with no recap of the room, dates,
                            or price at all. */}
                        <div className="flex gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                            {image ? (
                                <img
                                    src={image}
                                    alt={itemName}
                                    className="hidden h-16 w-20 shrink-0 rounded-xl object-cover sm:block"
                                />
                            ) : (
                                <div className="hidden h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-muted sm:flex">
                                    <BedDouble className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {itemName}
                                </p>
                                {subLabel && (
                                    <p className="text-xs text-muted-foreground">
                                        {subLabel}
                                    </p>
                                )}
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    {summaryDatesLabel && (
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            {summaryDatesLabel}
                                        </span>
                                    )}
                                    {hasProviderOffer && (
                                        <span className="inline-flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {adultCount}{' '}
                                            {t('hotelDetail.guests') || 'guests'}
                                            {childCount > 0
                                                ? ` +${childCount}`
                                                : ''}
                                        </span>
                                    )}
                                </div>
                                {(notRefundable || freeCancellationUntil) && (
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {freeCancellationUntil && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                <ShieldCheck className="h-3 w-3" />
                                                {t(
                                                    'hotelDetail.freeCancellationUntil',
                                                ) || 'Free cancellation until'}{' '}
                                                {formatShortDateFromISO(
                                                    freeCancellationUntil,
                                                    lang,
                                                )}
                                            </span>
                                        )}
                                        {notRefundable && (
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                                {t('hotelDetail.nonRefundable') ||
                                                    'Non-refundable'}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="shrink-0 text-right">
                                {nights && pricePerNight ? (
                                    <p className="text-[11px] text-muted-foreground">
                                        {nights}{' '}
                                        {nights === 1
                                            ? t('hotelDetail.nightLabel') ||
                                              'night'
                                            : t('hotelDetail.nightsLabel') ||
                                              'nights'}{' '}
                                        · {pricePerNight.toLocaleString()}{' '}
                                        {currency}
                                    </p>
                                ) : null}
                                <p className="font-serif text-lg font-bold text-primary">
                                    {amount.toLocaleString()} {currency}
                                </p>
                            </div>
                        </div>

                        {isRequest && (
                            <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                {t('booking.requestNotice') ||
                                    'This is a request booking. We\'ll contact the hotel to check availability.'}
                            </div>
                        )}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4 py-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    {t('label.fullName') || 'Full Name'}
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        {t('label.email') || 'Email'}
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        {t('label.phone') || 'Phone'}
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            {hasProviderOffer && guests.length > 0 && (
                                <div className="space-y-4">
                                    <div className="h-px bg-border" />
                                    <div>
                                        <h3 className="mb-1 text-sm font-semibold text-foreground">
                                            {t('booking.guests') ||
                                                'Guests'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {t('booking.guestsHint') ||
                                                'Add each guest. The first adult is the booking holder.'}
                                        </p>
                                    </div>
                                    {guests.map((row, index) => (
                                        <div
                                            key={index}
                                            className="space-y-3 rounded-xl border border-border p-4"
                                        >
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {t('booking.guestNumber')}{' '}
                                                {index + 1}{' '}
                                                {row.age !== null
                                                    ? `· ${t('hotels.childrenLabel')}`
                                                    : ''}
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor={`pax-${index}-civility`}
                                                    >
                                                        {t('booking.civility') ||
                                                            'Civility'}
                                                    </Label>
                                                    <Select
                                                        value={row.civility}
                                                        onValueChange={(v) =>
                                                            updateGuest(
                                                                index,
                                                                {
                                                                    civility:
                                                                        v as Civility,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id={`pax-${index}-civility`}
                                                        >
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {civilityOptions.map(
                                                                (option) => (
                                                                    <SelectItem
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {row.age !== null && (
                                                    <div className="space-y-2">
                                                        <Label
                                                            htmlFor={`pax-${index}-age`}
                                                        >
                                                            {t(
                                                                'booking.age',
                                                            ) || 'Age'}
                                                        </Label>
                                                        <Input
                                                            id={`pax-${index}-age`}
                                                            type="number"
                                                            min={0}
                                                            max={17}
                                                            value={row.age}
                                                            onChange={(e) =>
                                                                updateGuest(
                                                                    index,
                                                                    {
                                                                        age: Number(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor={`pax-${index}-firstName`}
                                                    >
                                                        {t(
                                                            'booking.firstName',
                                                        ) || 'First name'}
                                                    </Label>
                                                    <Input
                                                        id={`pax-${index}-firstName`}
                                                        value={row.firstName}
                                                        onChange={(e) =>
                                                            updateGuest(
                                                                index,
                                                                {
                                                                    firstName:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        required={
                                                            row.age !== null
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor={`pax-${index}-lastName`}
                                                    >
                                                        {t(
                                                            'booking.lastName',
                                                        ) || 'Last name'}
                                                    </Label>
                                                    <Input
                                                        id={`pax-${index}-lastName`}
                                                        value={row.lastName}
                                                        onChange={(e) =>
                                                            updateGuest(
                                                                index,
                                                                {
                                                                    lastName:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        required={
                                                            row.age !== null
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            {row.age === null && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label
                                                            htmlFor={`pax-${index}-passportNumber`}
                                                        >
                                                            {t(
                                                                'booking.passportNumber',
                                                            ) ||
                                                                'Passport number'}
                                                        </Label>
                                                        <Input
                                                            id={`pax-${index}-passportNumber`}
                                                            value={
                                                                row.passportNumber
                                                            }
                                                            onChange={(e) =>
                                                                updateGuest(
                                                                    index,
                                                                    {
                                                                        passportNumber:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label
                                                            htmlFor={`pax-${index}-passportExpiry`}
                                                        >
                                                            {t(
                                                                'booking.passportExpiry',
                                                            ) ||
                                                                'Passport expiry'}
                                                        </Label>
                                                        <Input
                                                            id={`pax-${index}-passportExpiry`}
                                                            type="date"
                                                            value={
                                                                row.passportExpiry
                                                            }
                                                            onChange={(e) =>
                                                                updateGuest(
                                                                    index,
                                                                    {
                                                                        passportExpiry:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {provider?.options?.length ? (
                                <div className="space-y-2">
                                    <div className="h-px bg-border" />
                                    <Label>
                                        {t('booking.preferences') ||
                                            'Preferences'}
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {provider.options.map((option) => {
                                            const checked =
                                                selectedOptionIds.includes(
                                                    option.id,
                                                );
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedOptionIds(
                                                            (ids) =>
                                                                checked
                                                                    ? ids.filter(
                                                                          (i) =>
                                                                              i !==
                                                                              option.id,
                                                                      )
                                                                    : [
                                                                          ...ids,
                                                                          option.id,
                                                                      ],
                                                        )
                                                    }
                                                    className={
                                                        checked
                                                            ? 'rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary'
                                                            : 'rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40'
                                                    }
                                                >
                                                    {option.title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <Label htmlFor="notes">
                                    {t('label.notes') || 'Notes'}
                                </Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={
                                        t('booking.notesPlaceholder') ||
                                        'Any special requests?'
                                    }
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending
                                        ? t('common.processing') ||
                                          'Processing...'
                                        : `${t('booking.submit') || 'Request booking'} · ${amount.toLocaleString()} ${currency}`}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}