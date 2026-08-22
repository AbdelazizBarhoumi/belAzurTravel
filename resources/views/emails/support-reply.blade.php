@extends('emails.layouts.base')

@section('content')
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">{{ $greeting }}</h2>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">{{ $introLine }}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px;">
                <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; font-weight: 600;">{{ $inquiryLabel }} #{{ $inquiryId }}</h3>
                <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">{{ $inquirySubject }}</p>
            </td>
        </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px;">
                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 14px; font-weight: 600;">{{ $supportTeamLabel }}</h3>
                <p style="margin: 0; color: #1e3a5f; font-size: 14px; line-height: 1.6;">{{ $replyMessage }}</p>
            </td>
        </tr>
    </table>

    @include('emails.partials.notice', [
        'noticeText' => $nextStepsLine ?? null,
        'noticeColor' => '#065f46',
        'noticeBg' => '#ecfdf5',
        'noticeBorder' => '#a7f3d0',
    ])

    @include('emails.partials.action-button', [
        'actionText' => $actionText ?? null,
        'actionUrl' => $actionUrl ?? null,
    ])

    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">{{ $closingLine }}</p>
@endsection