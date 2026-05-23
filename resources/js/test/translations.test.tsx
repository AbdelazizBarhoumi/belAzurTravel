import { describe, it, expect } from 'vitest';
import { t } from '@/i18n/translations';

describe('translations - actions keys', () => {
    it('should return localized book_now for each language', () => {
        expect(t('actions.book_now', 'en')).toBe('Book now');
        expect(t('actions.book_now', 'fr')).toBe('Réserver maintenant');
        expect(t('actions.book_now', 'ar')).toBe('احجز الآن');
    });

    it('should return localized whatsapp for each language', () => {
        expect(t('actions.whatsapp', 'en')).toBe('WhatsApp');
        expect(t('actions.whatsapp', 'fr')).toBe('WhatsApp');
        expect(t('actions.whatsapp', 'ar')).toBe('واتساب');
    });

    it('should return localized call for each language', () => {
        expect(t('actions.call', 'en')).toBe('Call');
        expect(t('actions.call', 'fr')).toBe('Appeler');
        expect(t('actions.call', 'ar')).toBe('اتصال');
    });
});
