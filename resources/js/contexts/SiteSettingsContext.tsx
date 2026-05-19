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
import { defaultSiteSettings, fetchSiteSettings } from '@/api/siteSettings.api';

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
        throw new Error(
            'useSiteSettings must be used within a SiteSettingsProvider',
        );
    }

    return context;
}