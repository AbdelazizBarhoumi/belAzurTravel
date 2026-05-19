export function tField(field: unknown, lang: string): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field !== null) {
        const map = field as Record<string, string>;
        return map[lang] ?? map['fr'] ?? map['en'] ?? '';
    }
    return '';
}
