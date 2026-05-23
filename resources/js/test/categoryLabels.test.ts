import { describe, expect, it } from 'vitest';
import {
    getLocalizedCategoryLabel,
    getLocalizedCategoryLabelByKey,
} from '@/lib/categoryLabels';

describe('category label helpers', () => {
    it('returns the translated category name for the active language', () => {
        expect(
            getLocalizedCategoryLabel(
                {
                    key: 'beach',
                    name: { en: 'Beach', fr: 'Plage', ar: 'شاطئ' },
                },
                'fr',
            ),
        ).toBe('Plage');
    });

    it('falls back to the category key when a translation is missing', () => {
        expect(
            getLocalizedCategoryLabel(
                {
                    key: 'luxury',
                    name: { en: '', fr: '', ar: '' },
                },
                'ar',
            ),
        ).toBe('luxury');
    });

    it('resolves a category label from its key', () => {
        expect(
            getLocalizedCategoryLabelByKey(
                [
                    {
                        id: 1,
                        key: 'city',
                        name: { en: 'City', fr: 'Ville', ar: 'مدينة' },
                        entity_type: 'destinations',
                    },
                ],
                'city',
                'ar',
            ),
        ).toBe('مدينة');
    });
});
