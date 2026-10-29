@extends('emails.layouts.base')

@section('content')
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">{{ $greeting }}</h2>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">{{ $introLine }}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px;">
                <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 16px; font-weight: 600;">{{ $detailsLabel }}</h3>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    @foreach($rows as $label => $value)
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 40%; vertical-align: top;">{{ $label }}</td>
                        <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">{!! nl2br(e($value)) !!}</td>
                    </tr>
                    @endforeach
                </table>
            </td>
        </tr>
    </table>

    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">{{ $closingLine }}</p>
@endsection
