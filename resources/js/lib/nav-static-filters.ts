/**
 * Static navigation filters — source of truth for hardcoded filter options
 * that appear in page navigation dropdowns.
 *
 * Each page can define filter groups with localized labels, optional inline SVGs,
 * and URL query param strings. These merge with dynamic API categories when
 * the navigation dropdown mode is "categories".
 */

import type { LocalizedText } from '@/lib/nav-config';

/* ─── Types ─── */

export interface StaticFilterOption {
    /** Unique key for this option (e.g. "star_5", "round-trip") */
    key: string;
    /** Localized display label */
    label: LocalizedText;
    /** Optional inline SVG string rendered next to the label */
    svg?: string;
    /** Query param string appended to the page href (e.g. "stars=5", "type=round-trip") */
    href: string;
    /** Optional provider/boarding ID used for live search API mapping */
    provider_id?: number;
}

export type StaticFilterDisplayMode = 'label' | 'svg' | 'both';

export interface StaticFilterGroup {
    /** Group key — must match the filter component key on the page */
    key: string;
    /** Localized group heading */
    label: LocalizedText;
    /** Filter options in this group */
    options: StaticFilterOption[];
    /** How to display items in the nav dropdown: "label" (text only), "svg" (icon only), "both" (icon + text). Default: "label" */
    displayMode?: StaticFilterDisplayMode;
}

/* ─── Star SVG icons ─── */

const STAR_FILLED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
const STAR_EMPTY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

function starSvg(filled: number, total: number): string {
    let icons = '';
    for (let i = 0; i < total; i++) {
        icons += i < filled ? STAR_FILLED_SVG : STAR_EMPTY_SVG;
    }
    return `<span style="display:inline-flex;gap:1px;align-items:center">${icons}</span>`;
}

/* ─── Filter definitions per page ─── */

