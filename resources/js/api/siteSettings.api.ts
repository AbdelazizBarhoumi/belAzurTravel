export interface SiteSettings {
    companyName: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    year?: number;
}

export const defaultSiteSettings: SiteSettings = {
    companyName: 'BelAzurTravel',
    email: 'hello@voyageur.com',
    phone: '+1 (555) 123-4567',
    whatsapp: '15551234567',
    address: '123 Travel St, NY 10001',
    year: new Date().getFullYear(),
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
            year: json.year ?? defaultSiteSettings.year,
        };
    } catch {
        // fallback to defaults
        return defaultSiteSettings;
    }
}
