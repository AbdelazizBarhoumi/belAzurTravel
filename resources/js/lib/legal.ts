import type { LegalSectionBody } from '@/api/siteSettings.api';

export type LegalBodyFormat = 'markdown' | 'richtext';

export interface NormalizedLegalBody {
    format: LegalBodyFormat;
    content: Record<string, string>;
}

const emptyContent = { en: '', fr: '', ar: '' };

function normalizeContent(input: unknown): Record<string, string> {
    if (!input) return { ...emptyContent };

    if (typeof input === 'string') {
        return { en: input, fr: input, ar: input };
    }

    if (typeof input === 'object') {
        return { ...emptyContent, ...(input as Record<string, string>) };
    }

    return { ...emptyContent };
}

export function normalizeLegalBody(
    body?: LegalSectionBody | null,
): NormalizedLegalBody {
    if (!body) {
        return { format: 'markdown', content: { ...emptyContent } };
    }

    if (typeof body === 'object' && 'format' in body && 'content' in body) {
        const raw = body as { format?: string; content?: unknown };
        const format: LegalBodyFormat =
            raw.format === 'richtext' ? 'richtext' : 'markdown';
        return {
            format,
            content: normalizeContent(raw.content),
        };
    }

    return { format: 'markdown', content: normalizeContent(body) };
}
