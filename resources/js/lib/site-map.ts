import type { SiteSettings } from '@/api/siteSettings.api';

export function getMapQuery(settings: SiteSettings): string {
    if (settings.mapLat && settings.mapLng) {
        return `${settings.mapLat},${settings.mapLng}`;
    }

    return settings.plusCode || settings.address || '';
}

export function getMapEmbedSrc(settings: SiteSettings): string {
    if (settings.mapEmbed) {
        return settings.mapEmbed;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(getMapQuery(settings))}&output=embed`;
}

export function getMapLink(settings: SiteSettings): string {
    return `https://www.google.com/maps?q=${encodeURIComponent(getMapQuery(settings))}`;
}

export function getMapDisplayText(settings: SiteSettings): string {
    return settings.address || settings.plusCode || '';
}