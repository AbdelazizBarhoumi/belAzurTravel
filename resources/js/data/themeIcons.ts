import {
    BookOpen,
    Briefcase,
    Building2,
    CalendarDays,
    Compass,
    Droplet,
    Droplets,
    Dumbbell,
    Flag,
    Footprints,
    Gem,
    Heart,
    Hotel,
    Landmark,
    Layers,
    Map,
    Mountain,
    PartyPopper,
    Sparkles,
    Sun,
    Tag,
    Thermometer,
    Users,
    Utensils,
    Wallet,
    Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Provider theme (or manual tag) -> lucide icon.
 *
 * Keys are lowercased + trimmed, mirroring the filter derivation in
 * `app/Services/OsTravel/HotelPublisher.php`. Full reference:
 * `docs/ostravel-theme-mapping.md`.
 */
export const THEME_ICONS: Record<string, LucideIcon> = {
    // Business
    affaires: Briefcase,
    business: Briefcase,
    // Family
    famille: Users,
    family: Users,
    'voyages de noces': Heart,
    // Sports & leisure
    sport: Dumbbell,
    loisirs: Dumbbell,
    'sport & loisirs': Dumbbell,
    golf: Flag,
    // Thalasso / spa / wellness
    thalasso: Droplets,
    spa: Droplets,
    thalassothérapie: Droplets,
    balnéothérapie: Droplet,
    thermalisme: Thermometer,
    'bien être': Heart,
    // Nature & adventure
    nature: Compass,
    aventure: Compass,
    découverte: Compass,
    randonnée: Footprints,
    montagne: Mountain,
    saharien: Sun,
    archéologie: Landmark,
    // Relaxation / charm / seaside / short break
    détente: Sparkles,
    charme: Gem,
    balnéaire: Waves,
    'week-end': CalendarDays,
    // Promotional tariffs
    promo: Tag,
    // Unmapped provider themes (stay searchable via `hotels.tags` text)
    tourisme: Map,
    réveillon: PartyPopper,
    'hôtel de ville': Building2,
    combinées: Layers,
    // Manual tag keys used by non-provider hotels
    beach: Waves,
    pool: Droplet,
    waterpark: Waves,
    'all-inclusive': Utensils,
    wellness: Heart,
    luxury: Gem,
    boutique: Gem,
    resort: Hotel,
    city: Building2,
    adventure: Compass,
    budget: Wallet,
    culture: BookOpen,
};

export function getThemeIcon(theme: string): LucideIcon | null {
    const key = theme.toLowerCase().trim();

    return THEME_ICONS[key] ?? null;
}
