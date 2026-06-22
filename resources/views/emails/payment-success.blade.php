@extends('emails.layouts.base')

@section('content')
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">
        {{ $greeting }}
    </h2>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
        {{ $introLine }}
    </p>

    <!-- Success Icon -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
            <td align="center">
                <div style="width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%; line-height: 64px; text-align: center; font-size: 32px;">
                    &#10003;
                </div>
            </td>
        </tr>
    </table>

    <!-- Payment Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px;">
                <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 16px; font-weight: 600;">
                    {{ $paymentDetailsLabel }}
                </h3>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 40%;">{{ $bookingRefLabel }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">#{{ $booking->id }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $transactionRefLabel }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-family: monospace;">{{ $payment->reference ?? $payment->clictopay_order_id ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $amountLabel }}</td>
                        <td style="padding: 6px 0; color: #16a34a; font-size: 18px; font-weight: 700;">{{ number_format(($payment->amount ?? $booking->total_amount) / 1000, 2) }} TND</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $statusLabel }}</td>
                        <td style="padding: 6px 0; color: #16a34a; font-size: 14px; font-weight: 600;">&#10003; {{ $paidLabel }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
        {{ $nextStepsLine }}
    </p>

    @if(isset($actionText) && isset($actionUrl))
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
            <td align="center">
                <a href="{{ $actionUrl }}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    {{ $actionText }}
                </a>
            </td>
        </tr>
    </table>
    @endif

    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
        {{ $closingLine }}
    </p>
@endsection
