import { useSiteSettings } from '@/hooks/useSiteSettings';
import { isPageEnabled } from '@/lib/pageVisibility';
import { FeaturedDestinations } from './FeaturedDestinations';

export function FeaturedDestinationsWrapper() {
    const { settings } = useSiteSettings();

    // Don't render if destinations page is disabled
    if (!isPageEnabled('destinations', settings.content?.nav?.settings)) {
        return null;
    }

    return <FeaturedDestinations />;
}
