import { describe, expect, it } from 'vitest';
import { uniqueNonEmptySelectOptions } from '@/lib/selectOptions';

describe('uniqueNonEmptySelectOptions', () => {
    it('deduplicates values and drops empty entries', () => {
        expect(
            uniqueNonEmptySelectOptions([
                'Economy',
                '',
                'Business',
                'Economy',
                '  ',
                undefined,
                null,
                'First',
            ]),
        ).toEqual(['Economy', 'Business', 'First']);
    });
});
