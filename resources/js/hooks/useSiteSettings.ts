import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

export function useSiteSettings() {
    const { settings, loading } = useSiteSettingsContext();

    return { settings, loading } as const;
}
