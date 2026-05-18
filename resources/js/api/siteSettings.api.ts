import type { SimpleLinkItem } from '@/api/siteContent.api';
import type { NavSettings } from '@/lib/nav-config';

type LocalizedText = Record<string, string>;

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
        body: Record<string, string>;
    }>;
    footerLinks: Array<{
        labelKey: string;
        href: string;
        group: 'quick' | 'support';
    }>;
    hours: Array<{ dayKey: string; value: string }>;
    content: SiteSettingsContent;
    gallery?: string[];
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
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
    try {
        const res = await fetch('/api/site-settings');
        if (!res.ok) throw new Error('Network response was not ok');
        const json = await res.json();
        // basic shape validation
        return {
            companyName: json.companyName ?? defaultSiteSettings.companyName,
            email: json.email ?? defaultSiteSettings.email,
            phone: json.phone ?? defaultSiteSettings.phone,
            whatsapp: json.whatsapp ?? defaultSiteSettings.whatsapp,
            address: json.address ?? defaultSiteSettings.address,
            plusCode: json.plusCode ?? defaultSiteSettings.plusCode,
            year: json.year ?? defaultSiteSettings.year,
            socialLinks: json.socialLinks ?? [],
            legalSections: json.legalSections ?? [],
            footerLinks: json.footerLinks ?? [],
            hours: json.hours ?? [],
            content: json.content ?? {},
            gallery: json.gallery ?? defaultSiteSettings.gallery,
        };
    } catch {
        // fallback to defaults
        return defaultSiteSettings;
    }
}
