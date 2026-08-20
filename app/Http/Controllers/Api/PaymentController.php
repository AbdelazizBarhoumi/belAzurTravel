<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingAction;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingAudit;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\BookingActivityNotification;
use App\Notifications\BookingStatusNotification;
use App\Services\ClictoPayService;
use App\Services\OsTravel\OsTravelBookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(
        private readonly ClictoPayService $clictoPay,
        private readonly OsTravelBookingService $osTravelBookingService,
    ) {}

    /**
     * Initiate a ClictoPay payment session for a booking.
     */
    public function initiate(Request $request, int $id): JsonResponse
    {
        $booking = Booking::query()->findOrFail($id);

        abort_unless(
            $booking->user_id === $request->user()->id,
            403,
        );

        abort_if(
            $booking->status !== 'Pending',
            422,
            'This booking cannot be paid for.',
        );

        abort_if(
            $booking->payment()->where('status', 'paid')->exists(),
            422,
            'This booking is already paid.',
        );

        $result = $this->clictoPay->createPayment($booking);

        // Create or update payment record
        Payment::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'user_id' => $booking->user_id,
                'amount' => $booking->total_amount,
                'currency' => 'TND',
                'status' => 'pending',
                'clictopay_order_id' => $result['orderId'],
            ],
        );

        return response()->json([
            'formUrl' => $result['formUrl'],
            'orderId' => $result['orderId'],
        ]);
    }

    /**
     * Handle ClictoPay callback after payment attempt.
     */
    public function callback(Request $request): RedirectResponse
    {
        $orderId = $request->query('orderId');
        $bookingId = $request->query('booking_id');

        if (! $orderId || ! $bookingId) {
            return redirect('/payment/result?payment=error');
        }

        try {
            $verification = $this->clictoPay->verifyPayment($orderId);

            $payment = Payment::where('clictopay_order_id', $orderId)->first();

            if (! $payment) {
                Log::warning('ClictoPay callback: payment not found', ['order_id' => $orderId]);

                return redirect('/payment/result?payment=error');
            }

            $booking = Booking::find($payment->booking_id);

            if (! $booking) {
                Log::warning('ClictoPay callback: booking not found', ['payment_id' => $payment->id]);

                return redirect('/payment/result?payment=error');
            }

            // IDEMPOTENCY: Skip if already paid
            if ($payment->status === 'paid') {
                return redirect('/payment/result?payment=success&booking_id='.$booking->id);
            }

            if ($verification['status'] === 'completed') {
                // AMOUNT VERIFICATION: Ensure paid amount matches booking amount
                $paidAmount = $verification['amount'];
                $expectedAmount = $booking->total_amount;

                if ($paidAmount !== $expectedAmount) {
                    Log::warning('ClictoPay callback: amount mismatch', [
                        'order_id' => $orderId,
                        'paid' => $paidAmount,
                        'expected' => $expectedAmount,
                    ]);

                    $payment->update(['status' => 'amount_mismatch']);

                    return redirect('/payment/result?payment=error&booking_id='.$booking->id);
                }

                // Payment successful
                $payment->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'reference' => $orderId,
                ]);

                $booking->update([
                    'status' => 'Confirmed',
                    'confirmed_at' => now(),
                    'cancelled_at' => null,
                ]);

                BookingAudit::log(
                    booking: $booking,
                    action: BookingAction::Confirmed,
                    from: $booking->statusEnum(),
                    to: BookingStatus::Confirmed,
                    notes: 'Payment confirmed via gateway',
                );

                // OS-TRAVEL hotel: Confirm the reservation with the provider
                // now that payment succeeded, using the stored Phase 9 context.
                if ($booking->type === 'hotel' && ! $booking->provider_booking_id) {
                    $hotelBooking = $this->osTravelBookingService->providerContextFromPayload($booking);
                    if ($hotelBooking) {
                        try {
                            $this->osTravelBookingService->confirm($booking, $hotelBooking);
                            $booking->refresh();
                        } catch (\Throwable $e) {
                            Log::error('OS-TRAVEL confirm failed after payment', [
                                'booking_id' => $booking->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                }

                // Notify admin
                User::query()
                    ->where('active', true)
                    ->whereIn('role', ['admin'])
                    ->get()
                    ->each(fn (User $admin) => $admin->notify(
                        new BookingActivityNotification($booking->refresh(), 'booking.paid'),
                    ));

                // Notify client
                if ($booking->user_id) {
                    $client = User::find($booking->user_id);
                    if ($client) {
                        $client->notify(new BookingStatusNotification($booking->refresh()));
                    }
                }

                return redirect('/payment/result?payment=success&booking_id='.$booking->id);
            }

            // Payment failed or declined
            $payment->update(['status' => 'failed']);

            return redirect('/payment/result?payment=failed&booking_id='.$booking->id);

        } catch (\Exception $e) {
            Log::error('ClictoPay callback error', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return redirect('/payment/result?payment=error&booking_id='.$booking->id);
        }
    }

    /**
     * Retry payment for a pending booking.
     */
    public function retry(Request $request, int $id): JsonResponse
    {
        $booking = Booking::query()->findOrFail($id);

        abort_unless(
            $booking->user_id === $request->user()->id,
            403,
        );

        abort_if(
            $booking->status !== 'Pending',
            422,
            'This booking cannot be paid for.',
        );

        // Delete old failed payment record if exists
        Payment::where('booking_id', $booking->id)
            ->whereIn('status', ['pending', 'failed'])
            ->delete();

        $result = $this->clictoPay->createPayment($booking);

        Payment::create([
            'booking_id' => $booking->id,
            'user_id' => $booking->user_id,
            'amount' => $booking->total_amount,
            'currency' => 'TND',
            'status' => 'pending',
            'clictopay_order_id' => $result['orderId'],
        ]);

        return response()->json([
            'formUrl' => $result['formUrl'],
            'orderId' => $result['orderId'],
        ]);
    }
}
