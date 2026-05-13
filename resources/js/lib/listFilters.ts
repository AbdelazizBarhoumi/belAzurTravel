export function normalizeSearchText(value: string): string {
    return value.trim().toLowerCase();
}

export function matchesSearchText(
    query: string,
    values: Array<string | null | undefined>,
): boolean {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
        return true;
    }

    return values.some((value) =>
        normalizeSearchText(value ?? '').includes(normalizedQuery),
    );
}
