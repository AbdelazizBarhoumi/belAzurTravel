@extends('emails.layouts.base')

@section('content')
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">{{ $greeting }}</h2>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">{{ $introLine }}</p>

    @include('emails.partials.booking-summary', [
        'booking' => $booking,
        'bookingLabel' => $bookingLabel,
        'refLabel' => $refLabel,
        'typeLabel' => $typeLabel,
        'itemLabel' => $itemLabel ?? null,
        'datesLabel' => $datesLabel,
        'amountLabel' => $amountLabel,
        'statusLabel' => $statusLabel,
        'showStatus' => true,
    ])

    @include('emails.partials.notice', [
        'noticeText' => $nextStepsLine ?? null,
        'noticeColor' => '#92400e',
        'noticeBg' => '#fef3c7',
        'noticeBorder' => '#fde68a',
    ])

    @include('emails.partials.action-button', [
        'actionText' => $actionText ?? null,
        'actionUrl' => $actionUrl ?? null,
    ])

    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">{{ $closingLine }}</p>
@endsection