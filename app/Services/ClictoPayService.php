<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClictoPayService
{
    private string $username;
    private string $password;
    private string $baseUrl;
    private int $currency;

    public function __construct()
    {
        $this->username = config('payment.clictopay.username', '');
        $this->password = config('payment.clictopay.password', '');
        $this->baseUrl = config('payment.clictopay.base_url', 'https://test.clictopay.com/payment/rest');
        $this->currency = config('payment.clictopay.currency', 788);
    }

    /**
     * Initiate a payment session with ClictoPay.
     *
     * @return array{orderId: string, formUrl: string}
     */
    public function createPayment(Booking $booking): array
    {
        $orderNumber = $this->generateOrderNumber($booking);

        $response = Http::asForm()->timeout(30)->post("{$this->baseUrl}/register.do", [
            'userName' => $this->username,
            'password' => $this->password,
            'orderNumber' => $orderNumber,
            'amount' => $this->toMilliemes($booking->total_amount),
            'currency' => $this->currency,
            'returnUrl' => $this->getReturnUrl($booking),
            'language' => app()->getLocale(),
        ]);

        if (! $response->successful()) {
            Log::error('ClictoPay createPayment failed', [
                'booking_id' => $booking->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Payment gateway error. Please try again.');
        }

        $data = $response->json();

        if (empty($data['orderId']) || empty($data['formUrl'])) {
            Log::error('ClictoPay createPayment invalid response', [
                'booking_id' => $booking->id,
                'response' => $data,
            ]);

            throw new \RuntimeException('Invalid payment gateway response.');
        }

        return [
            'orderId' => $data['orderId'],
            'formUrl' => $data['formUrl'],
        ];
    }

    /**
     * Verify payment status with ClictoPay.
     *
     * @return array{status: string, amount: int, orderId: string, raw: array}
     */
    public function verifyPayment(string $orderId): array
    {
        $response = Http::timeout(30)->get("{$this->baseUrl}/getOrderStatus.do", [
            'orderId' => $orderId,
            'userName' => $this->username,
            'password' => $this->password,
            'language' => app()->getLocale(),
        ]);

        if (! $response->successful()) {
            Log::error('ClictoPay verifyPayment failed', [
                'order_id' => $orderId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Payment verification failed.');
        }

        $data = $response->json();
        $orderStatus = $data['OrderStatus'] ?? -1;

        return [
            'status' => $this->mapOrderStatus($orderStatus),
            'amount' => $data['Amount'] ?? 0,
            'orderId' => $data['OrderNumber'] ?? $orderId,
            'raw' => $data,
        ];
    }

    /**
     * Map ClictoPay numeric order status to a readable string.
     *
     * ClictoPay OrderStatus values:
     * 0 = Created/Registered (not yet paid)
     * 1 = Authorized
     * 2 = Reversed
     * 3 = Captured/Completed (paid)
     * 4 = Refunded
     * 5 = Declined
     */
    private function mapOrderStatus(int $status): string
    {
        return match ($status) {
            0 => 'pending',
            1 => 'authorized',
            2 => 'reversed',
            3 => 'completed',
            4 => 'refunded',
            5 => 'declined',
            default => 'unknown',
        };
    }

    /**
     * Generate a unique order number for ClictoPay.
     */
    private function generateOrderNumber(Booking $booking): string
    {
        return "BAZ-{$booking->id}-" . uniqid('', true);
    }

    /**
     * Convert TND amount (e.g. 150.50) to milliemes (150500).
     */
    private function toMilliemes(int $amountInMilliemes): int
    {
        // amount is already stored in milliemes (integer)
        return $amountInMilliemes;
    }

    /**
     * Build the return URL for ClictoPay callback.
     */
    private function getReturnUrl(Booking $booking): string
    {
        $baseUrl = config('app.url', 'http://localhost');

        return "{$baseUrl}/api/payment/callback?booking_id={$booking->id}";
    }

    /**
     * Process a refund through ClictoPay.
     *
     * @return array{status: string, raw: array}
     */
    public function refundPayment(string $orderId, int $amount): array
    {
        $response = Http::asForm()->timeout(30)->post("{$this->baseUrl}/reverse.do", [
            'userName' => $this->username,
            'password' => $this->password,
            'orderId' => $orderId,
            'amount' => $amount,
        ]);

        if (! $response->successful()) {
            Log::error('ClictoPay refundPayment failed', [
                'order_id' => $orderId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException('Refund processing failed. Please try again.');
        }

        $data = $response->json();

        return [
            'status' => isset($data['ErrorCode']) && $data['ErrorCode'] === '0' ? 'refunded' : 'failed',
            'raw' => $data,
        ];
    }
}