export const STATIC_FILTERS_BY_PAGE: Record<string, StaticFilterGroup[]> = {
    /* ────────── HOTELS ────────── */
    hotels: [
        {
            key: 'stars',
            label: { en: 'Stars', fr: 'Étoiles', ar: 'نجوم' },
            displayMode: 'svg',
            options: [
                {
                    key: 'star_5',
                    label: { en: '5 Stars', fr: '5 étoiles', ar: '5 نجوم' },
                    svg: starSvg(5, 5),
                    href: 'stars=5',
                },
                {
                    key: 'star_4',
                    label: { en: '4 Stars', fr: '4 étoiles', ar: '4 نجوم' },
                    svg: starSvg(4, 5),
                    href: 'stars=4',
                },
                {
                    key: 'star_3',
                    label: { en: '3 Stars', fr: '3 étoiles', ar: '3 نجوم' },
                    svg: starSvg(3, 5),
                    href: 'stars=3',
                },
                {
                    key: 'star_2',
                    label: { en: '2 Stars', fr: '2 étoiles', ar: '2 نجوم' },
                    svg: starSvg(2, 5),
                    href: 'stars=2',
                },
                {
                    key: 'star_1',
                    label: { en: '1 Star', fr: '1 étoile', ar: '1 نجمة' },
                    svg: starSvg(1, 5),
                    href: 'stars=1',
                },
            ],
        },
        {
            key: 'type_chambres',
            label: { en: 'Room Type', fr: 'Type de chambre', ar: 'نوع الغرفة' },
            options: [
                {
                    key: 'chambre_double',
                    label: {
                        en: 'Double Room',
                        fr: 'Chambre Double',
                        ar: 'غرفة مزدوجة',
                    },
                    href: 'cat=chambre_double',
                },
                {
                    key: 'chambre_standard',
                    label: {
                        en: 'Standard Room',
                        fr: 'Chambre Standard',
                        ar: 'غرفة قياسية',
                    },
                    href: 'cat=chambre_standard',
                },
                {
                    key: 'suite',
                    label: { en: 'Suite', fr: 'Suite', ar: 'جناح' },
                    href: 'cat=suite',
                },
                {
                    key: 'suite_junior',
                    label: {
                        en: 'Junior Suite',
                        fr: 'Suite Junior',
                        ar: 'جناح صغير',
                    },
                    href: 'cat=suite_junior',
                },
            ],
        },
        {
            key: 'arrangements',
            label: { en: 'Arrangements', fr: 'Arrangements', ar: 'ترتيبات' },
            options: [
                {
                    key: 'logement_simple',
                    label: {
                        en: 'Simple Accommodation',
                        fr: 'Logement Simple',
                        ar: 'إقامة بسيطة',
                    },
                    href: 'category_arrangements=logement_simple',
                },
                {
                    key: 'petit_dejeuner',
                    label: {
                        en: 'Breakfast',
                        fr: 'Petit Déjeuner',
                        ar: 'فطور',
                    },
                    href: 'category_arrangements=petit_dejeuner',
                },
                {
                    key: 'demi_pension',
                    label: {
                        en: 'Half Board',
                        fr: 'Demi Pension',
                        ar: 'نصف إقامة',
                    },
                    href: 'category_arrangements=demi_pension',
                },
                {
                    key: 'pension_complete',
                    label: {
                        en: 'Full Board',
                        fr: 'Pension Complète',
                        ar: 'إقامة كاملة',
                    },
                    href: 'category_arrangements=pension_complete',
                },
            ],
        },
        {
            key: 'service',
            label: { en: 'Service', fr: 'Service', ar: 'خدمة' },
            options: [
                {
                    key: 'thalasso_spa',
                    label: {
                        en: 'Thalasso & Spa',
                        fr: 'Thalasso & Spa',
                        ar: 'ثالاسو وسبا',
                    },
                    href: 'category_service=thalasso_spa',
                },
                {
                    key: 'nature_aventure',
                    label: {
                        en: 'Nature and Adventure',
                        fr: 'Nature et Aventure',
                        ar: 'طبيعة ومغامرة',
                    },
                    href: 'category_service=nature_aventure',
                },
                {
                    key: 'famille',
                    label: { en: 'Family', fr: 'Famille', ar: 'عائلة' },
                    href: 'category_service=famille',
                },
                {
                    key: 'affaires',
                    label: { en: 'Business', fr: 'Affaires', ar: 'أعمال' },
                    href: 'category_service=affaires',
                },
                {
                    key: 'sport_loisir',
                    label: {
                        en: 'Sports & Leisure',
                        fr: 'Sport & Loisir',
                        ar: 'رياضة وترفيه',
                    },
                    href: 'category_service=sport_loisir',
                },
                {
                    key: 'detente',
                    label: { en: 'Relaxation', fr: 'Détente', ar: 'استرخاء' },
                    href: 'category_service=detente',
                },
            ],
        },
        {
            key: 'accommodation_type',
            label: {
                en: 'Accommodation Type',
                fr: "Type d'hébergement",
                ar: 'نوع الإقامة',
            },
            options: [
                {
                    key: 'campement',
                    label: {
                        en: 'Camp',
                        fr: 'Campement',
                        ar: 'مخيم',
                    },
                    href: 'cat_type=campement',
                },
                {
                    key: 'appart_hotel',
                    label: {
                        en: 'Aparthotel',
                        fr: 'Appart Hôtel',
                        ar: 'Residence hotel',
                    },
                    href: 'cat_type=appart_hotel',
                },
                {
                    key: 'maison_hotes',
                    label: {
                        en: 'Guesthouse',
                        fr: "Maison d'hôtes",
                        ar: 'بيت ضيافة',
                    },
                    href: 'cat_type=maison_hotes',
                },
                {
                    key: 'appartement',
                    label: {
                        en: 'Apartment',
                        fr: 'Appartement',
                        ar: 'شقة',
                    },
                    href: 'cat_type=appartement',
                },
                {
                    key: 'parc_attraction',
                    label: {
                        en: 'Theme Park',
                        fr: "Parc d'attraction",
                        ar: 'حديقة ملاهي',
                    },
                    href: 'cat_type=parc_attraction',
                },
                {
                    key: 'villa',
                    label: { en: 'Villa', fr: 'Villa', ar: 'فيلا' },
                    href: 'cat_type=villa',
                },
            ],
        },
        {
            key: 'pricing_type',
            label: { en: 'Pricing Type', fr: 'Formule repas', ar: 'نوع التسعير' },
            options: [
                { key: 'all-inclusive', label: { en: 'All Inclusive', fr: 'Tout inclus', ar: 'شامل كل شيء' }, href: 'pricing_type=all-inclusive', provider_id: 6 },
                { key: 'half-board', label: { en: 'Half Board', fr: 'Demi pension', ar: 'إجازة نصف' }, href: 'pricing_type=half-board', provider_id: 19 },
                { key: 'bed-breakfast', label: { en: 'Bed & Breakfast', fr: 'Petit déjeuner inclus', ar: 'فطور' }, href: 'pricing_type=bed-breakfast', provider_id: 17 },
                { key: 'room-only', label: { en: 'Room Only', fr: 'Chambre seulement', ar: 'غرفة فقط' }, href: 'pricing_type=room-only', provider_id: 3 },
                { key: 'soft-all-inclusive', label: { en: 'Soft All Inclusive', fr: 'Soft All Inclusive', ar: 'شامل كل شيء بارد' }, href: 'pricing_type=soft-all-inclusive' },
                { key: 'ultra-all-inclusive', label: { en: 'Ultra All Inclusive', fr: 'Ultra All Inclusive', ar: 'شامل كل شيء ultra' }, href: 'pricing_type=ultra-all-inclusive' },
                { key: 'ultra-all-inclusive-soft', label: { en: 'Ultra All Inclusive Soft', fr: 'Ultra All Inclusive Soft', ar: 'شامل كل شيء ultra بارد' }, href: 'pricing_type=ultra-all-inclusive-soft' },
                { key: 'full-board', label: { en: 'Full Board', fr: 'Pension Complète', ar: 'إقامة كاملة' }, href: 'pricing_type=full-board' },
                { key: 'full-board-plus', label: { en: 'Full Board Plus', fr: 'Pension Complète +', ar: 'إقامة كاملة +' }, href: 'pricing_type=full-board-plus' },
                { key: 'half-board-plus', label: { en: 'Half Board Plus', fr: 'Demi Pension +', ar: 'نصف إقامة +' }, href: 'pricing_type=half-board-plus' },
                { key: 'entry-only', label: { en: 'Entry Only', fr: 'Entrée Simple', ar: 'دخول فقط' }, href: 'pricing_type=entry-only' },
                { key: 'day-use', label: { en: 'Day Use', fr: 'Day Use', ar: 'استخدام نهاري' }, href: 'pricing_type=day-use' },
                { key: 'ultra-ai-soft-drink', label: { en: 'Ultra AI Soft Drink', fr: 'Ultra AI Soft Drink', ar: 'شامل كل شيء ultra مشروبات باردة' }, href: 'pricing_type=ultra-ai-soft-drink' },
            ],
        },
        {
            key: 'features',
            label: { en: 'Features', fr: 'Équipements & Ambiance', ar: 'الميزات' },
            options: [
                { key: 'pied-dans-leau', label: { en: 'Pieds dans l\'eau', fr: 'Pieds dans l\'eau', ar: 'أقدام في الماء' }, href: 'features=pied-dans-leau' },
                { key: 'animation', label: { en: 'Animation', fr: 'Animation', ar: 'ترفيه' }, href: 'features=animation' },
                { key: 'couple-famille', label: { en: 'Couple & Family Only', fr: 'Couple & Famille seulement', ar: 'أزواج وعائلات فقط' }, href: 'features=couple-famille' },
                { key: 'bon-rapport', label: { en: 'Good Value', fr: 'Bon rapport qualité prix', ar: 'قيمة جيدة' }, href: 'features=bon-rapport' },
                { key: 'burkini-autorise', label: { en: 'Burkini Allowed', fr: 'Burkini autorisé', ar: 'بركيني مسموح' }, href: 'features=burkini-autorise' },
                { key: 'wifi-gratuit', label: { en: 'Free WiFi', fr: 'Wifi gratuit', ar: 'واي فاي مجاني' }, href: 'features=wifi-gratuit' },
                { key: 'burkini-non-autorise', label: { en: 'Burkini Not Allowed', fr: 'Burkini non autorisé', ar: 'بركيني غير مسموح' }, href: 'features=burkini-non-autorise' },
                { key: 'toboggan', label: { en: 'Water Slides', fr: 'Toboggans', ar: 'زلاقات مائية' }, href: 'features=toboggan' },
                { key: 'luxe-calme', label: { en: 'Luxury & Quiet', fr: 'Luxe et calme', ar: 'فخامة وهدوء' }, href: 'features=luxe-calme' },
                { key: 'vue-ville', label: { en: 'City View', fr: 'Vue sur la ville', ar: 'إطلالة على المدينة' }, href: 'features=vue-ville' },
                { key: 'aire-jeux', label: { en: 'Kids Playground', fr: 'Aire de jeux pour enfants', ar: 'ملعب أطفال' }, href: 'features=aire-jeux' },
                { key: 'plage-privee', label: { en: 'Private Beach', fr: 'Plage privée', ar: 'شاطئ خاص' }, href: 'features=plage-privee' },
                { key: 'en-face-mer', label: { en: 'Seafront', fr: 'En face de la mer', ar: 'أمام البحر' }, href: 'features=en-face-mer' },
                { key: 'centre-thalasso', label: { en: 'Thalassotherapy', fr: 'Centre Thalasso', ar: 'مركز تالاسو' }, href: 'features=centre-thalasso' },
                { key: 'terrain-football', label: { en: 'Football Field', fr: 'Terrain de football', ar: 'ملعب كرة قدم' }, href: 'features=terrain-football' },
                { key: 'emplacement', label: { en: 'Great Location', fr: 'Emplacement stratégique', ar: 'موقع استراتيجي' }, href: 'features=emplacement' },
                { key: 'court-tennis', label: { en: 'Tennis Court', fr: 'Court de tennis', ar: 'ملعب تنس' }, href: 'features=court-tennis' },
                { key: 'congress', label: { en: 'Conference Center', fr: 'Congress center', ar: 'مركز مؤتمرات' }, href: 'features=congress' },
                { key: 'padel', label: { en: 'Padel', fr: 'Padel', ar: 'بادل' }, href: 'features=padel' },
            ],
        },
    ],

    /* ────────── FLIGHTS ────────── */
    flights: [
        {
            key: 'trip_type',
            label: { en: 'Trip Type', fr: 'Type de voyage', ar: 'نوع الرحلة' },
            options: [
                {
                    key: 'round-trip',
                    label: {
                        en: 'Round Trip',
                        fr: 'Aller-retour',
                        ar: 'ذهاب وعودة',
                    },
                    href: 'type=round-trip',
                },
                {
                    key: 'one-way',
                    label: {
                        en: 'One Way',
                        fr: 'Aller simple',
                        ar: 'ذهاب فقط',
                    },
                    href: 'type=one-way',
                },
                {
                    key: 'multi-city',
                    label: {
                        en: 'Multi City',
                        fr: 'Multi-ville',
                        ar: 'عدة مدن',
                    },
                    href: 'type=multi-city',
                },
            ],
        },
    ],

    /* ────────── PROMOS ────────── */
    promos: [
        {
            key: 'promo_type',
            label: {
                en: 'Promo Type',
                fr: 'Type de promotion',
                ar: 'نوع العرض',
            },
            options: [
                {
                    key: 'percentage',
                    label: {
                        en: 'Percentage Discount',
                        fr: 'Réduction en pourcentage',
                        ar: 'خصم نسبي',
                    },
                    href: 'type=percentage',
                },
                {
                    key: 'perk',
                    label: {
                        en: 'Perk / Bonus',
                        fr: 'Avantage / Bonus',
                        ar: 'ميزة / إضافة',
                    },
                    href: 'type=perk',
                },
            ],
        },
    ],

    /* ────────── DESTINATIONS ────────── */
    destinations: [
        {
            key: 'sort',
            label: { en: 'Sort By', fr: 'Trier par', ar: 'ترتيب حسب' },
            options: [
                {
                    key: 'featured',
                    label: { en: 'Featured', fr: 'Mis en avant', ar: 'مميز' },
                    href: 'sort=featured',
                },
                {
                    key: 'price-asc',
                    label: {
                        en: 'Price: Low to High',
                        fr: 'Prix croissant',
                        ar: 'السعر: من الأقل للأعلى',
                    },
                    href: 'sort=price-asc',
                },
                {
                    key: 'price-desc',
                    label: {
                        en: 'Price: High to Low',
                        fr: 'Prix décroissant',
                        ar: 'السعر: من الأعلى للأقل',
                    },
                    href: 'sort=price-desc',
                },
                {
                    key: 'rating',
                    label: { en: 'Rating', fr: 'Note', ar: 'التقييم' },
                    href: 'sort=rating',
                },
            ],
        },
    ],
};

