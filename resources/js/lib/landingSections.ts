import type {
    LandingSectionConfig,
    LandingSections,
} from '@/api/siteSettings.api';

export const LANDING_SECTION_META = {
    destinations: {
        labelKey: 'admin.section.destinations',
        styles: ['carousel', 'cards', 'grid'],
    },
    hotels: {
        labelKey: 'admin.section.hotels',
        styles: ['carousel', 'cards', 'grid'],
    },
    hotelSelection: {
        labelKey: 'admin.section.hotelSelection',
        styles: ['carousel', 'cards', 'grid'],
    },
    organized: {
        labelKey: 'admin.section.organized',
        styles: ['carousel', 'cards', 'grid'],
    },
    tours: {
        labelKey: 'admin.section.tours',
        styles: ['carousel', 'cards', 'grid'],
    },
    cars: {
        labelKey: 'admin.section.cars',
        styles: ['carousel', 'cards', 'grid'],
    },
    flights: {
        labelKey: 'admin.section.flights',
        styles: ['carousel', 'cards', 'grid'],
    },
    events: {
        labelKey: 'admin.section.events',
        styles: ['carousel', 'cards', 'grid'],
    },
    deals: {
        labelKey: 'admin.section.deals',
        styles: ['carousel', 'cards', 'grid'],
    },
    blog: {
        labelKey: 'admin.section.blog',
        styles: ['carousel', 'cards', 'grid'],
    },
    visas: {
        labelKey: 'admin.section.visas',
        styles: ['carousel', 'cards', 'grid'],
    },
    strongPoints: {
        labelKey: 'admin.section.strongPoints',
        styles: ['default'],
    },
    location: { labelKey: 'admin.section.location', styles: ['default'] },
} as const;

export const LANDING_SECTION_ORDER = [
    'destinations',
    'hotels',
    'hotelSelection',
    'organized',
    'tours',
    'cars',
    'flights',
    'events',
    'deals',
    'blog',
    'visas',
    'strongPoints',
    'location',
] as const;

export type LandingSectionKey = (typeof LANDING_SECTION_ORDER)[number];

export function getLandingSectionDefaultStyle(key: string): string {
    return (
        LANDING_SECTION_META[key as LandingSectionKey]?.styles[0] ?? 'carousel'
    );
}

export function buildLandingSectionDefaults(): Record<
    string,
    LandingSectionConfig
> {
    return LANDING_SECTION_ORDER.reduce<Record<string, LandingSectionConfig>>(
        (acc, key) => {
            acc[key] = {
                enabled: true,
                style: getLandingSectionDefaultStyle(key),
            };

            return acc;
        },
        {},
    );
}

export function normalizeLandingSectionOrder(
    order?: string[],
    sections?: Record<string, LandingSectionConfig>,
): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const key of order ?? []) {
        if (!key || seen.has(key)) {
            continue;
        }

        seen.add(key);
        normalized.push(key);
    }

    for (const key of Object.keys(sections ?? {})) {
        if (!key || seen.has(key)) {
            continue;
        }

        seen.add(key);
        normalized.push(key);
    }

    for (const key of LANDING_SECTION_ORDER) {
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        normalized.push(key);
    }

    return normalized;
}

export function normalizeLandingSections(
    landingSections?: LandingSections | null,
): LandingSections {
    const order = normalizeLandingSectionOrder(
        landingSections?.order,
        landingSections?.sections,
    );
    const defaults = buildLandingSectionDefaults();
    const sections: Record<string, LandingSectionConfig> = {};

    for (const key of order) {
        const base = defaults[key] ?? {
            enabled: true,
            style: getLandingSectionDefaultStyle(key),
        };
        const saved: LandingSectionConfig =
            landingSections?.sections?.[key] ?? ({} as LandingSectionConfig);

        sections[key] = {
            ...base,
            ...saved,
            enabled: saved.enabled ?? base.enabled ?? true,
            style:
                saved.style ?? base.style ?? getLandingSectionDefaultStyle(key),
        };
    }

    return { order, sections };
}
