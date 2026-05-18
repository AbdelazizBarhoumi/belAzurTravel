import { describe, expect, it } from 'vitest';
import {
    findCarBySlug,
    findDealBySlug,
    findEventBySlug,
    findFlightById,
    findPromoByCode,
    localizeText,
    searchDeals,
} from '@/data';

describe('public entities', () => {
    it('resolves localized text from the active language', () => {
        expect(
            localizeText({ en: 'Hello', fr: 'Bonjour', ar: 'مرحبا' }, 'fr'),
        ).toBe('Bonjour');
    });

    it('finds shared content records by their stable identifiers', async () => {
        const flight = await findFlightById('emirates-nyc-dxb');
        expect(flight?.departure).toBe('09:45');

        const deal = await findDealBySlug('early-bird-summer-2026');
        expect(deal?.slug).toBe('early-bird-summer-2026');

        const car = await findCarBySlug('mercedes-e-class');
        expect(car?.seats).toBe(5);

        const event = await findEventBySlug('cherry-blossom-festival');
        expect(event?.price).toBe(2490);

        const promo = await findPromoByCode('SPRING30');
        expect(promo?.code).toBe('SPRING30');
    });

    it('searches deals using localized fields', async () => {
        const results = await searchDeals('summer', 'en');

        expect(
            results.some((deal) => deal.slug === 'early-bird-summer-2026'),
        ).toBe(true);
    });
});
