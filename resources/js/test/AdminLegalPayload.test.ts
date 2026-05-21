import { describe, it, expect } from 'vitest';

/**
 * Mocks the logic used in AdminSiteSettings.tsx
 */
type LegalSectionState = {
    title: Record<string, string>;
    body: { format: string; content: string };
};

const buildLegalPayload = (legalSectionsState: LegalSectionState[]) =>
    legalSectionsState.map((s) => ({
        title: s.title,
        body: { format: s.body.format, content: s.body.content },
    }));

describe('AdminSiteSettings Payload Logic', () => {
    it('constructs correct payload structure for legal sections', () => {
        const mockState = [
            {
                title: { en: 'Terms', fr: 'Conditions', ar: 'الشروط' },
                body: { format: 'text', content: 'Valid content' },
            },
        ];

        const payload = buildLegalPayload(mockState);

        expect(payload).toEqual([
            {
                title: { en: 'Terms', fr: 'Conditions', ar: 'الشروط' },
                body: { format: 'text', content: 'Valid content' },
            },
        ]);
    });
});
