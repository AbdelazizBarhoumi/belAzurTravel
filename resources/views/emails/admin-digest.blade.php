@extends('emails.layouts.base')

@section('content')
    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">{{ $greeting }}</h2>

    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">{{ $introLine }}</p>

    @php($hasActivity = collect($sections ?? [])->contains(fn ($section) => ! empty($section['items'])))

    @if(! $hasActivity)
        <p style="margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.6;">{{ $emptyLine }}</p>
    @else
        @foreach($sections as $section)
            @if(! empty($section['items']))
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                    <td style="padding: 20px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                            <tr>
                                <td style="color: #0f172a; font-size: 16px; font-weight: 600;">{{ $section['label'] }}</td>
                                <td align="right" style="color: #0ea5e9; font-size: 14px; font-weight: 700;">{{ count($section['items']) }}</td>
                            </tr>
                        </table>
                        @foreach($section['items'] as $item)
                        <p style="margin: 0 0 8px; color: #475569; font-size: 14px; line-height: 1.5;">
                            @if(! empty($item['url']))
                            <a href="{{ $item['url'] }}" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">{{ $item['title'] }}</a>
                            @else
                            {{ $item['title'] }}
                            @endif
                        </p>
                        @endforeach
                    </td>
                </tr>
            </table>
            @endif
        @endforeach
    @endif

    @include('emails.partials.action-button', [
        'actionText' => $actionText ?? null,
        'actionUrl' => $actionUrl ?? null,
    ])

    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">{{ $closingLine }}</p>
@endsection