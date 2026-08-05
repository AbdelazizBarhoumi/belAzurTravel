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
}

export function BookingDialog({
    open,
    onOpenChange,
    type,
    itemSlug,
    itemId,
    itemName,
    amount,
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
            api.createBooking(payload) as Promise<{ id: number }>,
        onSuccess: async (data) => {
            toast.success(
                t('booking.success') ||
                    'Booking created. Redirecting to payment...',
            );
            queryClient.invalidateQueries({
                queryKey: ['client', 'dashboard'],
            });

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

        mutation.mutate({
            type,
            item_slug: itemSlug,
            item_id: itemId,
            start_date: startDate?.toISOString().split('T')[0],
            end_date: endDate?.toISOString().split('T')[0],
            client: {
                name,
                email,
                phone,
            },
            notes,
            amount,
        });
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
                                date={startDate}
                                onDateChange={setStartDate}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('label.endDate') || 'End Date'}</Label>
                            <DatePicker
                                date={endDate}
                                onDateChange={setEndDate}
                            />
                        </div>
                    </div>
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
