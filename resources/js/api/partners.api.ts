import { apiFetch } from './http';

export interface PartnerItem {
    id: number;
    name: string | { en: string; fr: string; ar: string };
    logo: string;
    website?: string;
    category?: string;
}

export function fetchPartners(): Promise<PartnerItem[]> {
    return apiFetch<PartnerItem[]>('/api/partners');
}
