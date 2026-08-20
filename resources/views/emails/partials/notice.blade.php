@if(! empty($noticeText))
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: {{ $noticeBg ?? '#ecfdf5' }}; border-radius: 8px; border: 1px solid {{ $noticeBorder ?? '#a7f3d0' }}; margin-bottom: 24px;">
    <tr>
        <td style="padding: 20px;">
            <p style="margin: 0; color: {{ $noticeColor ?? '#065f46' }}; font-size: 14px; line-height: 1.6;">{{ $noticeText }}</p>
        </td>
    </tr>
</table>
@endif