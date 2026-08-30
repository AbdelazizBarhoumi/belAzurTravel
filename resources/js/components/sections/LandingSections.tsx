import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { normalizeLandingSections } from '@/lib/landingSections';
import { BlogSection } from './landing/BlogSection';
import { CarsSection } from './landing/CarsSection';
import { DealsSection } from './landing/DealsSection';
import { DestinationsSection } from './landing/DestinationsSection';
import { EventsSection } from './landing/EventsSection';
import { FlightsSection } from './landing/FlightsSection';
import { HotelsSection } from './landing/HotelsSection';
import { HotelSelectionSection } from './landing/HotelSelectionSection';
import { LocationSection } from './landing/LocationSection';
import { OrganizedSection } from './landing/OrganizedSection';
import { ToursSection } from './landing/ToursSection';
import { VisaSection } from './landing/VisaSection';

const SECTION_COMPONENTS: Record<
    string,
    React.ComponentType<{ config: LandingSectionConfig }>
> = {
    destinations: DestinationsSection,
    hotels: HotelsSection,
    hotelSelection: HotelSelectionSection,
    organized: OrganizedSection,
    tours: ToursSection,
    cars: CarsSection,
    flights: FlightsSection,
    events: EventsSection,
    deals: DealsSection,
    blog: BlogSection,
    visas: VisaSection,
    location: LocationSection,
};

export function LandingSections() {
    const { settings } = useSiteSettings();
    const landingSections = settings.content?.landing_sections;

    const normalized = normalizeLandingSections(landingSections);
    const order = normalized.order;
    const sections = normalized.sections;

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
