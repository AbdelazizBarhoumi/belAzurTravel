import type { LocalizedText } from '../common';

/**
 * Hotel item - brief view with key info
 */
export interface HotelItem {
    slug: string;
    id: string;
    destinationSlug: string;
    name: LocalizedText;
    location: LocalizedText;
    city?: LocalizedText;
    country?: LocalizedText;
    category_key?: string;
    category?: LocalizedText;
    price: number;
    base_price?: number;
    markup_percentage?: string | number;
    currency?: string;
    source?: 'ostravel' | 'manual';
    provider?: 'ostravel' | 'manual';
    last_price?: number | null;
    last_price_at?: string | null;
    rating: number;
    stars: number;
    reviews: number;
    image: string;
    tags: string[];
    amenities: Array<{ name: Record<string, string>; icon: string }>;
    category_assignments?: Record<string, string>;
    // Filter fields
    htel_recommande?: boolean;
    tarifs_promo?: boolean;
    enfant_gratuit?: boolean;
    disponible_seulement?: boolean;
    annulation_gratuite?: boolean;
    logement_simple?: boolean;
    petit_dejeuner?: boolean;
    demi_pension?: boolean;
    pension_complete?: boolean;
    categorie_4_etoiles?: boolean;
    chambre_double?: boolean;
    suite?: boolean;
    chambre_standard?: boolean;
    suite_junior?: boolean;
    thalasso_spa?: boolean;
    nature_aventure?: boolean;
    famille?: boolean;
    affaires?: boolean;
    sport_loisir?: boolean;
    detente?: boolean;
}
