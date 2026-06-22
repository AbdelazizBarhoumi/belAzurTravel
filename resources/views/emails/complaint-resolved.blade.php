@extends('emails.layouts.base')

@section('content')
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">
        {{ $greeting }}
    </h2>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
        {{ $introLine }}
    </p>

    <!-- Status Icon -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
            <td align="center">
                <div style="width: 64px; height: 64px; background-color: {{ $isResolved ? '#dcfce7' : '#fee2e2' }}; border-radius: 50%; line-height: 64px; text-align: center; font-size: 32px; color: {{ $isResolved ? '#16a34a' : '#dc2626' }};">
                    {{ $isResolved ? '&#10003;' : '&#10007;' }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Complaint Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 40%;">{{ $refLabel }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">#{{ $complaint->id }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $typeLabel }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">{{ $complaint->type === 'refund_request' ? 'Refund Request' : 'Complaint' }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $statusLabel }}</td>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: {{ $isResolved ? '#16a34a' : '#dc2626' }};">
                            {{ $isResolved ? 'Resolved' : 'Rejected' }}
                        </td>
                    </tr>
                    @if($complaint->refund_amount)
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px;">{{ $refundAmountLabel }}</td>
                        <td style="padding: 6px 0; color: #16a34a; font-size: 16px; font-weight: 700;">{{ number_format($complaint->refund_amount / 1000, 2) }} TND</td>
                    </tr>
                    @endif
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