/* ─── Helpers ─── */

/** Get all static filter groups for a given page */
export function getStaticFiltersForPage(pageKey: string): StaticFilterGroup[] {
    return STATIC_FILTERS_BY_PAGE[pageKey] ?? [];
}

/** Get a specific static filter group by key for a page */
export function getStaticFilterGroup(
    pageKey: string,
    groupKey: string,
): StaticFilterGroup | undefined {
    return STATIC_FILTERS_BY_PAGE[pageKey]?.find((g) => g.key === groupKey);
}

/** Get the display mode for a static filter group (defaults to "label") */
export function getStaticFilterDisplayMode(
    pageKey: string,
    groupKey: string,
): StaticFilterDisplayMode {
    return getStaticFilterGroup(pageKey, groupKey)?.displayMode ?? 'label';
}

/**
 * Merge static filter options with dynamic API category types into a
 * unified list suitable for navbar dropdown rendering.
 *
 * Static groups appear first, followed by dynamic API categories.
 */
export function mergeCategoryOptions(
    pageKey: string,
    dynamicCategoryTypes: Array<{
        key: string;
        label: LocalizedText;
        values?: Array<{ key: string; name: LocalizedText }>;
    }>,
    lang: 'en' | 'fr' | 'ar',
): Array<{
    label: string;
    value: string;
    isStatic: boolean;
    groupLabel?: string;
    svg?: string;
}> {
    const result: Array<{
        label: string;
        value: string;
        isStatic: boolean;
        groupLabel?: string;
        svg?: string;
    }> = [];

    // 1. Static filter groups
    const staticGroups = getStaticFiltersForPage(pageKey);
    for (const group of staticGroups) {
        for (const opt of group.options) {
            result.push({
                label: opt.label[lang] ?? opt.label.en ?? opt.key,
                value: `static:${group.key}:${opt.key}`,
                isStatic: true,
                groupLabel: group.label[lang] ?? group.label.en ?? group.key,
                svg: opt.svg,
            });
        }
    }

    // 2. Dynamic API category types
    for (const ct of dynamicCategoryTypes) {
        for (const val of ct.values ?? []) {
            result.push({
                label:
                    (val.name as unknown as LocalizedText)[lang] ??
                    (val.name as unknown as LocalizedText).en ??
                    val.key,
                value: `${ct.key}:${val.key}`,
                isStatic: false,
                groupLabel: ct.label[lang] ?? ct.label.en ?? ct.key,
            });
        }
    }

    return result;
}
