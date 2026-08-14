import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { initiatePayment } from '@/api/payment.api';
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
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { api } from '@/hooks/useBooking';

interface BookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'destination' | 'hotel' | 'tour' | 'flight' | 'car' | 'travel';
    itemSlug?: string;
    itemId?: string;
    itemName: string;
    amount: number;
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
    const [travelers, setTravelers] = useState<string>('');

    // Hotels booked from a live offer are locked to the searched dates; the
    // token prices that exact window and cannot be re-booked for others.
    const lockDates =
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

    useEffect(() => {
        if (open && user) {
            // Defer state updates to avoid synchronous setState within effect
            setTimeout(() => {
                setName(user.name || '');
                setEmail(user.email || '');
            }, 0);
        }
    }, [open, user]);

    const mutation = useMutation({
        mutationFn: (payload: Record<string, unknown>) =>
            api.createBooking(payload) as Promise<{
                id: number;
                status?: string;
            }>,
        onSuccess: async (data) => {
            toast.success(
                t('booking.success') ||
                    'Booking created. Redirecting to payment...',
            );
            queryClient.invalidateQueries({
                queryKey: ['client', 'dashboard'],
            });

            // Manual `instant` hotels are confirmed at creation — no payment
            // session to start.
            if (data.status === 'Confirmed') {
                onOpenChange(false);
                return;
            }

            // Initiate payment
            try {
                const paymentResult = await initiatePayment(data.id);
                // Redirect to ClictoPay payment page
                window.location.href = paymentResult.formUrl;
            } catch {
                toast.error(
                    t('payment.initError') ||
                        'Payment initiation failed. Please pay from your dashboard.',
                );
                onOpenChange(false);
            }
        },
        onError: () => {
            toast.error(
                t('booking.error') || 'Failed to submit booking request.',
            );
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
            return;
        }

        // Parse the travelers textarea into OS-TRAVEL pax adults; the first
        // guest is the booking holder.
        const adultLines = travelers
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, Math.max(1, provider?.adults ?? 1));
        const adultPax = adultLines.map((line, index) => {
            const [firstName = 'Guest', ...rest] = line.split(/\s+/);
            const surname = rest.join(' ');

            return {
                civility: 'Mr',
                name: firstName,
                surname: surname || 'Traveler',
                holder: index === 0,
            };
        });
        const childPax = Array.from(
            { length: Math.max(0, provider?.children ?? 0) },
            (_, index) => ({
                name: `Child ${index + 1}`,
                surname: 'Traveler',
                age: provider?.childrenAges?.[index] ?? 8,
            }),
        );

        const payload: Record<string, unknown> = {
            type,
            item_slug: itemSlug,
            item_id: itemId,
            start_date: effectiveStartDate?.toISOString().split('T')[0],
            end_date: effectiveEndDate?.toISOString().split('T')[0],
            client: {
                name,
                email,
                phone,
            },
            notes,
            amount,
            travelers: adultLines.map((line) => ({ name: line })),
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
                pax: {
                    adults: adultPax,
                    children: childPax,
                },
                search: {
                    check_in:
                        effectiveStartDate?.toISOString().split('T')[0] ??
                        provider.checkIn,
                    check_out:
                        effectiveEndDate?.toISOString().split('T')[0] ??
                        provider.checkOut,
                },
            };
        }

        mutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {t('booking.title') || 'Book'} {itemName}
                    </DialogTitle>
                    <DialogDescription>
                        {t('booking.description') ||
                            'Fill in the details below to request a booking.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
                    {type === 'hotel' && provider?.token && (
                        <div className="space-y-2">
                            <Label htmlFor="travelers">
                                {t('booking.travelers') || 'Travelers'}
                            </Label>
                            <Textarea
                                id="travelers"
                                value={travelers}
                                onChange={(e) => setTravelers(e.target.value)}
                                placeholder={
                                    t('booking.travelersPlaceholder') ||
                                    'One traveler per line: First Last'
                                }
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending
                                ? t('common.processing') || 'Processing...'
                                : t('payment.payNow') || 'Book & Pay'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
