import type { Lang } from '@/i18n/translations';

export function getStoredLang(): Lang {
    return 'fr';
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
