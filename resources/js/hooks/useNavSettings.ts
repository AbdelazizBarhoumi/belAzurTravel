import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/api/http';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import type { NavSettings } from '@/lib/nav-config';
import { DEFAULT_NAV_SETTINGS } from '@/lib/nav-config';

export function useNavSettings() {
    const { settings: siteSettings, loading, setSettings } =
        useSiteSettingsContext();

    const settings = useMemo(
        () => siteSettings.content?.nav?.settings ?? DEFAULT_NAV_SETTINGS,
        [siteSettings.content?.nav?.settings],
    );

    useEffect(() => {
        setSettings((prev) => {
            if (prev.content?.nav?.settings === settings) {
                return prev;
            }

            return {
                ...prev,
                content: {
                    ...(prev.content ?? {}),
                    nav: {
                        ...(prev.content?.nav ?? {}),
                        settings,
                    },
                },
            };
        });
    }, [setSettings, settings]);

    // Save settings to Laravel API
    const update = useCallback(async (next: NavSettings) => {
        try {
            setSettings((prev) => ({
                ...prev,
                content: {
                    ...(prev.content ?? {}),
                    nav: {
                        ...(prev.content?.nav ?? {}),
                        settings: next,
                    },
                },
            }));
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({
                    content: {
                        nav: {
                            settings: next,
                        },
                    },
                }),
            });
        } catch (err) {
            console.error('Failed to save nav settings:', err);
            throw err;
        }
    }, []);

    // Reset to defaults
    const reset = useCallback(async () => {
        try {
            setSettings((prev) => ({
                ...prev,
                content: {
                    ...(prev.content ?? {}),
                    nav: {
                        ...(prev.content?.nav ?? {}),
                        settings: DEFAULT_NAV_SETTINGS,
                    },
                },
            }));
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({
                    content: {
                        nav: {
                            settings: DEFAULT_NAV_SETTINGS,
                        },
                    },
                }),
            });
        } catch (err) {
            console.error('Failed to reset nav settings:', err);
            throw err;
        }
    }, []);

    return { settings, loading, update, reset };
}
