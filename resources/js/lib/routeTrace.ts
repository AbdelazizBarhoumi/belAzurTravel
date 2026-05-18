type RouteTraceEntry = {
    event: string;
    atMs: number;
    pathname: string;
    details?: Record<string, unknown>;
};

declare global {
    interface Window {
        __routeTrace?: RouteTraceEntry[];
    }
}

export function traceRoute(
    event: string,
    details?: Record<string, unknown>
): void {
    if (typeof window === 'undefined') {
        return;
    }

    const entry: RouteTraceEntry = {
        event,
        atMs: Number(performance.now().toFixed(2)),
        pathname: window.location.pathname,
        details,
    };

    window.__routeTrace ??= [];
    window.__routeTrace.push(entry);

    if (import.meta.env.DEV) {
         
        //console.log('[route-trace]', entry);
    }
}

export function clearRouteTrace(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.__routeTrace = [];
}
