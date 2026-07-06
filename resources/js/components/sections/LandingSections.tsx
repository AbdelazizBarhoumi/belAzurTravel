import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { BlogSection } from './landing/BlogSection';
import { CarsSection } from './landing/CarsSection';
import { DealsSection } from './landing/DealsSection';
import { DestinationsSection } from './landing/DestinationsSection';
import { EventsSection } from './landing/EventsSection';
import { FlightsSection } from './landing/FlightsSection';
import { HotelsSection } from './landing/HotelsSection';
import { LocationSection } from './landing/LocationSection';
import { OrganizedSection } from './landing/OrganizedSection';
import { ToursSection } from './landing/ToursSection';

const SECTION_COMPONENTS: Record<string, React.ComponentType<{ config: LandingSectionConfig }>> = {
    destinations: DestinationsSection,
    hotels: HotelsSection,
    organized: OrganizedSection,
    tours: ToursSection,
    cars: CarsSection,
    flights: FlightsSection,
    events: EventsSection,
    deals: DealsSection,
    blog: BlogSection,
    location: LocationSection,
};

const DEFAULT_ORDER = ['destinations', 'hotels', 'organized', 'tours', 'cars', 'flights', 'events', 'deals', 'blog', 'location'];

export function LandingSections() {
    const { settings } = useSiteSettings();
    const landingSections = settings.content?.landing_sections;

    const order = landingSections?.order ?? DEFAULT_ORDER;
    const storedSections = landingSections?.sections ?? {};

    const sections: Record<string, LandingSectionConfig> = {};
    for (const key of order) {
        sections[key] = storedSections[key] ?? { enabled: true, style: 'auto' };
    }

    return (
        <>
            {order.map((key) => {
                const config = sections[key];
                if (!config?.enabled) return null;

                const Component = SECTION_COMPONENTS[key];
                if (!Component) return null;

                return <Component key={key} config={config} />;
            })}
        </>
    );
}
