export function csrfToken(): string {
    return (
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

export async function apiFetch<T>(
    url: string,
    options: RequestInit = {},
): Promise<T> {
    // Support running tests in Node where relative URLs need a full origin.
    // In browser, window.location.origin will be present; in Node (Vitest) it may not.
    const isRelative = url.startsWith('/');
    const origin = typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://127.0.0.1:8000';
    const finalUrl = isRelative ? `${origin}${url}` : url;
    // No local fallback: always proxy to backend API (DB-backed). Tests should
    // either start a test server or mock network responses as needed.
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    // If body is FormData, do not set Content-Type — the browser will
    // add the correct multipart boundary header automatically.
    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers.has('Content-Type')
    ) {
        headers.set('Content-Type', 'application/json');
    }

    const token = csrfToken();
    if (token) {
        headers.set('X-CSRF-TOKEN', token);
    }

    // Debug: log the URL when running tests to help diagnose network issues
    if (typeof process !== 'undefined' && process.env && process.env.VITEST) {
         
        console.debug('[apiFetch] GET', finalUrl);
    }

    const res = await fetch(finalUrl, {
        credentials: 'include',
        ...options,
        headers,
    });

    if (!res.ok) {
        if (typeof process !== 'undefined' && process.env && process.env.VITEST) {
             
            console.debug('[apiFetch] response', res.status, await res.text().catch(() => '')); 
        }
        if (res.status === 401 || res.status === 419) {
            window.location.href = '/login';
            throw new Error('Authentication required');
        }

        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Request failed');
    }

    return res.json();
}
