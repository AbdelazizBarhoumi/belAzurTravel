import { apiFetch } from '@/api/http';
import { type HotelDetailData as HotelProfileData } from '@/api/siteContent.api';
import type { Lang } from '@/i18n/translations';
import type {
    CarItem,
    DealItem,
    DestinationItem,
    EventItem,
    FlightItem,
    HotelItem,
    PromoItem,
    TourDetailItem,
    TourItem,
} from '@/types/public';

// Re-export public entity types so they're available via @/api/entities.api
export type {
    BlogPostItem,
    BlogContentSection,
    BlogContent,
    BlogContentValue,
    DestinationItem,
    TourDetailStep,
    TourDetailItem,
    TourItem,
    CarItem,
    DealItem,
    EventItem,
    FlightItem,
    PromoItem,
    HotelItem,
} from '@/types/public';
export { getLocalizedText } from '@/types/common';

export {
    blogPosts,
    contactMethods,
    dealsSectionData,
    designTripAccommodations,
    designTripBudgets,
    designTripDestinations,
    designTripInterests,
    designTripSteps,
    designTripTransports,
    footerQuickLinks,
    footerSupportLinks,
    galleryPhotos,
    landingAssurances,
    landingTrustCards,
    legalSections,
    navbarDestinationLinks,
    navbarHotelLinks,
    navbarMoreLinks,
    navbarSimpleLinks,
    socialLinks,
    teamMembers,
    type BlogPost,
    type ContactMethod,
    type DealCard,
    type HotelAmenity,
    type HotelDetailData,
    type HotelRoom,
    type LegalSection,
    type NavDropdownItem,
    type OptionItem,
    type SearchWidgetConfig,
    type SimpleLinkItem,
    type SocialLink,
    type StepItem,
    type TeamMember,
} from '@/api/siteContent.api';

export type LocalizedText = Record<Lang, string>;

export function localizeText(
    value:
        | LocalizedText
        | Record<string, string>
        | string
        | number
        | null
        | undefined,
    lang: Lang,
): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }

    return value[lang] || value.en || value.fr || value.ar || '';
}

// All lookups now proxy to backend endpoints (DB-backed). There is
// no in-memory fallback. Callers must handle network errors via react-query
// or higher-level code.
export function getDestinations(): Promise<DestinationItem[]> {
    return apiFetch<DestinationItem[]>('/api/destinations');
}

export function findDestinationBySlug(
    slug?: string | null,
): Promise<DestinationItem | null> {
    if (!slug) return Promise.resolve(null);
    return apiFetch<DestinationItem | null>(
        `/api/destinations/${slug}`,
    );
}

export function getHotels(): Promise<HotelItem[]> {
    return apiFetch<HotelItem[]>('/api/hotels');
}

export function getTours(): Promise<TourItem[]> {
    return apiFetch<TourItem[]>('/api/tours');
}

export function findTourBySlug(slug?: string | null): Promise<TourItem | null> {
    if (!slug) return Promise.resolve(null);
    return apiFetch<TourItem | null>(`/api/tours/${slug}`);
}

export function findTourDetailBySlug(
    slug?: string | null,
): Promise<TourDetailItem | null> {
    if (!slug) return Promise.resolve(null);
    return apiFetch<TourDetailItem | null>(`/api/tours/${slug}`);
}

export function getCars(): Promise<CarItem[]> {
    return apiFetch<CarItem[]>('/api/cars');
}

export function findCarBySlug(_slug?: string | null): Promise<CarItem | null> {
    if (!_slug) return Promise.resolve(null);
    return apiFetch<CarItem | null>(`/api/cars/${_slug}`);
}

export function getFlights(): Promise<FlightItem[]> {
    return apiFetch<FlightItem[]>('/api/flights');
}

export function findFlightById(id?: string | null): Promise<FlightItem | null> {
    if (!id) return Promise.resolve(null);
    return apiFetch<FlightItem | null>(`/api/flights/${id}`);
}

export function getEvents(): Promise<EventItem[]> {
    return apiFetch<EventItem[]>('/api/events');
}

export function findEventBySlug(
    slug?: string | null,
): Promise<EventItem | null> {
    if (!slug) return Promise.resolve(null);
    return apiFetch<EventItem | null>(`/api/events/${slug}`);
}

export function getDeals(): Promise<DealItem[]> {
    return apiFetch<DealItem[]>('/api/deals');
}

export function findDealBySlug(slug?: string | null): Promise<DealItem | null> {
    if (!slug) return Promise.resolve(null);
    return apiFetch<DealItem | null>(`/api/deals/${slug}`);
}

export function getPromos(): Promise<PromoItem[]> {
    return apiFetch<PromoItem[]>('/api/promos');
}

export function findPromoByCode(
    code?: string | null,
): Promise<PromoItem | null> {
    if (!code) return Promise.resolve(null);
    return apiFetch<PromoItem | null>(`/api/promos/${code}`);
}

export async function searchDeals(
    query: string,
    lang: Lang,
): Promise<DealItem[]> {
    const deals = await getDeals();
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return deals;

    return deals.filter((deal) =>
        [
            deal.title?.[lang],
            deal.description?.[lang],
            deal.discount?.[lang],
            deal.category?.[lang],
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery),
    );
}

export function findHotelById(
    id?: string | null,
): Promise<HotelProfileData | null> {
    if (!id) return Promise.resolve(null);
    return apiFetch<HotelProfileData | null>(`/api/hotels/${id}`);
}
// End of API-backed helpers.

