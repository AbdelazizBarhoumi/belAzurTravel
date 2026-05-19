type NotificationHandler = (payload: unknown) => void;

class SSEClient {
    private url: string;
    private es: EventSource | null = null;
    private reconnectMs = 10_000;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private handlers: NotificationHandler[] = [];
    private shouldReconnect = true;

    constructor(url: string) {
        this.url = url;
    }

    start() {
        if (this.es) return;

        if (typeof EventSource === 'undefined') {
            // jsdom / non-browser environments: no-op, but keep handlers registered.
            return;
        }

        try {
            this.es = new EventSource(this.url, { withCredentials: true });
        } catch (err) {
            // Some environments may not accept withCredentials; fall back
            // to the simple constructor and log the reason during dev.
            if (typeof console !== 'undefined')
                console.debug('SSE init fallback', err);
            this.es = new EventSource(this.url);
        }

        this.es.onopen = () => {
            // reset reconnect backoff
            this.reconnectMs = 10_000;
            this.clearReconnectTimer();
            // console.debug('[SSE] connected', this.url);
        };

        this.es.onmessage = (ev) => {
            // default message
            this.emit(JSON.parse(ev.data));
        };

        this.es.addEventListener('notification', (ev: MessageEvent) => {
            try {
                this.emit(JSON.parse(ev.data));
            } catch (err) {
                if (typeof console !== 'undefined')
                    console.debug('SSE parse error', err);
            }
        });

        this.es.onerror = () => {
            if (!this.shouldReconnect) return;
            if (!this.es) return;

            if (this.es.readyState === EventSource.CLOSED) {
                this.scheduleReconnect();
            }
        };
    }

    reconnect() {
        if (!this.shouldReconnect) return;
        if (this.es) this.close();
        this.start();
    }

    stop(permanent = false) {
        if (permanent) {
            this.shouldReconnect = false;
        }
        this.clearReconnectTimer();
        this.close();
    }

    private close() {
        if (!this.es) return;
        try {
            this.es.close();
        } catch (err) {
            if (typeof console !== 'undefined')
                console.debug('SSE close error', err);
        }
        this.es = null;
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.reconnect();
        }, this.reconnectMs);
        this.reconnectMs = Math.min(30_000, Math.round(this.reconnectMs * 1.5));
    }

    private clearReconnectTimer() {
        if (!this.reconnectTimer) return;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }

    onNotification(handler: NotificationHandler) {
        this.handlers.push(handler);
        // start lazily when first handler is registered
        this.shouldReconnect = true;
        if (!this.es) this.start();
        return () => {
            this.handlers = this.handlers.filter((h) => h !== handler);
        };
    }

    private emit(payload: unknown) {
        for (const h of this.handlers) {
            try {
                h(payload);
            } catch (err) {
                if (typeof console !== 'undefined')
                    console.debug('SSE handler error', err);
            }
        }
    }
}

const notificationsClient = new SSEClient('/api/notifications/stream');

export function onNotification(cb: NotificationHandler) {
    return notificationsClient.onNotification(cb);
}

export function stopNotifications() {
    notificationsClient.stop(true);
}

export default notificationsClient;
