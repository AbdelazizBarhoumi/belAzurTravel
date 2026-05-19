import type { Lang } from '@/i18n/translations';

/**
 * Localized text - available in all supported languages (English, French, Arabic)
 */
export type LocalizedText = Record<Lang, string>;

/**
 * Helper to extract text from LocalizedText for a specific language
 */
export function getLocalizedText(
    value: LocalizedText,
    lang: Lang = 'en',
): string {
    return value[lang];
}

/**
 * Helper to create empty LocalizedText
 */
export function emptyLocalizedText(): LocalizedText {
    return { en: '', fr: '', ar: '' };
}

/**
 * Helper to create LocalizedText from a single string
 */
export function localizeString(text: string): LocalizedText {
    return { en: text, fr: text, ar: text };
}
