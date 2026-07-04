/**
 * Converts a 2-letter ISO country code to a flag emoji using Unicode
 * regional indicator symbols.
 *
 * Example: "FR" → "🇫🇷", "TN" → "🇹🇳"
 */
export function countryCodeToFlag(code: string): string {
    if (!code || code.length !== 2) return '';
    const upper = code.toUpperCase();
    const codePoints = [...upper].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
