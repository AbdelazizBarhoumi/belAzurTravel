export function normalizeSearchText(value: string): string {
    return value.trim().toLowerCase();
}

export function normalizeFilterValue(value: string): string {
    return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
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

export function matchesFilterValue(
    query: string,
    values: Array<string | Record<string, string> | null | undefined>,
): boolean {
    const normalizedQuery = normalizeFilterValue(query);

    if (!normalizedQuery) {
        return true;
    }

    return values.some((value) => {
        if (!value) {
            return false;
        }

        if (typeof value === 'string') {
            return normalizeFilterValue(value).includes(normalizedQuery);
        }

        return Object.values(value).some((entry) =>
            normalizeFilterValue(entry).includes(normalizedQuery),
        );
    });
}
