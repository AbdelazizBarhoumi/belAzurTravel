@extends('emails.layouts.base')

@section('content')
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">
        {{ $greeting }}
    </h2>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
        {{ $introLine }}
    </p>

    <!-- Booking Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px;">
                <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 16px; font-weight: 600;">
                    {{ $bookingLabel }}
                </h3>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 40%;">{{ $refLabel }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">#{{ $booking->id }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $typeLabel }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">{{ ucfirst($booking->type) }}</td>
                    </tr>
                    @if($booking->start_date)
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $datesLabel }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">
                            {{ $booking->start_date->format('d M Y') }}{{ $booking->end_date ? ' - '.$booking->end_date->format('d M Y') : '' }}
                        </td>
                    </tr>
                    @endif
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $amountLabel }}</td>
                        <td style="padding: 6px 0; color: #0ea5e9; font-size: 16px; font-weight: 700;">{{ number_format($booking->total_amount / 1000, 2) }} TND</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $statusLabel }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">
                            <span style="background-color: #dbeafe; color: #1d4ed8; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 600;">
                                {{ $booking->status }}
                            </span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

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
