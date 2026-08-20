@php
    $itemLabel = $itemLabel ?? $typeLabel;
    $showStatus = $showStatus ?? true;
    $showProviderRef = $showProviderRef ?? true;
@endphp
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
    <tr>
        <td style="padding: 20px;">
            <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 16px; font-weight: 600;">{{ $bookingLabel }}</h3>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 40%;">{{ $refLabel }}</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">#{{ $booking->id }}</td>
                </tr>
                @if(! empty($clientLabel))
                <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $clientLabel }}</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">{{ $booking->client['name'] ?? $booking->client['email'] ?? '-' }}</td>
                </tr>
                @endif
                @if($showProviderRef && ! empty($booking->provider_booking_reference))
                <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $providerRefLabel ?? $refLabel }}</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">{{ $booking->provider_booking_reference }}</td>
                </tr>
                @endif
                <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $typeLabel }}</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">{{ ucfirst($booking->type) }}</td>
                </tr>
                @if(! empty($booking->item_slug))
                <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $itemLabel }}</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">{{ str_replace('-', ' ', ucwords($booking->item_slug)) }}</td>
                </tr>
                @endif
                @if($booking->start_date)
                <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $datesLabel }}</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">
                        {{ $booking->start_date->format('d M Y') }}{{ $booking->end_date ? ' - '.$booking->end_date->format('d M Y') : '' }}
                    </td>
                </tr>
                @endif
                @if(! empty($booking->total_amount))
                <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $amountLabel }}</td>
                    <td style="padding: 6px 0; color: #0ea5e9; font-size: 16px; font-weight: 700;">{{ number_format($booking->total_amount, 2) }} TND</td>
                </tr>
                @endif
                @if($showStatus)
                <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $statusLabel }}</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">
                        <span style="background-color: #dbeafe; color: #1d4ed8; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 600;">{{ $booking->status }}</span>
                    </td>
                </tr>
                @endif
                @if(! empty($reasonLabel) && ! empty($booking->reject_reason))
                <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $reasonLabel }}</td>
                    <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">{{ $booking->reject_reason }}</td>
                </tr>
                @endif
            </table>
        </td>
    </tr>
</table>