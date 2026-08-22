import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from 'react';
import type { SiteSettings } from '@/api/siteSettings.api';
import {
    clearSiteSettingsCache,
    defaultSiteSettings,
    fetchSiteSettings,
} from '@/api/siteSettings.api';

interface SiteSettingsContextValue {
    settings: SiteSettings;
    loading: boolean;
    setSettings: Dispatch<SetStateAction<SiteSettings>>;
    reload: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | undefined>(
    undefined,
);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const next = await fetchSiteSettings();
            setSettings(next);
        } catch {
            setSettings(defaultSiteSettings);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const next = await fetchSiteSettings();
                if (mounted) {
                    setSettings(next);
                }
            } catch {
                if (mounted) {
                    setSettings(defaultSiteSettings);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // Refetch when admin saves site settings
    useEffect(() => {
        const handler = () => {
            clearSiteSettingsCache();
            reload();
        };
        window.addEventListener('site-settings-updated', handler);
        return () =>
            window.removeEventListener('site-settings-updated', handler);
    }, [reload]);

    const value = useMemo(
        () => ({ settings, loading, setSettings, reload }),
        [loading, reload, settings],
    );

    return (
        <SiteSettingsContext.Provider value={value}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettingsContext() {
    const context = useContext(SiteSettingsContext);

    if (!context) {
        // In tests we may render components without the provider. Return a
        // safe fallback so components can read site settings without
        // throwing during unit tests.
        return {
            settings: defaultSiteSettings,
            loading: false,
            setSettings: () => {},
            reload: async () => {},
        } as SiteSettingsContextValue;
    }

    return context;
}
