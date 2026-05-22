import { apiFetch } from './http';

export async function notifyInteraction(
    type: 'call' | 'whatsapp',
    page?: string,
) {
    return apiFetch('/api/interactions/notify', {
        method: 'POST',
        body: JSON.stringify({
            type,
            page: page ?? window.location.pathname,
        }),
    });
}
