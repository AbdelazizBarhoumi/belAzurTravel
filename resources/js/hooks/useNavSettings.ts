import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/api/http';
import { fetchSiteSettings } from '@/api/siteSettings.api';
import type { NavSettings } from '@/lib/nav-config';
import { DEFAULT_NAV_SETTINGS } from '@/lib/nav-config';

export function useNavSettings() {
    const [settings, setSettings] = useState<NavSettings>(DEFAULT_NAV_SETTINGS);
    const [loading, setLoading] = useState(true);

    // Load settings from Laravel API using shared helper which normalizes shape
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const site = await fetchSiteSettings();
                const navData = site.content?.nav?.settings;
                if (mounted) setSettings(navData ?? DEFAULT_NAV_SETTINGS);
            } catch (err) {
                console.error('Failed to load nav settings:', err);
                if (mounted) setSettings(DEFAULT_NAV_SETTINGS);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Save settings to Laravel API
    const update = useCallback(async (next: NavSettings) => {
        try {
            setSettings(next);
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
            // Notify other parts of the app that site settings changed
            try {
                window.dispatchEvent(new CustomEvent('site-settings-updated'));
            } catch (error) {
                console.error(
                    'Failed to dispatch site settings update:',
                    error,
                );
            }
        } catch (err) {
            console.error('Failed to save nav settings:', err);
            throw err;
        }
    }, []);

    // Reset to defaults
    const reset = useCallback(async () => {
        try {
            setSettings(DEFAULT_NAV_SETTINGS);
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
            try {
                window.dispatchEvent(new CustomEvent('site-settings-updated'));
            } catch (error) {
                console.error(
                    'Failed to dispatch site settings update:',
                    error,
                );
            }
        } catch (err) {
            console.error('Failed to reset nav settings:', err);
            throw err;
        }
    }, []);

    return { settings, loading, update, reset };
}
