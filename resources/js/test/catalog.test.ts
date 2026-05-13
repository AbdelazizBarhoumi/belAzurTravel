import { describe, expect, it } from 'vitest';
import {
    findCarBySlug,
    findDealBySlug,
    findEventBySlug,
    findFlightById,
    findPromoByCode,
    localizeText,
    searchDeals,
} from '@/data/catalog';

describe('content catalog', () => {
    it('resolves localized text from the active language', () => {
        expect(
            localizeText({ en: 'Hello', fr: 'Bonjour', ar: 'مرحبا' }, 'fr'),
        ).toBe('Bonjour');
    });

    it('finds shared content records by their stable identifiers', () => {
        expect(findFlightById('emirates-nyc-dxb')?.departure).toBe('09:45');
        expect(findDealBySlug('early-bird-summer-2026')?.slug).toBe(
            'early-bird-summer-2026',
        );
        expect(findCarBySlug('mercedes-e-class')?.seats).toBe(5);
        expect(findEventBySlug('cherry-blossom-festival')?.price).toBe(2490);
        expect(findPromoByCode('SPRING30')?.code).toBe('SPRING30');
    });

    it('searches deals using localized fields', () => {
        const results = searchDeals('summer', 'en');

        expect(
            results.some((deal) => deal.slug === 'early-bird-summer-2026'),
        ).toBe(true);
    });
});
