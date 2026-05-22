import type { SimpleLinkItem } from '@/api/siteContent.api';
import type { NavSettings } from '@/lib/nav-config';
import { normalizeHours } from '@/lib/site-hours';
import type { SiteHourEntry } from '@/lib/site-hours';

type LocalizedText = Record<string, string>;

export type LegalSectionBody =
    | LocalizedText
    | {
          format: 'markdown' | 'richtext';
          content: LocalizedText;
      };

interface SiteSettingsContent {
    nav?: {
        simpleLinks?: Array<SimpleLinkItem & { label?: LocalizedText }>;
        settings?: NavSettings;
    };
    gallery?: {
        title?: LocalizedText;
        subtitle?: LocalizedText;
        images?: string[];
    };
    legal?: {
        title?: LocalizedText;
        subtitle?: LocalizedText;
    };
    footer?: {
        tagline?: LocalizedText;
    };
    contact?: {
        kicker?: LocalizedText;
        title?: LocalizedText;
        description?: LocalizedText;
        locationTitle?: LocalizedText;
        locationSubtitle?: LocalizedText;
        socialTitle?: LocalizedText;
        socialDescription?: LocalizedText;
        ctaTitle?: LocalizedText;
        ctaDescription?: LocalizedText;
    };
}

export interface SiteSettings {
    companyName: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    plusCode: string;
    year?: number;
    socialLinks: Array<{ label: string; href: string }>;
    legalSections: Array<{
        title: Record<string, string>;
        body: LegalSectionBody;
    }>;
    footerLinks: Array<{
        labelKey: string;
        href: string;
        group: 'quick' | 'support';
    }>;
    hours: SiteHourEntry[];
    content: SiteSettingsContent;
    gallery?: string[];
    config?: {
        navigation?: {
            enabled_dropdowns?: string[];
        };
    };
}

export const defaultSiteSettings: SiteSettings = {
    companyName: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    plusCode: '',
    year: new Date().getFullYear(),
    socialLinks: [],
    legalSections: [],
    footerLinks: [],
    hours: [],
    content: {},
    gallery: [],
    config: {
        navigation: {
            enabled_dropdowns: [],
        },
    },
};

const SITE_SETTINGS_TTL_MS = 60_000;
let cachedSiteSettings: SiteSettings | null = null;
let cachedAtMs = 0;
let inFlightSiteSettingsRequest: Promise<SiteSettings> | null = null;

function mapApiToSiteSettings(json: Record<string, unknown>): SiteSettings {
    return {
        companyName:
            (json.companyName as string) ?? defaultSiteSettings.companyName,
        email: (json.email as string) ?? defaultSiteSettings.email,
        phone: (json.phone as string) ?? defaultSiteSettings.phone,
        whatsapp: (json.whatsapp as string) ?? defaultSiteSettings.whatsapp,
        address: (json.address as string) ?? defaultSiteSettings.address,
        plusCode: (json.plusCode as string) ?? defaultSiteSettings.plusCode,
        year: (json.year as number) ?? defaultSiteSettings.year,
        socialLinks: (json.socialLinks as SiteSettings['socialLinks']) ?? [],
        legalSections:
            (json.legalSections as SiteSettings['legalSections']) ?? [],
        footerLinks: (json.footerLinks as SiteSettings['footerLinks']) ?? [],
        hours: normalizeHours(json.hours) as SiteSettings['hours'],
        content: (json.content as SiteSettings['content']) ?? {},
        gallery:
            (json.gallery as SiteSettings['gallery']) ??
            defaultSiteSettings.gallery,
        config:
            (json.config as SiteSettings['config']) ??
            defaultSiteSettings.config,
    };
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
    const now = Date.now();

    if (cachedSiteSettings && now - cachedAtMs < SITE_SETTINGS_TTL_MS) {
        return cachedSiteSettings;
    }

    if (inFlightSiteSettingsRequest) {
        return inFlightSiteSettingsRequest;
    }

    try {
        inFlightSiteSettingsRequest = (async () => {
            console.debug('[fetchSiteSettings] calling /api/site-settings');
            const res = await fetch('/api/site-settings');
            if (!res.ok) throw new Error('Network response was not ok');
            const json = (await res.json()) as Record<string, unknown>;
            const mapped = mapApiToSiteSettings(json);

            cachedSiteSettings = mapped;
            cachedAtMs = Date.now();

            return mapped;
        })();

        return await inFlightSiteSettingsRequest;
    } catch {
        // fallback to cache/defaults
        return cachedSiteSettings ?? defaultSiteSettings;
    } finally {
        inFlightSiteSettingsRequest = null;
    }
}
