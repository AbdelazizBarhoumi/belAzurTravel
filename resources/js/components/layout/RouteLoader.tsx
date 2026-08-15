import { useIsFetching } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { traceRoute } from '@/lib/routeTrace';


export function RouteLoader() {
    const { t } = useLanguage();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [firstLoad, setFirstLoad] = useState(true);
    const hideTimeoutRef = useRef<number | null>(null);
    const fallbackTimeoutRef = useRef<number | null>(null);
    const rafOneRef = useRef<number | null>(null);
    const rafTwoRef = useRef<number | null>(null);
    const maxWaitTimeoutRef = useRef<number | null>(null);

    // Track React Query global fetching state - only count queries, not mutations
    // Exclude background queries like notifications
    const isFetching = useIsFetching({
        predicate: (query) => {
            // Exclude mutations - they have mutationKey in meta
            if (query.meta?.mutationKey) return false;
            // Exclude paused queries (e.g., inactive background refetches)
            if (query.state.fetchStatus === 'paused') return false;
            // Exclude specific query keys that shouldn't trigger overlay
            const queryKey = query.queryKey;
            if (Array.isArray(queryKey)) {
                // Exclude notifications queries
                if (queryKey[0] === 'notifications') return false;
            }
            return true;
        },
    });

    // Keep the latest fetching count in a ref so the hide-polling loop can read
    // fresh values without re-running the (route-keyed) show/hide effect. The
    // overlay must only appear on route navigation, not on action-triggered
    // refetches (approve/reject/refresh/etc.).
    const isFetchingRef = useRef(isFetching);
    useEffect(() => {
        isFetchingRef.current = isFetching;
    }, [isFetching]);

    traceRoute('RouteLoader.render', {
        pathname: location.pathname,
        locationKey: location.key,
        loading,
        firstLoad,
        isFetching,
    });

    useEffect(() => {
        traceRoute('RouteLoader.useEffect.loadingChanged', {
            pathname: location.pathname,
            locationKey: location.key,
            loading,
            isFetching,
        });
    }, [loading, location.key, location.pathname, isFetching]);

    useLayoutEffect(() => {
        traceRoute('RouteLoader.useLayoutEffect.pathChanged.start', {
            pathname: location.pathname,
            locationKey: location.key,
            firstLoad,
        });

        if (hideTimeoutRef.current !== null) {
            window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        if (fallbackTimeoutRef.current !== null) {
            window.clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
        }

        if (rafOneRef.current !== null) {
            cancelAnimationFrame(rafOneRef.current);
            rafOneRef.current = null;
        }

        if (rafTwoRef.current !== null) {
            cancelAnimationFrame(rafTwoRef.current);
            rafTwoRef.current = null;
        }

        if (maxWaitTimeoutRef.current !== null) {
            window.clearTimeout(maxWaitTimeoutRef.current);
            maxWaitTimeoutRef.current = null;
        }

         
        setLoading(true);
        // Allow new route to mount + images/data to start fetching before hiding
        const minDelay = firstLoad ? 600 : 450;
        const start = performance.now();

        // Maximum time to wait for queries (safety net)
        const MAX_WAIT_MS = 15000;

        const waitForQueriesAndHide = () => {
            const elapsed = performance.now() - start;
            const remainingMinDelay = Math.max(0, minDelay - elapsed);

            // If min delay not yet passed, wait for it
            if (remainingMinDelay > 0) {
                hideTimeoutRef.current = window.setTimeout(() => {
                    waitForQueriesAndHide();
                }, remainingMinDelay);
                return;
            }

            // Min delay passed - now wait for React Query fetches to complete
            if (isFetchingRef.current > 0) {
                traceRoute('RouteLoader.waitForQueries', {
                    pathname: location.pathname,
                    locationKey: location.key,
                    isFetching: isFetchingRef.current,
                });
                // Poll every 100ms until queries complete
                hideTimeoutRef.current = window.setTimeout(() => {
                    waitForQueriesAndHide();
                }, 100);
                return;
            }

            // All queries complete and min delay passed - hide loader
            traceRoute('RouteLoader.timeout.hide', {
                pathname: location.pathname,
                locationKey: location.key,
                elapsed: performance.now() - start,
            });

            setLoading(false);
            setFirstLoad(false);
            hideTimeoutRef.current = null;
        };

        const finish = () => {
            traceRoute('RouteLoader.finish.scheduled', {
                pathname: location.pathname,
                locationKey: location.key,
            });
            waitForQueriesAndHide();
        };

        // Safety timeout - force hide after MAX_WAIT_MS regardless
        maxWaitTimeoutRef.current = window.setTimeout(() => {
            traceRoute('RouteLoader.maxWaitTimeout', {
                pathname: location.pathname,
                locationKey: location.key,
                isFetching: isFetchingRef.current,
            });
            setLoading(false);
            setFirstLoad(false);
            if (hideTimeoutRef.current !== null) {
                window.clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        }, MAX_WAIT_MS);

        if (document.readyState === 'complete') {
            // Wait next frame so the new page has a chance to render & request assets
            rafOneRef.current = requestAnimationFrame(() => {
                rafTwoRef.current = requestAnimationFrame(() => {
                    finish();
                    rafTwoRef.current = null;
                });
                rafOneRef.current = null;
            });
        } else {
            window.addEventListener('load', finish, { once: true });
            // Fallback in case load already fired
            fallbackTimeoutRef.current = window.setTimeout(() => {
                finish();
                fallbackTimeoutRef.current = null;
            }, 1200);
        }

        traceRoute('RouteLoader.useLayoutEffect.pathChanged.end', {
            pathname: location.pathname,
            locationKey: location.key,
        });

        return () => {
            window.removeEventListener('load', finish);

            if (hideTimeoutRef.current !== null) {
                window.clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }

            if (fallbackTimeoutRef.current !== null) {
                window.clearTimeout(fallbackTimeoutRef.current);
                fallbackTimeoutRef.current = null;
            }

            if (maxWaitTimeoutRef.current !== null) {
                window.clearTimeout(maxWaitTimeoutRef.current);
                maxWaitTimeoutRef.current = null;
            }

            if (rafOneRef.current !== null) {
                cancelAnimationFrame(rafOneRef.current);
                rafOneRef.current = null;
            }

            if (rafTwoRef.current !== null) {
                cancelAnimationFrame(rafTwoRef.current);
                rafTwoRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);
    return (
        <AnimatePresence initial={false}>
            {loading && (
                <motion.div
                    key="route-loader"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md"
                    aria-live="polite"
                    aria-busy="true"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0] }}
                        transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="mb-5"
                    >
                        <Plane className="h-10 w-10 text-primary" />
                    </motion.div>
                    <div className="relative h-1 w-48 overflow-hidden rounded-full bg-muted">
                        <motion.div
                            className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary"
                            animate={{ x: ['-100%', '300%'] }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </div>
                    <p className="mt-4 font-serif text-sm tracking-wide text-muted-foreground">
                        {t('your.journey.is.loading')}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
