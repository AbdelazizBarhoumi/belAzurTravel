import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBooking, type ClientBookingRow } from '@/api/booking.api';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const { t } = useLanguage();
    const status = searchParams.get('payment');
    const bookingId = searchParams.get('booking_id');

    const isSuccess = status === 'success';
    const isFailed = status === 'failed';
    const isError = status === 'error' || !status;

    const { data: booking } = useQuery<ClientBookingRow>({
        queryKey: ['booking', bookingId],
        queryFn: () => getBooking(bookingId!) as Promise<ClientBookingRow>,
        enabled: !!bookingId,
    });

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center"
            >
                {isSuccess && (
                    <>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <CheckCircle className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
                            {t('payment.successTitle')}
                        </h1>
                        <p className="mb-6 text-muted-foreground">
                            {t('payment.successMessage')}
                        </p>
                    </>
                )}

                {isFailed && (
                    <>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                            <XCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
                            {t('payment.failedTitle')}
                        </h1>
                        <p className="mb-6 text-muted-foreground">
                            {t('payment.failedMessage')}
                        </p>
                    </>
                )}

                {isError && (
                    <>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                            <AlertTriangle className="h-8 w-8 text-secondary" />
                        </div>
                        <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
                            {t('payment.errorTitle')}
                        </h1>
                        <p className="mb-6 text-muted-foreground">
                            {t('payment.errorMessage')}
                        </p>
                    </>
                )}

                {/* Booking Details */}
                {booking && (
                    <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4 text-left">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('admin.booking')} #
                                </span>
                                <span className="font-medium">
                                    {booking.booking_ref}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('admin.type')}
                                </span>
                                <span className="font-medium">
                                    {booking.type}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('admin.amount')}
                                </span>
                                <span className="font-bold text-primary">
                                    {booking.total_amount.toLocaleString()} TND
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <Link to="/client/dashboard">
                        <Button
                            variant={isSuccess ? 'default' : 'outline'}
                            className="w-full gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t('client.myBookings')}
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentResult;
