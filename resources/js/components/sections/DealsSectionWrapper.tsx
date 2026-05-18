import { useSiteSettings } from '@/hooks/useSiteSettings';
import { isPageEnabled } from '@/lib/pageVisibility';
import { DealsSection } from './DealsSection';

export function DealsSectionWrapper() {
    const { settings } = useSiteSettings();

    // Don't render if deals page is disabled
    if (!isPageEnabled('deals', settings.content?.nav?.settings)) {
        return null;
    }

    return <DealsSection />;
}
