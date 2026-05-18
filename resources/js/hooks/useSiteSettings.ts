import { useEffect, useState } from 'react';
import type { SiteSettings } from '@/api/siteSettings.api';
import { defaultSiteSettings, fetchSiteSettings } from '@/api/siteSettings.api';

export function useSiteSettings() {
    const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        fetchSiteSettings()
            .then((s) => {
                if (mounted) setSettings(s);
            })
            .catch(() => {
                // keep defaults
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    // Refresh when other parts of the app update site settings
    useEffect(() => {
        const handle = () => {
            fetchSiteSettings()
                .then((s) => setSettings(s))
                .catch(() => {})
                .finally(() => setLoading(false));
        };
        window.addEventListener(
            'site-settings-updated',
            handle as EventListener,
        );
        return () =>
            window.removeEventListener(
                'site-settings-updated',
                handle as EventListener,
            );
    }, []);

    return { settings, loading } as const;
}
