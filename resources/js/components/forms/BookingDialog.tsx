import { useMutation, useQueryClient } from '@tanstack/react-query';
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

interface PassengerRow {
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
}

function emptyPassenger(age: number | null): PassengerRow {
    return {
        civility: 'Mr',
        firstName: '',
        lastName: '',
        age,
        passportNumber: '',
        passportExpiry: '',
    };
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
}: BookingDialogProps) {
    const { t } = useLanguage();
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
    const [passengers, setPassengers] = useState<PassengerRow[]>([]);
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

    // Rebuild the per-guest passenger rows whenever the dialog opens with a
    // (possibly changed) offer occupancy.
    useEffect(() => {
        if (!open || !hasProviderOffer) {
            return;
        }
        const childrenAges = provider?.childrenAges ?? [];
        const rows: PassengerRow[] = [];
        for (let i = 0; i < adultCount; i++) {
            rows.push(emptyPassenger(null));
        }
        for (let i = 0; i < childCount; i++) {
            rows.push(emptyPassenger(childrenAges[i] ?? 8));
        }
        setPassengers(rows);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, adultCount, childCount]);

    const updatePassenger = (index: number, patch: Partial<PassengerRow>) => {
        setPassengers((prev) =>
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
                currency: data.provider_prebook?.currency ?? 'TND',
            });
        },
        onError: () => {
            toast.error(
                t('booking.error') || 'Failed to submit booking request.',
            );
        },
    });

    const passengerPayload = useMemo(() => {
        const adults = passengers
            .filter((row) => row.age === null)
            .map((row, index) => ({
                Civility: row.civility || 'Mr',
                Name: row.firstName.trim() || 'Guest',
                Surname: row.lastName.trim() || 'Traveler',
                Holder: index === 0,
            }));
        const children = passengers
            .filter((row) => row.age !== null)
            .map((row) => ({
                Name: row.firstName.trim() || 'Child',
                Surname: row.lastName.trim() || 'Traveler',
                Age: row.age ?? 8,
            }));
        return { adults, children };
    }, [passengers]);

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
            travelers: passengers
                .map((row) => `${row.firstName} ${row.lastName}`.trim())
                .filter(Boolean)
                .map((line) => ({ name: line })),
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
                pax: passengerPayload,
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
                        <DialogHeader>
                            <DialogTitle>
                                {t('booking.submittedTitle') ||
                                    'Request submitted'}
                            </DialogTitle>
                            <DialogDescription>
                                {t('booking.submittedDescription') ||
                                    "We've received your request. You'll be notified once it's confirmed."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
                                <span className="text-sm text-muted-foreground">
                                    {t('booking.submittedTotal') ||
                                        'Estimated total'}
                                </span>
                                <span className="font-serif text-2xl font-bold text-primary">
                                    {submittedBooking.total.toLocaleString()}{' '}
                                    {submittedBooking.currency}
                                </span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => onOpenChange(false)}>
                                {t('booking.submittedDone') || 'Done'}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>
                                {t('booking.title') || 'Book'} {itemName}
                            </DialogTitle>
                            <DialogDescription>
                                {t('booking.description') ||
                                    'Fill in the details below to request a booking.'}
                            </DialogDescription>
                        </DialogHeader>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>
                                        {t('label.startDate') || 'Start Date'}
                                    </Label>
                                    <DatePicker
                                        date={effectiveStartDate}
                                        onDateChange={setStartDate}
                                        disabled={lockDates}
                                        fromDate={minDate}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('label.endDate') || 'End Date'}</Label>
                                    <DatePicker
                                        date={effectiveEndDate}
                                        onDateChange={setEndDate}
                                        disabled={lockDates}
                                    />
                                </div>
                            </div>
                            {lockDates && (
                                <p className="text-xs text-muted-foreground">
                                    {t('booking.datesLocked') ||
                                        'Dates are fixed to your search; re-search to change them.'}
                                </p>
                            )}

                            {hasProviderOffer && passengers.length > 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="mb-1 text-sm font-semibold text-foreground">
                                            {t('booking.passengers') ||
                                                'Passengers'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {t('booking.passengersHint') ||
                                                'Add each traveler. The first adult is the booking holder.'}
                                        </p>
                                    </div>
                                    {passengers.map((row, index) => (
                                        <div
                                            key={index}
                                            className="space-y-3 rounded-xl border border-border p-4"
                                        >
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {t('booking.passengerNumber')}{' '}
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
                                                            updatePassenger(
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
                                                                updatePassenger(
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
                                                            updatePassenger(
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
                                                            updatePassenger(
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
                                                                updatePassenger(
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
                                                                updatePassenger(
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
                                        : t('booking.submit') ||
                                          'Request booking'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}