@extends('emails.layouts.base')

@section('content')
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">
        {{ $greeting }}
    </h2>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
        {{ $introLine }}
    </p>

    <!-- Failure Icon -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
            <td align="center">
                <div style="width: 64px; height: 64px; background-color: #fee2e2; border-radius: 50%; line-height: 64px; text-align: center; font-size: 32px; color: #dc2626;">
                    &#10007;
                </div>
            </td>
        </tr>
    </table>

    <!-- Booking Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 40%;">{{ $bookingRefLabel }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">#{{ $booking->id }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $amountLabel }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">{{ number_format($booking->total_amount / 1000, 2) }} TND</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
        {{ $retryLine }}
    </p>

    @if(isset($actionText) && isset($actionUrl))
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
            <td align="center">
                <a href="{{ $actionUrl }}" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
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
