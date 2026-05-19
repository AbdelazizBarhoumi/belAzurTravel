type NotificationHandler = (payload: any) => void;

class SSEClient {
    private url: string;
    private es: EventSource | null = null;
    private reconnectMs = 1000;
    private handlers: NotificationHandler[] = [];
    private shouldReconnect = true;

    constructor(url: string) {
        this.url = url;
    }

    start() {
        if (this.es) return;

        try {
            this.es = new EventSource(this.url, { withCredentials: true } as any);
        } catch (e) {
            // Some environments may not accept withCredentials; fall back
            this.es = new EventSource(this.url);
        }

        this.es.onopen = () => {
            // reset reconnect backoff
            this.reconnectMs = 1000;
            // console.debug('[SSE] connected', this.url);
        };

        this.es.onmessage = (ev) => {
            // default message
            this.emit(JSON.parse(ev.data));
        };

        this.es.addEventListener('notification', (ev: MessageEvent) => {
            try {
                this.emit(JSON.parse((ev as MessageEvent).data));
            } catch (e) {
                // ignore
            }
        });

        this.es.onerror = () => {
            this.close();
            if (!this.shouldReconnect) return;
            setTimeout(() => this.reconnect(), this.reconnectMs);
            this.reconnectMs = Math.min(30_000, Math.round(this.reconnectMs * 1.5));
        };
    }

    reconnect() {
        if (this.es) this.close();
        this.start();
    }

    stop() {
        this.shouldReconnect = false;
        this.close();
    }

    private close() {
        if (!this.es) return;
        try {
            this.es.close();
        } catch (_) {}
        this.es = null;
    }

    onNotification(handler: NotificationHandler) {
        this.handlers.push(handler);
        // start lazily when first handler is registered
        if (!this.es) this.start();
        return () => {
            this.handlers = this.handlers.filter((h) => h !== handler);
        };
    }

    private emit(payload: any) {
        for (const h of this.handlers) {
            try {
                h(payload);
            } catch (e) {
                // swallow handler errors
            }
        }
    }
}

const notificationsClient = new SSEClient('/api/notifications/stream');

export function onNotification(cb: NotificationHandler) {
    return notificationsClient.onNotification(cb);
}

export function stopNotifications() {
    notificationsClient.stop();
}

export default notificationsClient;
