import { useCallback, useEffect, useRef, type RefObject } from 'react';

export function useInfiniteScroll(
    sentinelRef: RefObject<Element | null>,
    fetchNextPage: () => void,
    options: { hasNextPage: boolean; isFetchingNextPage: boolean } = {
        hasNextPage: false,
        isFetchingNextPage: false,
    },
) {
    const fetchingRef = useRef(false);
    const skipNextRef = useRef(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const disconnect = useCallback(() => {
        observerRef.current?.disconnect();
        observerRef.current = null;
    }, []);

    const connect = useCallback(() => {
        if (!options.hasNextPage || fetchingRef.current) {
            disconnect();
            return;
        }
        const el = sentinelRef.current;
        if (!el) return;

        disconnect();

        // If we just reconnected and the element is already visible, skip
        // the first intersection entry to avoid an immediate re-fire.
        if (skipNextRef.current) {
            const rect = el.getBoundingClientRect();
            const rootMargin = 200;
            if (rect.top - rootMargin < window.innerHeight) {
                skipNextRef.current = false;
                return;
            }
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry?.isIntersecting && !fetchingRef.current) {
                    fetchingRef.current = true;
                    disconnect();
                    fetchNextPage();
                }
            },
            { rootMargin: '200px', threshold: 0 },
        );

        observerRef.current.observe(el);
    }, [sentinelRef, fetchNextPage, options.hasNextPage, disconnect]);

    // When fetching completes, reconnect after DOM settles
    useEffect(() => {
        if (options.isFetchingNextPage) {
            disconnect();
            return;
        }
        fetchingRef.current = false;
        skipNextRef.current = true;
        const raf = requestAnimationFrame(() => {
            connect();
        });
        return () => cancelAnimationFrame(raf);
    }, [options.isFetchingNextPage, connect, disconnect]);

    // Initial connect when hasNextPage first becomes true
    useEffect(() => {
        if (options.hasNextPage && !options.isFetchingNextPage) {
            fetchingRef.current = false;
            skipNextRef.current = false;
            const raf = requestAnimationFrame(() => {
                connect();
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [options.hasNextPage, options.isFetchingNextPage, connect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            observerRef.current?.disconnect();
        };
    }, []);
}
