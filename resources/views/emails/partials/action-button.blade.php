@if(! empty($actionText) && ! empty($actionUrl))
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
    <tr>
        <td align="center">
            <a href="{{ $actionUrl }}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">{{ $actionText }}</a>
        </td>
    </tr>
</table>
@endif