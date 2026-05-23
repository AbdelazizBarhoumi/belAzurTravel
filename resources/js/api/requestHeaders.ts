import type { Lang } from '@/i18n/translations';

export function getStoredLang(): Lang {
    if (typeof window === 'undefined') return 'en';

    const stored = window.localStorage.getItem('lang');
    if (stored === 'fr' || stored === 'ar' || stored === 'en') {
        return stored;
    }

    const htmlLang = document.documentElement.lang as Lang | string;
    if (htmlLang === 'fr' || htmlLang === 'ar' || htmlLang === 'en') {
        return htmlLang;
    }

    return 'en';
}

export function csrfToken(): string {
    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

export function buildRequestHeaders(
    options: {
        headers?: HeadersInit;
        includeCsrf?: boolean;
    } = {},
): Headers {
    const headers = new Headers(options.headers);

    headers.set('Accept', 'application/json');
    headers.set('Accept-Language', getStoredLang());

    if (options.includeCsrf !== false) {
        const token = csrfToken();
        if (token) {
            headers.set('X-CSRF-TOKEN', token);
        }
    }

    return headers;
}
