import { formatPrice } from '@/lib/utils';

export type WhatsAppItemType =
    | 'destination'
    | 'hotel'
    | 'tour'
    | 'flight'
    | 'car'
    | 'travel'
    | 'event';

export interface WhatsAppItemDetails {
    type?: WhatsAppItemType;
    title?: string;
    location?: string;
    /** ISO or Date values; only the day/month part is shown. */
    from?: string | Date | null;
    to?: string | Date | null;
    adults?: number;
    children?: number;
    /** Free-form selection, e.g. "Double room – Half board". */
    option?: string;
    price?: number;
    currency?: string;
    /** Defaults to the current page so the team can open the exact item. */
    url?: string;
}

/** wa.me link to the given number with a pre-filled message. */
export function buildWhatsAppUrl(phone: string, message: string): string {
    const digits = phone.replace(/\D/g, '');

    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function formatDay(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/** Short message describing what the visitor is asking about. */
export function buildItemMessage(
    t: (key: string) => string,
    details: WhatsAppItemDetails,
): string {
    const {
        type,
        title,
        location,
        from,
        to,
        adults,
        children,
        option,
        price,
        currency = 'TND',
        url = typeof window !== 'undefined' ? window.location.href : undefined,
    } = details;

    const subject = [
        type ? t(`favorites.type.${type}`) : null,
        title ? `« ${title} »` : null,
        location ? `(${location})` : null,
    ]
        .filter(Boolean)
        .join(' ');

    const lines: string[] = [
        subject
            ? `${t('whatsapp.msg.interestedIn')} ${subject}.`
            : t('whatsapp.msg.greeting'),
    ];

    if (from) {
        lines.push(
            `${t('whatsapp.msg.dates')} : ${formatDay(from)}${to ? ` → ${formatDay(to)}` : ''}`,
        );
    }

    if (adults || children) {
        const guests = [
            adults ? `${adults} ${t('whatsapp.msg.adults')}` : null,
            children ? `${children} ${t('whatsapp.msg.children')}` : null,
        ]
            .filter(Boolean)
            .join(', ');
        lines.push(`${t('whatsapp.msg.travelers')} : ${guests}`);
    }

    if (option) lines.push(`${t('whatsapp.msg.option')} : ${option}`);
    if (price && price > 0) {
        lines.push(`${t('whatsapp.msg.price')} : ${formatPrice(price, currency)}`);
    }

    lines.push(t('whatsapp.msg.closing'));
    if (url) lines.push(url);

    return lines.join('\n');
}
